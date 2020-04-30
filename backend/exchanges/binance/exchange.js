// GENERAL DEPENDENCIES
const WebSocket = require('ws')
const Big = require('big.js')

// DEBUGGING
const debug = require('debug')('binance-exchange')

// BINANCE
const binanceRestApi = require('./rest-api')
const binanceWebSocketStreams = require('./web-socket-streams')
const binanceHelpers = require('./helpers')

const candlestickHandler = require('../../candlestick-handler')
const logger = require('../../logger')
const nconf = require('nconf');
nconf.file({ file: 'config.json', search: true });
const exchangeHelpers = require('../helpers')

var g_map_timeoutsKLines = new Map();

function combine(p_s_type, p_s_symbol, p_s_interval) {
  return (p_s_type + '_' + p_s_symbol + '_' + p_s_interval);
}

/**
 * The websocket server will send a ping frame every 3 minutes. 
 * If the websocket server does not receive a pong frame back from the connection within a 10 minute period, the connection will be disconnected. 
 * Unsolicited pong frames are allowed.
 */
function heartbeatKLine(p_s_combined, p_ws) {
  clearTimeout(g_map_timeoutsKLines.get(p_s_combined));

  // Use `WebSocket#terminate()` and not `WebSocket#close()`. Delay should be
  // equal to the interval at which your server sends out pings plus a
  // conservative assumption of the latency.
  var l_f_pingTimeout = setTimeout(() => {
    logger.info('Terminating KLine ws for [' + p_s_combined + '] ...');
    p_ws.terminate();
  }, nconf.get('binance:ws_timeout_ms:ping')); // 3 minutes + 30 seconds
  g_map_timeoutsKLines.set(p_s_combined, l_f_pingTimeout);
}

module.exports.downloadPastKLines = async function (p_s_type, p_s_symbol, p_s_interval) {
  var res = await binanceRestApi.getKLineCandlestickData(p_s_symbol, p_s_interval, 200); // download past klines
  for (let kLine of res) {
    var ohlcv = binanceHelpers.createOHLCVObjFromArr(kLine);
    candlestickHandler.update(p_s_type, ohlcv);
  }
}

module.exports.startKLineStreaming = function (p_s_type, p_s_symbol, p_s_interval) {
  var l_s_addr = binanceWebSocketStreams.buildWsAddress(binanceWebSocketStreams.KlineCandlestickStreams, p_s_symbol.toLowerCase(), { '<interval>': p_s_interval });
  var l_ws = new WebSocket(l_s_addr);
  const l_s_combined = combine(p_s_type, p_s_symbol, p_s_interval);

  l_ws.addEventListener('open', () => {
    logger.info('Kline web socket opened for [' + l_s_combined + ']');
    heartbeatKLine(l_s_combined, l_ws);
  });
  l_ws.addEventListener('message', (msg) => {
    var ohlcv = binanceHelpers.createOHLCVObjFromObj(JSON.parse(msg.data));
    debug(ohlcv);
    candlestickHandler.update(p_s_type, ohlcv);
  });
  l_ws.addEventListener('close', () => {
    logger.info('Kline ws closed for [' + l_s_combined + ']');
    clearTimeout(g_map_timeoutsKLines.get(l_s_combined));
    setTimeout(function () { // restart connection after 5s
      startKLineStreaming(p_s_type, p_s_symbol, p_s_interval);
    }, nconf.get('binance:ws_timeout_ms:restart'));
  });
  l_ws.addEventListener('ping', () => {
    debug('Kline ping received! [' + l_s_combined + ']');
    heartbeatKLine(l_s_combined, l_ws);
  });
  l_ws.addEventListener('error', (error) => {
    logger.error('Kline ws error for [' + l_s_combined + ']', error);
    clearTimeout(g_map_timeoutsKLines.get(l_s_combined));
  });
}

module.exports.notifyBotIsIdle = function () {
}

module.exports.newOrder = function (_symbol, _side, _type, _quantity, /* OPTIONALS */_timeInForce, _price, _stopPrice, _icebergQty) {
  if (nconf.get('bot:mode') === exchangeHelpers.MODE_REAL) {
    return binanceRestApi.newOrder(_symbol, _side, _type, _quantity, _timeInForce, _price, _stopPrice, _icebergQty);
  }
  if (nconf.get('bot:mode') === exchangeHelpers.MODE_PAPERTRADING) {
    // TODO: simluateNewOrder without db!!!
    return exchangeHelpers.simulateNewOrder(_symbol, _side, _type, _quantity, _timeInForce, _price, _stopPrice, _icebergQty);
  }
}

module.exports.getFeesAndBalances = async function () {
  var resp = await binanceRestApi.getAccountInformation();
  var fees = { maker: Big(resp.makerCommission), taker: Big(resp.takerCommission) };
  var balances = { baseAsset: 0, quoteAsset: 0 };
  var symbolParts = nconf.get('bot:symbol').split('-');
  for (let balance of resp.balances) {
    if (balance.asset == symbolParts[0]) {
      balances.baseAsset = Big(balance.free);
    }
    if (balance.asset == symbolParts[1]) {
      balances.quoteAsset = Big(balance.free);
    }
  }
  return { fees: fees, balances: balances };
}

module.exports.getTakerFee = async function() {
  var resp = await binanceRestApi.getAccountInformation();
  return Big(resp.takerCommission);
}