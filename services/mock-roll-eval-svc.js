let mockCompareVarietyCtr = 0
const EVAL_COMPARE_INDEX_MAPPING = [-1, 0, 1]

let mockEvalauteVarietyCtr = 0

/**
 *
 * @param {Object} a Contains properties `rank` and `subrank`. `subrank` is optional.
 * @param {Object} b Contains properties `rank` and `subrank`. `subrank` is optional.
 * @returns {Number} 1 if `a` is greater than `b`. -1 if `b` is greater than `a`. If they are tied, 0 is returned instead.
 */
function compareEvals(a, b) {
  // eval objects are arrays containing [rank, subrank]. if there's no subrank, the array can contain just one member
  return EVAL_COMPARE_INDEX_MAPPING[mockCompareVarietyCtr++ % 2]
}

/**
 *
 * @param {Object} eval The evaluation to be converted into string form.
 */
function getEvalLabel({ rank, subrank }) {
  return 'MOCK_LABEL'
}

/**
 *
 * @param {Array} roll A 6-member array where each member's value can only range between 1 to 6, inclusive.
 * @returns {Object} Contains `rank` and `subrank` properties. `subrank` is optional, though.
 */
function evaluate(roll) {
  return mockEvalauteVarietyCtr++ % 2 === 0 ? null : { rank: 6, subrank: 1 }
}

/**
 * Returns the different ranks and their labels.
 * @returns {Array}
 */
function getRankList() {
  return [
    {
      rank: 6,
      subrank: 1,
      label: 'RANK_6_1',
    },
    {
      rank: 6,
      subrank: 2,
      label: 'RANK_6_2',
    },
  ]
}

module.exports = () => {
  return {
    compareEvals,
    getEvalLabel,
    evaluate,
    getRankList,
  }
}
