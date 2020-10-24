const { v4: uuid } = require('uuid')

class RollRepository {
  historyPerChannel = {}

  /**
   * Pushes a roll the user made to the history.
   * @param {Object} param0
   */
  pushToHistory({ userId, channelId, rolled, rollDt, rank, subrank }) {
    const { historyPerChannel } = this
    if (!historyPerChannel[channelId]) {
      historyPerChannel[channelId] = []
    }

    const roll = {
      uuid: uuid(),

      userId,
      channelId,

      rolled,
      rollDt: rollDt || new Date(),

      rank,
      subrank,
    }

    historyPerChannel[channelId].push(roll)
    return roll
  }

  getLastRoll(channelId) {
    const history = this.getRollHistory(channelId)
    return history[history.length - 1]
  }

  voidLastRoll(channelId) {
    return this.getRollHistory(channelId).pop()
  }

  /**
   * Clears the roll history of the specified channel.
   * @param {String} channelId
   */
  clearRollHistory(channelId) {
    this.historyPerChannel[channelId] = []
  }

  /**
   * Gets the roll history of the specified channel.
   * @param {String} channelId
   */
  getRollHistory(channelId) {
    const historyArr = this.historyPerChannel[channelId]
    return historyArr || []
  }
}

module.exports = () => new RollRepository()
