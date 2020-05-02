import express from 'express'
import path from 'path'
import { em, HTTP_SERVER_INITIALISED } from './event-handler'
import nconf from 'nconf'
nconf.file({
  file: 'config.json',
  search: true
});

// Create a new express application instance
const app: express.Application = express();

const APP_PORT = nconf.get('ports:http_server');

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../client/arbiter/build')));

import routes from './routes'

app.use(routes);

app.listen(APP_PORT, function () {
  console.log('Trading-bot http server (express) listening on port ' + APP_PORT + '!');
  em.emit(HTTP_SERVER_INITIALISED, APP_PORT);
});