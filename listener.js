const random = require('lodash.random')

const PREFIX = process.env.PREFIX || '!rolldice'
const DICE_FACE_EMOJI_ARR = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣']
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
 * @param {User} author
 * @param {Array} rolled
 */
function generateRepsonseString(author, rolled) {
  const rollAsEmojiStr = rolled
    .map((face) => DICE_FACE_EMOJI_ARR[face - 1])
    .join(' ')

  return [`> ${rollAsEmojiStr}`, author].join('\n')
}

/**
 * The bot's main logic. This is to be executed every time the user's message
 * matches the set command prefix for the app.
 * @param {Message} message
 */
async function commandProcessor(message) {
  const rolled = rollDice()
  const commandCaller = message.author

  await message.channel.send(generateRepsonseString(commandCaller, rolled))
}

module.exports = ({ client }) => {
  client.on('message', (message) => {
    if (message.content !== PREFIX) {
      return
    }

    commandProcessor(message)
  })
}
