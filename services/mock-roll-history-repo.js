class MockRollHistoryRepo {
  historyPerChannel = {}
  idSeq = 1

  constructor(injected) {
    this.injected = injected
  }

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
      id: this.idSeq++,

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

  /**
   * Clears the roll history of the specified channel.
   * @param {String} channelId
   */
  clearChannelRollHistory(channelId) {
    delete this.historyPerChannel[channelId]
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

module.exports = (injected) => new MockRollHistoryRepo(injected)
