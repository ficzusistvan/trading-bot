import * as ci from './common-interfaces'
import * as xi from './xapi-interfaces'
import * as helpers from './helpers'
import Big from 'big.js'
import * as technicalindicators from 'technicalindicators'
import logger from './logger'
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
const STOP_LOSS_INIT: Big = Big(nconf.get('strategy:stop_loss_init'));
const ADX_LIMIT: Big = Big(nconf.get('strategy:adx_limit'));

let calculatedTSL: Big = Big(0);
let useTsl: boolean = false;

let updateInstrumentBasicInfo = function (insInfo: ci.IInstrumentBasicInfo) {
  instrumentInfo = insInfo;
  logger.info(LOG_ID + 'Instrument info: %s', JSON.stringify(instrumentInfo));
}

// Technical indicators
let adx: Array<any> = [];
let macd: Array<any> = [];

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

  macd = technicalindicators.MACD.calculate({
    values: close,
    fastPeriod: 5,
    slowPeriod: 8,
    signalPeriod: 3,
    SimpleMAOscillator: false,
    SimpleMASignal: false
  });
  const macdDiff = candlesLength - macd.length;
  for (let i = 0; i < macdDiff; i++) {
    macd.unshift({ MACD: 0, signal: 0, histogram: 0 });
  }

  const idx = candles.length - 1;
  debug('TA result: adx [%o] macd cur [%o] macd prev [%o]', adx[idx], macd[idx], macd[idx - 1]);
}

let enter = function (candles: Array<ci.ICandle>, balance: Big): ci.ITradeTransactionEnter | boolean {
  const idx = candles.length - 1;
  // 1. check adx level if trending
  if (ADX_LIMIT.lt(adx[idx].adx)) {
    let side: xi.ECmd = xi.ECmd.BALANCE;
    const openPrice: Big = Big(candles[idx].close); // trade open price should be the next candle open price which is closest to the actual close price
    // 2a. buy if +di > -di AND MACD histogram is rising
    // idx - 1 is not going to be out of index because adx needs to be trending first...
    if (adx[idx].pdi > adx[idx].mdi && macd[idx].histogram > macd[idx - 1].histogram) {
      side = xi.ECmd.BUY;
      calculatedTSL = openPrice.minus(STOP_LOSS_INIT);
    }
    // 2b. sell if +di < -di AND MACD histogram is falling
    // idx - 1 is not going to be out of index because adx needs to be trending first...
    if (adx[idx].pdi < adx[idx].mdi && macd[idx].histogram < macd[idx - 1].histogram) {
      side = xi.ECmd.SELL;
      calculatedTSL = openPrice.plus(STOP_LOSS_INIT);
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
let exit = function (tick: xi.IStreamingTickRecord, openPrice: Big, side: xi.ECmd): boolean {

  const curPrice: Big = Big((tick.ask + tick.bid) / 2);

  if (side === xi.ECmd.BUY) {
    // Updating trailing stop loss if needed
    if (useTsl === false && (curPrice.minus(STOP_LOSS)) >= openPrice) {
      calculatedTSL = openPrice;
      useTsl = true;
      console.log('Current price[' + curPrice.toFixed(2) + '] - SL[' + STOP_LOSS + '] >= Open price[' + openPrice + ']; Updating Trailing Stop Loss: [' + calculatedTSL + ']');
    } else if (useTsl === true && (curPrice.minus(STOP_LOSS)) > calculatedTSL) {
      let oldTSL = calculatedTSL;
      calculatedTSL = curPrice.minus(STOP_LOSS);
      console.log('Current price[' + curPrice.toFixed(2) + '] - SL[' + STOP_LOSS + '] > Trailing Stop Loss[' + oldTSL + ']; Updating Trailins Stop Loss: [' + calculatedTSL + ']');
    } else {
      // skip
    }
    if (curPrice <= calculatedTSL) {
      useTsl = false;
      console.log('Exit strategy: ' + curPrice);
      return true;
    }
  }
  if (side === xi.ECmd.SELL) {
    if (useTsl === false && (curPrice.plus(STOP_LOSS)) <= openPrice) {
      calculatedTSL = openPrice;
      useTsl = true;
      console.log('Current price[' + curPrice.toFixed(2) + '] + SL[' + STOP_LOSS + '] <= Open price[' + openPrice + ']; Updating Trailing Stop Loss: [' + calculatedTSL + ']');
    } else if (useTsl === true && (curPrice.plus(STOP_LOSS)) < calculatedTSL) {
      let oldTSL = calculatedTSL;
      calculatedTSL = curPrice.plus(STOP_LOSS);
      console.log('Current price[' + curPrice.toFixed(2) + '] + SL[' + STOP_LOSS + '] < Trailing Stop Loss[' + oldTSL + ']; Updating Trailins Stop Loss: [' + calculatedTSL + ']');
    } else {
      // skip
    }
    if (curPrice >= calculatedTSL) {
      useTsl = false;
      console.log('Exit strategy: ' + curPrice);
      return true;
    }
  }

  return false;
}

export {
  updateInstrumentBasicInfo,
  runTA,
  enter,
  exit
}