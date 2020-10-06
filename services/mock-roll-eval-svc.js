/**
 *
 * @param {Array} roll
 * @returns If the roll is not connected to any prizes, return `null`.
 *  Else, return an array of numbers (max of length 2).
 */
function evaluateRoll(roll) {
  return [6]
  /*
   * If first place, then the returned array will look
   * something like this:
   * [1, 3]
   *
   * This means 1st place, 3rd tier.
   */
}

/**
 *
 * @param {Number} roll
 * @returns {String} The chinese name of the roll combination. Null if it's a no-prize roll.
 */
function getRollLabel(roll) {
  // chiong guan etc etc, you name it
  return `MOCK_ROLL_NAME`
}

/**
 * Compares two rolls.
 * @param {Array} a
 * @param {Array} b
 * @returns {Number} -1 if a is lesser than b, 0 if equal, 1 if a is greater than b.
 */
function compareRolls(a, b) {
  return 1
}

module.exports = () => {
  return {
    evaluateRoll,
    compareRolls,
    getRollLabel,
  }
}
