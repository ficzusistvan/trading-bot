var debug = require('debug')('web-socket-streams');

const BASE_ENDPOINT = 'wss://stream.binance.com:9443';
const RAW_STREAM = '/ws/';
const SYMBOL = '<symbol>';
module.exports.AggregateTradeStreams = '<symbol>@aggTrade';
module.exports.TradeStreams = '<symbol>@trade';
module.exports.KlineCandlestickStreams = '<symbol>@kline_<interval>';
module.exports.IndividualSymbolMiniTickerStream = '<symbol>@miniTicker';
module.exports.AllMarketMiniTickersStream = '!miniTicker@arr';
module.exports.IndividualSymbolTickerStreams = '<symbol>@ticker';
module.exports.AllMarketTickersStream = '!ticker@arr';
module.exports.PartialBookDepthStreams = '<symbol>@depth<levels>';
module.exports.DiffDepthStream = '<symbol>@depth';

module.exports.readyStates = ['CONNECTING', /* 0 Socket has been created. The connection is not yet open. */
  'OPEN', /* 1 The connection is open and ready to communicate. */
  'CLOSING', /* 2 The connection is in the process of closing. */
  'CLOSED' /* 3 The connection is closed or couldn't be opened. */];

/**
 * stream - e.g.: !ticker@arr
 * symbol - e.g.: btcusdt
 * param - key - value pair. e.g.: key = interval, value = 1h
 */
module.exports.buildWsAddress = function (stream, symbol, param) {
  var addr = BASE_ENDPOINT + RAW_STREAM + stream;
  if (symbol) {
    addr = addr.replace(SYMBOL, symbol);
  }
  if (param) {
    Object.keys(param).forEach(key => addr = addr.replace(key, param[key]));
  }
  debug('Web socket address:', addr);
  return addr;
}