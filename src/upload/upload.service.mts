import nano from '../couch-db/couch-db.mjs'

import * as ULID from 'ulid'

const db = nano.use('rrl-server')

import jwt from 'jsonwebtoken'

import { fileURLToPath } from 'url'

import multer from 'multer'

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
  upload(req) {
    return this.getToken(req)
      .then(token => this.verifyToken(token))
      .then(verifiedToken => this.uploadFile(req, verifiedToken))
  }

  uploadFile(req, verifiedToken) {
    const projectId = req.params.projectId.split(":")[2]
    // project._id = `${verifiedToken.ulid}:project:${projectId}`
    const destPath = 'uploads';

    const storage = multer.diskStorage({

      destination: function (req, file, cb) {
        // const destPath = path.join('uploads', projectId);
        // fs.mkdirSync(destPath, { recursive: true });
        cb(null, destPath);
      },

      filename: function (req, file, cb) {
        cb(null, file.originalname);
      }

    });

    const upload = multer({ storage: storage }).single('file');

    upload(req, null, err => {
      if (err) {
        return Promise.reject({
          error: `Ошибка при загрузке файла: ${err.message}`,
          status: 403
        });
      } else {
        console.log(req)
        Promise.resolve({upload: 'ok'})
      }
    })

  }

  // upload() {
  //   const uploadDir = new URL('./files/', import.meta.url);
  //   const storage = multer.diskStorage({
  //     destination: function (req, file, callback) {
  //         callback(null, fileURLToPath(uploadDir));
  //     },
  //     filename: function (req, file, callback) {
  //       // You can write your own logic to define the filename here (before passing it into the callback), e.g:
  //       console.log(file.originalname); // User-defined filename is available
  //       const filename = '111'
  //       callback(null, filename);
  //     }
  //   })
  //   // const upload = multer({
  //   //   storage: storage,
  //   //   limits: {
  //   //     fileSize: 10048576 // Defined in bytes (1 Mb)
  //   //   },
  //   // })

  //   const upload = multer({ dest: './files/' })
  //   return upload.single('file')
  // }

  update(req) {
    return this.getToken(req)
      .then(token => this.verifyToken(token))
      .then(verifiedToken => this.createProject(req, verifiedToken))
  }

  delete(req) {
    return this.getToken(req)
      .then(token => this.verifyToken(token))
      .then(verifiedToken => this.createProject(req, verifiedToken))
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