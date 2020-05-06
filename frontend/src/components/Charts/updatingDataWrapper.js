import React from "react";
import io from 'socket.io-client';
import moment from 'moment/moment';

function getDisplayName(ChartComponent) {
  const name = ChartComponent.displayName || ChartComponent.name || "ChartComponent";
  return name;
}

export default function updatingDataWrapper(ChartComponent) {
  class UpdatingComponentHOC extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        candles: [],
      };
    }

    async componentDidMount() {
      let socket = io('http://localhost:3005');
      socket.on('bufferedCandlesUpdated', updatedBufferedCandles => {
        this.setState({ candles: updatedBufferedCandles });
      });
    }

    render() {
      const { type } = this.props;
      const { candles } = this.state;

      const parsedCandles = candles.map(candle => {
        let obj = {};
        obj.date = moment(candle.date).toDate();
        obj.open = +candle.open;
        obj.high = +candle.high;
        obj.low = +candle.low;
        obj.close = +candle.close;
        obj.volume = +candle.volume;
        obj.text = '';
        return obj;
      });

      if (parsedCandles.length === 0) {
        return <h3>Waiting...</h3>
      }

      return <ChartComponent ref="component" data={parsedCandles} type={type} />;
    }
  }
  UpdatingComponentHOC.defaultProps = {
    type: "svg",
  };
  UpdatingComponentHOC.displayName = `updatingDataWrapper(${getDisplayName(ChartComponent)})`;

  return UpdatingComponentHOC;
}