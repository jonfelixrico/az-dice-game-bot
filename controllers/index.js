module.exports = (injections) => {
  require('./roll-controller')(injections)
  require('./history-controller')(injections)
  require('./void-controller')(injections)
  require('./history-tally-controller')(injections)
}
