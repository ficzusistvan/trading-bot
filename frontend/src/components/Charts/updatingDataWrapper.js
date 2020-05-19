import React from "react";
import io from 'socket.io-client';
import moment from 'moment/moment';
import { Line } from 'react-chartjs-2';
import { Row, Col } from 'reactstrap';

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
        inds: []
      };
    }

    async componentDidMount() {
      let socket = io('http://localhost:3005');
      socket.on('bufferedCandlesUpdated', updatedBufferedCandles => {
        this.setState({ candles: updatedBufferedCandles });
      });
      socket.on('indicatorsUpdated', updatedIndicators => {
        this.setState({ inds: updatedIndicators });
      });
    }

    render() {
      const { type } = this.props;
      const { candles, inds } = this.state;

      let chartData1 = {
        labels: [],
        datasets: [
          {
            label: "k",
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgb(255, 99, 132)',
            yAxisID: 'y-axis-1',
            fill: false,
            lineTension: 0,
            data: []
          },
          {
            label: "d",
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgb(75, 192, 192)',
            yAxisID: 'y-axis-2',
            fill: false,
            lineTension: 0,
            data: []
          }
        ]
      };
      let chartOptions1 = {
        responsive: true,
        hoverMode: 'index',
        stacked: false,
        scales: {
          yAxes: [{
            type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
            display: true,
            position: 'left',
            id: 'y-axis-1',
            scaleLabel: {
              display: true,
              fontColor: 'rgb(255, 99, 132)',
              labelString: 'volume',
            }
          }, {
            type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
            display: true,
            position: 'left',
            id: 'y-axis-2',
            scaleLabel: {
              display: true,
              fontColor: 'rgb(75, 192, 192)',
              labelString: 'pip',
            },

            // grid line settings
            gridLines: {
              drawOnChartArea: false, // only want the grid lines for one axis to show up
            },
          }],
        }
      }

      inds.forEach((ind) => {
        chartData1.labels.push(moment(ind.date).format('YY-M-D H:m'));
        chartData1.datasets[0].data.push(ind.k);
        chartData1.datasets[1].data.push(ind.d);
      });

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

      return (
        <>
          <Row>
            <Line data={chartData1} options={chartOptions1} width={600} height={250} />
          </Row>
          <Row>
            <ChartComponent ref="component" data={parsedCandles} type={type} />
          </Row>
        </>)
    }
  }
  UpdatingComponentHOC.defaultProps = {
    type: "svg",
  };
  UpdatingComponentHOC.displayName = `updatingDataWrapper(${getDisplayName(ChartComponent)})`;

  return UpdatingComponentHOC;
}