module.exports = () => {
  return {
    HighestRollCache: require('./highest-roll-cache')(),
    RollRepository: require('./roll-repository')(),
  }
}
