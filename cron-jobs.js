var CronJob = require('cron').CronJob;
const debug = require('debug')('cron-jobs');
var bot = require('./bot.js');
const logger = require('./logger');

/** GET EXCHANGE INFO */
if (process.env.NODE_ENV === "production") {
  var cronTimeSyncFromServerTask = '0 0 6 * * *'; // Every day at 6 AM
} else {
  var cronTimeSyncFromServerTask = '0 */30 * * * *'; // every 30 minutes
}
var syncFromServerTaskJob = new CronJob(cronTimeSyncFromServerTask, function () {
  debug('Running job [syncFromServerTask]');
  try {
    //bot.syncFromServerTask(false);
  } catch(e) {
    logger.error('syncFromServerTask', e);
  }
});

module.exports.syncFromServerTaskJob = syncFromServerTaskJob;
