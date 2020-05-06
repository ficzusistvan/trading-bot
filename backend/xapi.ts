import WebSocket from 'ws'
import ReconnectingWebSocket from 'reconnecting-websocket';
import * as i from './interfaces'
import logger from './logger'
import moment from 'moment'
import { em, events } from './event-handler'
import Big from 'big.js'
import Debug from 'debug'
const debug = Debug('xapi')
import nconf from 'nconf'
nconf.file({
  file: 'config.json',
  search: true
});

const LOG_ID = '[xapi] ';

const ADDRESS_DEMO = 'wss://ws.xtb.com/demo';
const ADDRESS_DEMO_STREAM = 'wss://ws.xtb.com/demoStream';
//const ADDRESS_REAL = 'wss://ws.xtb.com/real';
//const ADDRESS_REAL_STREAM = 'wss://ws.xtb.com/realStream';
const addrMain = ADDRESS_DEMO;
const addrStream = ADDRESS_DEMO_STREAM;

const USER_ID = nconf.get('xapi:userId');
const PASSWORD = nconf.get('xapi:password');
const SYMBOL = nconf.get('xapi:symbol');

const optionsMain = {
  WebSocket: WebSocket, // custom WebSocket constructor
};
const optionsStream = {
  WebSocket: WebSocket, // custom WebSocket constructor
};

let wsMain: ReconnectingWebSocket;
let wsStream: ReconnectingWebSocket;

/*** EXPORTED FUNCTIONS */
let wsMainOpen = function () {
  wsMain = new ReconnectingWebSocket(addrMain, [], optionsMain);
  wsMain.addEventListener('open', () => {
    debug('wsMain for [' + addrMain + ']');
    em.emit(events.WS_MAIN_CONNECTED, addrMain);
  });
  wsMain.addEventListener('message', (event: any) => {
    //console.log('message from ws: %O', msg.data);
    const mydata = JSON.parse(event.data);
    if (mydata.status === true) {
      if (mydata.streamSessionId !== undefined) {
        debug('wsMain logged in');
        em.emit(events.WS_MAIN_LOGGED_IN, mydata.streamSessionId);
      } else if (mydata.returnData !== undefined) {
        if (mydata.returnData.rateInfos !== undefined) {
          em.emit(events.WS_MAIN_CHART_LAST_INFO_RECEIVED, mydata.returnData)
        } else if (mydata.returnData.order !== undefined) {
          em.emit(events.WS_MAIN_TRADE_ENTERED, mydata.returnData.order);
        }
      } else {
        debug('wsMain ping confirmed');
      }
    } else {
      logger.error(LOG_ID + 'wsMain status NOT true %O', mydata);
    }
  });
  wsMain.addEventListener('error', (e) => {
    logger.error(LOG_ID + 'wsMain error:: %O', e);
  });
  wsMain.addEventListener('close', (e) => {
    logger.error(LOG_ID + 'wsMain close:: %O', e);
  });
}

let wsStreamOpen = function () {
  wsStream = new ReconnectingWebSocket(addrStream, [], optionsStream);
  wsStream.addEventListener('open', () => {
    debug('wsStream opened for [' + addrStream + ']');
    em.emit(events.WS_STREAM_CONNECTED, addrStream);
  });
  wsStream.addEventListener('message', (event: any) => {
    //console.log('message from ws: %O', msg.data);
    const mydata = JSON.parse(event.data);
    if (mydata.command === 'tickPrices') {
      em.emit(events.WS_STREAM_TICK_PRICES_RECEIVED, mydata.data);
    } else if (mydata.command === 'keepAlive') {
      debug('wsStream keepAlive received %O', mydata.data);
    } else if (mydata.command === 'tradeStatus') {
      logger.info(LOG_ID + 'wsStream tradeStatus received %O', mydata.data);
      em.emit(events.WS_STREAM_TRADE_STATUS_RECEIVED, mydata.data);
    } else {
      logger.info(LOG_ID + 'wsStream received %O', event.data);
    }
  });
  wsStream.addEventListener('error', (e) => {
    logger.error(LOG_ID + 'wsStream error', e);
  });
  wsStream.addEventListener('close', (e) => {
    logger.error(LOG_ID + 'wsStream close', e);
  });
}

