const _ = require('lodash')

class HistoryInteractor {
  constructor({ RollRepository, HighestRollCache }) {
    this.rolls = RollRepository
    this.highest = HighestRollCache
  }

  async getRollCount(channelId) {
    const history = await this.rolls.getRollHistory(channelId)
    return history.length
  }

  async getRollHistory(channelId, offset, limit) {
    const history = await this.rolls.getRollHistory(channelId)
    return [...history].reverse().slice(offset, offset + limit)
  }

  async getLastRoll(channelId) {
    return await this.rolls.getLastRoll(channelId)
  }

  async getHighestRoll(channelId) {
    return await this.highest.getHighestRoll(channelId)
  }

  async usersPerRank(channelId) {
    const history = await this.rolls.getRollHistory(channelId)
    const ranks = _.chain(history)
      .groupBy(({ rank, subrank }) => JSON.stringify([rank, subrank]))
      .toPairs()
      .map(([tierStr, rolls]) => {
        const [rank, subrank] = JSON.parse(tierStr)
        return {
          rolls,
          rank: rank || 0,
          subrank: subrank || 0,
        }
      })
      .map(({ rank, subrank, rolls }) => {
        return {
          rank,
          subrank,
          users: _.chain(rolls)
            .countBy('userId')
            .toPairs()
            // desc
            .sort((a, b) => b[1] - a[1])
            .map(([userId, count]) => ({
              userId,
              count,
            }))
            .value(),
          count: rolls.length,
        }
      })
      .value()

    return {
      ranks,
      total: ranks.reduce((acc, { count }) => acc + count, 0),
    }
  }

  async ranksPerUser(channelId) {
    const history = await this.rolls.getRollHistory(channelId)
    return _.chain(history)
      .groupBy('userId')
      .mapValues((rolls) => {
        const winnings = _.chain(rolls)
          .countBy(({ rank, subrank }) => JSON.stringify([rank, subrank]))
          .entries()
          .sort((a, b) => b[1] - a[1])
          .map(([tierStr, count]) => {
            const [rank, subrank] = JSON.parse(tierStr)
            return {
              count,
              rank: rank || 0,
              subrank: subrank || 0,
            }
          })
          .value()

        const rollCount = winnings.reduce((acc, { count }) => acc + count, 0)

        return {
          winnings,
          rollCount,
        }
      })
      .value()
  }

  async rankRollCount(channelId, rank, subrank) {
    const history = await this.rolls.getRollHistory(channelId)
    return history.filter(
      (roll) => roll.rank === rank && roll.subrank === subrank
    ).length
  }

  async clearHistory(channelId) {
    await this.highest.clearHistory(channelId)
    await this.rolls.clearRollHistory(channelId)
  }
}

module.exports = (injected) => new HistoryInteractor(injected)
