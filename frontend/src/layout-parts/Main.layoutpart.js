import React from 'react';
//import { Switch, Route } from 'react-router-dom';
import MyUpdatingChartComponent from '../components/Charts/MyUpdatingChart.component'
import TradesComponent from '../components/Trades.component';
import TickPriceComponent from '../components/TickPrice.component';
import { Row, Col } from 'reactstrap';
import './Main.layoutpart.css';

const MainLayoutPart = () => (
  <Row className='main'>
    <Col>
      {/*<Switch>
        <Route exact path='/charts' component={MyUpdatingChartComponent} />
      </Switch>*/}
      <TickPriceComponent />
      <MyUpdatingChartComponent />
      <TradesComponent />
    </Col>
  </Row>
)

export default MainLayoutPart;