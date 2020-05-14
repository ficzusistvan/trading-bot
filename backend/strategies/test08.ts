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
const TAKE_PROFIT: Big = Big(nconf.get('strategy:take_profit'));
const BUY_LIMIT: Big = Big(nconf.get('strategy:buy_limit'));
const SELL_LIMIT: Big = Big(nconf.get('strategy:sell_limit'));

let calculatedSL: Big = Big(0);
let calculatedTP: Big = Big(0);

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
  const indDiff = candlesLength - ind.length;
  for (let i = 0; i < indDiff; i++) {
    ind.unshift({ adx: 0, pdi: 0, mdi: 0 });
  }

  debug('TA result: ind [%o]', ind[candlesLength - 1]);
}

let enter = function (candles: Array<ci.ICandle>, balance: Big): ci.ITradeTransactionEnter | boolean {
  const idx = candles.length - 1;
  let side: xi.ECmd = xi.ECmd.BALANCE;
  const openPrice: Big = Big(candles[idx].close); // trade open price should be the next candle open price which is closest to the actual close price
  if (ind[idx].k > ind[idx].d && BUY_LIMIT.lte(ind[idx].k)) {
    side = xi.ECmd.BUY;
    calculatedSL = openPrice.minus(STOP_LOSS);
    calculatedTP = openPrice.plus(TAKE_PROFIT);
  } else if (ind[idx].k < ind[idx].d && SELL_LIMIT.gte(ind[idx].k)) {
    side = xi.ECmd.BUY;
    calculatedSL = openPrice.plus(STOP_LOSS);
    calculatedTP = openPrice.minus(TAKE_PROFIT);
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
    logger.info(LOG_ID + 'Initial SL: [' + calculatedSL + ']');
    logger.info(LOG_ID + 'Initial TP: [' + calculatedTP + ']');
    return entr;
  } else {
    return false;
  }
}

/* ha buy akkor TP a H es SL a L
ha sell akkor TP a L es SL a H */
let exit = function (tick: xi.IStreamingTickRecord, openPrice: Big, side: xi.ECmd): boolean {

  const curPrice: Big = Big((tick.ask + tick.bid) / 2);

  if (side === xi.ECmd.BUY) {
    if (curPrice.lte(calculatedSL)) {
      console.log('Exit strategy: ' + curPrice);
      return true;
    }
    if (curPrice.gte(calculatedTP)) {
      console.log('Exit strategy: ' + curPrice);
      return true;
    }
    if (curPrice.minus(openPrice).gte(20)) {
      calculatedSL = openPrice;
    }
  }
  if (side === xi.ECmd.SELL) {
    if (curPrice.gte(calculatedSL)) {
      console.log('Exit strategy: ' + curPrice);
      return true;
    }
    if (curPrice.lte(calculatedTP)) {
      console.log('Exit strategy: ' + curPrice);
      return true;
    }
    if (openPrice.minus(curPrice).gte(20)) {
      calculatedSL = openPrice;
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