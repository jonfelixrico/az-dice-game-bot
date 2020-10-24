const random = require('lodash/random')

class RollInteractor {
  constructor({ RollRepository, RollEvalService, HighestRollCache }) {
    this.rollRepo = RollRepository
    this.evalSvc = RollEvalService
    this.highestCache = HighestRollCache
  }

  _rollDice() {
    return new Array(6).fill().map(() => random(1, 6))
  }

  async didUserDoLastRoll(channelId, userId) {
    const last = this.rollRepo.getLastRoll(channelId)
    return last && last.userId === userId
  }

  async roll(channelId, userId) {
    const { rollRepo, evalSvc } = this
    const rolled = this._rollDice()

    const { rank, subrank } = evalSvc.evaluate(rolled) || {}
    const newRoll = await rollRepo.pushToHistory({
      userId,
      channelId,
      rolled,
      rank,
      subrank,
    })

    const isNewHighest = rank && (await this._evaluateIfNewHighest(newRoll))

    return {
      ...newRoll,
      isNewHighest,
      hasPrize: !!rank,
    }
  }

  async _evaluateIfNewHighest(roll) {
    const { highestCache, evalSvc } = this
    const { channelId } = roll

    const highest = await this.highestCache.getHighestRoll(channelId)

    if (!highest || evalSvc.compareEvals(roll, highest) === 1) {
      await highestCache.setHighestRoll(roll)
      return true
    }

    return false
  }

  async voidLastRoll(channelId) {
    const { rollRepo, highestCache } = this
    const voidedRoll = await rollRepo.voidLastRoll(channelId)
    const highestRoll = await highestCache.getHighestRoll(channelId)

    if (!voidedRoll) {
      return null
    }

    const wasVoidedAlsoHighest =
      highestRoll && voidedRoll.uuid === highestRoll.uuid
    if (wasVoidedAlsoHighest) {
      await highestCache.voidHighestRoll(channelId)
    }

    return {
      voidedRoll,
      wasVoidedAlsoHighest,
      lastRoll: await rollRepo.getLastRoll(channelId),
      highestRoll: await highestCache.getHighestRoll(channelId),
    }
  }
}

module.exports = (injected) => new RollInteractor(injected)
