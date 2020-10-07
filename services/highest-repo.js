const SQLite = require('better-sqlite3')
const sql = new SQLite('./dicegame.sqlite')

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
async function saveHighestRoll(channelId, userId, rolledArray) {
  // just save, no need for comparisons or anything
  highestRoll = {
    userId: userId,
    rolled: JSON.stringify(rolledArray),
    rollDt: new Date().toISOString(),
    channelId: channelId,
  }

  sql
    .prepare(
      'insert or replace into HIGHEST_ROLLS (channelId, userId, rolled, rollDt) VALUES (@channelId, @userId, @rolled, @rollDt);'
    )
    .run(highestRoll)
}

/**
 * Fetches the highest roll from the specified channel.
 * @param {String} channelId
 */
async function getHighestRoll(channelId) {
  const highestRoll = sql
    .prepare('select * from HIGHEST_ROLLS where channelId = ?')
    .get(channelId)

  if (!highestRoll) {
    return null
  }

  // parse string to array
  highestRoll.rolled = JSON.parse(highestRoll.rolled)

  // parse string to date
  highestRoll.rollDt = Date.parse(highestRoll.rollDt)

  return highestRoll
}

/**
 * Clears the highest roll in a channel specified by the `channelId`.
 * @param {String} channelId
 * @returns {Void}
 */
async function clearHighestRoll(channelId) {
  sql.prepare('delete from HIGHEST_ROLLS where channelId = @channelId').run({
    channelId,
  })
}

/**
 * Create table for highest roll
 */
async function createTable() {
  const table = sql
    .prepare(
      "select count(*) from SQLITE_MASTER where TYPE='table' and NAME = 'HIGHEST_ROLLS';"
    )
    .get()

  if (!table['count(*)']) {
    // If the table isn't there, create it and setup the database correctly.
    sql
      .prepare(
        'create table HIGHEST_ROLLS (channelId TEXT PRIMARY KEY, userId TEXT, rolled TEXT, rollDt TEXT);'
      )
      .run()
    // Ensure that the "id" row is always unique and indexed.
    sql
      .prepare(
        'create unique index idx_channel_id ON HIGHEST_ROLLS (channelId);'
      )
      .run()
    sql.pragma('synchronous = 1')
    sql.pragma('journal_mode = wal')
  }
}

module.exports = async () => {
  // instantiate the table
  await createTable()
  return {
    saveHighestRoll,
    getHighestRoll,
    clearHighestRoll,
  }
}
