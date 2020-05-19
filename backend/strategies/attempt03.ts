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

let ind: Array<any> = [];

let runTA = function (candles: Array<ci.ICandle>) {
  const close = candles.map(candle => {
    return Number(candle.close);
  });
  const high = candles.map(candle => {
    return Number(candle.high);
  });
  const low = candles.map(candle => {
    return Number(candle.low);
  });

  ind = technicalindicators.Stochastic.calculate({
    close: close,
    high: high,
    low: low,
    period: 14,
    signalPeriod: 3
  });
  logger.info('TA result: ind [%o]', JSON.stringify(ind[ind.length - 1]));
}

let enter = function (candles: Array<ci.ICandle>, balance: Big): ci.ITradeTransactionEnter | boolean {
  const lastCandleIdx = candles.length - 1;
  const lastIndIdx = ind.length - 1;
  let side: xi.ECmd = xi.ECmd.BALANCE;
  const openPrice: Big = Big(candles[lastCandleIdx].close);
  if (BUY_LIMIT.gt(ind[lastIndIdx - 1].k) && BUY_LIMIT.lte(ind[lastIndIdx].k) && ind[lastIndIdx].k >= ind[lastIndIdx].d) {
    side = xi.ECmd.BUY;
    calculatedTSL = Big(candles[lastCandleIdx - 1].low).minus(STOP_LOSS);
  }
  if (SELL_LIMIT.lt(ind[lastIndIdx - 1].k) && SELL_LIMIT.gte(ind[lastIndIdx].k) && ind[lastIndIdx].k <= ind[lastIndIdx].d) {
    side = xi.ECmd.SELL;
    calculatedTSL = Big(candles[lastCandleIdx - 1].high).plus(STOP_LOSS);
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

  return false;
}

let exit = function (candles: Array<ci.ICandle>, tick: xi.IStreamingTickRecord, openPrice: Big, side: xi.ECmd): boolean {

  const m = moment(tick.timestamp);
  if (m.hour() === 22 && m.minute() === 59) {
    logger.info(LOG_ID + 'Exit EOD strategy');
    return true;
  }

  if (side === xi.ECmd.BUY) {
    const curAskPrice: Big = Big(tick.ask);
    if (curAskPrice.lte(calculatedTSL)) {
      logger.info(LOG_ID + 'Exit strategy: ' + curAskPrice);
      return true;
    }
    if (curAskPrice.minus(STOP_LOSS).gt(calculatedTSL)) {
      calculatedTSL = curAskPrice.minus(STOP_LOSS);
      logger.info(LOG_ID + 'Updating SL to: [' + calculatedTSL + ']');
    }
  }
  if (side === xi.ECmd.SELL) {
    const curBidPrice: Big = Big(tick.bid);
    if (curBidPrice.gte(calculatedTSL)) {
      logger.info(LOG_ID + 'Exit strategy: ' + curBidPrice);
      return true;
    }
    if (curBidPrice.plus(STOP_LOSS).lt(calculatedTSL)) {
      calculatedTSL = curBidPrice.plus(STOP_LOSS);
      logger.info(LOG_ID + 'Updating SL to: [' + calculatedTSL + ']');
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