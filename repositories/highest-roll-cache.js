class HighestRollCache {
  highestRollPerChannel = {}

  setHighestRoll(roll) {
    this.highestRollPerChannel[roll.channelId] = roll
  }

  getHighestRoll(channelId) {
    return this.highestRollPerChannel[channelId]
  }

  clearHighestRoll(channelId) {
    this.highestRollPerChannel[channelId] = undefined
  }
}

module.exports = () => new HighestRollCache()
