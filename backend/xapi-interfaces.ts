// common
export enum ECmd {
  BUY = 0,
  SELL = 1,
  BUY_LIMIT = 2,
  SELL_LIMIT = 3,
  BUY_STOP = 4,
  SELL_STOP = 5,
  BALANCE = 6,
  CREDIT = 7
}

export enum EType {
  OPEN = 0,
  PENDING = 1,
  CLOSE = 2,
  MODIFY = 3,
  DELETE = 4
}

export enum EState {
  MODIFIED = 'Modified',
  DELETED = 'Deleted'
}

export enum ERequestStatus {
  ERROR = 0,
  PENDING = 1,
  ACCEPTED = 3,
  REJECTED = 4
}

// http://developers.xstore.pro/documentation/current#available-commands
export interface ICommandLogin {
  command: string;
  arguments: {
    userId: number;
    password: string;
  }
}

/** http://developers.xstore.pro/documentation/current#retrieving-trading-data */
// http://developers.xstore.pro/documentation/current#getChartLastRequest
export interface ICommandChartLastRequest {
  command: string;
  arguments: {
    info: {
      period: number;
      start: number;
      symbol: string;
    }
  };
}

export interface IRateInfoRecord {
  close: number;
  ctm: number;
  ctmString: string;
  high: number;
  low: number;
  open: number;
  vol: number;
}

export interface IChartLastRequestReturnData {
  digits: number,
  rateInfos: Array<IRateInfoRecord>
}

// http://developers.xstore.pro/documentation/current#getMarginLevel
export interface IMarginLevelReturnData {
  balance: number,
  credit: number,
  currency: string,
  equity: number,
  margin: number,
  marginFree: number,
  marginLevel: number
}

// http://developers.xstore.pro/documentation/current#getSymbol
export interface ICommandGetSymbol {
  command: string;
  arguments: {
    symbol: string
  }
}

export interface IGetSymbolReturnData {
  ask: number, //	Floating number	Ask price in base currency
  bid: number, //	Floating number	Bid price in base currency
  categoryName: string, //	String	Category name
  contractSize: number, //	Number	Size of 1 lot
  currency: string, //	String	Currency
  currencyPair: boolean, //	Boolean	Indicates whether the symbol represents a currency pair
  currencyProfit: string, //	String	The currency of calculated profit
  description: string, //	String	Description
  expiration: number, //	Time	Null if not applicable
  groupName: string, //	String	Symbol group name
  high: number, //	Floating number	The highest price of the day in base currency
  initialMargin: number, //	Number	Initial margin for 1 lot order, used for profit/margin calculation
  instantMaxVolume: number, //	Number	Maximum instant volume multiplied by 100 (in lots)
  leverage: number, //	Floating number	Symbol leverage
  longOnly: boolean, //	Boolean	Long only
  lotMax: number, //	Floating number	Maximum size of trade
  lotMin: number, //	Floating number	Minimum size of trade
  lotStep: number, //	Floating number	A value of minimum step by which the size of trade can be changed (within lotMin - lotMax range)
  low: number, //	Floating number	The lowest price of the day in base currency
  marginHedged: number, //	Number	Used for profit calculation
  marginHedgedStrong: number, //	Boolean	For margin calculation
  marginMaintenance: number, //	Number	For margin calculation, null if not applicable
  marginMode: number, //	Number	For margin calculation
  percentage: number, //	Floating number	Percentage
  pipsPrecision: number, //	Number	Number of symbol's pip decimal places
  precision: number, //	Number	Number of symbol's price decimal places
  profitMode: number, //	Number	For profit calculation
  quoteId: number, //	Number	Source of price
  shortSelling: boolean, //	Boolean	Indicates whether short selling is allowed on the instrument
  spreadRaw: number, //	Floating number	The difference between raw ask and bid prices
  spreadTable: number, //	Floating number	Spread representation
  starting: number, //	Time	Null if not applicable
  stepRuleId: number, //	Number	Appropriate step rule ID from getStepRules  command response
  stopsLevel: number, //	Number	Minimal distance(in pips) from the current price where the stopLoss / takeProfit can be set
  swap_rollover3days: number, //	Number	Time when additional swap is accounted for weekend
  swapEnable: boolean, //	Boolean	Indicates whether swap value is added to position on end of day
  swapLong: number, //	Floating number	Swap value for long positions in pips
  swapShort: number, //	Floating number	Swap value for short positions in pips
  swapType: number, //	Number	Type of swap calculated
  symbol: string, //	String	Symbol name
  tickSize: number, //	Floating number	Smallest possible price change, used for profit / margin calculation, null if not applicable
  tickValue: number, //	Floating number	Value of smallest possible price change(in base currency), used for profit / margin calculation, null if not applicable
  time: number, //	Time	Ask & bid tick time
  timeString: string, //	String	Time in String
  trailingEnabled: boolean, //	Boolean	Indicates whether trailing stop(offset) is applicable to the instrument.
  type: number, // Number	Instrument class number
}

