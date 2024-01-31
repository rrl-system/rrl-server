import type { Router } from "express";

import express from 'express'

const router: Router = express.Router()

import signInRoutes from '../sign-in/sign-in.routes.mjs'
import signUpRoutes from '../sign-up/sign-up.routes.mjs'
import userRoutes from '../user/user.routes.mjs'
import projectsRoutes from '../projects/projects.routes.mjs'
import projectRoutes from '../project/project.routes.mjs'
import uploadRoutes from '../upload/upload.routes.mjs'
import downloadRoutes from '../download/download.routes.mjs'
import userProfileRoutes from '../user-profile/user-profile.routes.mjs'
import sseRoutes from '../sse/sse.routes.mjs'
import neuralDataRoutes from '../neural-data/neural-data.routes.mjs'

router.use('/sign-in', signInRoutes)
router.use('/sign-up', signUpRoutes)
router.use('/user', userRoutes)
router.use('/projects', projectsRoutes)
router.use('/project', projectRoutes)
router.use('/upload', uploadRoutes)
router.use('/download', downloadRoutes)
router.use('/user-profile', userProfileRoutes)
router.use('/sse', sseRoutes)
router.use('/neural-data', neuralDataRoutes)

export default router