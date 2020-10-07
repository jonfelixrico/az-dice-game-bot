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
function generateRepsonseString(author, rolled, rollLabel, isNewHighestRoll) {
  const rollAsEmojiStr = diceRollToString(rolled)
  let authorStr = null

  if (!!rollLabel && isNewHighestRoll) {
    authorStr = `${author} rolled _**${rollLabel}**_! **They now have the highest roll in the channel.**`
  } else if (!!rollLabel) {
    authorStr = `${author} rolled _**${rollLabel}**_!`
  } else {
    authorStr = `${author} didn't roll a prize-winning combination.`
  }

  return [
    authorStr,
    // > is the markdown for a quote line
    `> ${rollAsEmojiStr}`,
  ].join('\n')
}

/**
 * The bot's main logic. This is to be executed every time the user's message
 * matches the set command prefix for the app.
 * @param {Message} message
 */
async function processCommand({
  message,
  highestRollRepo,
  rollEvalSvc,
  executorSvc,
}) {
  console.debug(
    `Received ${COMMAND} from ${message.author.username} (${message.author.id}) in channel ${message.channel.name} (${message.channel.id}).`
  )

  // react to the user's message as acknowlegedmenet that the bot recognized the command
  await message.react('🎲')
  const { author, channel } = message

  const rolled = rollDice()
  const rollLabel = rollEvalSvc.getRollLabel(rolled)

  try {
    await executorSvc.queueJob(async () => {
      const highestRoll = await highestRollRepo.getHighestRoll(channel.id)
      let isNewHighestRoll = false

      if (
        rollLabel &&
        (!highestRoll ||
          rollEvalSvc.compareRolls(rolled, highestRoll.rolled) === 1)
      ) {
        await highestRollRepo.saveHighestRoll(channel.id, author.id, rolled)
        isNewHighestRoll = true
      }

      await message.channel.send(
        generateRepsonseString(author, rolled, rollLabel, isNewHighestRoll)
      )
    }, channel.id)
  } catch (e) {
    console.debug(e)
    await message.reply('Something went wrong while processing the command.')
  }
}

module.exports = (injections) => {
  const { messageSvc } = injections
  messageSvc.onCommand(COMMAND, (message) =>
    processCommand({ message, ...injections })
  )
}
