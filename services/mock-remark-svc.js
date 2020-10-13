const RemarkType = require('../enums/remark-type')

class MockRemarkSvc {
  // this is just for the mock
  _remarkVariationCtr = 0

  // just in case you have some dependencies
  constructor(injected) {
    this.injected = injected
  }

  /**
   * Returns a remark to be replied with the user along with what they rolled.
   *
   * @param {Object} param0 An object that contains the details of a roll.
   * @returns {Object} A remark to be embedded in the response to a user's roll.
   */
  getRemark({ userId, channelId, rolled, rank, subrank, rollDt }) {
    const mode = this._remarkVariationCtr++ % 3

    if (mode === 0) {
      // show a gif to the user
      return {
        type: RemarkType.GIF_URL,
        content:
          'https://media1.tenor.com/images/29650410a6ed4f0117dc72159182e55d/tenor.gif?itemid=14871471',
      }
    } else if (mode === 1) {
      // show a phrase or a quote to the user. you can use markdown and emojis, btw.
      return {
        type: RemarkType.STRING,
        content: 'RANDOM_QUOTE_HERE',
      }
    } else if (mode === 2) {
      // no response to the user. sometimes we just have to calm down.
      return null
    }
  }
}

module.exports = async (injected) => {
  // do something where. load some stuff, do http calls, etc
  return new MockRemarkSvc(injected)
}
