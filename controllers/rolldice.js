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

function generateResponseBuffer(author, rolled, rollLabel, isNewHighestRoll) {
  const rollAsEmojiStr = diceRollToString(rolled)
  let authorStr = null

  if (!!rollLabel && isNewHighestRoll) {
    authorStr = `${author} rolled _**${rollLabel}!**_ They now have the highest roll in the channel.`
  } else if (!!rollLabel) {
    authorStr = `${author} rolled _**${rollLabel}!**_`
  } else {
    authorStr = `${author} didn't roll a prize-winning combination.`
  }

  return [
    authorStr,
    // > is the markdown for a quote line
    `> ${rollAsEmojiStr}`,
  ]
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
  remarkSvc,
}) {
  console.debug(
    `Received ${COMMAND} from ${message.author.username} (${message.author.id}) in channel ${message.channel.name} (${message.channel.id}).`
  )

  // react to the user's message as acknowlegedmenet that the bot recognized the command
  await message.react('🎲')
  const { author, channel } = message

  const rolled = rollDice()
  const [rank, subRank] = rollEvalSvc.evaluate(rolled) || []

  try {
    await executorSvc.queueJob(async () => {
      const highestRoll = await highestRollRepo.getHighestRoll(channel.id)
      let isNewHighestRoll = false

      if (
        rank != null &&
        (!highestRoll ||
          rollEvalSvc.compareRolls(rolled, highestRoll.rolled) === 1)
      ) {
        await highestRollRepo.saveHighestRoll(channel.id, author.id, rolled)
        isNewHighestRoll = true
      }

      const remark = remarkSvc.getRemarks(rank, subRank)
      const strBuffer = generateResponseBuffer(
        author,
        rolled,
        rollEvalSvc.getPrizeLabel(rank, subRank),
        isNewHighestRoll
      )

      if (remark.isGif) {
        await message.channel.send(strBuffer.join('\n'), {
          files: [remark.content],
        })
      } else {
        await message.channel.send([...strBuffer, remark.content].join('\n'))
      }
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
