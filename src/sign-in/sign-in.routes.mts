import type { Express, Router, Request, Response, NextFunction} from 'express'

import express from 'express'

import singInService from './sign-in.service.mjs'

import singInController from './sign-in.controller.mjs'

const router: Router = express.Router()

router.use(async (req: Request, res: Response, next: NextFunction) => {
    singInService.checkMethod(req)
        .then (() => next())
        .catch(next)
})


router
    .route('/')
    .post(singInController.getUser)

router.use(function(err: any, req: Request, res: Response, next: NextFunction) {
    res.status(err.status || 500)
    .send(err);
});

export default router