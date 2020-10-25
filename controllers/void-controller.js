const moment = require('moment-timezone')
const { diceRollToString } = require('./utils')

class VoidController {
  constructor({ RollInteractor, MessageService, RollEvalService }) {
    this.roll = RollInteractor
    this.msg = MessageService
    this.eval = RollEvalService
    this.initListeners()
  }

  _generateRollString({ rolled, rollDt, userId, rank, subrank }) {
    const rollStr = diceRollToString(rolled)
    const label = rank
      ? `**${this.eval.getEvalLabel({ rank, subrank })}**`
      : 'No matching prize.'

    return [
      rollStr,
      [`<@${userId}>`, label, moment(rollDt).format('MMM D, h:mm:ss a')].join(
        ' · '
      ),
    ]
      .map((str) => `> ${str}`)
      .join('\n')
  }

  _generateResponse({ voidedRoll }, author) {
    return [
      `The last roll has been voided by ${author}.`,
      this._generateRollString(voidedRoll),
    ].join('\n\n')
  }

  async handler(message) {
    const { member, channel } = message
    const isSupervisor = !!member.roles.cache.find(
      (role) => role.name === 'Dice Game Supervisor'
    )

    if (!isSupervisor) {
      message.react('❌')
      return
    }

    const voided = await this.roll.voidLastRoll(channel.id)

    if (!voided) {
      await channel.send('There are no remaining rolls in the channel.')
      return
    }

    await channel.send(this._generateResponse(voided, message.author))
  }

  initListeners() {
    this.msg.onCommand('!void', this.handler.bind(this))
  }
}

module.exports = (injected) => new VoidController(injected)
