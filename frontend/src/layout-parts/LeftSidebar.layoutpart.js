import React from 'react';
import { Row, Col, Button } from 'reactstrap';
import './LeftSidebar.layoutpart.css';
import { Link } from 'react-router-dom';

class LeftSidebarLayoutPart extends React.Component {

  render() {
    return (
      <>
        <Row className='left-sidebar'>
          <Col>
            <Row>
              <Col className="text-center">
                <h4>Trading Bot Frontend</h4>
              </Col>
            </Row>
            <Row className='mt-1'>
              <Col>
                <Button block color="success" tag={Link} to='charts'>Charts</Button>
              </Col>
            </Row>
          </Col>
        </Row>
      </>
    )
  }
}

export default LeftSidebarLayoutPart;