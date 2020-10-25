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

    const highestEvalResults = rank
      ? await this._evaluateAgainstHighest(newRoll)
      : {}

    return {
      ...newRoll,
      ...highestEvalResults,
      hasPrize: !!rank,
    }
  }

  async _evaluateAgainstHighest(roll) {
    const { highestCache, evalSvc } = this
    const { channelId } = roll

    const currentHighest = await highestCache.getHighestRoll(channelId)

    if (!currentHighest || evalSvc.compareEvals(roll, currentHighest) === 1) {
      await highestCache.setHighestRoll(roll)

      return {
        isNewHighest: true,
        prevHolder: currentHighest && currentHighest.userId,
        isPrevHolder: currentHighest && currentHighest.userId === roll.userId,
      }
    }

    return {}
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
      didHighestRollChange: wasVoidedAlsoHighest,
      lastRoll: await rollRepo.getLastRoll(channelId),
      highestRoll: await highestCache.getHighestRoll(channelId),
    }
  }
}

module.exports = (injected) => new RollInteractor(injected)
