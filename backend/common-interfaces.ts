import Big from 'big.js'
import * as xi from './xapi-interfaces'

export interface ICandle {
  date: number,
  open: number,
  high: number,
  low: number,
  close: number,
  volume: number
}

export interface ITradeTransactionEnter {
  cmd: xi.ECmd,
  volume: Big,
  openPrice: Big
}

export interface IInstrumentBasicInfo {
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