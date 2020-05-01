import * as i from './interfaces'
import Debug from 'debug'
const debug = Debug('candles-handler')

import { em, UPDATED_CANDLES } from './event-handler'

const CIRCULAR_BUFFER_SIZE = 200;
let candles: Array<i.ICommonCandle> = [];

let updateLastCandle = function (candle: i.ICommonCandle) {
  candles.push(candle);

  if (candles.length > CIRCULAR_BUFFER_SIZE) { // See: https://github.com/binance-exchange/binance-official-api-docs/blob/master/rest-api.md#klinecandlestick-data
    candles.shift();
  }
  debug('Updated candles; new length[' + candles.length + ']');

  em.emit(UPDATED_CANDLES, candle);
}

export {
  updateLastCandle
}