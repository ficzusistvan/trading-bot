import { SET_CANDLES } from "../actions/types";

const candles = (state = { candles: [] }, action) => {
  switch (action.type) {

    case SET_CANDLES: {
      return {
        ...state,
        candles: action.candles
      }
    }

    default:
      return state;
  }
}

export default candles