import express from 'express'
let router: express.Router = express.Router();

import opportunityRouter from "./opportunity";

router.use("/opportunity", opportunityRouter);

export = router;