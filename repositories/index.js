module.exports = () => {
  return {
    highestRollCache: require('./highest-roll-cache')(),
    rollRepo: require('./roll-repository')(),
  }
}
