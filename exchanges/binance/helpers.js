var crypto = require('crypto');

module.exports.generateHmac = function (data, key) {
  return crypto.createHmac('sha256', key).update(data).digest('hex');
}

module.exports.IDX_OPEN_TIME = 0
module.exports.IDX_OPEN = 1
module.exports.IDX_HIGH = 2
module.exports.IDX_LOW = 3
module.exports.IDX_CLOSE = 4
module.exports.IDX_VOLUME = 5
module.exports.IDX_CLOSE_TIME = 6
module.exports.IDX_QAV = 7
module.exports.IDX_NR_OF_TRADES = 8
module.exports.IDX_TBBAV = 9
module.exports.IDX_TBQAV = 10
module.exports.IDX_IGNORE = 11

module.exports.mapCandlestickObject2Array = function (obj) {
  var arr = [];
  arr.push(obj.k.t);
  arr.push(obj.k.o);
  arr.push(obj.k.h);
  arr.push(obj.k.l);
  arr.push(obj.k.c);
  arr.push(obj.k.v);
  arr.push(obj.k.T);
  arr.push(obj.k.q);
  arr.push(obj.k.t);
  arr.push(obj.k.V);
  arr.push(obj.k.Q);
  arr.push(obj.k.B);
  return arr;
}

module.exports.createOHLCVObjFromObj = function (obj) {
  return {
    timestamp: obj.E,
    startTime: obj.k.t,
    closeTime: obj.k.T,
    open: obj.k.o,
    high: obj.k.h,
    low: obj.k.l,
    close: obj.k.c,
    volume: obj.k.v
  }
}

module.exports.createOHLCVObjFromArr = function (arr) {
  return {
    timestamp: arr[module.exports.IDX_OPEN_TIME],
    startTime: arr[module.exports.IDX_OPEN_TIME],
    closeTime: arr[module.exports.IDX_CLOSE_TIME],
    open: arr[module.exports.IDX_OPEN],
    high: arr[module.exports.IDX_HIGH],
    low: arr[module.exports.IDX_LOW],
    close: arr[module.exports.IDX_CLOSE],
    volume: arr[module.exports.IDX_VOLUME]
  }
}