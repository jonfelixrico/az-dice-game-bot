module.exports = (injections) => {
  require('./rolldice')(injections)
  require('./get-highest')(injections)
  require('./clear-highest')(injections)
}
