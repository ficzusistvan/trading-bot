import Big from 'big.js'
import { CronJob } from 'cron';
import * as ci from './common-interfaces'
import * as xi from './xapi-interfaces'
import * as xapi from './xapi'
import * as sio from './socketio'
import logger from './logger'
import nconf from 'nconf'
nconf.file({
  file: 'config.json',
  search: true
});

import Debug from 'debug'
const debug = Debug('bot')

const LOG_ID = '[bot] ';

let strategy: any;
let streamSessionId: string = '';
let balance: Big = Big(0);
let botState: ci.EBotState = ci.EBotState.WAITING_FOR_ENTER_SIGNAL;
let enteredOrderId: number = 0;
let openedTradeRecord: xi.IStreamingTradeRecord = {
  close_price: 0,
  close_time: 0,
  closed: true,
  cmd: xi.ECmd.BALANCE,
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
  state: xi.EState.DELETED,
  storage: 0,
  symbol: '',
  tp: 0,
  type: xi.EType.PENDING,
  volume: 0
};
let curCandles: Array<ci.ICandle> = [];

/*** LOCAL FUNCTIONS */
let normalizeCandles = function (candles: Array<xi.IRateInfoRecord>, scale: number) {
  return candles.map(candle => {
    let obj: ci.ICandle = { date: 0, open: 0, high: 0, low: 0, close: 0, volume: 0 };

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
}

let handleWsMainConnected = function () {
  xapi.wsMainLogin();
}

let handleWsMainLoggedIn = function (ssId: string) {
  streamSessionId = ssId;
  getCandlesJob.start();
  wsMainPingJob.start();
  xapi.wsStreamOpen();
  xapi.wsMainGetSymbol();
  xapi.wsMainGetMarginLevel();
}

let handleWsMainMarginLevelReceived = function (returnData: xi.IMarginLevelReturnData) {
  balance = Big(returnData.balance);
  logger.warn(LOG_ID + 'Balance: %s', balance);
}

let handleWsMainChartLastInfoReceived = function (returnData: xi.IChartLastRequestReturnData) {
  const candles: Array<ci.ICandle> = normalizeCandles(returnData.rateInfos, Math.pow(10, returnData.digits));
  if (botState === ci.EBotState.WAITING_FOR_ENTER_SIGNAL) {
    //const candles = candleHandler.getCandles();
    const inds = strategy.runTA(candles);
    const resEnter: ci.ITradeTransactionEnter | boolean = strategy.enter(candles, balance);
    if (resEnter !== false) {
      logger.warn(LOG_ID + 'ENTER: %s', JSON.stringify(resEnter));
      xapi.wsMainTradeTransactionOpen(
        (resEnter as ci.ITradeTransactionEnter).cmd,
        (resEnter as ci.ITradeTransactionEnter).volume,
        (resEnter as ci.ITradeTransactionEnter).openPrice
      );
      botState = ci.EBotState.TRADE_REQUEST_SENT;
      sio.sendToBrowser('enter', resEnter);
    }
    sio.sendToBrowser('indicatorsUpdated', inds);
  }
  curCandles = candles;
  sio.sendToBrowser('bufferedCandlesUpdated', candles);
}

let handleWsMainTradeEntered = function (returnData: xi.ITradeTransactionReturnData) {
  enteredOrderId = returnData.order;
  botState = ci.EBotState.TRADE_REQUESTED;
}

let handleWsMainSymbolReceived = async function (returnData: xi.IGetSymbolReturnData) {
  const instrumentInfo: ci.IInstrumentBasicInfo = {
    leverage: Big(100).div(Big(returnData.leverage)),
    nominalValue: Big(returnData.contractSize)
  }
  strategy = await import('./strategies/' + nconf.get('strategy:name'));
  strategy.updateInstrumentBasicInfo(instrumentInfo);
}

let handleWsStreamConnected = function () {
  xapi.wsStreamStartGetTickPrices(streamSessionId);
  xapi.wsStreamStartGetKeepAlive(streamSessionId);
  xapi.wsStreamStartGetTradeStatus(streamSessionId);
  xapi.wsStreamStartGetTrades(streamSessionId);
  xapi.wsStreamStartGetBalance(streamSessionId);
  wsStreamPingJob.start();
}

let handleWsStreamTradeStatusReceived = function (streamingTradeStatusRecord: xi.IStreamingTradeStatusRecord) {
  switch (streamingTradeStatusRecord.requestStatus) {
    case xi.ERequestStatus.ACCEPTED:
      botState = ci.EBotState.TRADE_IN_ACCEPTED_STATE;
      break;
    case xi.ERequestStatus.ERROR:
      botState = ci.EBotState.TRADE_IN_ERROR_STATE;
      break;
    case xi.ERequestStatus.PENDING:
      botState = ci.EBotState.TRADE_IN_PENDING_STATE;
      break;
    case xi.ERequestStatus.REJECTED:
      botState = ci.EBotState.TRADE_IN_REJECTED_STATE;
      break;
  }
}

let handleWsStreamTradeReceived = function (streamingTradeRecord: xi.IStreamingTradeRecord) {
  if (streamingTradeRecord.type === xi.EType.OPEN
    && streamingTradeRecord.state === xi.EState.MODIFIED
    && streamingTradeRecord.order2 === enteredOrderId) {
    openedTradeRecord = streamingTradeRecord;
    botState = ci.EBotState.WAITING_FOR_EXIT_SIGNAL;
  }
  if (streamingTradeRecord.type === xi.EType.CLOSE
    && streamingTradeRecord.state === xi.EState.MODIFIED
    && streamingTradeRecord.order2 === enteredOrderId) {
    openedTradeRecord = { // reset opened trade record
      close_price: 0,
      close_time: 0,
      closed: true,
      cmd: xi.ECmd.BALANCE,
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
      state: xi.EState.DELETED,
      storage: 0,
      symbol: '',
      tp: 0,
      type: xi.EType.PENDING,
      volume: 0
    };
    botState = ci.EBotState.WAITING_FOR_ENTER_SIGNAL;
  }
}

let handleWsStreamTickPricesReceived = function (streamingTickRecord: xi.IStreamingTickRecord) {
  // handle exit strategy if state is requireing it
  if (botState === ci.EBotState.WAITING_FOR_EXIT_SIGNAL) {
    const resExit: boolean = strategy.exit(curCandles, streamingTickRecord, Big(openedTradeRecord.open_price), openedTradeRecord.cmd);
    if (resExit !== false) {
      logger.warn(LOG_ID + 'EXIT: %s', JSON.stringify(resExit));
      xapi.wsMainTradeTransactionClose(
        openedTradeRecord.cmd,
        openedTradeRecord.volume,
        openedTradeRecord.close_price,
        openedTradeRecord.order
      );
      botState = ci.EBotState.TRADE_REQUEST_SENT;
    }
  }
  sio.sendToBrowser('tickPrice', streamingTickRecord);
}

let handleWsStreamBalanceReceived = function (streamingBalanceRecord: xi.IStreamingBalanceRecord) {
  balance = Big(streamingBalanceRecord.balance);
  if (botState !== ci.EBotState.WAITING_FOR_EXIT_SIGNAL) {
    logger.warn(LOG_ID + 'New balance: %s', balance);
  }
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
  handleWsMainMarginLevelReceived,
  handleWsMainChartLastInfoReceived,
  handleWsMainTradeEntered,
  handleWsMainSymbolReceived,
  handleWsStreamConnected,
  handleWsStreamTradeStatusReceived,
  handleWsStreamTradeReceived,
  handleWsStreamTickPricesReceived,
  handleWsStreamBalanceReceived
};