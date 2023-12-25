import type { Router } from "express";

import express from 'express'

const router: Router = express.Router()

import signInRoutes from '../sign-in/sign-in.routes.mjs'
import signUpRoutes from '../sign-up/sign-up.routes.mjs'
import userRoutes from '../user/user.routes.mjs'

router.use('/sign-in', signInRoutes)
router.use('/sign-up', signUpRoutes)
router.use('/user', userRoutes)

export default router