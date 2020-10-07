/**
 * We're using moment to explicitly convert the string to manila time.
 * This is to handle the possibility of the server being hosted in foreign
 * countries (AWS/Heroku/etc).
 */
const moment = require('moment-timezone')
moment.tz.setDefault('Asia/Manila')

const COMMAND = '!highest clear'

async function processCommand({ message, highestRollRepo, executorSvc }) {
  console.debug(
    `Received ${COMMAND} from ${message.author.username} (${message.author.id}) in channel ${message.channel.name} (${message.channel.id}).`
  )

  // this is as acknowledgement to the user
  await message.react('🎲')

  const { channel } = message
  // get the highest roll from the repository.

  try {
    await executorSvc.queueJob(async () => {
      await highestRollRepo.clearHighestRoll(channel.id)
      await message.reply('the highest roll has been cleared.')
    }, channel.id)
  } catch (e) {
    await message.reply('something went wrong while processing your command.')
  }
}

module.exports = (injections) => {
  const { messageSvc } = injections
  messageSvc.onCommand(COMMAND, (message) =>
    processCommand({ message, ...injections })
  )
}
