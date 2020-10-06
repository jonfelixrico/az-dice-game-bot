module.exports = async (injected) => {
  return {
    highestRollRepo: await require('./mock-highest-repo')(injected),
  }
}
