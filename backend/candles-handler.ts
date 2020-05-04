import * as i from './interfaces'
import Debug from 'debug'
const debug = Debug('candles-handler')

import { em, events } from './event-handler'

const CIRCULAR_BUFFER_SIZE = 200;
let bufferedCandles: Array<i.ICommonCandle> = [];

let merge = (a: Array<i.ICommonCandle>, b: Array<i.ICommonCandle>, p: string) => a.filter(aa => !b.find(bb => (aa as { [key: string]: any })[p] as number === (bb as { [key: string]: any })[p] as number)).concat(b);

let updateLastCandles = function (candles: Array<i.ICommonCandle>) {
  bufferedCandles = merge(bufferedCandles, candles, 'date');

  const diff = bufferedCandles.length - CIRCULAR_BUFFER_SIZE;

  for (let i = 0; i < diff; i++) {
    bufferedCandles.shift();
  }

  debug('Updated candles; last candle[' + JSON.stringify(bufferedCandles[bufferedCandles.length - 1]) + '] bufferedCandles length[' + bufferedCandles.length + ']');

  em.emit(events.CANDLES_HANDLER_UPDATED, bufferedCandles);
}

let getLastCandleTimestamp = function () {
  return bufferedCandles.length > 0 ? bufferedCandles[bufferedCandles.length - 1].date : undefined;
}

let getCandles = function () {
  return bufferedCandles;
}

export {
  updateLastCandles,
  getLastCandleTimestamp,
  getCandles
}