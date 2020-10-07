const lastRollMap = {}

/**
 *
 * @param {String} userId Id of the user who rolled last.
 * @param {String} channelId Id of the channel where the user rolled last.
 */
function setLastRoll(userId, channelId) {
  lastRollMap[channelId] = userId
}

/**
 * Clears the last roll from a specified channel. Similar to `setLastRoll(undefined, channelId)`.
 * @param {String} channelId The id of the channel where the roll record should be cleared.
 */
function clearLastRoll(channelId) {
  setLastRoll(undefined, channelId)
}

/**
 *
 * @param {String} channelId Id of the channel to check for the last roll.
 * @returns {String | undefined} Id of the user who rolled last, if any.
 */
function getLastRoll(channelId) {
  return lastRollMap[channelId]
}

module.exports = () => {
  return {
    setLastRoll,
    getLastRoll,
    clearLastRoll,
  }
}
