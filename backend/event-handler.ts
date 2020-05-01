import Emittery from 'emittery'
export const em = new Emittery();
import * as bot from './bot'
import * as xtb from './xapi'
import logger from './logger'

export const HTTP_SERVER_INITIALISED = 'HTTP_SERVER_INITIALISED';
export const WS_MAIN_CONNECTED = 'WS_MAIN_CONNECTED';
export const WS_MAIN_LOGGED_IN = 'WS_MAIN_LOGGED_IN';
export const WS_STREAM_CONNECTED = 'WS_STREAM_CONNECTED';
export const UPDATED_CANDLES = 'UPDATED_CANDLES';
export const BOT_RUN_END = 'BOT_RUN_END';
export const MIN_TRADE_AMOUNT_REACHED = 'MIN_TRADE_AMOUNT_REACHED';

em.on(HTTP_SERVER_INITIALISED, function (data: any) {
  logger.info('HttpServerInitialized [%s]', data);
  logger.info('Starting bot...');
  bot.run();
});

em.on(WS_MAIN_CONNECTED, function(data: any) {
  bot.xtbLogin();
});

em.on(WS_MAIN_LOGGED_IN, function(streamSessionId: string) {
  logger.info('WebSocket logged in [%s]', streamSessionId);
  bot.xtbGetCandle(streamSessionId);
});