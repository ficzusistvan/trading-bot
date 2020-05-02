import React, { Component } from 'react'
import { Row, ListGroup, Col, ListGroupItem, ListGroupItemText } from 'reactstrap';
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
      listItems.push(<ListGroupItem>
        <ListGroupItemText>
          {trade.side}
        </ListGroupItemText>
        <ListGroupItemText>
          {trade.volume}
        </ListGroupItemText>
        <ListGroupItemText>
          {trade.openPrice}
        </ListGroupItemText>
      </ListGroupItem>);
    });

    return (
      <Row>
        <Col>
          <h6>Trades:</h6>
          <ListGroup>
            {listItems}
          </ListGroup>
        </Col>
      </Row>
    );
  }
}

export default Trades