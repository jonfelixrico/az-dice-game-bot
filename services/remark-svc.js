const RemarkType = require('../enums/remark-type')

const gifRepliesContent = require('../data/gif-reply.json')
const textRepliesContent = require('../data/text-reply.json')
const random = require('lodash/random')

class RemarkSvc {
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
    // If there is no rank, assign 0
    if (!rank) {
      rank = 0
    }

    // Fetch a random mode between 1 = GIF_URL, 2 = STRING
    const mode = random(1, 2)
    const remark = { type: null, content: null }

    let replies = []

    if (mode == 1) {
      // show a gif to the user
      ;(remark.type = RemarkType.GIF_URL), (replies = gifRepliesContent[rank])
    }

    if (mode == 2) {
      // send a text to the user
      ;(remark.type = RemarkType.STRING), (replies = textRepliesContent[rank])
    }

    if (!replies) {
      return null
    }

    const repliesLastItemIndex = replies.length - 1
    // fetch a random content from the replies based on the type
    remark.content = replies[random(0, repliesLastItemIndex)]
    return remark
  }
}

module.exports = async (injected) => {
  // do something where. load some stuff, do http calls, etc
  return new RemarkSvc(injected)
}
