const Env = require('./config/env')
const Mongoose = require('mongoose')
const Log = require('./modules/log')
const Bitbay = require('./modules/Bitbay')
const Order = require('./models/order')
const colors = require('colors')// eslint-disable-line
const Logger = new Log()

class App {
  constructor () {
    Mongoose.connect(Env.MONGO_CONNECTION_STRING)
    Mongoose.Promise = global.Promise
    this.Bitbay = new Bitbay()
    Logger.bold('Delete Orders.')
  }
  init () {
    Order.findNew().then(activeOrders => {
      let orderNo = 1
      Logger.info(`Found ${activeOrders.length} Active Orders to Cancel.`)
      activeOrders.forEach(activeOrder => {
        setTimeout(() => {
          this.Bitbay.cancelOrder(activeOrder.buyOrderId).then(resp => {
            activeOrder.remove()
            Logger.info(`#${resp.order_id} was canceled.`)
          })
        }, orderNo++ * Env.API_TIMEOUT)
      })
    })
  }
}

const Deleter = new App()
Deleter.init()
