import express from 'express'
import nconf from 'nconf'
nconf.file({
  file: 'config.json',
  search: true
});
let router: express.Router = express.Router();

router.get('/list', async function (req, res, next) {
  res.json({ yes: 'yes' });
});

export = router;