const mockDb = {}

function saveIfHighest(channelId, userId, rolled) {
  mockDb[channelId] = {
    userId,
    rolled,
    rollDt: new Date(),
    channelId,
  }
}

function getHighestRoll(channelId) {
  return mockDb[channelId] || null
}

module.exports = async () => {
  return {
    saveIfHighest,
    getHighestRoll,
  }
}
