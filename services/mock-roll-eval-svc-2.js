function compareRolls(rollA, rollB) {
  return 1
}

function getRollLabel(roll) {
  return 'MOCK_LABEL'
}

function compareEvals(evalA, evalB) {
  return 1
}

function getEvalLabel(eval) {
  return 'MOCK_LABEL'
}

function evaluate(roll) {
  return [6, 1]
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
    compareRolls,
    getRollLabel,
    getEvalLabel,
    evaluate,
    getRankList,
  }
}
