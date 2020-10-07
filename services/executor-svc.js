const { Subject, Observable, throwError, of } = require('rxjs')
const { filter, groupBy, mergeMap, concatMap, take } = require('rxjs/operators')
const { v4: uuid } = require('uuid')

// subject for incoming jobs
const jobDispatcher = new Subject()
// subject for finished jobs
const jobNotifier = new Subject()

/**
 * Queues a function for execution.
 *
 * @param {Function} fn The function to be executed.
 * @param {String} jobGroup Which group the function will be queued under.
 *
 * @returns {Promise<void>} Resolves if the function has been executed.
 */
function queueJob(fn, jobGroup = 'general') {
  const id = uuid()

  // creates the job payload to be queued
  const job = {
    fn,
    group: jobGroup,
    id,
  }

  console.debug(`Queued job ${jobGroup}/${id}.`)

  // the actual function that does the queue-like operation.
  jobDispatcher.next(job)

  /*
   * create a promise which will resolve if the provided function has been executed
   * by the executor. may have delays depending on how much jobs were queued in the group.
   */
  return (
    jobNotifier
      .pipe(
        filter(({ jobId }) => jobId === id),
        mergeMap(({ err }) => {
          /*
           * proceed as normal if there were no errors caught by the executor.
           * do not that even if your promise returns a value, it will automatically
           * be returned as undefined by the executor. too lazy to implement that.
           */
          if (!err) {
            return of(undefined)
          }

          /*
           * if an error was caught, an error observable will be thrown which will make
           * the observable throw. see more below
           */
          return throwError(err)
        }),
        take(1)
      )
      /*
       * if the observable produced by jobNotifier.pipe succeeds, then the promise will
       * resolve normally. if it got errored out due to `throwError` above, the promise
       * will reject.
       */
      .toPromise()
  )
}

/**
 * This is pretty much the handler for the queue groups. 1 group = one
 * concatMapped observable.
 * @param {*} group$
 */
function processGroupObservable(group$) {
  return group$.pipe(
    // the concatMap causes the queue-like behavior. concatMap allows one observable to execute at a time.
    concatMap(
      ({ id: jobId, fn, group }) =>
        new Observable((obs) => {
          fn()
            .then(() => {
              console.debug(`Finished job ${group}/${jobId} without problems.`)
              obs.next({ jobId })
            })
            .catch((err) => {
              console.error(`Failed job ${group}/${jobId}`, err)
              obs.next({ jobId, err })
            })
            .finally(() => obs.complete())
        })
    )
  )
}

function bootstrap() {
  // jobDispatcher is where the jobs get lined up
  jobDispatcher
    .pipe(
      /*
       * group by creates an observable if a new job gets queued which has an
       * unregistered group in the groupBy magic (idk the specifics).
       *
       * just imagine that a queue gets created for each new group.
       */
      groupBy((job) => job.group),
      // this does the actual execution. just check processGroupObservable
      mergeMap(processGroupObservable)
    )
    .subscribe((jobResult) => jobNotifier.next(jobResult))
}

module.exports = () => {
  bootstrap()

  return {
    queueJob,
  }
}
