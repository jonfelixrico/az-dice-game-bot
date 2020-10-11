const moment = require('moment-timezone')
const { diceRollToString } = require('./utils')

const HistoryCommands = {
  LAST_ROLL: '!history last',
  HIGHEST: '!history highest',
  TALLY: '!history tally',
}

class HistoryController {
  constructor({ rollInteractor, executorSvc, rollEvalSvc, messageSvc }) {
    this.interactor = rollInteractor
    this.executor = executorSvc
    this.rollEval = rollEvalSvc
    this.messageSvc = messageSvc

    this.initListeners()
  }

  formatDate(date, forceAbsoluteDate) {
    const momentDt = moment(date)

    if (!forceAbsoluteDate && momentDt.isSame(new Date(), 'day')) {
      return `today, ${momentDt.format('h:mm:ss A')}`
    }

    return momentDt.format('MMM D, YYYY h:mm:ss A')
  }

  generateLastRollResponse(roll) {
    if (!roll) {
      return 'There were no previous rolls found in this channel.'
    }

    const { userId, rollDt, rolled, channelId, rank, subrank } = roll
    const formattedDt = this.formatDate(rollDt)

    const strBuff = [
      `The last roll in <#${channelId}> was by <@${userId}>, ${formattedDt}.`,
      // awaiting evaluation utils, will display just the dice roll string for now.
      `> ${diceRollToString(rolled)}`,
    ]

    if (rank) {
      strBuff.push(`**${this.rollEval.getEvalLabel({ rank, subrank })}**`)
    }

    return strBuff.join('\n')
  }

  generateHighestRollReponse(roll) {
    if (!roll || !roll.rank) {
      return 'There were highest rolls recorded for this channel.'
    }

    const { userId, rollDt, rolled, channelId, rank, subrank } = roll
    const formattedDt = this.formatDate(rollDt)

    return [
      `The highest roll in <#${channelId}> was by <@${userId}>, ${formattedDt}.`,
      // awaiting evaluation utils, will display just the dice roll string for now.
      `> ${diceRollToString(rolled)}`,
      `**${this.rollEval.getEvalLabel({ rank, subrank })}**`,
    ].join('\n')
  }

  generateTallyResponse(channelId, tally) {
    const responseStrBuff = [
      `Here is the rank tally for <#${channelId}> as of ${this.formatDate(
        new Date(),
        true
      )}`,
    ]

    for (const { label, count } of tally) {
      responseStrBuff.push(`**${label}:** ${count}`)
    }

    return responseStrBuff.join('\n')
  }

  async handleLast(message) {
    const channelId = message.channel.id
    await this.executor.queueJob(async () => {
      const roll = await this.interactor.getChannelLastRoll(channelId)
      await message.channel.send(this.generateLastRollResponse(roll))
    }, channelId)
  }

  async handleHighest(message) {
    const channelId = message.channel.id
    await this.executor.queueJob(async () => {
      const roll = await this.interactor.getChannelHighestRoll(channelId)
      await message.channel.send(this.generateHighestRollReponse(roll))
    }, channelId)
  }

  async handleTally(message) {
    const channelId = message.channel.id
    await this.executor.queueJob(async () => {
      const tally = await this.interactor.getChannelTallyByRank(channelId)
      await message.channel.send(this.generateTallyResponse(channelId, tally))
    }, channelId)
  }

  initListeners() {
    const { messageSvc } = this

    messageSvc.onCommand(HistoryCommands.HIGHEST, this.handleHighest.bind(this))

    messageSvc.onCommand(HistoryCommands.LAST_ROLL, this.handleLast.bind(this))

    messageSvc.onCommand(HistoryCommands.TALLY, this.handleTally.bind(this))
  }
}

module.exports = (injected) => new HistoryController(injected)
