var express = require('express');
var router = express.Router();
var nconf = require('nconf');
nconf.file({
  file: 'config.json',
  search: true
});
var algo = require('../bot.js');
const debug = require('debug')('apiRouter')
const binanceRestApi = require('../exchanges/binance/rest-api.js')

router.get('/binance-get-all-orders/:symbol', async function (req, res, next) {
  var data = await binanceRestApi.getAllOrders(req.params.symbol);
  debug('binanceRestApi.getAllOrders(' + req.params.symbol + ')', data);
  res.json(data);
});

router.get('/binance-get-account-trade-list/:symbol', async function (req, res, next) {
  var data = await binanceRestApi.getAccountTradeList(req.params.symbol);
  debug('binanceRestApi.getAccountTradeList(' + req.params.symbol + ')', data);
  res.json(data);
});

router.get('/algo-results/:symbol/:points', function (req, res, next) {
  var indicators = algo.getIndicators(req.params.symbol);
  var sliced = new Map();
  for (let [key, value] of indicators) {
    var tmp;
    if (key.indexOf('kline') > -1) {
      tmp = value.slice(-1 * Number(req.params.points));
    } else {
      tmp = value.result.outReal.slice(-1 * Number(req.params.points));
    }
    sliced.set(key, tmp);
  }
  res.json([...sliced]);
});

router.get('/interval', function (req, res, next) {
  var data = algo.getInterval();
  debug('/api/interval', data);
  res.json(data);
});

router.get('/open-orders', async function (req, res, next) {
  var data = await binanceRestApi.getCurrentOpenOrders(); // Attention!!! Weight = 40 without symbol...
  debug('/api/open-orders', data);
  res.json(data);
});

router.get('/order-history', async function (req, res, next) {
  var data = await binanceRestApi.getAllOrders('BTCUSDT'); // TODO: How to query all orders? Weight = 5 per symbol...
  debug('/api/order-history', data);
  res.json(data);
});

router.get('/trade-history', async function (req, res, next) {
  var data = await binanceRestApi.getAccountTradeList('BTCUSDT'); // TODO: How to query all trades? Weight = 5 per symbol...
  debug('/api/trade-history', data);
  res.json(data);
});

router.get('/account-information', async function (req, res, next) {
  var data = await binanceRestApi.getAccountInformation();
  debug('binanceRestApi.getAccountInformation()', data);
  res.json(data);
});

router.post('/strategies-settings', async function (req, res, next) {
  res.json({result: true});
});

module.exports = router;