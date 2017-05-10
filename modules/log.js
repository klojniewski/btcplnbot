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
    Winston.info('success', message.green)
  }
  extra (message) {
    Winston.info('info', message.rainbow)
  }
  bold (message) {
    Winston.info('info', message.red.bold)
  }
  printMessages (messages, type = 'info') {
    messages.forEach(message => {
      type === 'buy' ? this.buy(message) : this.info(message)
    })
  }
  buy (message) {
    Winston.info('info', message.magenta)
  }
  sell (message) {
    Winston.info('info', message.cyan)
  }
}
module.exports = Log
