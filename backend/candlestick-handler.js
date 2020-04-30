// DEBUGGING
const debug = require('debug')('candlestick-handler')

const eventEmitter = require('./event-handler')

const CIRCULAR_BUFFER_SIZE = 200; // See: https://github.com/binance-exchange/binance-official-api-docs/blob/master/rest-api.md#klinecandlestick-data

const TYPE_ANCHOR = 'TYPE_ANCHOR';
const TYPE_TRADING = 'TYPE_TRADING';
module.exports.TYPE_ANCHOR = TYPE_ANCHOR;
module.exports.TYPE_TRADING = TYPE_TRADING;

var g_map_kLineBars = new Map();

module.exports.update = function (p_s_type, ohlcv) {
  var l_arr_kLineBarz = g_map_kLineBars.get(p_s_type);
  if (l_arr_kLineBarz === undefined) { // first kLine bar...
    l_arr_kLineBarz = [ohlcv];
    g_map_kLineBars.set(p_s_type, l_arr_kLineBarz);
  }
  var l_n_lastIdx = l_arr_kLineBarz.length - 1;
  var l_lastBar = l_arr_kLineBarz[l_n_lastIdx];

  if (ohlcv.startTime > l_lastBar.closeTime) { // new kline/candlestick bar
    l_arr_kLineBarz.push(ohlcv);
  } else
    if (ohlcv.startTime == l_lastBar.startTime) { // same bar, new data
      l_arr_kLineBarz[l_n_lastIdx] = ohlcv;
    } else {
      // ignore...
    }

  if (l_arr_kLineBarz.length > CIRCULAR_BUFFER_SIZE) { // See: https://github.com/binance-exchange/binance-official-api-docs/blob/master/rest-api.md#klinecandlestick-data
    l_arr_kLineBarz.shift();
  }
  debug('Updated klineBars for [' + p_s_type + ']; new length[' + l_arr_kLineBarz.length + ']');

  eventEmitter.emit(eventEmitter.UPDATED_KLINEBARS, ohlcv);
}

module.exports.getKLineBars = function (p_s_Type) {
  return g_map_kLineBars.get(p_s_Type);
}