let wsMainLogin = function () {
  const msg: i.IXAPILogin = { command: "login", arguments: { userId: USER_ID, password: PASSWORD } };
  logger.info(LOG_ID + 'wsMainLogin:' + JSON.stringify(msg));
  wsMain.send(JSON.stringify(msg));
}

let wsMainGetChartLastRequest = function (period: number) {
  const start = moment().subtract(100, 'minute').valueOf();
  const msg: i.IXAPIChartLastRequest = { command: "getChartLastRequest", arguments: { info: { period: period, start: start, symbol: SYMBOL } } };
  logger.info(LOG_ID + 'wsMainGetChartLastRequest:' + JSON.stringify(msg));
  wsMain.send(JSON.stringify(msg));
}

let wsMainTradeTransactionOpen = function (cmd: i.EXAPITradeTransactionCmd, volume: Big, price: Big) {
  const msg: i.IXAPITradeTransaction = {
    command: "tradeTransaction",
    arguments: {
      tradeTransInfo: {
        cmd: cmd,
        customComment: '', // The value the customer may provide in order to retrieve it later.
        expiration: 0, // Pending order expiration time
        offset: 0, // Trailing offset
        order: 0, // 0 or position number for closing/modifications
        price: +price.toFixed(2), // symbolResponse.Symbol.Ask.GetValueOrDefault();
        sl: 0.0,
        symbol: SYMBOL,
        tp: 0.0,
        type: i.EXAPITradeTransactionType.OPEN,
        volume: +volume.toFixed(2)
      }
    }
  }
  logger.info(LOG_ID + 'wsMainTradeTransactionOpen:' + JSON.stringify(msg));
  wsMain.send(JSON.stringify(msg));
}

let wsMainPing = function (streamSessionId: string) {
  const msg: any = { command: "ping" };
  debug('wsMainPing:' + JSON.stringify(msg));
  wsMain.send(JSON.stringify(msg));
}

let wsStreamStartGetCandles = function (streamSessionId: string) {
  const msg: i.IXAPIGetCandles = { command: "getCandles", streamSessionId: streamSessionId, symbol: SYMBOL };
  logger.info(LOG_ID + 'wsStreamStartGetCandles:' + JSON.stringify(msg));
  wsStream.send(JSON.stringify(msg));
}

let wsStreamStartGetTickPrices = function (streamSessionId: string) {
  const msg: i.IXAPIGetTickPrices = { command: "getTickPrices", streamSessionId: streamSessionId, symbol: SYMBOL };
  logger.info(LOG_ID + 'wsStreamStartGetTickPrices:' + JSON.stringify(msg));
  wsStream.send(JSON.stringify(msg));
}

let wsStreamStartGetTradeStatus = function (streamSessionId: string) {
  const msg: any = { command: "getTradeStatus", streamSessionId: streamSessionId };
  logger.info(LOG_ID + 'wsStreamStartGetTradeStatus:' + JSON.stringify(msg));
  wsStream.send(JSON.stringify(msg));
}

let wsStreamPing = function (streamSessionId: string) {
  const msg: any = { command: "ping", streamSessionId: streamSessionId };
  debug('wsStreamPing:' + JSON.stringify(msg));
  wsStream.send(JSON.stringify(msg));
}

let wsStreamStartGetKeepAlive = function (streamSessionId: string) {
  const msg: any = { command: "getKeepAlive", streamSessionId: streamSessionId };
  debug('wsStreamStartGetKeepAlive:' + JSON.stringify(msg));
  wsStream.send(JSON.stringify(msg));
}

export {
  wsMainOpen,
  wsMainLogin,
  wsMainGetChartLastRequest,
  wsMainTradeTransactionOpen,
  wsMainPing,
  wsStreamOpen,
  wsStreamStartGetCandles,
  wsStreamStartGetTickPrices,
  wsStreamStartGetTradeStatus,
  wsStreamPing,
  wsStreamStartGetKeepAlive
}