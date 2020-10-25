const { MessageEmbed } = require('discord.js')
const { sprintf } = require('sprintf-js')

class VoidController {
  constructor({
    RollInteractor,
    MessageService,
    RollEvalService,
    ControllerHelperService,
  }) {
    this.roll = RollInteractor
    this.msg = MessageService
    this.eval = RollEvalService
    this.helper = ControllerHelperService
    this.initListeners()
  }

  _generateResponse({ voidedRoll }, { author, channel }) {
    return [
      `The latest roll in ${channel} has been voided by ${author}.`,
      this.helper.stringifyRoll(voidedRoll),
    ].join('\n\n')
  }

  async handler(message) {
    const { member, channel, author } = message
    if (!this.helper.isSupervisor(member)) {
      message.react('❌')
      return
    }

    const voided = await this.roll.voidLastRoll(channel.id)

    if (!voided) {
      await channel.send(
        new MessageEmbed({
          description: sprintf(
            '%s tried to use `!void` in %s whose roll history is empty.',
            author,
            channel
          ),
        })
      )
      return
    }

    await channel.send(
      new MessageEmbed({
        description: this._generateResponse(voided, message),
      })
    )
  }

  initListeners() {
    this.msg.onCommand('!void', this.handler.bind(this))
  }
}

module.exports = (injected) => new VoidController(injected)
