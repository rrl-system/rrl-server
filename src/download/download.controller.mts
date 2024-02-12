import service from './download.service.mjs'

import 'express-zip';

class Controller {
  get(req, res, next) {
    service.get(req)
      .then( result => {
        res.status(200).send(result)
      })
      .catch(next)
  }
  download(req, res, next) {
    service.download(req, res)
      .catch(next);
  }

  downloadProjectAvatars(req, res, next) {

    service.downloadProjectAvatars(req, res).then(zipFiles => {
      console.log('zip', zipFiles)
      console.log('zip2', res.zip)
      res.zip(zipFiles, '111', (e) => {
        console.log('11')
      })
    })
      .catch(next);
  }

  create(req, res, next) {
    service.create(req)
      .then( result => {
        res.status(200).send(result)
      })
      .catch(next)
  }
  update(req, res, next) {
    service.update(req)
      .then( result => {
        res.status(200).send(result)
      })
      .catch(next)
  }
  delete(req, res, next) {
    service.delete(req)
      .then( project => {
        res.status(200).send(project)
      })
      .catch(next)
  }
}

const controller: Controller = new Controller()

export default controller