const moment = require('moment-timezone')

class HistoryTallyController {
  constructor({
    ExecutorService,
    RollEvalService,
    MessageService,
    HistoryInteractor,
  }) {
    this.executor = ExecutorService
    this.eval = RollEvalService
    this.hist = HistoryInteractor

    MessageService.onCommand('!history tally', this.handler.bind(this))
  }

  formatDate(date, forceAbsoluteDate) {
    const momentDt = moment(date)

    if (!forceAbsoluteDate && momentDt.isSame(new Date(), 'day')) {
      return `today, ${momentDt.format('h:mm:ss A')}`
    }

    return momentDt.format('MMM D, YYYY h:mm:ss A')
  }

  _generateTallyResponse(channelId, tally, total) {
    const responseStrBuff = [
      `Here is the rank tally for <#${channelId}> as of ${this.formatDate(
        new Date(),
        true
      )}`,
    ]

    const formattedTally = tally
      .filter(({ rank }) => !!rank)
      .map(({ count, rank, subrank }) => ({
        label: this.eval.getEvalLabel({ rank, subrank }),
        count,
      }))

    for (const { label, count } of formattedTally) {
      responseStrBuff.push(`**${label}:** ${count}`)
    }

    responseStrBuff.push(`**Total rolls made:** ${total}`)

    return responseStrBuff.join('\n')
  }

  async handler(message) {
    const channelId = message.channel.id
    await this.executor.queueJob(async () => {
      const tally = await this.hist.countPerRank(channelId)
      const total = await this.hist.getRollCount(channelId)
      await message.channel.send(
        this._generateTallyResponse(channelId, tally, total)
      )
    }, channelId)
  }
}

module.exports = (inject) => new HistoryTallyController(inject)
