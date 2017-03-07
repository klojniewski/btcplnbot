const Winston = require('winston')
const Env = require('../config/env')

class Log {
  constructor () {
    Winston.add(Winston.transports.File, { filename: Env.LOGFILE })
  }
  info (message) {
    Winston.info('info', message.yellow)
  }
  error (message) {
    Winston.error('error', message.red)
  }
  success (message) {
    Winston.log('success', message.green)
  }
  extra (message) {
    Winston.info('info', message.rainbow)
  }
  bold (message) {
    Winston.info('info', message.red.bold)
  }
}
module.exports = Log
