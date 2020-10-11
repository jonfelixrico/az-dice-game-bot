class MockRollHistoryRepo {
  historyPerChannel = {}

  constructor(injected) {
    this.injected = injected
  }

  pushToHistory({ userId, channelId, rolled, rollDt, rank, subRank }) {
    if (!historyPerChannel[channelId]) {
      this.historyPerChannel[channelId] = []
    }

    this.historyPerChannel[channelId].push({
      userId,
      channelId,
      rolled,
      rollDt: rollDt || new Date(),
      rank,
      subRank,
    })
  }

  clearHistory(channelId) {
    delete this.historyPerChannel[channelId]
  }

  getLastRoll(channelId) {
    const historyArr = this.historyPerChannel[channelId]

    if (!historyArr || !historyArr.length) {
      return null
    }

    return historyArr[historyArr.length - 1]
  }

  getHistory(channelId) {
    const historyArr = this.historyPerChannel[channelId]
    return historyArr || []
  }
}

module.exports = (injected) => new MockRollHistoryRepo(injected)
