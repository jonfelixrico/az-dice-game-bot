const { diceRollToString } = require('./utils')
const { MessageEmbed } = require('discord.js')
const RemarkType = require('../enums/remark-type')

const RollCommands = {
  FORCED: '!roll force',
  REGULATED: '!roll',
}

class RollController {
  constructor({
    rollInteractor,
    rollEvalSvc,
    messageSvc,
    executorSvc,
    remarkSvc,
    historyInteractor,
  }) {
    this.interactor = rollInteractor
    this.rollEval = rollEvalSvc
    this.messageSvc = messageSvc
    this.executor = executorSvc
    this.remarkSvc = remarkSvc
    this.hist = historyInteractor

    this.initListeners()
  }

  async generateResponse(rollData) {
    const {
      isNewHighest,
      rolled,
      userId,
      channelId,
      rank,
      subrank,
      hasPrize,
    } = rollData

    const label = hasPrize && this.rollEval.getEvalLabel({ rank, subrank })

    const embed = new MessageEmbed()

    if (hasPrize) {
      embed.setTitle(label)
    }

    const descStrBuffer = [`<@${userId}> rolled ${diceRollToString(rolled)}`]
    if (hasPrize && isNewHighest) {
      descStrBuffer.push(`This is now the new highest roll in <#${channelId}>.`)
    } else if (!hasPrize) {
      descStrBuffer.push('This roll does not match any prize combinations.')
    }

    if (hasPrize) {
      const count = await this.hist.rankRollCount(channelId, rank, subrank)
      descStrBuffer.push(`_${label} has been rolled ${count} time(s)._`)
    }

    embed.setDescription(descStrBuffer.join('\n'))

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

    return embed
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
