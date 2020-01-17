import React, { Component } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

let socket = io('http://localhost:3001')

class PriceTicker extends Component {
  constructor() {
    super();
    this.state = {
      rest: null,
      ws: null
    }
  }

  async componentDidMount() {
    var resp = await axios.get('/api/algo-results/' + this.props.symbol + '/1');
    this.setState({ rest: resp.data });
    socket.on('WS_MSG_KLINE', msg => {
      if (msg.symbol === this.props.symbol) {
        this.setState({
          ws: JSON.parse(msg.data)
        });
      }
    })
  }

  render() {
    var firstChart = this.state.rest ? this.state.rest[0][1] : null;
    var firstElement = firstChart ? firstChart[0] : null;
    var restPrice = firstElement ? firstElement[4] : null;
    var wsPrice = this.state.ws ? this.state.ws.k.c : null;
    return (
      <div className="price-ticker">
        <div>
          {restPrice}
        </div>
        <div>
          {wsPrice}
        </div>
      </div>
    )
  }
}

export default PriceTicker;