module.exports = (inject) => {
  const HistoryInteractor = require('./history-interactor')(inject)
  const RollInteractor = require('./roll-interactor')(inject)

  return {
    HistoryInteractor,
    RollInteractor,
  }
}
