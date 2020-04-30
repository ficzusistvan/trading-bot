// GENERAL DEPENDENCIES
const parse = require('csv-parse')
const fs = require('fs')
const path = require('path')
const Big = require('big.js')

// DEBUGGING
const debug = require('debug')('backtest-exchange')

// BACKTEST
const backtestHelpers = require('./helpers')

// APP
const candlestickHandler = require('../../candlestick-handler')
const exchangeHelpers = require('../helpers')
const nconf = require('nconf');
nconf.file({ file: 'config.json', search: true });

var index = 0;
var kLines;
var g_s_type;

function readCSV(p_s_type, p_s_symbol, p_s_interval) {
  return new Promise((resolve, reject) => {
    var parser = parse({ delimiter: ',', columns: true }, (err, data) => {
      resolve(data);
    });
    fs.createReadStream(path.join(__dirname, '../../CCXTMarketDataDownloader', 'binance-' + p_s_symbol + '-' + p_s_interval + '.csv')).pipe(parser);
  });
}

module.exports.downloadPastKLines = async function (p_s_type, p_s_symbol, p_s_interval) {
  g_s_type = p_s_type;
  kLines = await readCSV(p_s_type, p_s_symbol, p_s_interval);
}

/**
 * kLine format from csv:
 * Timestamp,Open,High,Low,Close,Volume
 */
module.exports.startKLineStreaming = function (p_s_type, p_s_symbol, p_s_interval) {
  var ohlcv = backtestHelpers.createOHLCVObj(kLines[index], kLines[index + 1]);
  debug(ohlcv);
  index++;
  candlestickHandler.update(g_s_type, ohlcv);
}

module.exports.notifyBotIsIdle = function () {
  if (index < kLines.length) {
    var ohlcv = backtestHelpers.createOHLCVObj(kLines[index], kLines[index + 1]);
    debug(ohlcv);
    index++;
    candlestickHandler.update(g_s_type, ohlcv);
  }
}

module.exports.newOrder = function (_symbol, _side, _type, _quantity, /* OPTIONALS */_timeInForce, _price, _stopPrice, _icebergQty) {
  // In case of backtesting this only slows down things...
  // return exchangeHelpers.simulateNewOrder(_symbol, _side, _type, _quantity, _timeInForce, _price, _stopPrice, _icebergQty);
  return null;
}

module.exports.getFeesAndBalances = function () {
  var fees = { maker: Big(nconf.get('backtest:maker_fee')), taker: Big(nconf.get('backtest:taker_fee')) };
  var balances = { baseAsset: Big(nconf.get('backtest:initial_base_asset_quantity')), quoteAsset: Big(nconf.get('backtest:initial_quote_asset_quantity')) };
  return { fees: fees, balances: balances };
}

module.exports.getTakerFee = function() {
  return Big(nconf.get('backtest:taker_fee'));
}