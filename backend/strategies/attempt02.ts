import * as ci from '../common-interfaces'
import * as xi from '../xapi-interfaces'
import * as helpers from '../helpers'
import moment from 'moment'
import Big from 'big.js'
import * as technicalindicators from 'technicalindicators'
import logger from '../logger'
import Debug from 'debug'
import nconf from 'nconf'
nconf.file({
  file: 'config.json',
  search: true
});
const debug = Debug('strategy')
const LOG_ID = '[strategy] ';

// every strategy should have these variables
let instrumentInfo: ci.IInstrumentBasicInfo = { leverage: Big(0), nominalValue: Big(0) };

// parameters of the strategy
const CURRENCY_PRICE = Big(nconf.get('strategy:currency_price'));
const MARGIN_TO_BALANCE_PERCENT: Big = Big(nconf.get('strategy:margin_to_balance_percent'));
const STOP_LOSS: Big = Big(nconf.get('strategy:stop_loss'));
const ADX_LIMIT: Big = Big(nconf.get('strategy:adx_limit'));

let calculatedTSL: Big = Big(0);

let updateInstrumentBasicInfo = function (insInfo: ci.IInstrumentBasicInfo) {
  instrumentInfo = insInfo;
  logger.info(LOG_ID + 'Instrument info: %s', JSON.stringify(instrumentInfo));
}

// Technical indicators
let adx: Array<any> = [];

let runTA = function (candles: Array<ci.ICandle>) {
  const candlesLength = candles.length;
  const open = candles.map(candle => {
    return Number(candle.open);
  });
  const close = candles.map(candle => {
    return Number(candle.close);
  });
  const high = candles.map(candle => {
    return Number(candle.high);
  });
  const low = candles.map(candle => {
    return Number(candle.low);
  });
  const volume = candles.map(candle => {
    return Number(candle.volume);
  });

  adx = technicalindicators.ADX.calculate({
    close: close,
    high: high,
    low: low,
    period: 14
  });
  const adxDiff = candlesLength - adx.length;
  for (let i = 0; i < adxDiff; i++) {
    adx.unshift({ adx: 0, pdi: 0, mdi: 0 });
  }

  const idx = candles.length - 1;
  debug('TA result: adx [%o]', adx[idx]);
}

let enter = function (candles: Array<ci.ICandle>, balance: Big): ci.ITradeTransactionEnter | boolean {
  const idx = candles.length - 1;
  // 1. check if adx level is starting to trend
  // curr adx is above 25, previous adx is less or equal to 25 (adx rising)
  if (ADX_LIMIT.gte(adx[idx - 1].adx) && ADX_LIMIT.lt(adx[idx].adx)) {
    let side: xi.ECmd = xi.ECmd.BALANCE;
    const openPrice: Big = Big(candles[idx].close); // trade open price should be the next candle open price which is closest to the actual close price
    // 2a. buy if +di > -di AND MACD histogram is rising
    // idx - 1 is not going to be out of index because adx needs to be trending first...
    if (adx[idx].pdi > adx[idx].mdi) {
      side = xi.ECmd.BUY;
      calculatedTSL = Big(candles[idx - 1].low).minus(STOP_LOSS);
    }
    // 2b. sell if +di < -di AND MACD histogram is falling
    // idx - 1 is not going to be out of index because adx needs to be trending first...
    if (adx[idx].pdi < adx[idx].mdi) {
      side = xi.ECmd.SELL;
      calculatedTSL = Big(candles[idx - 1].high).plus(STOP_LOSS);
    }

    if (side !== xi.ECmd.BALANCE) {
      const cVolume = helpers.calculateMaxVolume(balance, MARGIN_TO_BALANCE_PERCENT, openPrice, CURRENCY_PRICE, instrumentInfo.leverage, instrumentInfo.nominalValue);

      let entr: ci.ITradeTransactionEnter = {
        cmd: side,
        volume: cVolume,
        // TODO: open price should be read from confirmed/accepted trade status!!!!
        openPrice: openPrice
      }

      logger.info(LOG_ID + 'Enter strategy: ' + JSON.stringify(entr));
      logger.info(LOG_ID + 'Initial SL: [' + calculatedTSL + ']');
      return entr;
    }
  }

  return false;
}

/* ha buy akkor TP a H es SL a L
ha sell akkor TP a L es SL a H */
let exit = function (candles: Array<ci.ICandle>, tick: xi.IStreamingTickRecord, openPrice: Big, side: xi.ECmd): boolean {

  const curPrice: Big = Big((tick.ask + tick.bid) / 2);

  if (side === xi.ECmd.BUY) {
    if (curPrice.lte(calculatedTSL)) {
      console.log('Exit strategy: ' + curPrice);
      return true;
    }
    calculatedTSL = Big(candles[candles.length - 2].low);
  }
  if (side === xi.ECmd.SELL) {
    if (curPrice.gte(calculatedTSL)) {
      console.log('Exit strategy: ' + curPrice);
      return true;
    }
    calculatedTSL = Big(candles[candles.length - 2].high);
  }

  return false;
}

export {
  updateInstrumentBasicInfo,
  runTA,
  enter,
  exit
}