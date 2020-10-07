module.exports = async (injected) => {
  return {
    highestRollRepo: await require('./highest-repo')(injected),
    rollEvalSvc: require('./mock-roll-eval-svc')(),
    executorSvc: require('./executor-svc')(),
  }
}
