import React from 'react';
import MainLayoutPart from './layout-parts/Main.layoutpart';
import { Container, Row, Col } from 'reactstrap';
import LeftSidebarRedux from './redux/containers/LeftSidebar.redux';

const App = () => (
  <div>
    <Container fluid={true} >
      <Row>
        <Col sm="2">
          <LeftSidebarRedux />
        </Col>
        <Col sm="10">
          <MainLayoutPart />
        </Col>
      </Row>
    </Container>
  </div>
)

export default App;