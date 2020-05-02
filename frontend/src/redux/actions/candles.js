import { SET_CANDLES } from "./types";

export const setCandles = (candles) => ({
  type: SET_CANDLES,
  candles
});