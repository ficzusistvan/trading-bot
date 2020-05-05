import Emittery from 'emittery'
export const em = new Emittery();
import * as bot from './bot'
import * as i from './interfaces'
import logger from './logger'

const LOG_ID = '[event-handler] ';

export const events = {
  HTTP_SERVER_INITIALISED: 'HTTP_SERVER_INITIALISED',

  WS_MAIN_CONNECTED: 'WS_MAIN_CONNECTED',
  WS_MAIN_LOGGED_IN: 'WS_MAIN_LOGGED_IN',
  WS_MAIN_TRADE_ENTERED: 'WS_MAIN_TRADE_ENTERED',
  
  WS_STREAM_CONNECTED: 'WS_STREAM_CONNECTED',
  WS_STREAM_TICK_PRICES_RECEIVED: 'WS_STREAM_TICK_PRICES_RECEIVED',
  WS_STREAM_TRADE_STATUS_RECEIVED: 'WS_STREAM_TRADE_STATUS_RECEIVED',
  
  CANDLES_HANDLER_BUFFERED_CANDLES_UPDATED: 'CANDLES_HANDLER_BUFFERED_CANDLES_UPDATED',
  CANDLES_HANDLER_MOVING_CANDLE_UPDATED: 'CANDLES_HANDLER_MOVING_CANDLE_UPDATED',
  
  BOT_RUN_END: 'BOT_RUN_END',
  MIN_TRADE_AMOUNT_REACHED: 'MIN_TRADE_AMOUNT_REACHED'
}

/** HTTP SERVER EVENTS */
em.on(events.HTTP_SERVER_INITIALISED, function (port: number) {
  logger.info(LOG_ID + 'HttpServerInitialized on port [%s]', port);
  logger.info(LOG_ID + 'Starting bot...');
  bot.handleHttpServerInitialised();
});

/** WS_MAIN EVENTS */
em.on(events.WS_MAIN_CONNECTED, function(addr: string) {
  logger.info(LOG_ID + 'WsMain connected [%s]', addr);
  bot.handleWsMainConnected();
});

em.on(events.WS_MAIN_LOGGED_IN, function(streamSessionId: string) {
  logger.info(LOG_ID + 'WsMain logged in [%s]', streamSessionId);
  bot.handleWsMainLoggedIn(streamSessionId);
});

em.on(events.WS_MAIN_TRADE_ENTERED, function(orderId: number) {
  logger.info(LOG_ID + 'WsMain trade entered [%s]', orderId);
  bot.handleWsMainTradeEntered(orderId);
});

em.on(events.CANDLES_HANDLER_BUFFERED_CANDLES_UPDATED, function(candles: Array<i.ICommonCandle>) {
  logger.info(LOG_ID + 'Candles handler buffered candles updated [%s]', JSON.stringify(candles[candles.length - 1]));
  bot.handleBufferedCandlesUpdated(candles);
})

em.on(events.CANDLES_HANDLER_MOVING_CANDLE_UPDATED, function(movingCandle: i.ICommonCandle) {
  logger.info(LOG_ID + 'Candles handler moving candle updated [%s]', JSON.stringify(movingCandle));
  bot.handleMovingCandleUpdated(movingCandle);
});

/** WS_STREAM EVENTS */
em.on(events.WS_STREAM_CONNECTED, function(addr: string) {
  logger.info(LOG_ID + 'WsStream connected [%s]', addr);
  bot.handleWsStreamConnected();
});

em.on(events.WS_STREAM_TICK_PRICES_RECEIVED, function(streamingTickRecord: i.IXAPIStreamingTickRecord) {
  //logger.info(LOG_ID + 'Tick prices updated [%O]'/*, streamingTickRecord*/);
  bot.handleWsStreamTickPricesReceived(streamingTickRecord);
});

em.on(events.WS_STREAM_TRADE_STATUS_RECEIVED, function(streamingTradeStatusRecord: i.IXAPIStreamingTradeStatusRecord) {
  logger.info(LOG_ID + 'WsStream trade status received [%s]', JSON.stringify(streamingTradeStatusRecord));
  bot.handleWsStreamTradeStatusReceived(streamingTradeStatusRecord);
});