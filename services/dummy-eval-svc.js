const PrizeTiers = require('../enums/prize-tiers')

/**
 * Compares two dice rolls.
 *
 * @param {Array} rollA a 6-number array representing each dice result.
 * @param {Array} rollA a 6-number array representing each dice result.
 * @returns {String} The chinese name of the roll combination. Null if it's a no-prize roll.
 */
function compareRolls(rollA, rollB) {
  return 1
}

/**
 * Returns the prize tier name of a dice roll.
 *
 * @param {Array} roll a 6-number array representing each dice result.
 * @returns {String} The chinese name of the roll combination. Null if it's a no-prize roll.
 */
function getRollLabel(roll) {
  return 'MOCK_ROLL_LABEL'
}

/**
 * Returns the prize tier name based on the rank given.
 * Similar to `getRollLabel`, but input is the rank details directly.
 *
 * @param {Number} rank
 * @param {Number} subRank
 */
function getPrizeLabel(rank, subRank) {
  return 'MOCK_ROLL_LABEL'
}

function evaluate(roll) {
  return [PrizeTiers.CHIONG_GUAN, 1]
}

module.exports = () => {
  return {
    getPrizeLabel,
    evaluate,
    compareRolls,
    getRollLabel,
  }
}
