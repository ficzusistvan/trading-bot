const shortid = require('shortid')

module.exports.MODE_BACKTESTING = 'backtesting';
module.exports.MODE_PAPERTRADING = 'papertrading';
module.exports.MODE_REAL = 'real';

module.exports.ORDER_TYPE_LMIT = 'LIMIT'; // Limit order sets the maximum or minimum price at which you are willing to buy or sell.
module.exports.ORDER_TYPE_MARKET = 'MARKET'; // Market orders are transactions meant to execute as quickly as possible at the present or market price.
module.exports.ORDER_TYPE_STOP_LOSS = 'STOP_LOSS';
module.exports.ORDER_TYPE_STOP_LOSS_LIMIT = 'STOP_LOSS_LIMIT';
module.exports.ORDER_TYPE_TAKE_PROFIT = 'TAKE_PROFIT';
module.exports.ORDER_TYPE_TAKE_PROFIT_LIMIT = 'TAKE_PROFIT_LIMIT';
module.exports.ORDER_TYPE_LIMIT_MAKER = 'LIMIT_MAKER';

module.exports.ORDER_STATUS_NEW = 'NEW';
module.exports.ORDER_STATUS_PARTIALLY_FILLED = 'PARTIALLY_FILLED';
module.exports.ORDER_STATUS_FILLED = 'FILLED';
module.exports.ORDER_STATUS_CANCELED = 'CANCELED';
module.exports.ORDER_STATUS_PENDING_CANCEL = 'PENDING_CANCEL'; // (currently unused)
module.exports.ORDER_STATUS_REJECTED = 'REJECTED';
module.exports.ORDER_STATUS_EXPIRED = 'EXPIRED';

module.exports.SIDE_BUY = 'BUY';
module.exports.SIDE_SELL = 'SELL';

module.exports.TIME_IN_FORCE_GTC = 'GTC'; // (Good-Til-Canceled) orders are effective until they are executed or canceled.
module.exports.TIME_IN_FORCE_IOC = 'IOC'; // (Immediate or Cancel) orders fills all or part of an order immediately and cancels the remaining part of the order.
module.exports.TIME_IN_FORCE_FOK = 'FOK'; // (Fill or Kill) orders fills all in its entirety, otherwise, the entire order will be cancelled.

module.exports.SUPPORTED_INTERVALS = ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M'];

module.exports.simulateNewOrder = function (_symbol, _side, _type, _quantity, /* OPTIONALS */ _timeInForce, _price, _stopPrice, _icebergQty) {
  // Simulate that the order is already 100% filled...
  return {
    clientOrderId: shortid.generate(),
    cummulativeQuoteQty: _quantity * _price,
    executedQty: _quantity,
    icebergQty: _icebergQty,
    isWorking: true,
    origQty: _quantity,
    price: _price,
    side: _side,
    status: module.exports.ORDER_STATUS_FILLED,
    stopPrice: _stopPrice,
    symbol: _symbol,
    time: (+new Date()),
    timeInForce: _timeInForce,
    type: _type,
    updateTime: (+new Date())
  };
}