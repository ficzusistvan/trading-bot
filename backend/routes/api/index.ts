import express from 'express'
let router: express.Router = express.Router();

import candlesRouter from "./candles";

router.use("/candles", candlesRouter);

export = router;