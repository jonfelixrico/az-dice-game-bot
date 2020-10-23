module.exports = async (injected) => {
  const rollEvalSvc = await require('./roll-eval-svc')(injected)
  const executorSvc = await require('./executor-svc')(injected)
  const messageSvc = await require('./message-svc')(injected)
  const rollInteractor = await require('./roll-interactor')({
    ...injected,
    rollEvalSvc,
  })
  const historyInteractor = await require('./history-interactor')({
    ...injected,
    rollEvalSvc,
  })

  const remarkSvc = await require('./remark-svc')(injected)

  return {
    rollEvalSvc,
    executorSvc,
    messageSvc,
    rollInteractor,
    remarkSvc,
    historyInteractor,
  }
}
