const Big = require('big.js');
var nconf = require('nconf');
nconf.file({
  file: 'config.json',
  search: true
});

// DEBUGGING
const debug = require('debug')('bot')

// STRATEGY
const strategy = require('./strategies/' + nconf.get('bot:strategy'))

// EXCHANGE
const exchangeHelpers = require('./exchanges/helpers')

var exchangePath = 'binance';
if (nconf.get('bot:mode') === exchangeHelpers.MODE_BACKTESTING) {
  exchangePath = 'backtest';
}
const exchange = require('./exchanges/' + exchangePath + '/exchange')

// APP RELATED
const socketio = require('./socketio')
const logger = require('./logger');
const eventHandler = require('./event-handler')
const candlestickHandler = require('./candlestick-handler')

const SYMBOL = nconf.get('bot:symbol');
const INTERVAL_TRADING = nconf.get('bot:kline_trading_interval');
const STR_BASE_ASSET = nconf.get('bot:base_asset');
const STR_QUOTE_ASSET = nconf.get('bot:quote_asset');
const MIN_TRADE_AMOUNT = nconf.get('bot:min_trade_amount');
const INVEST_PERCENT = nconf.get('bot:invest_percent');

/**
 * Updated indicators.
 * Structure depends on the selected strategy.
 */
var indicators = new Map();
/**
 * Currently tracked pair info, null otherwise
 */
var trackedPair = null;
/**
 * Total number of trades
 */
var nrOfTrades = 0;
/**
 * Quantity of current assets
 */
var baseAssetQuantity, quoteAssetQuantity;

function startTracking(p_s_side, p_n_quantity, p_n_stopLossPrice, p_n_price) {
  logger.silly('Start tracking [' + SYMBOL + '] side[' + p_s_side + ']; quantity[' + p_n_quantity + ' ' + STR_BASE_ASSET + ']; stop loss price[' + p_n_stopLossPrice + ']; buy/sell price[' + p_n_price + ' ' + STR_QUOTE_ASSET + ']');
  trackedPair = {
    pair: SYMBOL,
    side: p_s_side,
    quantity: p_n_quantity,
    stop_loss_price: p_n_stopLossPrice,
    price: p_n_price
  };
}

function stopTracking() {
  logger.silly('Stop tracking [' + SYMBOL + ']');
  trackedPair = null;
}

// TODO: check if order book is ok
/**
 * 
 * @param {string} side 
 * @param {Big.js} price 
 * @param {Big.js} fee - specified in percent
 */
function getQuantityAndFeeAmountForOrder(side, price, fee) {
  var maxAmountToInvest = (side === exchangeHelpers.SIDE_BUY ? quoteAssetQuantity : baseAssetQuantity).times(INVEST_PERCENT).div(100);
  var q = Big(0);
  var f = Big(0);
  if (
    (side === exchangeHelpers.SIDE_BUY && maxAmountToInvest.gt(MIN_TRADE_AMOUNT)) ||
    (side === exchangeHelpers.SIDE_SELL && maxAmountToInvest.times(price).gt(MIN_TRADE_AMOUNT))
  ) {
    q = maxAmountToInvest.div(price).div(fee.div(100).plus(1));
    f = q.times(price).times(fee).div(100);
  }
  return { quantity: q, fee: f };
}

function getExitFee(quantity, price, fee) {
  return quantity.times(price).times(fee).div(100);
}

