import Big from 'big.js'

export interface ICommonCandle {
  date: number,
  open: number,
  high: number,
  low: number,
  close: number,
  volume: number
}

export enum ETradeSide {
  NONE = 'NONE',
  BUY = 'BUY',
  SELL = 'SELL'
}

export interface ITradeTransactionEnter {
  side: ETradeSide,
  volume: Big,
  openPrice: Big
}

export interface ICommonInstrumentBasicInfo {
  currencyPrice: Big,
  leverage: Big,
  nominalValue: Big
}

export enum EBotState {
  IDLE,
  TRADE_REQUESTED,
  TRADE_ERROR,
  TRADE_PENDING,
  TRADE_ACCEPTED,
  TRADE_REJECTED
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