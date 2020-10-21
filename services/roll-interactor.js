const random = require('lodash.random')

class RollInteractor {
  constructor(injected) {
    this.injected = injected
  }

  _rollDice() {
    return new Array(6).fill().map(() => random(1, 6))
  }

  get rollRepo() {
    return this.injected.rollHistoryRepo
  }

  get evalSvc() {
    return this.injected.rollEvalSvc
  }

  async roll(channelId, userId) {
    const { rollHistoryRepo, rollEvalSvc } = this.injected
    const rolled = this._rollDice()

    const { rank, subrank } = rollEvalSvc.evaluate(rolled) || {}

    const newRoll = await rollHistoryRepo.pushToHistory({
      userId,
      channelId,
      rolled,
      rank,
      subrank,
    })

    const highestRoll = await this.getChannelHighestRoll(channelId)

    return {
      ...newRoll,
      isNewHighest: highestRoll || newRoll.id === highestRoll.id,
    }
  }

  async getChannelHighestRoll(channelId) {
    const history = await this.rollRepo.getChannelRollHistory(channelId)

    if (!history.length) {
      return null
    }

    return [...history].sort((a, b) => this.evalSvc.compareEvals(b, a))[0]
  }

  async getChannelLastRoll(channelId) {
    const history = await this.rollRepo.getChannelRollHistory(channelId)

    return history.length && history[history.length - 1]
  }

  async didUserDoLastRollInChannel(channelId, userId) {
    const roll = await this.getChannelLastRoll(channelId)

    return roll && roll.userId === userId
  }

  async getChannelHistoryByRank(channelId) {
    const grouped = await this.rollRepo
      .getChannelRollHistory(channelId)
      .reduce((map, roll) => {
        const { rank, subrank } = roll
        const groupId = [rank || -1, subrank - 1].join('/')

        if (!map[groupId]) {
          map[groupId] = []
        }

        map[groupId].push(roll)
        return map
      }, {})

    const transformed = Object.values(grouped).map((values) => {
      const { rank, subrank } = values[0]
      return {
        rank,
        subrank,
        rolls: values.sort(
          (a, b) => a.rollDt.getMilliseconds() - b.rollDt.getMilliseconds()
        ),
      }
    })

    return this.evalSvc.getRankList().map((rollRank) => {
      const { rank, subrank } = rollRank
      const grouped = transformed.find(
        (g) => g.rank === rank && g.subrank === subrank
      )

      return {
        ...rollRank,
        rolls: grouped ? grouped.rolls : [],
      }
    })
  }

  async getChannelTallyByRank(channelId) {
    const groupedHistory = await this.getChannelHistoryByRank(channelId)

    return groupedHistory.map(({ rolls, ...data }) => {
      return {
        ...data,
        count: rolls.length,
      }
    })
  }

  async clearChannelHistory(channelId) {
    await this.rollRepo.clearChannelRollHistory(channelId)
  }
}

module.exports = (injected) => new RollInteractor(injected)
