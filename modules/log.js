const Winston = require('winston')
const Env = require('../config/env')

class Log {
  constructor () {
    Winston.add(Winston.transports.File, { filename: Env.LOGFILE })
  }
  info (message) {
    Winston.log('info', message.yellow)
  }
  error (message) {
    Winston.log('error', message.red)
  }
  success (message) {
    Winston.log('success', message.green)
  }
}
module.exports = Log
