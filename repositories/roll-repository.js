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

  getChannelLastRoll(channelId) {
    const history = this.getChannelRollHistory(channelId)
    return history[history.length - 1]
  }

  voidChannelLastRoll(channelId) {
    const history = this.getChannelRollHistory(channelId)
    const lastRoll = rolls[rolls.length - 1]
    history.pop()

    return lastRoll
  }

  /**
   * Clears the roll history of the specified channel.
   * @param {String} channelId
   */
  clearChannelRollHistory(channelId) {
    this.historyPerChannel[channelId] = []
  }

  /**
   * Gets the roll history of the specified channel.
   * @param {String} channelId
   */
  getChannelRollHistory(channelId) {
    const historyArr = this.historyPerChannel[channelId]
    return historyArr || []
  }
}

module.exports = () => new RollRepository()
