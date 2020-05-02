import express from 'express'
import nconf from 'nconf'
import * as candlesHandler from '../../candles-handler'
nconf.file({
  file: 'config.json',
  search: true
});
let router: express.Router = express.Router();

router.get('/', async function (req, res, next) {
  res.json(candlesHandler.getCandles());
});

export = router;