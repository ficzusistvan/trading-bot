import WebSocket from 'ws'
//import ReconnectingWebSocket from 'reconnecting-websocket';
import * as i from './interfaces'
import * as candlesHandler from './candles-handler'
import logger from './logger'
import moment from 'moment'
import { em, WS_MAIN_CONNECTED, WS_MAIN_LOGGED_IN, WS_STREAM_CONNECTED, TICK_PRICES_UPDATED } from './event-handler'
import Debug from 'debug'
const debug = Debug('xapi')
import nconf from 'nconf'
nconf.file({
  file: 'config.json',
  search: true
});

const ADDRESS_DEMO = 'wss://ws.xtb.com/demo';
const ADDRESS_DEMO_STREAM = 'wss://ws.xtb.com/demoStream';
//const ADDRESS_REAL = 'wss://ws.xtb.com/real';
//const ADDRESS_REAL_STREAM = 'wss://ws.xtb.com/realStream';
const addrMain = ADDRESS_DEMO;
const addrStream = ADDRESS_DEMO_STREAM;

const USER_ID = nconf.get('xapi:userId');
const PASSWORD = nconf.get('xapi:password');
const SYMBOL = nconf.get('xapi:symbol');

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

const optionsMain = {
  maxPayload: 10000000
};
const optionsStream = {
  maxPayload: 10000000
};

let wsMain: WebSocket;
let wsStream: WebSocket;

/*** EXPORTED FUNCTIONS */
let wsMainOpen = function () {
  wsMain = new WebSocket(addrMain, optionsMain);
  wsMain.addEventListener('open', () => {
    debug('wsMain for [' + addrMain + ']');
    em.emit(WS_MAIN_CONNECTED, addrMain);
  });
  wsMain.addEventListener('message', (event: any) => {
    //console.log('message from ws: %O', msg.data);
    const mydata = JSON.parse(event.data);
    if (mydata.status === true) {
      if (mydata.streamSessionId !== undefined) {
        debug('wsMain logged in');
        em.emit(WS_MAIN_LOGGED_IN, mydata.streamSessionId);
      } else if (mydata.returnData !== undefined) {
        const candles = normalizeCandles(mydata.returnData.rateInfos, Math.pow(10, mydata.returnData.digits));
        candlesHandler.updateLastCandles(candles);
      } else {
        logger.info('wsMain ping confirmed');
      }
    } else {
      logger.error('wsMain status NOT true %O', mydata);
    }
  });
  wsMain.addEventListener('error', (e) => {
    logger.error('wsMain error:: %O', e);
  });
  wsMain.addEventListener('close', (e) => {
    logger.error('wsMain close:: %O', e);
  });
}

let wsStreamOpen = function () {
  wsStream = new WebSocket(addrStream, optionsStream);
  wsStream.addEventListener('open', () => {
    debug('wsStream opened for [' + addrStream + ']');
    em.emit(WS_STREAM_CONNECTED, addrStream);
  });
  wsStream.addEventListener('message', (event: any) => {
    //console.log('message from ws: %O', msg.data);
    const mydata = JSON.parse(event.data);
    if (mydata.command === 'tickPrices') {
      em.emit(TICK_PRICES_UPDATED, mydata.data);
    } else if (mydata.command === 'keepAlive') {
      logger.info('wsStream keepAlive received %O', mydata.data);
    } else {
      logger.info('wsStream received %O', event.data);
    }
  });
  wsStream.addEventListener('error', (e) => {
    logger.error('wsStream error', e);
  });
  wsStream.addEventListener('close', (e) => {
    logger.error('wsStream close', e);
  });
}

let wsMainLogin = function () {
  const msg: i.IXAPILogin = { command: "login", arguments: { userId: USER_ID, password: PASSWORD } };
  logger.info('wsMainLogin:' + JSON.stringify(msg));
  wsMain.send(JSON.stringify(msg));
}

let wsMainGetChartLastRequest = function (period: number) {
  const lastTimestamp = candlesHandler.getLastCandleTimestamp();
  const start = /*lastTimestamp !== undefined ? lastTimestamp :*/ moment().subtract(200, 'minute').valueOf();
  const msg: i.IXAPIChartLastRequest = { command: "getChartLastRequest", arguments: { info: { period: period, start: start, symbol: SYMBOL } } };
  logger.info('wsMainGetChartLastRequest:' + JSON.stringify(msg));
  wsMain.send(JSON.stringify(msg));
}

let wsMainPing = function (streamSessionId: string) {
  const msg: any = { command: "ping" };
  logger.info('wsMainPing:' + JSON.stringify(msg));
  wsMain.send(JSON.stringify(msg));
}

let wsStreamStartGetCandles = function (streamSessionId: string) {
  const msg: i.IXAPIGetCandles = { command: "getCandles", streamSessionId: streamSessionId, symbol: SYMBOL };
  logger.info('wsStreamStartGetCandles:' + JSON.stringify(msg));
  wsStream.send(JSON.stringify(msg));
}

let wsStreamStartGetTickPrices = function (streamSessionId: string) {
  const msg: i.IXAPIGetTickPrices = { command: "getTickPrices", streamSessionId: streamSessionId, symbol: SYMBOL };
  logger.info('wsStreamStartGetTickPrices:' + JSON.stringify(msg));
  wsStream.send(JSON.stringify(msg));
}

let wsStreamPing = function (streamSessionId: string) {
  const msg: any = { command: "ping", streamSessionId: streamSessionId };
  logger.info('wsStreamPing:' + JSON.stringify(msg));
  wsStream.send(JSON.stringify(msg));
}

let wsStreamStartGetKeepAlive = function (streamSessionId: string) {
  const msg: any = { command: "getKeepAlive", streamSessionId: streamSessionId };
  logger.info('wsStreamStartGetKeepAlive:' + JSON.stringify(msg));
  wsStream.send(JSON.stringify(msg));
}

export {
  wsMainOpen,
  wsMainLogin,
  wsMainGetChartLastRequest,
  wsMainPing,
  wsStreamOpen,
  wsStreamStartGetCandles,
  wsStreamStartGetTickPrices,
  wsStreamPing,
  wsStreamStartGetKeepAlive
}