const moment = require('moment-timezone')
const { table } = require('table')
const { MessageEmbed } = require('discord.js')
const _ = require('lodash')

class HistoryTallyController {
  constructor({
    ExecutorService,
    RollEvalService,
    MessageService,
    HistoryInteractor,
  }) {
    this.executor = ExecutorService
    this.rollEval = RollEvalService
    this.hist = HistoryInteractor

    MessageService.onCommand('!history tally', this.handler.bind(this))
  }

  _generateTableData(tally) {
    const { rollEval } = this
    const tierMap = _.chain(rollEval.getRankList())
      .keyBy(({ rank, subrank }) => [rank || 0, subrank || 0].join('/'))
      .value()

    tierMap['0/0'] = { label: 'No Prize' }

    tally.forEach(({ rank, subrank, count }) => {
      const key = [rank || 0, subrank || 0].join('/')
      const tier = tierMap[key]
      tier.count = count
    })

    // sorts ranked rolls from highest to lowest
    const sortedTally = _.chain(tierMap)
      .values()
      .filter(({ rank }) => !!rank)
      .sort((a, b) => rollEval.compareEvals(b, a))
      .value()

    // push unranked rolls as the lowest
    sortedTally.push(tierMap['0/0'])

    const totalRollsMade = sortedTally.reduce(
      (acc, { count }) => acc + (count || 0),
      0
    )

    const formattedForTable = sortedTally.map(({ label, count }) => [
      label,
      count || 0,
    ])

    return [
      ['Prize Tier', 'Count'],
      ...formattedForTable,
      ['Total rolls made', totalRollsMade],
    ]
  }

  _generateTallyResponse(channelId, tally) {
    // generate the ascii table for the tally and enclose it within a markdown code block
    const tabularData = [
      '```',
      table(this._generateTableData(tally)),
      '```',
    ].join('\n')

    return new MessageEmbed({
      title: 'Prize Tally',
      timestamp: moment().toDate(),
      description: [
        `This is the tally of rolls for channel <#${channelId}>`,
        tabularData,
      ].join('\n'),
    })
  }

  async handler(message) {
    const channelId = message.channel.id
    await this.executor.queueJob(async () => {
      const tally = await this.hist.countPerRank(channelId)
      await message.channel.send(this._generateTallyResponse(channelId, tally))
    }, channelId)
  }
}

module.exports = (inject) => new HistoryTallyController(inject)
