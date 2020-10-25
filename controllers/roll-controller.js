const { diceRollToString } = require('./utils')
const { MessageEmbed } = require('discord.js')
const RemarkType = require('../enums/remark-type')
const { BLANK_SPACE } = require('../enums/string-constants')

const RollCommands = {
  FORCED: '!roll force',
  REGULATED: '!roll',
}

class RollController {
  constructor({
    RollEvalService,
    MessageService,
    ExecutorService,
    RemarkService,
    RollInteractor,
    HistoryInteractor,
  }) {
    this.rollEval = RollEvalService
    this.messageSvc = MessageService
    this.executor = ExecutorService
    this.remarkSvc = RemarkService

    this.interactor = RollInteractor
    this.hist = HistoryInteractor

    this.initListeners()
  }

  async generateResponse(rollData) {
    const {
      isNewHighest,
      prevHolder,
      isPrevHolder,
      rolled,
      userId,
      channelId,
      rank,
      subrank,
      hasPrize,
    } = rollData

    const embed = new MessageEmbed()

    const label = hasPrize && this.rollEval.getEvalLabel({ rank, subrank })
    const userMention = `<@${userId}>`
    const channelMention = `<#${channelId}>`

    const descBuffer = []

    if (hasPrize) {
      const count = await this.hist.rankRollCount(channelId, rank, subrank)
      const prizeBuffer = [`${userMention} rolled **${label}**!`]

      if (count === 1) {
        prizeBuffer.push('**They are the first one to roll this combination.**')
      } else {
        prizeBuffer.push(`This combination has been rolled **${count}** times.`)
      }

      descBuffer.push(prizeBuffer.join(' '))
    } else {
      descBuffer.push(`${userMention} didn't roll a winning combination.`)
    }

    if (isNewHighest && isPrevHolder) {
      descBuffer.push(
        `They retain their position as the holder of the highest roll in ${channelMention}.`
      )
    } else if (isNewHighest && prevHolder) {
      descBuffer.push(
        `They now overtake <@${prevHolder}> as the user with the highest roll in ${channelMention}!`
      )
    } else if (isNewHighest && !prevHolder) {
      descBuffer.push(
        `They are now the holder of the highest roll in ${channelMention}!`
      )
    }

    const descStr = descBuffer.join('\n\n')

    embed.setDescription(descStr)

    const remark = await this.remarkSvc.getRemark(rollData)

    if (remark) {
      if (remark.type === RemarkType.STRING) {
        embed.addFields({
          // we won't use the name field.
          name: '\u200B',
          value: remark.content,
        })
      } else {
        embed.setImage(remark.content)
      }
    }

    return {
      content: diceRollToString(rolled),
      embed,
    }
  }

  doRoll(message) {
    const channelId = message.channel.id
    this.executor.queueJob(async () => {
      try {
        await message.react('🎲')
        const userId = message.author.id

        const roll = await this.interactor.roll(channelId, userId)

        await message.channel.send(await this.generateResponse(roll))
      } catch (e) {
        console.error(e)
        await message.reply(
          'something went wrong while processing the command.'
        )
      }
    }, channelId)
  }

  initListeners() {
    const { messageSvc, interactor, executor } = this

    messageSvc.onCommand(RollCommands.REGULATED, async (message) => {
      const { channel, author } = message
      /*
       * If the same user made the last roll, then we'll not allow them
       * to roll again. A reaction will be made to tell them that their
       * roll was prevented.
       */
      if (await interactor.didUserDoLastRoll(channel.id, author.id)) {
        executor.queueJob(async () => await message.react('🛑'), channel.id)
        return
      }

      this.doRoll(message)
    })

    /*
     * Even if the user is the same one who made the last roll,
     * the force command allows them to roll either way.
     */
    messageSvc.onCommand(RollCommands.FORCED, this.doRoll.bind(this))
  }
}

module.exports = (injected) => new RollController(injected)
