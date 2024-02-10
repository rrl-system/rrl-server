import express from 'express'

import type { Express, Router, Request, Response } from 'express'

import 'dotenv/config'

import routes from './routes/index.mjs'

import cors from 'cors'

import cookieparser from 'cookie-parser'

import './notification-services/notification.services.mjs'

const app: Express = express()

const host = process.env.SERVER_HOST

const port = Number(process.env.SERVER_PORT)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieparser());

app.use(function setCommonHeaders(req, res, next) {
    res.set("Access-Control-Allow-Private-Network", "true");
    res.set("Permissions-Policy", "interest-cohort=()")
    next();
  });

const corsOption={
  origin:"http://localhost:52330",
  credentials:true
}

app.use(cors(corsOption));

app.use('/api', routes)

app.listen(port, host, () =>
    console.log(`Server listens http://${host}:${port}`)
)