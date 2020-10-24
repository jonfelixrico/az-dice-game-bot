const moment = require('moment-timezone')
const { table } = require('table')
const { sprintf } = require('sprintf-js')
const { MessageEmbed } = require('discord.js')
const _ = require('lodash')
const { BLANK_SPACE } = require('../enums/string-constants')

class HistoryBreakdownController {
  constructor({
    ExecutorService,
    RollEvalService,
    MessageService,
    HistoryInteractor,
  }) {
    this.executor = ExecutorService
    this.rollEval = RollEvalService
    this.hist = HistoryInteractor

    MessageService.onCommand('!history breakdown', this.handler.bind(this))
  }

  __rankCols = null

  get _rankCols() {
    if (this.__rankCols) {
      return this.__rankCols
    }

    const { rollEval } = this

    const ranks = [
      {
        label: 'No Rank',
        rank: 0,
        subrank: 0,
      },
      ...rollEval
        .getRankList()
        .sort((a, b) => rollEval.compareEvals(a, b))
        .map(({ rank, subrank, label }) => ({
          rank: rank || 0,
          subrank: subrank || 0,
          label,
        })),
    ]

    this.__rankCols = ranks
    return ranks
  }

  _generateRowData({ winnings, rollCount }) {
    const indexedWinnings = _.chain(winnings)
      .keyBy(({ rank, subrank }) => [rank, subrank].join('/'))
      .mapValues(({ count }) => ({
        count,
        percentage: _.round(count / rollCount, 2) * 100,
      }))
      .value()

    const rowData = this._rankCols.map(({ rank, subrank }) => {
      const key = [rank, subrank].join('/')
      const rollsForRank = indexedWinnings[key]

      if (!rollsForRank) {
        return {
          percentage: 0,
          count: 0,
        }
      }

      return rollsForRank
    })

    return [
      ...rowData,
      {
        count: rollCount,
      },
    ]
  }

  _generateFooterData(byRank) {
    const indexedByRank = _.chain(byRank)
      .keyBy(({ rank, subrank }) => [rank, subrank].join('/'))
      .mapValues(({ count }) => count)
      .value()

    const totalRolls = _.chain(indexedByRank).values().sum().value()

    const rankData = this._rankCols.map(({ rank, subrank }) => {
      const key = [rank, subrank].join('/')
      const count = indexedByRank[key] || 0

      return {
        count,
        percentage: !count ? 0 : _.round(count / totalRolls, 2) * 100,
      }
    })

    return [
      ...rankData,
      {
        count: totalRolls,
      },
    ]
  }

  _generateTableData(userIdSequence, byUser, byRank) {
    const headers = [
      'User',
      ...this._rankCols.map(({ label }) => label),
      'Total',
    ]

    const body = userIdSequence.map(({ id, name }, index) => {
      const userRowData = this._generateRowData(byUser[id])

      const formattedData = userRowData.map(({ count, percentage }) =>
        percentage === undefined
          ? count
          : sprintf('%d (%.2f%%)', count, percentage)
      )

      return [name, ...formattedData]
    })

    const footer = [
      'All Users',
      ...this._generateFooterData(byRank).map(({ count, percentage }) =>
        percentage === undefined
          ? count
          : sprintf('%d (%.2f%%)', count, percentage)
      ),
    ]

    return [headers, ...body, footer]
  }

  _generateUserSequence(guild, data) {
    const userIdKeys = new Set(Object.keys(data))
    const matching = guild.members.cache
      .filter((member) => userIdKeys.has(member.user.id))
      .array()

    return _.chain(matching)
      .map((member) => ({
        id: member.user.id,
        name: member.nickname || user.username,
      }))
      .sortBy('name')
      .value()
  }

  async _generateResponse(message) {
    const channelId = message.channel.id
    const byUser = await this.hist.ranksPerUser(channelId)
    const byRank = await this.hist.countPerRank(channelId)

    const sequence = this._generateUserSequence(message.guild, byUser)
    const tableData = this._generateTableData(sequence, byUser, byRank)

    const tableText = [
      '```',
      table(tableData, { columnDefault: { wrapWord: true, width: 8 } }),
      '```',
    ].join('\n')

    return tableText
  }

  async handler(message) {
    const channelId = message.channel.id
    await this.executor.queueJob(async () => {
      const reply = await message.channel.send('Loading roll breakdown...')
      const embed = await this._generateResponse(message)
      await reply.edit(embed)
    }, channelId)
  }
}

module.exports = (inject) => new HistoryBreakdownController(inject)
