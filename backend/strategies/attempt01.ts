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
const BUY_LIMIT: Big = Big(nconf.get('strategy:buy_limit'));
const SELL_LIMIT: Big = Big(nconf.get('strategy:sell_limit'));

let calculatedTSL: Big = Big(0);

let updateInstrumentBasicInfo = function (insInfo: ci.IInstrumentBasicInfo) {
  instrumentInfo = insInfo;
  logger.info(LOG_ID + 'Instrument info: %s', JSON.stringify(instrumentInfo));
}

// Technical indicators
let ind: Array<any> = [];

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

  ind = technicalindicators.Stochastic.calculate({
    close: close,
    high: high,
    low: low,
    period: 14,
    signalPeriod: 3
  });

  debug('TA result: ind [%o]', ind[candlesLength - 1]);
}

let enter = function (candles: Array<ci.ICandle>, balance: Big): ci.ITradeTransactionEnter | boolean {
  const cIdx = candles.length - 1;
  const indIdx = ind.length - 1;

  let side: xi.ECmd = xi.ECmd.BALANCE;
  const openPrice: Big = Big(candles[cIdx].close); // trade open price should be the next candle open price which is closest to the actual close price
  if (BUY_LIMIT.gt(ind[indIdx - 1].k) &&
    ind[indIdx].k > ind[indIdx].d && BUY_LIMIT.lte(ind[indIdx].k)) {
    side = xi.ECmd.BUY;
    calculatedTSL = openPrice.minus(STOP_LOSS);
  } else
    if (SELL_LIMIT.lt(ind[indIdx - 1].k) &&
      ind[indIdx].k < ind[indIdx].d && SELL_LIMIT.gte(ind[indIdx].k)) {
      side = xi.ECmd.SELL;
      calculatedTSL = openPrice.plus(STOP_LOSS);
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
  } else {
    return false;
  }
}

/* ha buy akkor TP a H es SL a L
ha sell akkor TP a L es SL a H */
let exit = function (tick: xi.IStreamingTickRecord, openPrice: Big, side: xi.ECmd): boolean {

  const curPrice: Big = Big((tick.ask + tick.bid) / 2);

  const curDate = moment();
  const hour: number = curDate.hour();
  const minute: number = curDate.minute();
  const isEndOfDayCandle: boolean = (hour === 22 && minute === 59);
  if (isEndOfDayCandle) {
    logger.info(LOG_ID + 'Exit EOD strategy: ' + curPrice);
    return true;
  }

  if (side === xi.ECmd.BUY) {
    if (curPrice.lte(calculatedTSL)) {
      console.log('Exit strategy: ' + curPrice);
      return true;
    }
    if (calculatedTSL.lt(curPrice)) {
      logger.info(LOG_ID + 'Updating SL from: ' + calculatedTSL + ' to ' + curPrice);
      calculatedTSL = curPrice;
    }
  }
  if (side === xi.ECmd.SELL) {
    if (curPrice.gte(calculatedTSL)) {
      console.log('Exit strategy: ' + curPrice);
      return true;
    }
    if (calculatedTSL.gt(curPrice)) {
      logger.info(LOG_ID + 'Updating SL from: ' + calculatedTSL + ' to ' + curPrice);
      calculatedTSL = curPrice;
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