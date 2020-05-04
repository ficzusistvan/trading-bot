import React, { Component } from 'react'
import { ListGroup, ListGroupItem, ListGroupItemText, Jumbotron } from 'reactstrap';
import io from 'socket.io-client';

class Trades extends Component {
  constructor(props) {
    super(props);
    this.state = {
      trades: [],
    };
  }

  async componentDidMount() {
    let socket = io('http://localhost:3005');
    socket.on('enter', data => {
      console.log(data);
      const newTrades = this.state.trades;
      newTrades.push(data);
      this.setState({ trades: newTrades });
    });
  }

  render() {
    let listItems = [];
    this.state.trades.forEach((trade) => {
      listItems.push(
        <ListGroupItem>
          <ListGroupItemText>
            Side: {trade.side} Volume: {trade.volume} Open price: {trade.openPrice}
          </ListGroupItemText>
        </ListGroupItem>
      );
    });

    return (
      <Jumbotron>
        <ListGroup>
          {listItems}
        </ListGroup>
      </Jumbotron>
    );
  }
}

export default Trades