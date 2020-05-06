import Big from 'big.js'
import { CronJob } from 'cron';
import nconf from 'nconf'
nconf.file({
  file: 'config.json',
  search: true
});
import * as strategy from './strategy'
import * as i from './interfaces'
import * as xapi from './xapi'
import * as sio from './socketio'
import logger from './logger'

import Debug from 'debug'
const debug = Debug('bot')

const LOG_ID = '[bot] ';

let streamSessionId: string;
let botState: i.EBotState = i.EBotState.WAITING_FOR_ENTER_SIGNAL;
let enteredOrderId: number = 0;
let openedTradeRecord: i.IXAPIStreamingTradeRecord = {
  close_price: 0,
  close_time: 0,
  closed: true,
  cmd: i.EXAPITradeTransactionCmd.BALANCE,
  comment: '',
  commission: 0,
  customComment: '',
  digits: 0,
  expiration: 0,
  margin_rate: 0,
  offset: 0,
  open_price: 0,
  open_time: 0,
  order: 0,
  order2: 0,
  position: 0,
  profit: 0,
  sl: 0,
  state: i.EXAPIStreamingTradeRecordState.DELETED,
  storage: 0,
  symbol: '',
  tp: 0,
  type: i.EXAPIStreamingTradeRecordType.PENDING,
  volume: 0
};

const instrumentInfo: i.ICommonInstrumentBasicInfo = {
  currencyPrice: Big(4.835),
  leverage: Big(10),
  nominalValue: Big(10)
}
const mToBPercent: Big = Big(10);

/*** LOCAL FUNCTIONS */
let normalizeCandles = function (candles: Array<i.IXAPIRateInfoRecord>, scale: number) {
  return candles.map(candle => {
    let obj: i.ICommonCandle = { date: 0, open: 0, high: 0, low: 0, close: 0, volume: 0 };

    obj.date = candle['ctm'];
    obj.open = candle['open'] / scale;
    obj.high = obj.open + candle['high'] / scale;
    obj.low = obj.open + candle['low'] / scale;
    obj.close = obj.open + candle['close'] / scale;
    obj.volume = candle['vol'];

    return obj;
  });
}

/*** EXPORTED FUNCTIONS */
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

let handleChartLastInfoReceived = function (returnData: i.IXAPIChartLastRequestReturnData) {
  const candles: Array<i.ICommonCandle> = normalizeCandles(returnData.rateInfos, Math.pow(10, returnData.digits));
  if (botState === i.EBotState.WAITING_FOR_ENTER_SIGNAL) {
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
  }
  sio.sendToBrowser('bufferedCandlesUpdated', candles);
}

let handleWsMainTradeEntered = function (orderId: number) {
  enteredOrderId = orderId;
  botState = i.EBotState.TRADE_REQUESTED;
}

let handleWsStreamConnected = function () {
  xapi.wsStreamStartGetTickPrices(streamSessionId);
  xapi.wsStreamStartGetKeepAlive(streamSessionId);
  xapi.wsStreamStartGetTradeStatus(streamSessionId);
  xapi.wsStreamStartGetTrades(streamSessionId);
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

let handleWsStreamTradeReceived = function (streamingTradeRecord: i.IXAPIStreamingTradeRecord) {
  if (streamingTradeRecord.type === i.EXAPIStreamingTradeRecordType.OPEN 
    && streamingTradeRecord.state === i.EXAPIStreamingTradeRecordState.MODIFIED
    && streamingTradeRecord.order2 === enteredOrderId) {
    openedTradeRecord = streamingTradeRecord;
    botState = i.EBotState.WAITING_FOR_EXIT_SIGNAL;
  }
  if (streamingTradeRecord.type === i.EXAPIStreamingTradeRecordType.CLOSE 
    && streamingTradeRecord.state === i.EXAPIStreamingTradeRecordState.MODIFIED
    && streamingTradeRecord.order2 === enteredOrderId) {
    openedTradeRecord = { // reset opened trade record
      close_price: 0,
      close_time: 0,
      closed: true,
      cmd: i.EXAPITradeTransactionCmd.BALANCE,
      comment: '',
      commission: 0,
      customComment: '',
      digits: 0,
      expiration: 0,
      margin_rate: 0,
      offset: 0,
      open_price: 0,
      open_time: 0,
      order: 0,
      order2: 0,
      position: 0,
      profit: 0,
      sl: 0,
      state: i.EXAPIStreamingTradeRecordState.DELETED,
      storage: 0,
      symbol: '',
      tp: 0,
      type: i.EXAPIStreamingTradeRecordType.PENDING,
      volume: 0    
    };
    botState = i.EBotState.WAITING_FOR_ENTER_SIGNAL;
  }
}

let handleWsStreamTickPricesReceived = function (streamingTickRecord: i.IXAPIStreamingTickRecord) {
  // handle exit strategy if state is requireing it
  if (botState === i.EBotState.WAITING_FOR_EXIT_SIGNAL) {
    const resExit: boolean = strategy.exit(streamingTickRecord, Big(openedTradeRecord.open_price), openedTradeRecord.cmd);
    if (resExit !== false) {
      logger.warn(LOG_ID + 'EXIT: %s', JSON.stringify(resExit));
      xapi.wsMainTradeTransactionClose(
        openedTradeRecord.cmd,
        openedTradeRecord.volume,
        openedTradeRecord.close_price,
        openedTradeRecord.order
      );
    }
  }
  sio.sendToBrowser('tickPrice', streamingTickRecord);
}

const getCandlesJob = new CronJob('3 * * * * *', function () { // TODO: how to 'delay' as small as possible???
  debug('Running job [getCandles]');
  xapi.wsMainGetChartLastRequest(1);
});

const wsMainPingJob = new CronJob('*/5 * * * * *', function () { // every 5 seconds
  debug('Running job [wsMainPingJob]');
  xapi.wsMainPing(streamSessionId);
});

const wsStreamPingJob = new CronJob('*/5 * * * * *', function () { // every 5 seconds
  debug('Running job [wsStreamPingJob]');
  xapi.wsStreamPing(streamSessionId);
});

export {
  handleHttpServerInitialised,
  handleWsMainConnected,
  handleWsMainLoggedIn,
  handleChartLastInfoReceived,
  handleWsMainTradeEntered,
  handleWsStreamConnected,
  handleWsStreamTradeStatusReceived,
  handleWsStreamTradeReceived,
  handleWsStreamTickPricesReceived
};