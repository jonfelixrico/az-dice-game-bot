module.exports = async (injected) => {
  return {
    highestRollRepo: await require('./mock-highest-repo')(injected),
    rollEvalSvc: require('./mock-roll-eval-svc')(),
  }
}
