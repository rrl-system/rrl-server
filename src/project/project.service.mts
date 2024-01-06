import nano from '../couch-db/couch-db.mjs'

import * as ULID from 'ulid';

const db = nano.use('rrl-server')

import jwt from 'jsonwebtoken';

class Service {

  get(req) {
    return this.getToken(req)
      .then(token => this.verifyToken(token))
      .then(verifiedToken => this.getProject(req, verifiedToken))
  }

  create(req) {
    return this.getToken(req)
      .then(token => this.verifyToken(token))
      .then(verifiedToken => this.createProject(req, verifiedToken))
  }

  update(req) {
    return this.getToken(req)
      .then(token => this.verifyToken(token))
      .then(verifiedToken => this.updateProject(req, verifiedToken))
  }

  delete(req) {
    return this.getToken(req)
      .then(token => this.verifyToken(token))
      .then(verifiedToken => this.deleteProject(req, verifiedToken))
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

  getProject(req, verifiedToken) {
    const projectId = req.params.projectId.split(":")
    return db.get(`${verifiedToken.ulid}:project:${projectId[2]}`)
      .catch( err =>
        Promise.reject({
          error: `Не могу найти проект: ${err}`,
          status: 403
        })
      )
  }

  updateProject(req, verifiedToken) {
    const project = req.body
    const projectId = project._id.split(":")[2]
    project._id = `${verifiedToken.ulid}:project:${projectId}`
    console.log("update", project)
    return db.insert(project)
    .catch( err =>
        Promise.reject({
          error: `Ошибка сохранения проекта: ${err}`,
          status: 403,
        })
      )
  }

  deleteProject(req, verifiedToken) {
    const projectId = req.params.projectId.split(":")[2]
    return db.destroy(`${verifiedToken.ulid}:project:${projectId}`, req.query.rev)
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