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
    return (req.body.type === 'google') ? this.googleUserCreate(req) : this.simpleleUserCreate(req)
  }


  checkGoogleUser(ticket) {
    console.log('ticket', ticket);
    return db.get(`${encode(ticket.payload.sub)}:user`)
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

  checkSimpleUser(encodedUser) {
    console.log(encodedUser)
    return db.get(`${encodedUser.id}:user`)
      .then(
        res =>
          Promise.reject({
            error: `Такой пользователь уже существует. Войдите от его имени`,
            status: 500
          }),
        () => {
          return encodedUser
        }
      )
  }

  googleUserCreate(req) {
    return this.verifyGoogle(req.body.token)
      .then(ticket => this.checkGoogleUser(ticket))
      .then(userData => this.createUserObject(userData, req))
      .then(encodedUser => this.createGoogleUser(encodedUser))
      .then(userDb => this.createGoogleUserToken(userDb, req))
  }

  simpleleUserCreate(req) {
    return this.verifyPassword(req)
      .then(() => this.createHash(req))
      .then((hash) => this.hashPassword(hash,req))
      .then(() => this.createSimpleUserObject(req))
      .then((encodedUser) => this.checkSimpleUser(encodedUser))
      .then(encodedUser => this.createSimpleUser(encodedUser))
      .then(userDb => this.createSimpleUserToken(userDb, req))
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

  async hashPassword(hash, req) {
    console.log("before", req.body)
    req.body.password = hash
    console.log("after`", req.body)
    return hash
  }

  async verifyPassword(req) {
    if (!req.body.password)
      return Promise.reject( {
        error: `Не задан пароль пользователя`,
        status: 500
      })
    return true
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

  createSimpleUser(encodedUser) {
    console.log(encodedUser)
    return db.insert(encodedUser.data as object, `${encodedUser.id}:user`)
    .catch( err =>
      Promise.reject({
        error: `Ошибка создания пользователя: ${err}`,
        status: 500
      })
    )
  }

  async createGoogleUserToken(user, req) {
    console.log(user)
    const payload = {
      id: user.id,
      ulid: req.body.ulid
    };
    // ulid: user.data.ulid
    const secret =  process.env.TOKEN_PRIVATE_KEY
    const options = { expiresIn: '1h' };
    return jwt.sign(payload, secret, options);
  }

  async createSimpleUserToken(user, req) {
    console.log("userDB",user)
    const payload = {
      id: user.id,
      ulid: req.body.ulid
    };
    console.log("payload",payload)
    // ulid: user.data.ulid,
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

  async createUserObject(userData, req) {
    console.log(userData)
    const googleUserData: GoogleUser = {
      ulid: ULID.ulid(),
      userData: encode(JSON.stringify(userData)),
      createDate: Date.now()
    }
    req.body.ulid = googleUserData.ulid
    return {id: encode(userData.sub),
            data: googleUserData}
  }

  async createSimpleUserObject(req) {
    const simpleUserData = {
      ulid: ULID.ulid(),
      password: req.body.password,
      emailVerified: false,
      userData: encode(JSON.stringify(req.body)),
      createDate: Date.now()
    }
    req.body.ulid = simpleUserData.ulid
    return {id: encode(req.body.username),
            data: simpleUserData}
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

  // createSimpleUser(req) {
  //   return this.createHash(req).then(hash => this.insertUser(req, hash))
  // }
}

const signUpService: SignUpService = new SignUpService()

export default signUpService