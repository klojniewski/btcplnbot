const Env = require('./config/env')
const Mongoose = require('mongoose')
const Log = require('./modules/log')
const Bitbay = require('./modules/Bitbay')
const Calculator = require('./modules/calculator')
const Order = require('./models/order')
const colors = require('colors')
const OrderCreator = require('./modules/order-creator')
const OrderChecker = require('./modules/order-checker')
const Logger = new Log()

class App {
  constructor () {
    Mongoose.connect(Env.MONGO_CONNECTION_STRING)
    Mongoose.Promise = global.Promise
    this.Bitbay = new Bitbay(Logger)
    this.Checker = new OrderChecker(this.Bitbay)
    Logger.bold('Bot instance created.')
  }
  init () {
    Logger.info('Bot Init, getting account informations.')
    this.Bitbay.getPLNBalance().then(PLN => {
      this.available = PLN - Env.MONEY_LEFT
      this.Calculator = new Calculator()
      this.Creator = new OrderCreator(this.Calculator, Logger, this.Bitbay)
      this.earnMoney()
    })
  }
  earnMoney () {
    this.createBTCBuyOrders()
    setTimeout(() => {
      this.checkBTCBuyOrderStatus()
    }, 2 * 1000)
    setTimeout(() => {
      this.createBTCSellOrders()
    }, 4 * 1000)
    setTimeout(() => {
      this.checkBTCSellOrderStatus()
    }, 6 * 1000)
    if (Env.IN_LOOP) {
      setTimeout(() => {
        Logger.bold('Another round.')
        this.earnMoney()
      }, 60 * 1000)
    }
  }
  createBTCBuyOrders () {
    Order.findActive().then(activeOrders => {
      if (activeOrders.length < Env.ACTIVE_ORDERS_LIMIT) {
        if (this.available > 1) {
          // check current price
          this.Bitbay.getBuyPrice().then(buyPrice => {
            // create orders
            this.Creator.createBTCBuyOrders(buyPrice, this.available)
          })
        } else {
          const cash = Number(this.available).toFixed(2)
          Logger.info(`Not enough cash to create BTC Buy Orders, current cash: ${cash} PLN.`)
        }
      }
    })
  }
  checkBTCBuyOrderStatus () {
    Logger.info(`Check if BTC Buy Order(s) have been made.`)
    this.Checker.getOrders(Env.STATUS_NEW).then(data => {
      const { activeOrders, inActiveOrders, databaseOrders } = data.orders
      const buyPrice = data.buyPrice
      let lostOrders = []
      if (databaseOrders.length) {
        Logger.info(`Found ${databaseOrders.length} BTC Buy Order(s) to check.`)
      } else {
        Logger.info(`No pending BTC Buy Orders to check.`)
        return
      }
      databaseOrders.forEach(dbOrder => {
        const dbOrderId = dbOrder.buyOrderId
        const isActive = this.Bitbay.checkIfOrderIsActive(activeOrders, dbOrderId)
        const isInActive = this.Bitbay.checkIfOrderIsInActive(inActiveOrders, dbOrderId)
        const isBought = this.Bitbay.checkIfOrderIsBought(inActiveOrders, dbOrderId)

        if (isBought) {
          Logger.success(`#${dbOrderId} has been bought! Changing Order status.`)
          dbOrder.saveUpdatedStatus(Env.STATUS_BOUGHT)
        } else if (isActive || isInActive) {
          const priceMargin = Number(dbOrder.buyPrice - buyPrice).toFixed(2)
          Logger.info(`#${dbOrderId} is waiting, ${dbOrder.buyPrice} vs ${buyPrice} (${priceMargin} PLN)`)
        } else {
          lostOrders.push(dbOrder)
        }
      })
      if (lostOrders.length) {
        const lostOrdersIds = lostOrders.map(order => order.buyOrderId)
        Logger.error(`Lost ${lostOrders.length} Orders: ${lostOrdersIds}`)
      }
    })
  }
  checkBTCSellOrderStatus () {
    Logger.info(`Check if BTC Sell Order(s) have been sold.`)

    this.Checker.getOrders(Env.STATUS_TOBESOLD).then(data => {
      const { activeOrders, inActiveOrders, databaseOrders } = data.orders
      const buyPrice = data.buyPrice
      let lostOrders = []
      if (databaseOrders.length) {
        Logger.info(`Found ${databaseOrders.length} BTC Sell Order(s) to check.`)
      } else {
        Logger.info(`No pending BTC Sell Orders to check.`)
        return
      }
      databaseOrders.forEach(dbOrder => {
        const dbOrderId = dbOrder.sellOrderId
        const isActive = this.Bitbay.checkIfOrderIsActive(activeOrders, dbOrderId)
        const isInActive = this.Bitbay.checkIfOrderIsInActive(inActiveOrders, dbOrderId)
        const isSold = this.Bitbay.checkIfOrderIsBought(inActiveOrders, dbOrderId)

        if (isSold) {
          const profit = Number(dbOrder.estimatedProfit).toFixed(2)
          Logger.success(`#${dbOrderId} has been sold! Profit: ${profit} PLN. Changing order status.`)
          dbOrder.saveUpdatedStatus(Env.STATUS_SOLD)
        } else if (isActive || isInActive) {
          const priceMargin = Number(dbOrder.buyPrice - buyPrice).toFixed(2)
          Logger.info(`#${dbOrderId} is waiting, ${dbOrder.sellPrice} vs ${buyPrice} (${priceMargin} PLN)`)
        } else {
          lostOrders.push(dbOrder)
        }
      })
      if (lostOrders.length) {
        const lostOrdersIds = lostOrders.map(order => order.buyOrderId)
        Logger.error(`Lost ${lostOrders.length} Orders: ${lostOrdersIds}`)
      }
    })
  }
  createBTCSellOrders () {
    Order.findByStatusId(Env.STATUS_BOUGHT).then(orders => {
      if (orders.length) {
        Logger.info(`Creating ${orders.length} BTC Sell Order(s)`)
        orders.forEach(order => {
          this.Creator.createBTCSellOrder(order)
        })
      } else {
        Logger.info(`No pending BTC Sell Orders to create.`)
      }
    })
  }
}

const Bot = new App()
Bot.init()
