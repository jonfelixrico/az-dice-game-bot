module.exports = async (injected) => {
  return {
    highestRollRepo: await require('./highest-repo')(injected),
    rollEvalSvc: await require('./dummy-eval-svc')(injected),
    executorSvc: await require('./executor-svc')(injected),
    messageSvc: await require('./message-svc')(injected),
  }
}
