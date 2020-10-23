class HighestRollCache {
  highestRollPerChannel = {}

  _findOrCreateHistory(channelId) {
    const { highestRollPerChannel } = this

    return (
      highestRollPerChannel[channelId] ||
      (highestRollPerChannel[channelId] = [])
    )
  }

  setHighestRoll(roll) {
    const hist = this._findOrCreateHistory(roll.channelId)
    hist.push(roll)
    return roll
  }

  getHighestRoll(channelId) {
    const hist = this._findOrCreateHistory(channelId)
    return hist.length ? hist[hist.length - 1] : null
  }

  voidHighestRoll(channelId) {
    return this._findOrCreateHistory(channelId).pop()
  }

  clearHistory(channelId) {
    this.highestRollPerChannel[channelId] = []
  }
}

module.exports = () => new HighestRollCache()
