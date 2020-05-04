import React, { Component } from 'react'
import { Jumbotron } from 'reactstrap';
import io from 'socket.io-client';
import moment from 'moment/moment';

class TickPrice extends Component {
  constructor(props) {
    super(props);
    this.state = {
      price: {},
    };
  }

  async componentDidMount() {
    let socket = io('http://localhost:3005');
    socket.on('tickPrice', data => {
      console.log(data);
      this.setState({ price: data });
    });
  }

  render() {
    return (
      <Jumbotron>
        <p>Ask: {this.state.price.ask} Volume: {this.state.price.askVolume}</p>
        <p>Bid: {this.state.price.bid} Volume: {this.state.price.bidVolume}</p>
        <p>High: {this.state.price.high} Low: {this.state.price.low} Level: {this.state.price.level}</p>
        <p>QuoteId {this.state.price.quoteId} Timestamp: {moment(this.state.price.timestamp).format()}</p>
      </Jumbotron>
    );
  }
}

export default TickPrice