const random = require('lodash.random')
const { diceRollToString } = require('./utils')

const COMMAND = '!rolldice'
const DICE_COUNT = 6

/**
 * Generates an array of random numbers, specific to the dice game.
 *
 * @returns {Array} Array of numbers with the length of six. Each
 *  member is within the range of 1 to 6, inclusive which represents
 *  the faces of a dice.
 */
function rollDice() {
  return new Array(DICE_COUNT).fill().map(() => random(1, 6))
}

/**
 * Displays the results of a user's roll as prettified strings.
 *
 * @param {User} author The record of the user who called the roll command.
 * @param {Array} rolled The results of the user's roll.
 * @returns {String} The string to be used for the bot's response to the user's
 *  command call.
 */
function generateRepsonseString(author, rolled) {
  const rollAsEmojiStr = diceRollToString(rolled)
  return [
    // > is the markdown for a quote line
    `> ${rollAsEmojiStr}`,
    // author automatically gets stringified to <@{user_id_of_message_author}
    author,
  ].join('\n')
}

/**
 * The bot's main logic. This is to be executed every time the user's message
 * matches the set command prefix for the app.
 * @param {Message} message
 */
async function processCommand({ message, highestRollRepo }) {
  // react to the user's message as acknowlegedmenet that the bot recognized the command
  await message.react('🎲')
  const { author, channel } = message

  const rolled = rollDice()

  await highestRollRepo.saveIfHighest(channel.id, author.id, rolled)

  await message.channel.send(generateRepsonseString(author, rolled))
}

module.exports = ({ client, highestRollRepo }) => {
  client.on('message', (message) => {
    if (message.content !== COMMAND) {
      return
    }

    processCommand({ message, highestRollRepo })
  })
}
