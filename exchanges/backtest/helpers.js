module.exports.createOHLCVObj = function (obj, objNext) {
  return {
    timestamp: obj.Timestamp,
    startTime: obj.Timestamp,
    closeTime: (objNext !== undefined ? (objNext.Timestamp - 1) : ('' + new Date())),
    open: Number(obj.Open),
    high: Number(obj.High),
    low: Number(obj.Low),
    close: Number(obj.Close),
    volume: Number(obj.Volume)
  }
}