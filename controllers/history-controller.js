const { MessageEmbed } = require('discord.js')

const HistoryCommands = {
  LAST_ROLL: '!history last',
  HIGHEST: '!history highest',
  CLEAR: '!history clear',
}

class HistoryController {
  constructor({
    ExecutorService,
    RollEvalService,
    MessageService,
    RollInteractor,
    HistoryInteractor,
    ControllerHelperService,
  }) {
    this.executor = ExecutorService
    this.rollEval = RollEvalService
    this.messageSvc = MessageService

    this.hist = HistoryInteractor
    this.interactor = RollInteractor
    this.helper = ControllerHelperService

    this.initListeners()
  }

  generateLastRollResponse(roll) {
    return new MessageEmbed({
      title: 'Latest Roll',
      description: roll
        ? this.helper.stringifyRoll(roll)
        : 'There were no previous rolls found in this channel.',
    })
  }

  generateHighestRollReponse(roll) {
    return new MessageEmbed({
      title: 'Highest Roll',
      description: roll
        ? this.helper.stringifyRoll(roll)
        : 'There were no highest rolls recorded for this channel.',
    })
  }

  async handleClear(message) {
    const channelId = message.channel.id
    this.executor.queueJob(async () => {
      if (!this.helper.isSupervisor(message.member)) {
        message.react('❌')
        return
      }

      try {
        await this.hist.clearHistory(channelId)
        await message.channel.send(
          new MessageEmbed({
            title: 'History Cleared',
            description: `${message.author} has cleared the roll history for channel ${message.channel}.`,
          })
        )
      } catch (e) {
        console.error(e)
        await message.reply(
          'Something went wrong while attemtpting to clear the history. Please try again later.'
        )
      }
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

  initListeners() {
    const { messageSvc } = this

    messageSvc.onCommand(HistoryCommands.HIGHEST, this.handleHighest.bind(this))
    messageSvc.onCommand(HistoryCommands.LAST_ROLL, this.handleLast.bind(this))
    messageSvc.onCommand(HistoryCommands.CLEAR, this.handleClear.bind(this))
  }
}

module.exports = (injected) => new HistoryController(injected)
