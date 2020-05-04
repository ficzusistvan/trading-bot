import * as i from './interfaces';
import Big from 'big.js';

export let searchFirstCandleInDay = function (date: moment.Moment, candles: Array<i.ICommonCandle>): i.ICommonCandle | null {
  for (let i = 0; i < candles.length; i++) {
    if (date.isSame(candles[i].date, "day")) {
      return candles[i];
    }
  }
  return null;
}

export let getPrevDayMinMaxDiff = function (date: moment.Moment, candles: Array<i.ICommonCandle>) {
  let mdate = date.subtract(1, 'day');
  if (mdate.isoWeekday() === 7) {
    mdate = mdate.subtract(2, 'day');
  }
  if (mdate.isoWeekday() === 6) {
    mdate = mdate.subtract(1, 'day');
  }
  let min = Number.MAX_SAFE_INTEGER;
  let max = Number.MIN_SAFE_INTEGER;
  for (let i = 0; i < candles.length; i++) {
    if (mdate.isSame(candles[i].date, "day")) {
      let curLow = Number(candles[i].low);
      if (curLow < min) {
        min = curLow;
      }
      let curHigh = Number(candles[i].high);
      if (curHigh > max) {
        max = curHigh;
      }
    }
  }
  //return (max - min);
  return 240;
}

export let calculateMaxVolume = function (balance: Big, marginToBalancePercent: Big, price: Big, currencyPrice: Big, leverage: Big, nominalValue: Big): Big {
  const lvrg = Big(1).div(leverage);
  const adjustedBalance = balance.mul(marginToBalancePercent).div(100);
  const volume = adjustedBalance.div(price.mul(currencyPrice).mul(lvrg).mul(nominalValue)).round(2);
  return volume;
}

export let calculatePip = function (volume: Big, currencyPrice: Big, nominalValue: Big): Big {
  const pip = volume.mul(currencyPrice).mul(nominalValue);
  return pip;
}

export let calculateMargin = function (pip: Big, price: Big, leverage: Big): Big {
  const lvrg = Big(1).div(leverage);
  const margin = pip.mul(price).mul(lvrg);
  return margin;
}