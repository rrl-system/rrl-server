import type { Express, Router, Request, Response, NextFunction} from 'express'

import express from 'express'

import service from './project.service.mjs'

import controller from './project.controller.mjs'

const router: Router = express.Router()

router.use(async (req: Request, res: Response, next: NextFunction) => {
    service.hasAuthorizationHeader(req)
        .then (() => next())
        .catch(next)
})

router
    .route('/')
    .post(controller.create)
    .put(controller.update)

router
    .route('/:projectId')
    .get(controller.get)
    .delete(controller.delete)

router.use(function(err: any, req: Request, res: Response, next: NextFunction) {
    res.status(err.status || 500)
    .send(err);
});

export default router