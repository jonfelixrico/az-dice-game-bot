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

  async _groupByWinnings(channelId) {
    const history = await this.rolls.getRollHistory(channelId)
    return _.chain(history)
      .groupBy(({ rank, subrank }) => JSON.stringify([rank, subrank]))
      .toPairs()
      .map(([tierStr, rolls]) => {
        const [rank, subrank] = JSON.parse(tierStr)
        return {
          rolls,
          rank,
          subrank,
        }
      })
      .value()
  }

  async countPerRank(channelId) {
    const grouped = await this._groupByWinnings(channelId)
    return grouped.map(({ rank, subrank, rolls }) => ({
      rank: rank || 0,
      subrank: subrank || 0,
      count: rolls.length,
    }))
  }

  async usersPerRank(channelId) {
    const grouped = await this._groupByWinnings(channelId)
    return grouped.map(({ rank, subrank, rolls }) => {
      return {
        rank,
        subrank,
        users: _.chain(rolls)
          .countBy('userId')
          .entries()
          // desc
          .sort((a, b) => b[1] - a[1])
          .map(([userId, count]) => {
            userId, count
          })
          .value(),
      }
    })
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
