import type { Express, Router, Request, Response } from 'express'

const express = require('express'),
   app: Express = express(),
   routes: Router = require('./routes/index'),
   cors = require('cors')


const host = 'localhost'
const port = 7000

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
