import Emittery from 'emittery'
export const em = new Emittery();
import * as bot from './bot'
import * as i from './interfaces'
import logger from './logger'

export const events = {
  HTTP_SERVER_INITIALISED: 'HTTP_SERVER_INITIALISED',

  WS_MAIN_CONNECTED: 'WS_MAIN_CONNECTED',
  WS_MAIN_LOGGED_IN: 'WS_MAIN_LOGGED_IN',
  WS_MAIN_TRADE_ENTERED: 'WS_MAIN_TRADE_ENTERED',
  
  WS_STREAM_CONNECTED: 'WS_STREAM_CONNECTED',
  WS_STREAM_TICK_PRICES_RECEIVED: 'WS_STREAM_TICK_PRICES_RECEIVED',
  WS_STREAM_TRADE_STATUS_RECEIVED: 'WS_STREAM_TRADE_STATUS_RECEIVED',
  
  CANDLES_HANDLER_UPDATED: 'CANDLES_HANDLER_UPDATED',
  
  BOT_RUN_END: 'BOT_RUN_END',
  MIN_TRADE_AMOUNT_REACHED: 'MIN_TRADE_AMOUNT_REACHED'
}

/** HTTP SERVER EVENTS */
em.on(events.HTTP_SERVER_INITIALISED, function (port: number) {
  logger.info('HttpServerInitialized on port [%s]', port);
  logger.info('Starting bot...');
  bot.handleHttpServerInitialised();
});

/** WS_MAIN EVENTS */
em.on(events.WS_MAIN_CONNECTED, function(addr: string) {
  logger.info('WsMain connected [%s]', addr);
  bot.handleWsMainConnected();
});

em.on(events.WS_MAIN_LOGGED_IN, function(streamSessionId: string) {
  logger.info('WsMain logged in [%s]', streamSessionId);
  bot.handleWsMainLoggedIn(streamSessionId);
});

em.on(events.WS_MAIN_TRADE_ENTERED, function(orderId: number) {
  logger.info('WsMain trade entered [%s]', orderId);
  bot.handleWsMainTradeEntered(orderId);
});

em.on(events.CANDLES_HANDLER_UPDATED, function(candle: i.ICommonCandle) {
  logger.info('Candles handler updated [%s]', JSON.stringify(candle));
  bot.handleCandlesHandlerUpdated(candle);
})

/** WS_STREAM EVENTS */
em.on(events.WS_STREAM_CONNECTED, function(addr: string) {
  logger.info('WsStream connected [%s]', addr);
  bot.handleWsStreamConnected();
});

em.on(events.WS_STREAM_TICK_PRICES_RECEIVED, function(streamingTickRecord: any) {
  //logger.info('Tick prices updated [%O]'/*, streamingTickRecord*/);
  bot.handleWsStreamTickPricesReceived(streamingTickRecord);
});

em.on(events.WS_STREAM_TRADE_STATUS_RECEIVED, function(streamingTradeStatusRecord: i.IXAPIStreamingTradeStatusRecord) {
  logger.info('WsStream trade status received [%s]', JSON.stringify(streamingTradeStatusRecord));
  bot.handleWsStreamTradeStatusReceived(streamingTradeStatusRecord);
});