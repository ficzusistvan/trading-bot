import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './App';
import { Provider } from "react-redux";
import store from "./redux/store";
import 'bootstrap/dist/css/bootstrap.min.css';

import { HashRouter } from 'react-router-dom';

ReactDOM.render((
  <Provider store={store}>
    <HashRouter>
      <App />
    </HashRouter>
  </Provider>
), document.getElementById('root'));