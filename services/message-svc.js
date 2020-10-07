const { fromEvent } = require('rxjs')
const { filter, groupBy, mergeMap, debounceTime } = require('rxjs/operators')
module.exports = ({ client }) => {
  const messageEvent = fromEvent(client, 'message')

  /**
   * Similar to client.on('message' () => { // insert logic here }), but with extra
   * steps. This also includes filtering command calls and debouncing how much a user
   * calls a command to avoid spamming the server.
   *
   * @param {String} command The command to look out for.
   * @param {Function} callback The function to be called if the user entered
   *  a message with the content  that matches the provided `command`.
   * @param {Number} debouncePerUser Defaults to 1000. This is the amount of ms
   *  to debounce the command call of the user.
   */
  function onCommand(command, callback, debouncePerUser = 750) {
    return messageEvent
      .pipe(
        filter(({ content }) => content === command),
        groupBy(({ channel, author }) =>
          [command, channel.id, author.id].join('/')
        ),
        mergeMap((group$) => {
          return group$.pipe(debounceTime(debouncePerUser))
        })
      )
      .subscribe(callback)
  }

  return {
    onCommand,
  }
}
