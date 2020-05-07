import Big from 'big.js'

export interface ICommonCandle {
  date: number,
  open: number,
  high: number,
  low: number,
  close: number,
  volume: number
}

export interface ITradeTransactionEnter {
  cmd: EXAPITradeTransactionCmd,
  volume: Big,
  openPrice: Big
}

export interface ICommonInstrumentBasicInfo {
  currencyPrice: Big,
  leverage: Big,
  nominalValue: Big
}

export enum EBotState {
  TRADE_REQUEST_SENT,
  TRADE_REQUESTED,
  TRADE_IN_ERROR_STATE,
  TRADE_IN_PENDING_STATE,
  TRADE_IN_ACCEPTED_STATE,
  TRADE_IN_REJECTED_STATE,
  WAITING_FOR_ENTER_SIGNAL,
  WAITING_FOR_EXIT_SIGNAL
}

// xapi
export interface IXAPILogin {
  command: string;
  arguments: {
    userId: number;
    password: string;
  }
}
export interface IXAPIGetCandles {
  command: string,
  streamSessionId: string,
  symbol: string
}
export interface IXAPIChartLastRequest {
  command: string;
  arguments: {
    info: {
      period: number;
      start: number;
      symbol: string;
    }
  };
}
export interface IXAPIChartLastRequestReturnData {
  digits: number,
  rateInfos: Array<IXAPIRateInfoRecord>
}
export interface IXAPIRateInfoRecord {
  close: number;
  ctm: number;
  ctmString: string;
  high: number;
  low: number;
  open: number;
  vol: number;
}
export interface IXAPIGetTickPrices {
  command: string,
  streamSessionId: string,
  symbol: string,
  minArrivalTime?: number,
  maxLevel?: number
}

export enum EXAPITradeTransactionCmd {
  BUY = 0,
  SELL = 1,
  BUY_LIMIT = 2,
  SELL_LIMIT = 3,
  BUY_STOP = 4,
  SELL_STOP = 5,
  BALANCE = 6,
  CREDIT = 7
}

export enum EXAPITradeTransactionType {
  OPEN = 0,
  PENDING = 1,
  CLOSE = 2,
  MODIFY = 3,
  DELETE = 4
}

export interface IXAPITradeTransaction {
  command: string,
  arguments: {
    tradeTransInfo: {
      cmd: EXAPITradeTransactionCmd,
      customComment: string,
      expiration: number,
      offset: number,
      order: number,
      price: number,
      sl: number,
      symbol: string,
      tp: number,
      type: EXAPITradeTransactionType,
      volume: number
    }
  }
}

export enum EXAPIStreamingTradeStatusRecordRequestStatus {
  ERROR = 0,
  PENDING = 1,
  ACCEPTED = 3,
  REJECTED = 4
}

export interface IXAPIStreamingTradeStatusRecord {
  customComment: string,
  message: string,
  order: number,
  price: number,
  requestStatus: EXAPIStreamingTradeStatusRecordRequestStatus
}

export interface IXAPIStreamingTradeRecord {
  close_price: number, //	Floating number	Close price in base currency
  close_time: number, //	Time	Null if order is not closed
  closed: boolean, //	Boolean	Closed
  cmd: EXAPITradeTransactionCmd, //	Number	Operation code
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
  state: EXAPIStreamingTradeRecordState, //	String	Trade state, should be used for detecting pending order's cancellation
  storage: number, //	Floating number	Storage
  symbol: string, //	String	Symbol
  tp: number, //	Floating number	Zero if take profit is not set(in base currency)
  type: EXAPIStreamingTradeRecordType, // Number	type
  volume: number //	Floating number	Volume in lots
}

export enum EXAPIStreamingTradeRecordType {
  OPEN = 0,
  PENDING = 1,
  CLOSE = 2,
  MODIFY = 3,
  DELETE = 4
}

export enum EXAPIStreamingTradeRecordState {
  MODIFIED = 'Modified',
  DELETED = 'Deleted'
}

export interface IXAPIStreamingTickRecord {
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