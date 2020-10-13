let mockCompareVarietyCtr = 0
const EVAL_COMPARE_INDEX_MAPPING = [-1, 0, 1]

let mockEvalauteVarietyCtr = 0

function compareEvals(evalA, evalB) {
  return EVAL_COMPARE_INDEX_MAPPING[mockCompareVarietyCtr++ % 2]
}

function getEvalLabel(eval) {
  return 'MOCK_LABEL'
}

function evaluate(roll) {
  return mockEvalauteVarietyCtr++ % 2 === 0 ? null : [6, 1]
}

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
