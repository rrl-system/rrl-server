import nano from '../couch-db/couch-db.mjs'

import * as ULID from 'ulid';

const db = nano.use('rrl-server')

import jwt from 'jsonwebtoken';

class Service {

  get(req) {
    const projectId = req.params.projectId;
    return this.getToken(req)
      .then(token => this.verifyToken(token))
      .then(verifiedToken => this.getProject(verifiedToken, projectId))
  }

  create(req) {
    return this.getToken(req)
      .then(token => this.verifyToken(token))
      .then(verifiedToken => this.createProject(req, verifiedToken))
  }

  update(req) {
    return this.getToken(req)
      .then(token => this.verifyToken(token))
      .then(verifiedToken => this.createProject(req, verifiedToken))
  }

  delete(req) {
    const projectId = req.params.projectId;
    return this.getToken(req)
      .then(token => this.verifyToken(token))
      .then(verifiedToken => this.deleteProject(verifiedToken, projectId))
  }

  createProject(req, verifiedToken) {
    return db.insert(req.body, `${verifiedToken.ulid}:project:${ULID.ulid()}`)
    .catch( err =>
        Promise.reject({
          error: `Ошибка создания проекта: ${err}`,
          status: 500
        })
      )
  }

  getProject(verifiedToken, projectId) {
    const project = projectId.split(":")[2]
    return db.get(`${verifiedToken.ulid}:project:${project}`)
      .catch( err =>
        Promise.reject({
          error: `Не могу найти проект: ${err}`,
          status: 403
        })
      )
  }

  deleteProject(verifiedToken, projectId) {
    const project = projectId.split(":")
    return db.destroy(`${verifiedToken.ulid}:project:${project[2]}`, `${project[3]}`)
    .catch( err =>
        Promise.reject({
          error: `Ошибка удаления проекта: ${err}`,
          status: 403,
        })
      )
  }

  async hasAuthorizationHeader(req) {
    if (!req.headers['authorization'])
      return Promise.reject({
        error: 'Не заданы параметры авторизации',
        status: 403
      })
    return true;
  }

  async getToken(req) {
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