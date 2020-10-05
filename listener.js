const random = require('lodash.random')

const PREFIX = process.env.PREFIX || '!rolldice'
const DICE_FACE_EMOJI_ARR = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣']
const QMARK = '❓'
const DICE_COUNT = 6

function rollDice() {
  return new Array(6).fill().map(() => random(1, 6))
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), ms)
  })
}

function generateDiceRollString(rolled, exposedIdx = -1) {
  const emojiArr = new Array(DICE_COUNT).fill(QMARK)

  for (let i = 0; i <= exposedIdx; i++) {
    const face = rolled[i]
    emojiArr[i] = DICE_FACE_EMOJI_ARR[face - 1]
  }

  return emojiArr.join(' ')
}

function generateRepsonseString(author, rolled, exposedIndex) {
  return [
    `${author}, you rolled...`,
    generateDiceRollString(rolled, exposedIndex),
  ]
}

async function commandProcessor(message) {
  const rolled = rollDice()
  const commandCaller = message.author

  const reply = await message.channel.send(
    generateRepsonseString(commandCaller, rolled, 0)
  )

  for (let exposedIdx = 0; exposedIdx < DICE_COUNT; exposedIdx++) {
    await delay(1000)
    await reply.edit(generateRepsonseString(commandCaller, rolled, exposedIdx))
  }
}

module.exports = ({ client }) => {
  client.on('message', (message) => {
    if (message.content !== PREFIX) {
      return
    }

    commandProcessor(message)
  })
}
