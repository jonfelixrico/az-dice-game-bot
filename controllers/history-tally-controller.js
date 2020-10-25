const _ = require('lodash')
const { sprintf } = require('sprintf-js')

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

    const ranks = [
      ...rollEval
        .getRankList()
        .sort((a, b) => rollEval.compareEvals(b, a))
        .map(({ rank, subrank, label }) => ({
          rank: rank || 0,
          subrank: subrank || 0,
          label,
        })),
      {
        label: 'No Prize',
        rank: 0,
        subrank: 0,
      },
    ]

    this.__ranks = ranks
    return ranks
  }

  async _generateResponse(message) {
    const channelId = message.channel.id

    // create map for users per rank
    const { ranks, total } = await this.hist.usersPerRank(channelId)
    const indexedWinnersPerRank = _.chain(ranks)
      .keyBy(({ rank, subrank }) => [rank, subrank].join('/'))
      .mapValues(({ users, count }) => ({ count, users }))
      .value()

    return (
      this._ranks
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
        // format strings
        .map(({ label, users, count, rank }) => {
          const percentage = count ? _.round((count / total) * 100, 2) : 0

          const userListStr =
            rank &&
            users
              .map(({ userId, count }) => `> <@${userId}> (${count})`)
              .join('\n')

          const rankHeaderStr = sprintf(
            '**%s**: %d (%0.2f%%)',
            label,
            count,
            percentage
          )

          return [rankHeaderStr, userListStr].filter((str) => !!str).join('\n')
        })
        .join('\n---\n')
    )
  }

  async handler(message) {
    const channelId = message.channel.id
    await this.executor.queueJob(async () => {
      const reply = await message.channel.send('Loading roll breakdown...')
      const response = await this._generateResponse(message)
      await reply.edit(response)
    }, channelId)
  }
}

module.exports = (inject) => new HistoryTallyController(inject)
