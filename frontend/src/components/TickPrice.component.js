import React, { Component } from 'react'
import { Row, ListGroup, Col } from 'reactstrap';
import io from 'socket.io-client';

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
      <Row>
        <Col>
          <h5>TickPrice</h5>
          <p>Ask: {this.state.price.ask} Bid: {this.state.price.bid}</p>
        </Col>
      </Row>
    );
  }
}

export default TickPrice