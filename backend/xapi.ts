import WebSocketClient from './WebSocketClient'
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
    //console.log('xapi candle timestamp:', candle['ctm']); // 1585830600000. Ok with doc!
    let obj: i.ICommonCandle = { date: 0, open: 0, high: 0, low: 0, close: 0, volume: 0 };

    obj.date = moment(candle['ctm']).toDate(); // Time is number of milliseconds from 01.01.1970, 00:00 GMT. e.g.: 1272529161605
    obj.open = candle['open'] / scale;
    obj.high = obj.open + candle['high'] / scale;
    obj.low = obj.open + candle['low'] / scale;
    obj.close = obj.open + candle['close'] / scale;
    obj.volume = candle['vol'];

    return obj;
  });
}

const _WebSocketClient: any = WebSocketClient;
let wsMain = new _WebSocketClient();
let wsStream = new _WebSocketClient();

/*** MAIN WEB SOCKET */
wsMain.onopen = (e: any) => {
  debug('Websocket opened for [' + addrMain + ']');
  em.emit(WS_MAIN_CONNECTED, addrMain);
}
wsMain.onmessage = (data: any, flags: any, number: any) => {
  //console.log('message from ws: %O', msg.data);
  const mydata = JSON.parse(data);
  if (mydata.status === true) {
    if (mydata.streamSessionId !== undefined) {
      debug('Main Websocket logged in');
      em.emit(WS_MAIN_LOGGED_IN, mydata.streamSessionId);
    } else {
      const candles = normalizeCandles(mydata.returnData.rateInfos, Math.pow(10, mydata.returnData.digits));
      candlesHandler.updateLastCandle(candles[candles.length - 1]);
    }
  } else {
    logger.error('Main Websocket status NOT true %O', mydata);
  }
}

/*** STREAM WEB SOCKET */
wsStream.onopen = (e: any) => {
  debug('Websocket opened for [' + addrStream + ']');
  em.emit(WS_STREAM_CONNECTED, addrStream);
}
wsStream.onmessage = (data: any, flags: any, number: any) => {
  //console.log('message from ws: %O', msg.data);
  const mydata = JSON.parse(data);
  if (mydata.command === 'tickPrices') {
    em.emit(TICK_PRICES_UPDATED, mydata.data);
  }
}

/*** EXPORTED FUNCTIONS */
let wsMainOpen = function() {
  wsMain.open(addrMain);
}

let wsStreamOpen = function() {
  wsStream.open(addrStream);
}

let wsMainLogin = function () {
  const msg: i.IXAPILogin = { command: "login", arguments: { userId: USER_ID, password: PASSWORD } };
  logger.info('wsMainLogin:' + JSON.stringify(msg));
  wsMain.send(JSON.stringify(msg));
}

const since = new Map();
since.set(1, 1); // period, available data in months
since.set(5, 1);
since.set(15, 1);
since.set(30, 7);
since.set(60, 7);
since.set(240, 13);
since.set(1440, 13);
since.set(10080, 60);
since.set(43200, 60);

let wsMainGetChartLastRequest = function (period: number) {
  const start = moment().subtract(since.get(period), 'month').valueOf();
  const msg: i.IXAPIChartLastRequest = { command: "getChartLastRequest", arguments: { info: { period: period, start: start, symbol: SYMBOL } } };
  logger.info('wsMainGetChartLastRequest:' + JSON.stringify(msg));
  wsMain.send(JSON.stringify(msg));
}

let wsStreamStartGetCandles = function (streamSessionId: string) {
  const msg: i.IXAPIGetCandles = { command: "getCandles", streamSessionId: streamSessionId, symbol: SYMBOL };
  logger.info('wsStreamStartGetCandles:' + JSON.stringify(msg));
  wsStream.send(JSON.stringify(msg));
}

let wsStreamStartGetTickPrices = function(streamSessionId: string) {
  const msg: i.IXAPIGetTickPrices = { command: "getTickPrices", streamSessionId: streamSessionId, symbol: SYMBOL };
  logger.info('wsStreamStartGetTickPrices:' + JSON.stringify(msg));
  wsStream.send(JSON.stringify(msg));
}

export {
  wsMainOpen,
  wsMainLogin,
  wsMainGetChartLastRequest,
  wsStreamOpen,
  wsStreamStartGetCandles,
  wsStreamStartGetTickPrices
}