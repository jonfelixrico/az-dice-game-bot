const mockDb = {}

/**
 * Saves the highest roll (`rolled`) into the map. If there's
 * already an existing record there, then it will be replaced.
 *
 * @param {String} channelId Where the highest roll occurred.
 * @param {String} userId Who rolled the highest roll.
 * @param {Array} rolled The new highest roll.
 *
 * @returns {Promise} A promise that resolves when the DB has finished saving.
 */
async function saveHighestRoll(channelId, userId, rolled) {
  // just save, no need for comparisons or anything
  mockDb[channelId] = {
    userId,
    rolled,
    rollDt: new Date(),
    channelId,
  }
}

/**
 * Fetches the highest roll from the specified channel.
 * @param {String} channelId
 */
async function getHighestRoll(channelId) {
  return mockDb[channelId] || null
}

module.exports = async () => {
  // you can await an async function here if you need to initialize the db or smth
  return {
    saveHighestRoll,
    getHighestRoll,
  }
}
