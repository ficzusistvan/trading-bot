import React from 'react';
import { Switch, Route } from 'react-router-dom';
import MyUpdatingChartComponent from '../components/Charts/MyUpdatingChart.component'
import { Row, Col } from 'reactstrap';
import './Main.layoutpart.css';

const MainLayoutPart = () => (
  <Row className='main'>
    <Col>
      <Switch>
        <Route exact path='/charts' component={MyUpdatingChartComponent} />
      </Switch>
    </Col>
  </Row>
)

export default MainLayoutPart;