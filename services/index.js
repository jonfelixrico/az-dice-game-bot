module.exports = async (injected) => {
  const RollEvalService = await require('./roll-eval-svc')(injected)
  const ExecutorService = await require('./executor-svc')(injected)
  const MessageService = await require('./message-svc')(injected)
  const RemarkService = await require('./remark-svc')(injected)

  return {
    RollEvalService,
    ExecutorService,
    MessageService,
    RemarkService,
  }
}
