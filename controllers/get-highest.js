/**
 * We're using moment to explicitly convert the string to manila time.
 * This is to handle the possibility of the server being hosted in foreign
 * countries (AWS/Heroku/etc).
 */
const moment = require('moment-timezone')
moment.tz.setDefault('Asia/Manila')

const COMMAND = '!highest'
const { diceRollToString } = require('./utils')

function generateResponse(highestRoll, svc) {
  if (!highestRoll) {
    return 'There were no highest rolls recorded for this channel.'
  }

  const { userId, rollDt, rolled, channelId } = highestRoll
  const momentDt = moment(rollDt)

  let formattedDt = null

  if (momentDt.isSame(new Date(), 'day')) {
    formattedDt = `Today, ${momentDt.format('h:mm:s A')}`
  } else {
    formattedDt = momentDt.format('MMM D, YYYY h:mm:s A')
  }

  return [
    `The highest roll in <#${channelId}> was by <@${userId}> on ${formattedDt}.`,
    // awaiting evaluation utils, will display just the dice roll string for now.
    `> ${diceRollToString(rolled)}`,
    svc.getRollLabel(rolled),
  ].join('\n')
}

async function processCommand({
  message,
  highestRollRepo,
  rollEvalSvc,
  executorSvc,
}) {
  // this is as acknowledgement to the user
  await message.react('🎲')

  const { channel } = message
  // get the highest roll from the repository.

  try {
    await executorSvc.queueJob(async () => {
      const highestRoll = await highestRollRepo.getHighestRoll(channel.id)
      const responseString = generateResponse(highestRoll, rollEvalSvc)

      await channel.send(responseString)
      await message.react('👌')
    }, channel.id)
  } catch (e) {
    await message.reply('something went wrong while processing your command.')
  }
}

module.exports = (injections) => {
  const { client } = injections
  client.on('message', (message) => {
    if (message.content === COMMAND) {
      processCommand({ message, ...injections })
    }
  })
}
