import type { Router } from "express";

const express = require('express'),
    router: Router = express.Router(),
    startRoutes = require('./start.routes')

router.use('/start', startRoutes)

export = router