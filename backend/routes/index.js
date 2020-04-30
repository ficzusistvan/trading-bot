var express = require('express');
var router = express.Router();
var nconf = require('nconf');
nconf.file({
  file: 'config.json',
  search: true
});
var algo = require('../bot.js');
const debug = require('debug')('indexRouter')
const binanceRestApi = require('../exchanges/binance/rest-api.js')
var binanceWebSocketStreams = require('../exchanges/binance/web-socket-streams.js');
const binanceHelpers = require('../exchanges/binance/helpers')

const THE_FUCKING_TITLE = 'NEM LETEZIK, HOGY NEM TUDOM MEGCSINALNI!!!';

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('dashboard', {
    title: THE_FUCKING_TITLE,
    isProductionBuild: nconf.get('debug:is_production_build'),
    socketIoPort: nconf.get('ports:socket_io')
  });
});

router.get('/algo-charts', function (req, res, next) {
  var data = algo.getExchangeSymbols();
  debug('algo.getExchangeSymbols()', data);
  res.render('algo-charts', {
    title: THE_FUCKING_TITLE,
    intervals: binanceHelpers.SUPPORTED_INTERVALS,
    symbols: data
  });
});

router.get('/web-sockets-status', function (req, res, next) {
  var data = algo.getWebSockets();
  debug('algo.getWebSockets()', data);
  res.render('web-sockets-status', {
    title: THE_FUCKING_TITLE,
    isProductionBuild: nconf.get('debug:is_production_build'),
    socketIoPort: nconf.get('ports:socket_io'),
    readyStates: binanceWebSocketStreams.readyStates,
    webSockets: data
  });
});

router.get('/account-balances', async function (req, res, next) {
  var data = await binanceRestApi.getAccountInformation();
  debug('binanceRestApi.getAccountInformation()', data);
  res.render('account-balances', {
    title: THE_FUCKING_TITLE,
    balances: data.balances
  });
});

router.get('/binance-rest-api-test', async function (req, res, next) {
  res.render('binance-rest-api-test', {
    title: THE_FUCKING_TITLE
  });
});

router.get('/stop-losses', function(req, res, next) {
  var data = algo.getStopLosses();
  debug('algo.getStopLosses()', data);
  res.render('stop-losses', {
    title: THE_FUCKING_TITLE,
    stopLosses: data
  });
});

router.get('/tracked-pairs', async function(req, res, next) {
  var data = null;
  debug('TrackedPair.findAll()', data);
  res.render('tracked-pairs', {
    title: THE_FUCKING_TITLE,
    isProductionBuild: nconf.get('debug:is_production_build'),
    socketIoPort: nconf.get('ports:socket_io'),
    trackedPairs: data
  });
});

router.get('/settings', async function(req, res, next) {
  var data = null;
  debug('user.getSettings()', data);
  res.render('settings', {
    title: THE_FUCKING_TITLE,
    strategiesSettings: data
  });
});

module.exports = router;