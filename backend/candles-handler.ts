import * as i from './interfaces'
import Debug from 'debug'
const debug = Debug('candles-handler')

import { em, events } from './event-handler'
import logger from './logger';

const CIRCULAR_BUFFER_SIZE = 200;
let bufferedCandles: Array<i.ICommonCandle> = [];
let movingCandle: i.ICommonCandle = {
  close: 0,
  open: 0,
  high: 0,
  low: 0,
  volume: 0,
  date: 0
};

let merge = (a: Array<i.ICommonCandle>, b: Array<i.ICommonCandle>, p: string) => a.filter(aa => !b.find(bb => (aa as { [key: string]: any })[p] as number === (bb as { [key: string]: any })[p] as number)).concat(b);

let updateLastCandles = function (candles: Array<i.ICommonCandle>) {
  bufferedCandles = merge(bufferedCandles, candles, 'date');

  const diff = bufferedCandles.length - CIRCULAR_BUFFER_SIZE;

  for (let i = 0; i < diff; i++) {
    bufferedCandles.shift();
  }

  debug('Updated candles; last candle[' + JSON.stringify(bufferedCandles[bufferedCandles.length - 1]) + '] bufferedCandles length[' + bufferedCandles.length + ']');

  em.emit(events.CANDLES_HANDLER_BUFFERED_CANDLES_UPDATED, bufferedCandles);
}

let getLastCandleTimestamp = function () {
  return bufferedCandles.length > 0 ? bufferedCandles[bufferedCandles.length - 1].date : undefined;
}

let getCandles = function () {
  return bufferedCandles;
}

let resetMovingCandle = function() {
  movingCandle = {
    open: 0,
    close: 0,
    high: 0,
    low: 0,
    volume: 0,
    date: 0
  };
}

let updateMovingCandleFromTickPrice = function(streamingTickRecord: i.IXAPIStreamingTickRecord) {

  const curPrice = (streamingTickRecord.ask + streamingTickRecord.bid) / 2;
  const curVolume = streamingTickRecord.askVolume - streamingTickRecord.bidVolume;
  const curTimestampInSeconds = Math.trunc(streamingTickRecord.timestamp / 1000);
  const curTimestampInMillis = curTimestampInSeconds * 1000;

  movingCandle.date = curTimestampInMillis;
  if (movingCandle.open === 0) {
    movingCandle.open = curPrice;
  }
  movingCandle.close = curPrice;
  movingCandle.volume += curVolume;
  if (movingCandle.high === 0 || movingCandle.high < curPrice) {
    movingCandle.high = curPrice;
  }
  if (movingCandle.low === 0 || movingCandle.low > curPrice) {
    movingCandle.low = curPrice;
  }
  em.emit(events.CANDLES_HANDLER_MOVING_CANDLE_UPDATED, movingCandle);
}

export {
  updateLastCandles,
  getLastCandleTimestamp,
  getCandles,
  resetMovingCandle,
  updateMovingCandleFromTickPrice
}