const { MessageEmbed } = require('discord.js')
const { diceRollToString } = require('./utils')

const BLANK_SPACE = '\u200B'

class VoidController {
  constructor({ RollInteractor, MessageService, RollEvalService }) {
    this.roll = RollInteractor
    this.msg = MessageService
    this.eval = RollEvalService
    this.initListeners()
  }

  generateResponseEmbed({ voidedRoll, lastRoll, highestRoll }) {
    console.debug(voidedRoll, lastRoll, highestRoll)
    const embed = new MessageEmbed({
      title: 'Last Roll Voided',

      fields: [
        {
          name: `Voided roll: ${diceRollToString(voidedRoll.rolled)} (${
            voidedRoll.rank ? this.eval.getEvalLabel(voidedRoll) : 'no prize'
          })`,
          value: `<@${voidedRoll.userId}>`,
        },
      ],
    })

    if (lastRoll) {
      embed.addField(
        `Restored last roll: ${diceRollToString(lastRoll.rolled)} (${
          lastRoll.rank ? this.eval.getEvalLabel(lastRoll) : 'no prize'
        })`,
        `<@${lastRoll.userId}>`
      )
    }

    if (highestRoll) {
      embed.addField(
        `Restored highest roll: ${diceRollToString(
          highestRoll.rolled
        )} (${this.eval.getEvalLabel(highestRoll)})`,
        `<@${highestRoll.userId}>`
      )
    }

    return embed
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

    await channel.send(this.generateResponseEmbed(voided))
  }

  initListeners() {
    this.msg.onCommand('!void', this.handler.bind(this))
  }
}

module.exports = (injected) => new VoidController(injected)
