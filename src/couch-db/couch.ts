import * as Nano  from 'nano'
const settingDB = require('../config/config').db,
   nano = require('nano')(`${settingDB.scheme}://${settingDB.login}:${settingDB.password}@${settingDB.server}:${settingDB.port}`);

export = nano