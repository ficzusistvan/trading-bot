import Emittery from 'emittery'
export const em = new Emittery();
import * as bot from './bot'
import * as i from './interfaces'
import logger from './logger'
import * as sio from './socketio';

export const HTTP_SERVER_INITIALISED = 'HTTP_SERVER_INITIALISED';
export const WS_MAIN_CONNECTED = 'WS_MAIN_CONNECTED';
export const WS_MAIN_LOGGED_IN = 'WS_MAIN_LOGGED_IN';
export const WS_STREAM_CONNECTED = 'WS_STREAM_CONNECTED';
export const TICK_PRICES_UPDATED = 'TICK_PRICES_UPDATED';
export const UPDATED_CANDLES = 'UPDATED_CANDLES';
export const BOT_RUN_END = 'BOT_RUN_END';
export const MIN_TRADE_AMOUNT_REACHED = 'MIN_TRADE_AMOUNT_REACHED';

em.on(HTTP_SERVER_INITIALISED, function (port: number) {
  logger.info('HttpServerInitialized on port [%s]', port);
  logger.info('Starting bot...');
  bot.run();
});

em.on(WS_MAIN_CONNECTED, function(addr: string) {
  logger.info('WsMain connected', addr);
  bot.xtbLogin();
});

em.on(WS_STREAM_CONNECTED, function(addr: string) {
  logger.info('WsStream connected', addr);
  bot.xtbStartTickPricesStreaming();
});

em.on(WS_MAIN_LOGGED_IN, function(streamSessionId: string) {
  logger.info('WsMain logged in [%s]', streamSessionId);
  bot.setStreamSessionId(streamSessionId);
  // TODO: should this be here??
  bot.xtbGetCandle();
});

em.on(UPDATED_CANDLES, function(candle: i.ICommonCandle) {
  logger.info('Updated last candle %O', candle);
  sio.sendToBrowser('candle', candle);
})

em.on(TICK_PRICES_UPDATED, function(streamingTickRecord: any) {
  //logger.info('Tick prices updated [%O]'/*, streamingTickRecord*/);
});