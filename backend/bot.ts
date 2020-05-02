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
let streamSessionId: string;

let setStreamSessionId = function(id: string) {
  streamSessionId = id;
  // TODO: where to handle this??
  xapi.wsStreamOpen();
}

let xtbLogin = function () {
  xapi.wsMainLogin();
}

let xtbGetCandle = function() {
  // TODO: try to fix 'getCandles' streaming command!!!
  //xapi.startGetCandlesStreaming(streamSessionId);
  isGetCandlesJobEnabled = true;
  getCandlesJob.start();
}

let xtbStartTickPricesStreaming = function() {
  xapi.wsStreamStartGetTickPrices(streamSessionId);
}

let run = function () {
  xapi.wsMainOpen();
}

const getCandlesJob = new CronJob('0 * * * * *', function () {
  debug('Running job [getCandles]');
  if (isGetCandlesJobEnabled) {
    xapi.wsMainGetChartLastRequest(1);
  }
});

export {
  xtbLogin,
  xtbGetCandle,
  xtbStartTickPricesStreaming,
  setStreamSessionId,
  run
};