// http://developers.xstore.pro/documentation/current#tradeTransaction
export interface ICommandTradeTransaction {
  command: string,
  arguments: {
    tradeTransInfo: {
      cmd: ECmd,
      customComment: string,
      expiration: number,
      offset: number,
      order: number,
      price: number,
      sl: number,
      symbol: string,
      tp: number,
      type: EType,
      volume: number
    }
  }
}

export interface ITradeTransactionReturnData {
  order: number
}

/** http://developers.xstore.pro/documentation/current#available-streaming-commands */
// http://developers.xstore.pro/documentation/current#streamgetBalance
export interface IStreamingBalanceRecord {
  balance: number,
  credit: number,
  equity: number,
  margin: number,
  marginFree: number,
  marginLevel: number
}

// http://developers.xstore.pro/documentation/current#streamgetCandles
export interface ICommandGetCandles {
  command: string,
  streamSessionId: string,
  symbol: string
}

// http://developers.xstore.pro/documentation/current#streamgetTickPrices
export interface ICommandGetTickPrices {
  command: string,
  streamSessionId: string,
  symbol: string,
  minArrivalTime?: number,
  maxLevel?: number
}

export interface IStreamingTickRecord {
  ask: number,
  askVolume: number,
  bid: number,
  bidVolume: number,
  high: number,
  level: number,
  low: number,
  quoteId: number,
  spreadRaw: number,
  spreadTable: number,
  symbol: string,
  timestamp: number
}

// http://developers.xstore.pro/documentation/current#streamgetTrades
export interface IStreamingTradeRecord {
  close_price: number, //	Floating number	Close price in base currency
  close_time: number, //	Time	Null if order is not closed
  closed: boolean, //	Boolean	Closed
  cmd: ECmd, //	Number	Operation code
  comment: string, //	String	Comment
  commission: number, //	Floating number	Commission in account currency, null if not applicable
  customComment: string, //	String	The value the customer may provide in order to retrieve it later.
  digits: number, //	Number	Number of decimal places
  expiration: number, //	Time	Null if order is not closed
  margin_rate: number, //	Floating number	Margin rate
  offset: number, // Number	Trailing offset
  open_price: number, //	Floating number	Open price in base currency
  open_time: number, //	Time	Open time
  order: number, //	Number	Order number for opened transaction
  order2: number, //	Number	Transaction id
  position: number, //	Number	Position number(if type is 0 and 2) or transaction parameter(if type is 1)
  profit: number, //	Floating number	null unless the trade is closed(type = 2) or opened(type = 0)
  sl: number, //	Floating number	Zero if stop loss is not set(in base currency)
  state: EState, //	String	Trade state, should be used for detecting pending order's cancellation
  storage: number, //	Floating number	Storage
  symbol: string, //	String	Symbol
  tp: number, //	Floating number	Zero if take profit is not set(in base currency)
  type: EType, // Number	type
  volume: number //	Floating number	Volume in lots
}

// http://developers.xstore.pro/documentation/current#streamgetTradeStatus
export interface IStreamingTradeStatusRecord {
  customComment: string,
  message: string,
  order: number,
  price: number,
  requestStatus: ERequestStatus
}