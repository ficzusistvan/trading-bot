const Emittery = require('emittery');
const em = new Emittery();
module.exports = em; // export as soon as possible. See: https://coderwall.com/p/myzvmg/circular-dependencies-in-node-js
var bot = require('./bot')
// TODO: configurable exchange
const exchange = require('./exchanges/backtest/exchange')
//const exchange = require('./exchanges/binance/exchange')
const logger = require('./logger')

const HTTP_SERVER_INITIALISED = 'HTTP_SERVER_INITIALISED';
const UPDATED_KLINEBARS = 'UPDATED_KLINEBARS';
const BOT_RUN_END = 'BOT_RUN_END';
const MIN_TRADE_AMOUNT_REACHED = 'MIN_TRADE_AMOUNT_REACHED';

module.exports.HTTP_SERVER_INITIALISED = HTTP_SERVER_INITIALISED;
module.exports.UPDATED_KLINEBARS = UPDATED_KLINEBARS;
module.exports.BOT_RUN_END = BOT_RUN_END;
module.exports.MIN_TRADE_AMOUNT_REACHED = MIN_TRADE_AMOUNT_REACHED;

em.on(HTTP_SERVER_INITIALISED, function (data) {
  logger.info('HttpServerInitialized [%s]', data);
  logger.info('Starting bot...');
  bot.start();
});

em.on(BOT_RUN_END, function(data) {
  exchange.notifyBotIsIdle();
});

em.on(UPDATED_KLINEBARS, function (data) {
  bot.run();
});

em.on(MIN_TRADE_AMOUNT_REACHED, function(data) {
  logger.warn('Bot stopped! Not enough money!');
  em.clearListeners();
});