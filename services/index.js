module.exports = async (injected) => {
  const rollEvalSvc = await require('./roll-eval-svc')(injected)
  const executorSvc = await require('./executor-svc')(injected)
  const messageSvc = await require('./message-svc')(injected)
  const rollHistoryRepo = await require('./mock-roll-history-repo')(injected)
  const rollInteractor = await require('./roll-interactor')({
    ...injected,
    rollHistoryRepo,
    rollEvalSvc,
  })

  const remarkSvc = await require('./remark-svc')(injected)

  return {
    rollEvalSvc,
    executorSvc,
    messageSvc,
    rollHistoryRepo,
    rollInteractor,
    remarkSvc,
  }
}
