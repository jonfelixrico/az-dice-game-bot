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

    // create a map for the prize tiers
    const tierMap = _.chain(rollEval.getRankList())
      .keyBy(({ rank, subrank }) => [rank || 0, subrank || 0].join('/'))
      .value()

    // we'll also throw in the prize-less tiers
    tierMap['0/0'] = { label: 'No Prize' }

    // set the count of the values in tierMap by using the values from `tally`
    tally.forEach(({ rank, subrank, count }) => {
      const key = [rank || 0, subrank || 0].join('/')
      const tier = tierMap[key]
      tier.count = count
    })

    /*
     * sorts ranked rolls from highest to lowest. we cant include no-prize rolls
     * in this because compareEvals will break
     */
    const sortedTally = _.chain(tierMap)
      .values()
      .filter(({ rank }) => !!rank)
      .sort((a, b) => rollEval.compareEvals(b, a))
      .value()

    // finally, include the no-prize rolls as dead last
    sortedTally.push(tierMap['0/0'])

    const totalRollsMade = sortedTally.reduce(
      (acc, { count }) => acc + (count || 0),
      0
    )

    const formattedForTable = sortedTally.map(({ label, count }) => [
      label,
      // the count of the others may be undefined, so we'll transfrom them to 0
      count || 0,
    ])

    return [
      ['Prize Tier', 'Count'],
      ...formattedForTable,
      ['Total rolls made', totalRollsMade],
    ]
  }

  _generateTallyResponse(tally) {
    // generate the ascii table for the tally and enclose it within a markdown code block
    return ['```', table(this._generateTableData(tally)), '```'].join('\n')
  }

  async handler(message) {
    const channelId = message.channel.id
    await this.executor.queueJob(async () => {
      const msg = await message.channel.send('Loading tally...')

      const tally = await this.hist.countPerRank(channelId)
      await msg.edit(this._generateTallyResponse(tally))
    }, channelId)
  }
}

module.exports = (inject) => new HistoryTallyController(inject)
