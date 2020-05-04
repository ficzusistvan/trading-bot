import Big from 'big.js'
import { CronJob } from 'cron';
import nconf from 'nconf'
nconf.file({
  file: 'config.json',
  search: true
});
import technicalindicators from 'technicalindicators'
import * as strategy from './strategies/my-strategy-01'
import * as candleHandler from './candles-handler'
import * as i from './interfaces'
import * as xapi from './xapi'
import * as sio from './socketio'
import logger from './logger'

import Debug from 'debug'
const debug = Debug('bot')

let isGetCandlesJobEnabled = false;
let streamSessionId: string;

const instrumentInfo: i.ICommonInstrumentBasicInfo = {
  currencyPrice: Big(4.835),
  leverage: Big(10),
  nominalValue: Big(10)
}
const mToBPercent: Big = Big(10);

let start = function () {
  xapi.wsMainOpen();
  strategy.init(instrumentInfo, mToBPercent);
}

let setStreamSessionId = function (id: string) {
  streamSessionId = id;
  // TODO: where to handle this??
  xapi.wsStreamOpen();
}

let xtbLogin = function () {
  xapi.wsMainLogin();
}

let xtbGetCandle = function () {
  // TODO: try to fix 'getCandles' streaming command!!!
  //xapi.startGetCandlesStreaming(streamSessionId);
  isGetCandlesJobEnabled = true;
  getCandlesJob.start();
  wsMainPingJob.start();
}

let xtbStartTickPricesStreaming = function () {
  xapi.wsStreamStartGetTickPrices(streamSessionId);
  xapi.wsStreamStartGetKeepAlive(streamSessionId);
  //wsMainPingJob.start();
  wsStreamPingJob.start();
}

let run = function () {
  const candles = candleHandler.getCandles();
  strategy.runTA(candles);
  const resEnter: i.ITradeTransactionEnter | boolean = strategy.enter(candles, Big(10000));
  if (resEnter !== false) {
    logger.warn('ENTER: %O', resEnter);
    sio.sendToBrowser('enter', resEnter);
  }
}

const getCandlesJob = new CronJob('0 * * * * *', function () {
  debug('Running job [getCandles]');
  if (isGetCandlesJobEnabled) {
    xapi.wsMainGetChartLastRequest(1);
  }
});

const wsMainPingJob = new CronJob('*/5 * * * * *', function () { // every 3 minutes
  debug('Running job [wsMainPingJob]');
  xapi.wsMainPing(streamSessionId);
});

const wsStreamPingJob = new CronJob('*/5 * * * * *', function () { // every 3 minutes
  debug('Running job [wsStreamPingJob]');
  xapi.wsStreamPing(streamSessionId);
});

export {
  xtbLogin,
  xtbGetCandle,
  xtbStartTickPricesStreaming,
  setStreamSessionId,
  start,
  run
};