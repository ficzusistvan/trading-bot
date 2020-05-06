import * as i from './interfaces'
import * as helpers from './helpers'
import Big from 'big.js'
import * as technicalindicators from 'technicalindicators'
import logger from './logger'
import Debug from 'debug'
const debug = Debug('strategy')

const LOG_ID = '[strategy] ';

// every strategy should have these variables
let instrumentInfo: i.ICommonInstrumentBasicInfo = { currencyPrice: Big(1), leverage: Big(1), nominalValue: Big(1) };
let marginToBalancePercent: Big = Big(100);

// parameters of the strategy
let STOP_LOSS: Big = Big(20);
let STOP_LOSS_INIT: Big = Big(60);

let calculatedTSL: Big = Big(0);
let useTsl: boolean = false;

let init = function (insInfo: i.ICommonInstrumentBasicInfo, mToBPercent: Big) {
  instrumentInfo = insInfo;
  marginToBalancePercent = mToBPercent;
}

// Technical indicators
let adx: Array<any> = [];
let macd: Array<any> = [];

let runTA = function (candles: Array<i.ICommonCandle>) {
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
}

let enter = function (candles: Array<i.ICommonCandle>, balance: Big): i.ITradeTransactionEnter | boolean {
  const idx = candles.length - 1;
  // 1. check adx level if trending
  if (adx[idx].adx > 15) { // TODO: change it to 25, only for testing purposes
    let side: i.ETradeSide = i.ETradeSide.NONE;
    const openPrice: Big = Big(candles[idx].close); // trade open price should be the next candle open price which is closest to the actual close price
    // 2a. buy if +di > -di AND MACD histogram is rising
    // idx - 1 is not going to be out of index because adx needs to be trending first...
    if (adx[idx].pdi > adx[idx].mdi && macd[idx].histogram > macd[idx - 1].histogram) {
      side = i.ETradeSide.BUY;
      calculatedTSL = openPrice.minus(STOP_LOSS_INIT);
    }
    // 2b. sell if +di < -di AND MACD histogram is falling
    // idx - 1 is not going to be out of index because adx needs to be trending first...
    if (adx[idx].pdi < adx[idx].mdi && macd[idx].histogram < macd[idx - 1].histogram) {
      side = i.ETradeSide.SELL;
      calculatedTSL = openPrice.plus(STOP_LOSS_INIT);
    }

    if (side !== i.ETradeSide.NONE) {
      const cVolume = helpers.calculateMaxVolume(balance, marginToBalancePercent, openPrice, instrumentInfo.currencyPrice, instrumentInfo.leverage, instrumentInfo.nominalValue);

      let entr: i.ITradeTransactionEnter = {
        side: side,
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
let exit = function (tick: i.IXAPIStreamingTickRecord, openPrice: Big, side: i.EXAPITradeTransactionCmd): boolean {

  const curPrice: Big = Big((tick.ask + tick.bid) / 2);

  if (side === i.EXAPITradeTransactionCmd.BUY) {
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
  if (side === i.EXAPITradeTransactionCmd.SELL) {
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
  init,
  runTA,
  enter,
  exit
}