const StartService = require('../services/start.service')

class StartController {
  getStart(req, res) {
    StartService.getStart().then(
      result => res.status(200).send({ data: result }),
      err => res.status(404).send({ message: err })
    );
  }

  async createHost(req, res) {
    if (req.body.user && req.body.user.id) {
      if (req.users.hasOwnProperty(req.body.user.id))
        return res
          .status(409)
          .send({ message: 'User already exists.' })

      req.users[req.body.user.id] = req.body.user

      let result = await StartService.createUser(req.users)

      if (result) return res.status(200).send(result)
      else
        return res
          .status(500)
          .send({ message: 'Unable create user.' })
    } else
      return res
        .status(400)
        .send({ message: 'Bad request.' })
  }

  async updateHost(req, res) {
    if (req.body.user && req.body.user.id) {
      if (!req.users.hasOwnProperty(req.body.user.id))
        return res
          .status(404)
          .send({ message: 'User not found.' })

      req.users[req.body.user.id] = req.body.user

      let result = await StartService.updateUser(req.users)

      if (result) return res.status(200).send(result)
      else
        return res
          .status(500)
          .send({ message: 'Unable update user.' })
    } else
      return res
        .status(400)
        .send({ message: 'Bad request.' })
  }

  async deleteHost(req, res) {
    if (req.query.id) {
      if (req.users.hasOwnProperty(req.query.id)) {
        delete req.users[req.query.id]

        let result = await StartService.deleteUser(
          req.users
        )

        if (result) return res.status(200).send(result)
        else
          return res
            .status(500)
            .send({ message: 'Unable delete user.' })
      } else
        return res
          .status(404)
          .send({ message: 'User not found.' })
    } else
      return res
        .status(400)
        .send({ message: 'Bad request.' })
  }
}

export = new StartController()