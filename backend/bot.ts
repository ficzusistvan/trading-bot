import Big from 'big.js'
import { CronJob } from 'cron';
import nconf from 'nconf'
nconf.file({
  file: 'config.json',
  search: true
});

import Debug from 'debug'
const debug = Debug('bot')

import * as xapi from './xapi'

const socketio = require('./socketio')
import * as logger from './logger'
import * as  eventHandler from './event-handler'

let isGetCandlesJobEnabled = false;

let xtbLogin = function () {
  xapi.login();
}

let xtbGetCandle = function(streamSessionId: any) {
  //xapi.startGetCandlesStreaming(streamSessionId);
  isGetCandlesJobEnabled = true;
  getCandlesJob.start();
}

let run = function () {
  
}

const getCandlesJob = new CronJob('0 * * * * *', function () {
  debug('Running job [getCandles]');
  if (isGetCandlesJobEnabled) {
    xapi.getChartLastRequest(1);
  }
});

export {
  xtbLogin,
  xtbGetCandle,
  run
};