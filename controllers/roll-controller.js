const { diceRollToString } = require('./utils')

const RollCommands = {
  FORCED: '!roll force',
  REGULATED: '!roll',
}

class RollController {
  constructor({ rollInteractor, rollEvalSvc, messageSvc, executorSvc }) {
    this.interactor = rollInteractor
    this.rollEval = rollEvalSvc
    this.messageSvc = messageSvc
    this.executor = executorSvc

    this.initListeners()
  }

  generateResponseString({
    isNewHighest,
    rolled,
    userId,
    channelId,
    rank,
    subrank,
  }) {
    const authorMention = `<@${userId}>`
    let authorStr = null

    if (rank) {
      const comboLabel = this.rollEval.getEvalLabel({ rank, subrank })
      const strBuff = [`${authorMention} rolled _**${comboLabel}!**_`]

      if (isNewHighest) {
        strBuff.push(`They now have the highest roll in <#${channelId}>.`)
      }

      authorStr = strBuff.join(' ')
    } else {
      authorStr = `${authorMention} didn't roll a prize-winning combination.`
    }

    return [authorStr, `> ${diceRollToString(rolled)}`].join('\n')
  }

  doRoll(message) {
    const channelId = message.channel.id
    this.executor.queueJob(async () => {
      try {
        await message.react('🎲')
        const userId = message.author.id

        const roll = await this.interactor.roll(channelId, userId)

        await message.channel.send(this.generateResponseString(roll))
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
      if (await interactor.didUserDoLastRollInChannel(channel.id, author.id)) {
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
