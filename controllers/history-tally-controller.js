const { MessageEmbed } = require('discord.js')
const _ = require('lodash')
const { sprintf } = require('sprintf-js')
const { BLANK_SPACE } = require('../enums/string-constants')

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

  __ranks = null
  get _ranks() {
    if (this.__ranks) {
      return this.__ranks
    }

    const { rollEval } = this
    const sortedRanks = _.chain(rollEval.getRankList())
      .map(({ rank, subrank, label }) => ({
        rank: rank || 0,
        subrank: subrank || 0,
        label,
      }))
      .uniqBy(({ rank, subrank }) => [rank, subrank].join('/'))
      .sort((a, b) => rollEval.compareEvals(b, a))
      .value()

    const ranks = [
      ...sortedRanks,
      {
        label: 'No Prize',
        rank: 0,
        subrank: 0,
      },
    ]

    this.__ranks = ranks
    return ranks
  }

  async _generateResponseData(channelId) {
    // create map for users per rank
    const { ranks: ranksWithWinners, total } = await this.hist.usersPerRank(
      channelId
    )
    const indexedWinnersPerRank = _.chain(ranksWithWinners)
      .keyBy(({ rank, subrank }) => [rank, subrank].join('/'))
      .mapValues(({ users, count }) => ({ count, users }))
      .value()

    const ranks = this._ranks
      // merge list of rank with the users per rank
      .map((rankData) => {
        const { rank, subrank } = rankData
        const key = [rank, subrank].join('/')
        const winData = indexedWinnersPerRank[key] || { users: [], count: 0 }

        return {
          ...rankData,
          ...winData,
        }
      })

    return {
      total,
      ranks,
    }
  }

  async _generateEmbedResponse(message) {
    const channelId = message.channel.id
    const { total, ranks } = await this._generateResponseData(channelId)

    const fields = ranks.map(({ rank, users, count: rankCount, label }) => {
      const userListStr =
        rank &&
        users
          .map(({ userId, count: userCount }) =>
            sprintf('> <@%s> (%d)', userId, userCount)
          )
          .join('\n')

      let rankSubheaderStr = null

      if (rank) {
        rankSubheaderStr = sprintf(
          '%s matching %s.',
          !rankCount ? 'No' : `**${rankCount}**`,
          rankCount === 1 ? 'roll' : 'rolls'
        )
      } else {
        rankSubheaderStr = sprintf(
          '%s %s.',
          !rankCount ? 'No' : rankCount,
          rankCount === 1 ? 'roll' : 'rolls'
        )
      }

      return {
        name: label,
        value: [rankSubheaderStr, userListStr]
          .filter((str) => !!str)
          .join('\n'),
      }
    })

    return new MessageEmbed({
      fields,
      footer: {
        text: sprintf(
          '%d %s made so far',
          total,
          total === 1 ? 'roll' : 'rolls'
        ),
      },
    })
  }

  async handler(message) {
    const channelId = message.channel.id
    await this.executor.queueJob(async () => {
      const reply = await message.channel.send('Loading roll breakdown...')
      const embed = await this._generateEmbedResponse(message)
      await reply.edit({
        content: '**Tally of Ranks**',
        embed,
      })
    }, channelId)
  }
}

module.exports = (inject) => new HistoryTallyController(inject)
