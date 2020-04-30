var talib = require('talib');
const util = require('util');

var debug = require('debug')('my-strategy-01')

var talibExecute = util.promisify(talib.execute);

// INPUTS
const LENGTH1 = 3;
const LENGTH2 = 10;

// OUTPUTS
var resSma1, resSma2;

module.exports.runIndicators = async function(kLineBars) {
  // Step 1: prepare data
  var closePrices = kLineBars.reduce(function (accumulator, currentValue) {
    accumulator.push(Number(currentValue.close));
    return accumulator;
  }, []);
  // Step 2: run indicators
  resSma1 = await talibExecute({
    name: "SMA",
    startIdx: 0,
    endIdx: closePrices.length - 1,
    inReal: closePrices,
    optInTimePeriod: LENGTH1
  });
  resSma2 = await talibExecute({
    name: "SMA",
    startIdx: 0,
    endIdx: closePrices.length - 1,
    inReal: closePrices,
    optInTimePeriod: LENGTH2
  });
  var indicators = new Map();
  // chart id _ indicator abbreviation _ params
  indicators.set('chart0_sma_' + LENGTH1, resSma1);
  indicators.set('chart0_sma_' + LENGTH2, resSma2);

  return indicators;
}

module.exports.runEnterStrategy = function () {
  debug('Running enter strategy...');
  var res = { long: false, short: false };

  if (
    // fast sma is rising
    (resSma1.result.outReal[resSma1.nbElement - 1] > resSma1.result.outReal[resSma1.nbElement - 2]) &&
    // fast sma crosses slow sma
    (resSma1.result.outReal[resSma1.nbElement - 1] > resSma2.result.outReal[resSma2.nbElement - 1]) &&
    (resSma1.result.outReal[resSma1.nbElement - 2] <= resSma2.result.outReal[resSma2.nbElement - 2])
  ) {
    res.long = true;
  } else if (
    // fast sma is falling
    (resSma1.result.outReal[resSma1.nbElement - 1] < resSma1.result.outReal[resSma1.nbElement - 2]) &&
    // fast sma crosses slow sma
    (resSma1.result.outReal[resSma1.nbElement - 1] < resSma2.result.outReal[resSma2.nbElement - 1]) &&
    (resSma1.result.outReal[resSma1.nbElement - 2] >= resSma2.result.outReal[resSma2.nbElement - 2])
  ) {
    res.short = true;
  }

  return res;
}

module.exports.runExitStrategy = function (p_s_side) {
  debug('Running exit strategy...');
  var res = { long: false, short: false };

  if (
    // fast sma is rising
    (resSma1.result.outReal[resSma1.nbElement - 1] > resSma1.result.outReal[resSma1.nbElement - 2]) &&
    // fast sma crosses slow sma
    (resSma1.result.outReal[resSma1.nbElement - 1] > resSma2.result.outReal[resSma2.nbElement - 1]) &&
    (resSma1.result.outReal[resSma1.nbElement - 2] <= resSma2.result.outReal[resSma2.nbElement - 2])
  ) {
    res.short = true;
  } else if (
    // fast sma is falling
    (resSma1.result.outReal[resSma1.nbElement - 1] < resSma1.result.outReal[resSma1.nbElement - 2]) &&
    // fast sma crosses slow sma
    (resSma1.result.outReal[resSma1.nbElement - 1] < resSma2.result.outReal[resSma2.nbElement - 1]) &&
    (resSma1.result.outReal[resSma1.nbElement - 2] >= resSma2.result.outReal[resSma2.nbElement - 2])
  ) {
    res.long = true;
  }

  return res;
}

module.exports.initStopLoss = function() {
  return 0;
}