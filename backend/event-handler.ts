import Emittery from 'emittery'
export const em = new Emittery();
import * as bot from './bot'
import * as xi from './xapi-interfaces'
import logger from './logger'

const LOG_ID = '[event-handler] ';

export const events = {
  HTTP_SERVER_INITIALISED: 'HTTP_SERVER_INITIALISED',

  WS_MAIN_CONNECTED: 'WS_MAIN_CONNECTED',
  WS_MAIN_LOGGED_IN: 'WS_MAIN_LOGGED_IN',
  WS_MAIN_MARGIN_LEVEL_RECEIVED: 'WS_MAIN_MARGIN_LEVEL_RECEIVED',
  WS_MAIN_CHART_LAST_INFO_RECEIVED: 'WS_MAIN_CHART_LAST_INFO_RECEIVED',
  WS_MAIN_TRADE_ENTERED: 'WS_MAIN_TRADE_ENTERED',
  WS_MAIN_SYMBOL_RECEIVED: 'WS_MAIN_SYMBOL_RECEIVED',

  WS_STREAM_CONNECTED: 'WS_STREAM_CONNECTED',
  WS_STREAM_TICK_PRICES_RECEIVED: 'WS_STREAM_TICK_PRICES_RECEIVED',
  WS_STREAM_TRADE_STATUS_RECEIVED: 'WS_STREAM_TRADE_STATUS_RECEIVED',
  WS_STREAM_TRADE_RECEIVED: 'WS_STREAM_TRADE_RECEIVED',
  WS_STREAM_BALANCE_RECEIVED: 'WS_STREAM_BALANCE_RECEIVED',

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
em.on(events.WS_MAIN_CONNECTED, function (addr: string) {
  logger.info(LOG_ID + 'WsMain connected [%s]', addr);
  bot.handleWsMainConnected();
});

em.on(events.WS_MAIN_LOGGED_IN, function (streamSessionId: string) {
  logger.info(LOG_ID + 'WsMain logged in [%s]', streamSessionId);
  bot.handleWsMainLoggedIn(streamSessionId);
});

em.on(events.WS_MAIN_MARGIN_LEVEL_RECEIVED, function (returnData: xi.IMarginLevelReturnData) {
  logger.info(LOG_ID + 'WsMain margin level received [%s]', JSON.stringify(returnData));
  bot.handleWsMainMarginLevelReceived(returnData);
});

em.on(events.WS_MAIN_TRADE_ENTERED, function (returnData: xi.ITradeTransactionReturnData) {
  logger.info(LOG_ID + 'WsMain trade entered [%s]', returnData);
  bot.handleWsMainTradeEntered(returnData);
});

em.on(events.WS_MAIN_CHART_LAST_INFO_RECEIVED, function (returnData: xi.IChartLastRequestReturnData) {
  logger.info(LOG_ID + 'WsMain chart last info received [%s]', returnData.rateInfos.length);
  bot.handleWsMainChartLastInfoReceived(returnData);
});

em.on(events.WS_MAIN_SYMBOL_RECEIVED, function (returnData: xi.IGetSymbolReturnData) {
  logger.info(LOG_ID + 'WsMain symbol received [%s]', returnData.symbol);
  bot.handleWsMainSymbolReceived(returnData);
});

/** WS_STREAM EVENTS */
em.on(events.WS_STREAM_CONNECTED, function (addr: string) {
  logger.info(LOG_ID + 'WsStream connected [%s]', addr);
  bot.handleWsStreamConnected();
});

em.on(events.WS_STREAM_TICK_PRICES_RECEIVED, function (streamingTickRecord: xi.IStreamingTickRecord) {
  //logger.info(LOG_ID + 'Tick prices updated [%O]'/*, streamingTickRecord*/);
  bot.handleWsStreamTickPricesReceived(streamingTickRecord);
});

em.on(events.WS_STREAM_TRADE_STATUS_RECEIVED, function (streamingTradeStatusRecord: xi.IStreamingTradeStatusRecord) {
  logger.info(LOG_ID + 'WsStream trade status received [%s]', JSON.stringify(streamingTradeStatusRecord));
  bot.handleWsStreamTradeStatusReceived(streamingTradeStatusRecord);
});

em.on(events.WS_STREAM_TRADE_RECEIVED, function (streamingTradeRecord: xi.IStreamingTradeRecord) {
  logger.info(LOG_ID + 'WsStream trade received [%s]', JSON.stringify(streamingTradeRecord));
  bot.handleWsStreamTradeReceived(streamingTradeRecord);
});

em.on(events.WS_STREAM_BALANCE_RECEIVED, function (streamingBalanceRecord: xi.IStreamingBalanceRecord) {
  //logger.info(LOG_ID + 'WsStream balance received [%s]', JSON.stringify(streamingBalanceRecord));
  bot.handleWsStreamBalanceReceived(streamingBalanceRecord);
});