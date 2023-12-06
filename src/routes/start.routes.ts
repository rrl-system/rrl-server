const express = require('express'),
  router = express.Router(),
  StartController = require('../controllers/start.controller')


router.use(async (req, res, next) => {
  const data = {x: 1, y: 1}
  if (data) {
    req.start = data
    next()
  } else
    return res
      .status(500)
      .send({ message: 'Error while getting users' })
})

router
  .route('/')
  .get(StartController.getStart)

export = router