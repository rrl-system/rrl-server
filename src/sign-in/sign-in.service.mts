import nano from '../couch-db/couch-db.mjs'

import type {User} from 'user.mjs'

import * as ULID from 'ulid';

import {OAuth2Client} from 'google-auth-library';

const client = new OAuth2Client();

import bcrypt from 'bcrypt'

import {encode} from '../helpers/crypto.mjs';

const db = nano.use('rrl-users')

import jwt from 'jsonwebtoken';

class SingInService {
  checkMethod(req) {
    return (req.method === "POST") ? Promise.resolve("POST") :
      Promise.reject({
        error: `Метод ${req.method} недопустим`,
        status: 400
      })
  }

  checkUserName(req) {
    return req.body.username !== undefined ? Promise.resolve(JSON.stringify(req.body.username)) :
      Promise.reject({
        error: `Не задано имя пользователя`,
        status: 400
      })
  }

  checkPassword(req) {
    return req.body.password !== undefined ? Promise.resolve(req.body.password) :
      Promise.reject({
        error: `Не задан пароль пользователя`,
        status: 400
      })
  }

  userSignIn(req) {
    console.log(req.body)
    return (req.body.type === 'google') ? this.googleUserSingIn(req) : this.simpleUserSingIn(req)
  }

  simpleUserSingIn(req) {
    return this.verifyPassword(req)
    .then(() => this.getUserDB(req))
    .then(userDB => this.checkUserPassword(userDB, req))
    .then(userDB => this.createSimpleUserToken(userDB))
  }

  googleUserSingIn(req) {
    return this.verifyGoogleToken(req.body.token)
    .then(ticket => this.getGoogleUserId(ticket))
    .then(userId => this.getGoogleUserDB(userId))
    .then(userDB => this.createSimpleUserToken(userDB))
  }

  async verifyGoogleToken(token) {
    console.log('token', token);
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: '152529125992-enoddnchd7n8mug7he2juk5fh3fhevqe.apps.googleusercontent.com',
    });
    return ticket;
  }

  async getGoogleUserId(ticket) {
    console.log('ticket', ticket);
    return `${encode(ticket.payload.sub)}:user`
  }

  getGoogleUserDB(userId) {
    console.log('userId', userId);
    return db.get(userId).catch( err => {
      console.log(err)
      return Promise.reject({
        error: `Не могу найти такого пользователя: ${err}`,
        status: 403
      })}
    )
  }

  async createSimpleUserToken(user) {
    const payload = {
      id: user._id,
      ulid: user.ulid
    };
    console.log("payload",payload)
    const secret =  process.env.TOKEN_PRIVATE_KEY
    const options = { expiresIn: '1h' };
    return jwt.sign(payload, secret, options);
  }

  getUserDB(req) {
    console.log(req.body)
    console.log(`${encode(req.body.username)}:user`)
    return db.get(`${encode(req.body.username)}:user`).catch( err => {
      console.log(err)
      return Promise.reject({
        error: `Не могу найти этого пользователя: ${err}`,
        status: 403
      })}
    )
  }

  checkUserPassword(userDB, req) {
    console.log(userDB)
    return bcrypt.compare(req.body.password, userDB.password)
    .then(result => {
      console.log(result)
      return result ? userDB :
        Promise.reject({
          error: 'Вы указали неправильный пароль',
          status: 403
        })
    })
  }

  async verifyPassword(req) {
    if (!req.body.password)
      return Promise.reject( {
        error: `Не задан пароль пользователя`,
        status: 500
      })
    return true
  }

}

const singInService: SingInService = new SingInService()

export default singInService