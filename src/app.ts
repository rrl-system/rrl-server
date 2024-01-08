import express from 'express'

import type { Express, Router, Request, Response } from 'express'

import 'dotenv/config'

import routes from './routes/index.mjs'

import cors from 'cors'

const app: Express = express()

const host = process.env.SERVER_HOST

const port = Number(process.env.SERVER_PORT)


import multer from 'multer'

const upload = multer({ dest: 'uploads/' })

// app.post('/upload', upload.single('file'), function (req, res, next) {
//   console.log(req)
//   console.log(req.body)
//   res.status(200).send({a: 1})
// })

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(function setCommonHeaders(req, res, next) {
    res.set("Access-Control-Allow-Private-Network", "true");
    res.set("Permissions-Policy", "interest-cohort=()")
    next();
  });

app.use(cors());


app.use('/api', routes)

app.listen(port, host, () =>
    console.log(`Server listens http://${host}:${port}`)
)