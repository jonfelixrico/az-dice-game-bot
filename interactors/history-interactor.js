const _ = require('lodash')

class HistoryInteractor {
  constructor({ rollRepo, highestRollCache }) {
    this.rolls = rollRepo
    this.highest = highestRollCache
  }

  async getRollCount(channelId) {
    const history = await this.rolls.getRollHistory(channelId)
    return history.length
  }

  async getRollHistory(channelId, offset, limit) {
    const history = await this.rolls.getRollHistory(channelId)
    return history.slice(offset, offset + limit)
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
      rank,
      subrank,
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
        return _.chain(rolls)
          .countBy(({ rank, subrank }) => JSON.stringify([rank, subrank]))
          .entries()
          .sort((a, b) => b[1] - a[1])
          .map(([tierStr, count]) => {
            const [rank, subrank] = JSON.parse(tierStr)
            return {
              count,
              rank,
              subrank,
            }
          })
      })
      .entries()
      .map(([userId, winnings]) => ({ userId, winnings }))
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
