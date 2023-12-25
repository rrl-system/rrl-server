import nano from '../couch-db/couch-db.mjs'

import type {User, GoogleUser} from 'user.mjs'

import * as ULID from 'ulid';

import bcrypt from 'bcrypt'

const db = nano.use('rrl-users')

import {OAuth2Client} from 'google-auth-library';

const client = new OAuth2Client();

import jwt from 'jsonwebtoken';

import {encode, decode} from '../helpers/crypto.mjs';

class SignUpService {

  async verifyGoogle(token) {
    console.log('token', token);
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: '152529125992-enoddnchd7n8mug7he2juk5fh3fhevqe.apps.googleusercontent.com',
    });
    return ticket;
  }

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

  createUser(req) {
    return (req.body.type === 'google') ? this.googleUser(req) :
    new Promise((res, rej) => {
        db.partitionedList(req.body.username)
          .then(loginList => {
            if (loginList.rows.length === 0 )
              return res(loginList.rows.length)
            else {
              rej({
                error: `Пользователь с именем ${req.body.username} уже существует`,
                status: 400
              })
            }
          })
          .catch( (e) =>
            rej({
              error: `Ошибка запроса к базе данных: ${e}`,
              status: 400
            })
          )
    })
  }

  checkGoogleUser(ticket) {
    console.log('ticket', ticket);
    return db.get(`${ticket.payload.sub}:user`)
      .then(
        res =>
          Promise.reject({
            error: `Такой пользователь уже существует. Войдите от его имени`,
            status: 500
          }),
        () => {
          return ticket.payload
        }
      )
  }

  googleUser(req) {
    return this.verifyGoogle(req.body.token)
      .then(ticket => this.checkGoogleUser(ticket))
      .then(userData => this.createUserObject(userData))
      .then(encodedUser => this.createGoogleUser(encodedUser))
      .then(userDb => this.createGoogleUserToken(userDb))
  }

  createHash(req) {
    return bcrypt.hash(req.body.password, +process.env.SALT_ROUNDS )
      .catch ( err =>
        Promise.reject( {
          error: `Ошибка создания кеша пароля: ${err}`,
          status: 500
        })
      )
  }

  createGoogleUser(encodedUser) {
    console.log(encodedUser)
    return db.insert(encodedUser.data as object, `${encodedUser.id}:user`)
    .catch( err =>
      Promise.reject({
        error: `Ошибка создания пользователя: ${err}`,
        status: 500
      })
    )
  }

  async createGoogleUserToken(user) {
    console.log(user)
    const payload = {
      id: user.id
    };
    const secret =  process.env.TOKEN_PRIVATE_KEY
    const options = { expiresIn: '1h' };
    return jwt.sign(payload, secret, options);
  }

  insertUser(req, hash) {
    const user: User = {
      ulid: ULID.ulid(),
      password: hash
    }
    return db.insert(user as object, `${req.body.username}:user`)
    .catch( err =>
        Promise.reject({
          error: `Ошибка создания пользователя: ${err}`,
          status: 500
        })
      )
  }

  getUser(req) {
    return db.get(`${req.body.username}:user`).catch( err =>
      Promise.reject({
        error: `Не могу найти пользователя ${req.body.username} в базе данных: ${err}`,
        status: 500
      })
    )
  }

  async createUserObject(userData) {
    console.log(userData)
    const googleUserData: GoogleUser = {
      ulid: ULID.ulid(),
      userData: encode(JSON.stringify(userData)),
      createDate: Date.now()
    }
    return {id: encode(userData.sub),
            data: googleUserData}
  }

  async generateAccessToken() {
    // const payload = {
    //   id: user.id,
    //   email: user.email
    // };

    // const secret =  process.env.TOKEN_PRIVATE_KEY
    // const options = { expiresIn: '1h' };

    // return jwt.sign(payload, secret, options);
  }

  verifyAccessToken(token) {
    const secret = process.env.TOKEN_PRIVATE_KEY;
    try {
      const decoded = jwt.verify(token, secret);
      return { success: true, data: decoded };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  createSimpleUser(req) {
    return this.createHash(req).then(hash => this.insertUser(req, hash))
  }
}

const signUpService: SignUpService = new SignUpService()

export default signUpService