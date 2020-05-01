export interface ICommonCandle {
  date: any,
  open: number,
  high: number,
  low: number,
  close: number,
  volume: number
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