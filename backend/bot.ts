import Big from 'big.js'
import { CronJob } from 'cron';
import nconf from 'nconf'
nconf.file({
  file: 'config.json',
  search: true
});
import * as strategy from './strategies/my-strategy-01'
import * as candleHandler from './candles-handler'
import * as i from './interfaces'
import * as xapi from './xapi'
import * as sio from './socketio'
import logger from './logger'

import Debug from 'debug'
const debug = Debug('bot')

const LOG_ID = '[bot] ';

let streamSessionId: string;
let botState: i.EBotState = i.EBotState.IDLE;
let tradeOrderId: number = 0;

const instrumentInfo: i.ICommonInstrumentBasicInfo = {
  currencyPrice: Big(4.835),
  leverage: Big(10),
  nominalValue: Big(10)
}
const mToBPercent: Big = Big(10);

let handleHttpServerInitialised = function () {
  xapi.wsMainOpen();
  strategy.init(instrumentInfo, mToBPercent);
}

let handleWsMainConnected = function () {
  xapi.wsMainLogin();
}

let handleWsMainLoggedIn = function (ssId: string) {
  streamSessionId = ssId;
  getCandlesJob.start();
  wsMainPingJob.start();
  xapi.wsStreamOpen();
}

let handleBufferedCandlesUpdated = function (candles: Array<i.ICommonCandle>) {
  candleHandler.resetMovingCandle();
  sio.sendToBrowser('bufferedCandlesUpdated', candles);
  /*if (botState === i.EBotState.IDLE) {
    //const candles = candleHandler.getCandles();
    strategy.runTA(candles);
    const resEnter: i.ITradeTransactionEnter | boolean = strategy.enter(candles, Big(10000));
    if (resEnter !== false) {
      logger.warn(LOG_ID + 'ENTER: %s', JSON.stringify(resEnter));
      if ((resEnter as i.ITradeTransactionEnter).side === i.ETradeSide.BUY) {
        xapi.wsMainTradeTransactionOpen(
          i.EXAPITradeTransactionCmd.BUY,
          (resEnter as i.ITradeTransactionEnter).volume,
          (resEnter as i.ITradeTransactionEnter).openPrice
        );
      } else if ((resEnter as i.ITradeTransactionEnter).side === i.ETradeSide.SELL) {
        xapi.wsMainTradeTransactionOpen(
          i.EXAPITradeTransactionCmd.SELL,
          (resEnter as i.ITradeTransactionEnter).volume,
          (resEnter as i.ITradeTransactionEnter).openPrice
        );
      }
      sio.sendToBrowser('enter', resEnter);
    }
  }*/
}

let handleMovingCandleUpdated = function (movingCandle: i.ICommonCandle) {
  sio.sendToBrowser('movingCandleUpdated', movingCandle);
}

let handleWsMainTradeEntered = function (orderId: number) {
  tradeOrderId = orderId;
  botState = i.EBotState.TRADE_REQUESTED;
}

let handleWsStreamConnected = function () {
  xapi.wsStreamStartGetTickPrices(streamSessionId);
  xapi.wsStreamStartGetKeepAlive(streamSessionId);
  xapi.wsStreamStartGetTradeStatus(streamSessionId);
  wsStreamPingJob.start();
}

let handleWsStreamTradeStatusReceived = function (streamingTradeStatusRecord: i.IXAPIStreamingTradeStatusRecord) {
  switch (streamingTradeStatusRecord.requestStatus) {
    case i.EXAPIStreamingTradeStatusRecordRequestStatus.ACCEPTED:
      botState = i.EBotState.TRADE_ACCEPTED;
      break;
    case i.EXAPIStreamingTradeStatusRecordRequestStatus.ERROR:
      botState = i.EBotState.TRADE_ERROR;
      break;
    case i.EXAPIStreamingTradeStatusRecordRequestStatus.PENDING:
      botState = i.EBotState.TRADE_PENDING;
      break;
    case i.EXAPIStreamingTradeStatusRecordRequestStatus.REJECTED:
      botState = i.EBotState.TRADE_REJECTED;
      break;
  }
}

let handleWsStreamTickPricesReceived = function (streamingTickRecord: i.IXAPIStreamingTickRecord) {
  candleHandler.updateMovingCandleFromTickPrice(streamingTickRecord);
  sio.sendToBrowser('tickPrice', streamingTickRecord);
}

const getCandlesJob = new CronJob('3 * * * * *', function () { // TODO: how to 'delay' as small as possible???
  debug('Running job [getCandles]');
  xapi.wsMainGetChartLastRequest(1);
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
  handleHttpServerInitialised,
  handleWsMainConnected,
  handleWsMainLoggedIn,
  handleBufferedCandlesUpdated,
  handleMovingCandleUpdated,
  handleWsMainTradeEntered,
  handleWsStreamConnected,
  handleWsStreamTradeStatusReceived,
  handleWsStreamTickPricesReceived
};