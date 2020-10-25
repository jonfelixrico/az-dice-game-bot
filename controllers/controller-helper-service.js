const { diceRollToString } = require('./utils')
const moment = require('moment-timezone')

class ControllerHelperService {
  constructor({ RollEvalService }) {
    this.eval = RollEvalService
  }

  stringifyRoll({ rolled, rollDt, userId, rank, subrank }) {
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

  isSupervisor(member) {
    return !!member.roles.cache.find(
      (role) => role.name === 'Dice Game Supervisor'
    )
  }
}

module.exports = (injected) => new ControllerHelperService(injected)