module.exports.run = async function () {
  var kLineBars = candlestickHandler.getKLineBars(candlestickHandler.TYPE_TRADING);
  var lastPrice = Big(kLineBars[kLineBars.length - 1].close);
  socketio.sendToBrowser('PRICE_UPDATED', {
    currentPrice: lastPrice
  });
  if (kLineBars.length >= 200) {
    indicators = await strategy.runIndicators(kLineBars);
    if (trackedPair === null) {
      var resEnter = strategy.runEnterStrategy();
      if (resEnter.long) {
        logger.info('---------------------------------------------ENTER---------------------------------------------');
        var qf = getQuantityAndFeeAmountForOrder(exchangeHelpers.SIDE_BUY, lastPrice, exchange.getTakerFee());
        if (qf.quantity.eq(0) && qf.fee.eq(0)) {
          logger.warn('Not enough quoteAssetQuantity [' + quoteAssetQuantity.toFixed(5) + ' ' + STR_QUOTE_ASSET + '] !!! (Min trade amount [' + MIN_TRADE_AMOUNT + '])');
          eventHandler.emit(eventHandler.MIN_TRADE_AMOUNT_REACHED, '');
        } else {
          var stopLossPrice = strategy.initStopLoss();
          logger.info('Enter: Opening BUY order for [' + SYMBOL + '] price [' + lastPrice.toFixed(2) + ' ' + STR_QUOTE_ASSET + '] quantity [' + qf.quantity.toFixed(5) + ' ' + STR_BASE_ASSET + '] fee [' + qf.fee.toFixed(5) + ' ' + STR_QUOTE_ASSET + ']');
          await exchange.newOrder(SYMBOL, exchangeHelpers.SIDE_BUY, exchangeHelpers.ORDER_TYPE_MARKET, qf.quantity, exchangeHelpers.TIME_IN_FORCE_GTC, stopLossPrice, lastPrice);
          await startTracking(exchangeHelpers.SIDE_BUY, qf.quantity, stopLossPrice, lastPrice);
          baseAssetQuantity = baseAssetQuantity.plus(qf.quantity);
          quoteAssetQuantity = quoteAssetQuantity.minus(qf.quantity.times(lastPrice).plus(qf.fee));
          logger.info('baseAssetQuantity [' + baseAssetQuantity.toFixed(5) + ' ' + STR_BASE_ASSET + '] quoteAssetQuantity [' + quoteAssetQuantity.toFixed(5) + ' ' + STR_QUOTE_ASSET + ']');
          socketio.sendToBrowser('STARTED_TRACKING_BUY_ORDER', trackedPair);
        }
      }
      if (resEnter.short) {
        // TODO
      }
    } else {
      var resExit = strategy.runExitStrategy(trackedPair.side);
      if (resExit.long) {
        logger.info('---------------------------------------------EXIT----------------------------------------------');
        nrOfTrades++;
        var fee = getExitFee(trackedPair.quantity, lastPrice, exchange.getTakerFee())
        logger.info('Exit: Opening SELL order for [' + SYMBOL + '] price [' + lastPrice.toFixed(2) + ' ' + STR_QUOTE_ASSET + '] quantity [' + trackedPair.quantity.toFixed(5) + ' ' + STR_BASE_ASSET + '] fee [' + fee.toFixed(5) + ' ' + STR_QUOTE_ASSET + ']');
        await exchange.newOrder(SYMBOL, exchangeHelpers.SIDE_SELL, exchangeHelpers.ORDER_TYPE_MARKET, trackedPair.quantity, exchangeHelpers.TIME_IN_FORCE_GTC, 0, lastPrice);
        baseAssetQuantity = baseAssetQuantity.minus(trackedPair.quantity);
        quoteAssetQuantity = quoteAssetQuantity.plus(trackedPair.quantity.times(lastPrice).minus(fee));
        await stopTracking();
        logger.info('baseAssetQuantity [' + baseAssetQuantity.toFixed(5) + ' ' + STR_BASE_ASSET + '] quoteAssetQuantity [' + quoteAssetQuantity.toFixed(5) + ' ' + STR_QUOTE_ASSET + '] Number of trades: [' + nrOfTrades + ']');
        socketio.sendToBrowser('STOPPED_TRACKING_BUY_ORDER', { b: baseAssetQuantity, q: quoteAssetQuantity });
      }
      if (resExit.short) {
        // TODO
      }
    }
  } else {
    debug('KLineBars length [' + kLineBars.length + '] not enough... Skipping...');
  }
  eventHandler.emit(eventHandler.BOT_RUN_END, '');
}

async function initFeesAndBalances() {
  var res = await exchange.getFeesAndBalances();
  baseAssetQuantity = res.balances.baseAsset;
  quoteAssetQuantity = res.balances.quoteAsset;
  logger.info('Starting with balances', res.balances);
  logger.info('Starting with fees', res.fees);
}

module.exports.start = async function () {
  await initFeesAndBalances();
  await exchange.downloadPastKLines(candlestickHandler.TYPE_TRADING, SYMBOL, INTERVAL_TRADING);
  exchange.startKLineStreaming(candlestickHandler.TYPE_TRADING, SYMBOL, INTERVAL_TRADING);
}

/**
 * Functions for the Frontend
 */
module.exports.getIndicators = function () {
  return indicators;
}