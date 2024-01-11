import nano from '../couch-db/couch-db.mjs'

import * as ULID from 'ulid'

const db = nano.use('rrl-server')

import jwt from 'jsonwebtoken'

import { fileURLToPath } from 'url'

import fs from 'fs';

import path from 'path';

class Service {

  get(req) {
    return this.getToken(req)
      .then(token => this.verifyToken(token))
      .then(verifiedToken => this.getProjects(verifiedToken))
  }

  create(req) {
    return this.getToken(req)
      .then(token => this.verifyToken(token))
      .then(verifiedToken => this.uploadFiles(req, verifiedToken))
  }
  download(req, res) {
    return this.getToken(req)
      .then(token => this.verifyToken(token))
      .then(verifiedToken => this.downloadFile(req, res, verifiedToken))
  }

  downloadFile(req, res, verifiedToken) {
    const projectId = req.params.projectId.split(":")[2];
    const dirPath = path.join('uploads', verifiedToken.ulid, `project-${projectId}`);
    const filePath = path.join(dirPath, 'model.pkl');
  
    if (fs.existsSync(filePath)) {
      res.download(filePath, 'model.pkl', (err) => {
        if (err) {
          res.status(500).send({
            error: `Ошибка при скачивании файла: ${err.message}`
          });
        }
      });
    } else {
      res.status(404).send({
        error: 'Файл не найден'
      });
    }
  }
  

  update(req) {
    return this.getToken(req)
      .then(token => this.verifyToken(token))
      .then(verifiedToken => this.createProject(req, verifiedToken))
  }

  delete(req) {
    return this.getToken(req)
      .then(token => this.verifyToken(token))
      .then(verifiedToken => this.deleteFiles(req, verifiedToken))
  }

  deleteFiles(req, verifiedToken) {
    const projectId = req.params.projectId.split(":")[2]
    const dir = path.join('uploads', verifiedToken.ulid, `project-${projectId}`);
    try {
      fs.rmSync(dir, { recursive: true, force: true });
      return {delete: 'ok'}
    }
    catch (err) {
      throw Error(`Ошибка удаления файла: ${err}}`)
    }
  }

  uploadFiles(req, verifiedToken) {
    // this.upload(req)
    console.log(req.body)
    console.log(req)
    return {a:1};
  }

  createProject(req, verifiedToken) {
    console.log(req.body)
    console.log(req.files)
    return Promise.resolve(1);
  }

  getProjects(verifiedToken) {
      console.log(verifiedToken)
      return db.partitionedList(verifiedToken.ulid,{ include_docs: true, start_key: `${verifiedToken.ulid}:project:0`, end_key: `${verifiedToken.ulid}:project:f`})
        .catch( err =>
          Promise.reject({
            error: `Не могу найти список проектов: ${err}`,
            status: 403
          })
        )
    }

  async hasAuthorizationHeader(req) {
    console.log('hasAuthorizationHeader')
    // console.log(path.dirname(import.meta.url))
    if (!req.headers['authorization'])
      return Promise.reject({
        error: 'Не заданы параметры авторизации',
        status: 403
      })
    return true;
  }

  async getToken(req) {
    console.log('getToken')
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return Promise.reject({
        error: 'Доступ закрыт. Нет токена пользователя',
        status: 403
      })
    }
    return token;
  }
  async verifyToken(token) {
    console.log(token)
    const secret = process.env.TOKEN_PRIVATE_KEY;
    try {
      return jwt.verify(token, secret);
    } catch (error) {
      return Promise.reject({
        error: `Ошибка верификации токена: ${error.message}`,
        status: 403
      });
    }
  }

}

const service: Service = new Service()

export default service