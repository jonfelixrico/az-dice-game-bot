const moment = require('moment-timezone')
const { diceRollToString } = require('./utils')
const { MessageEmbed } = require('discord.js')

const HistoryCommands = {
  LAST_ROLL: '!history last',
  HIGHEST: '!history highest',
  TALLY: '!history tally',
  CLEAR: '!history clear',
}

const BLANK_SPACE = '\u200B'

class HistoryController {
  constructor({
    executorSvc,
    rollEvalSvc,
    messageSvc,
    RollInteractor,
    HistoryInteractor,
  }) {
    this.executor = executorSvc
    this.rollEval = rollEvalSvc
    this.messageSvc = messageSvc

    this.hist = HistoryInteractor
    this.interactor = RollInteractor

    this.initListeners()
  }

  generateLastRollResponse(roll) {
    if (!roll) {
      return 'There were no previous rolls found in this channel.'
    }

    const { userId, rollDt, rolled, channelId, rank, subrank } = roll

    const embed = new MessageEmbed({
      title: 'Last Roll',
      description: `The last roll in <#${channelId}> was by <@${userId}>.`,
      footer: 'Rolled at',
      timestamp: moment(rollDt).toDate(),
    })

    if (!rank) {
      embed.addField(diceRollToString(rolled), BLANK_SPACE)
    } else {
      embed.addField(
        this.rollEval.getEvalLabel({ rank, subrank }),
        diceRollToString(rolled)
      )
    }

    return embed
  }

  generateHighestRollReponse(roll) {
    if (!roll || !roll.rank) {
      return 'There were no highest rolls recorded for this channel.'
    }

    const { userId, rollDt, rolled, channelId, rank, subrank } = roll

    return new MessageEmbed({
      title: 'Highest Roll',
      description: `The highest roll in <#${channelId}> was by <@${userId}>.`,
      fields: [
        {
          name: this.rollEval.getEvalLabel({ rank, subrank }),
          value: diceRollToString(rolled),
        },
      ],
      footer: 'Rolled at',
      timestamp: moment(rollDt).toDate(),
    })
  }

  formatDate(date, forceAbsoluteDate) {
    const momentDt = moment(date)

    if (!forceAbsoluteDate && momentDt.isSame(new Date(), 'day')) {
      return `today, ${momentDt.format('h:mm:ss A')}`
    }

    return momentDt.format('MMM D, YYYY h:mm:ss A')
  }

  generateTallyResponse(channelId, tally) {
    const responseStrBuff = [
      `Here is the rank tally for <#${channelId}> as of ${this.formatDate(
        new Date(),
        true
      )}`,
    ]

    const formattedTally = tally
      .filter(({ rank }) => !!rank)
      .map(({ count, rank, subrank }) => ({
        label: this.rollEval.getEvalLabel({ rank, subrank }),
        count,
      }))

    for (const { label, count } of formattedTally) {
      responseStrBuff.push(`**${label}:** ${count}`)
    }

    return responseStrBuff.join('\n')
  }

  async handleClear(message) {
    const channelId = message.channel.id
    this.executor.queueJob(async () => {
      await this.hist.clearHistory(channelId)
      await message.channel.send(
        `${message.author} has cleared the history for channel ${message.channel}.`
      )
    }, channelId)
  }

  async handleLast(message) {
    const channelId = message.channel.id
    await this.executor.queueJob(async () => {
      const roll = await this.hist.getLastRoll(channelId)
      await message.channel.send(this.generateLastRollResponse(roll))
    }, channelId)
  }

  async handleHighest(message) {
    const channelId = message.channel.id
    await this.executor.queueJob(async () => {
      const roll = await this.hist.getHighestRoll(channelId)
      await message.channel.send(this.generateHighestRollReponse(roll))
    }, channelId)
  }

  async handleTally(message) {
    const channelId = message.channel.id
    await this.executor.queueJob(async () => {
      const tally = await this.hist.countPerRank(channelId)
      await message.channel.send(this.generateTallyResponse(channelId, tally))
    }, channelId)
  }

  initListeners() {
    const { messageSvc } = this

    messageSvc.onCommand(HistoryCommands.HIGHEST, this.handleHighest.bind(this))

    messageSvc.onCommand(HistoryCommands.LAST_ROLL, this.handleLast.bind(this))

    messageSvc.onCommand(HistoryCommands.TALLY, this.handleTally.bind(this))

    messageSvc.onCommand(HistoryCommands.CLEAR, this.handleClear.bind(this))
  }
}

module.exports = (injected) => new HistoryController(injected)
