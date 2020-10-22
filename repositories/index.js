module.exports = () => {
  return {
    highestRollCache: require('./highest-roll-cache')(),
    rollRepository: require('./roll-repository')(),
  }
}
