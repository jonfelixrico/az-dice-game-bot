module.exports = async (injected) => {
  const rollEvalSvc = await require('./roll-eval-svc')(injected)
  const executorSvc = await require('./executor-svc')(injected)
  const messageSvc = await require('./message-svc')(injected)
  const remarkSvc = await require('./remark-svc')(injected)

  return {
    rollEvalSvc,
    executorSvc,
    messageSvc,
    remarkSvc,
  }
}
