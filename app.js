const Env = require('./config/env')
const Mongoose = require('mongoose')
const Log = require('./modules/log')
const Bitbay = require('./modules/Bitbay')
const Calculator = require('./modules/calculator')
const Order = require('./models/order')
const OrderCreator = require('./modules/order-creator')
const OrderChecker = require('./modules/order-checker')
const colors = require('colors')// eslint-disable-line
const Logger = new Log()

class App {
  constructor () {
    Mongoose.connect(Env.MONGO_CONNECTION_STRING)
    Mongoose.Promise = global.Promise
    this.Bitbay = new Bitbay()
    this.Checker = new OrderChecker(this.Bitbay)
    Logger.bold('Bot instance created.')
  }
  init () {
    this.Calculator = new Calculator()
    this.Creator = new OrderCreator()
    this.earnMoney()
  }
  earnMoney () {
    this.createBTCBuyOrders()
    setTimeout(() => {
      this.checkBTCBuyOrderStatus()
    }, 4 * 1000)
    setTimeout(() => {
      this.createBTCSellOrders()
    }, 6 * 1000)
    setTimeout(() => {
      this.checkBTCSellOrderStatus()
    }, 8 * 1000)
    if (Env.IN_LOOP) {
      setTimeout(() => {
        Logger.bold('Another round.')
        this.earnMoney()
      }, 60 * 1000)
    }
  }
  createBTCBuyOrders () {
    Logger.info('Bot Init, getting account informations.')
    Promise.all([
      this.Bitbay.getPLNBalance(),
      Order.findActive()
    ]).then(values => {
      const [ PLN, activeOrders ] = values
      this.available = PLN - Env.MONEY_LEFT
      if (activeOrders.length < Env.ACTIVE_ORDERS_LIMIT) {
        if (this.available > 1) {
          // check current price
          this.Bitbay.getBuyPrice().then(buyPrice => {
            // create orders
            let orderCount = 0
            const { buyOrdersToCreate, messages } = this.Creator.getOrdersToCreate(buyPrice, this.available)
            Logger.printMessages(messages)
            buyOrdersToCreate.forEach(orderToCreate => {
              if (orderToCreate.estimatedProfit > 0) {
                setTimeout(() => {
                  this.Bitbay.createBTCBuyOrder(orderToCreate).then(resp => {
                    if (resp.order_id) {
                      this.available = this.available - orderToCreate.buyValue
                      orderToCreate.buyOrderId = resp.order_id
                      Logger.info(`BTC Buy Order Created ${orderToCreate.buyOrderId}, cash left: ${this.available}.`)
                      Order(orderToCreate).save(error => {
                        if (error) {
                          Logger.error(`Failed to create BTC Buy Order ${orderToCreate.buyOrderId} with error ${error}.`)
                        }
                      })
                    }
                  })
                }, orderCount++ * 1500)
              } else {
                Logger.error(`Estimated profit is too low: ${orderToCreate.estimatedProfit}, skipping.`)
              }
            })
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

    Promise.all([
      this.Checker.getOrders(Env.STATUS_NEW),
      this.Bitbay.getBuyPrice()
    ]).then(values => {
      const { activeOrders, inActiveOrders, databaseOrders } = values[0]
      const buyPrice = values[1]
      let lostOrders = []
      if (databaseOrders.length) {
        Logger.info(`Found ${databaseOrders.length} BTC Buy Order(s) to check.`)
      } else {
        Logger.info(`No pending BTC Buy Orders to check.`)
        return
      }
      databaseOrders.forEach(databaseOrder => {
        const dbOrderId = databaseOrder.buyOrderId
        const isActive = this.Checker.checkIfOrderIsActive(activeOrders, dbOrderId)
        const isInActive = this.Checker.checkIfOrderIsInActive(inActiveOrders, dbOrderId)
        const isBought = this.Checker.checkIfOrderIsBought(inActiveOrders, dbOrderId)

        if (isBought) {
          Logger.success(`#${dbOrderId} has been bought! Changing order status.`)
          databaseOrder.saveUpdatedStatus(Env.STATUS_BOUGHT)
        } else if (isActive || isInActive) {
          const priceMargin = Number(databaseOrder.buyPrice - buyPrice).toFixed(2)
          Logger.info(`#${dbOrderId} is waiting, ${databaseOrder.buyPrice} vs ${buyPrice} (${priceMargin} PLN)`)
        } else {
          lostOrders.push(databaseOrder)
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

    Promise.all([
      this.Checker.getOrders(Env.STATUS_TOBESOLD),
      this.Bitbay.getBuyPrice()
    ]).then(values => {
      const { activeOrders, inActiveOrders, databaseOrders } = values[0]
      const buyPrice = values[1]
      let lostOrders = []
      if (databaseOrders.length) {
        Logger.info(`Found ${databaseOrders.length} BTC Sell Order(s) to check.`)
      } else {
        Logger.info(`No pending BTC Sell Orders to check.`)
        return
      }
      databaseOrders.forEach(dbOrder => {
        const dbOrderId = dbOrder.sellOrderId
        const isActive = this.Checker.checkIfOrderIsActive(activeOrders, dbOrderId)
        const isInActive = this.Checker.checkIfOrderIsInActive(inActiveOrders, dbOrderId)
        const isSold = this.Checker.checkIfOrderIsBought(inActiveOrders, dbOrderId)

        if (isSold) {
          const profit = Number(dbOrder.estimatedProfit).toFixed(2)
          Logger.success(`#${dbOrderId} has been sold! Profit: ${profit} PLN. Changing Order status.`)
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
          let orderCount = 0
          setTimeout(() => {
            Logger.info(`Creating BTC Sell Order #${order.buyOrderId}`)
            this.Bitbay.createBTCSellOrder(order).then(response => {
              if (response.order_id) {
                order.sellOrderId = response.order_id
                order.saveUpdatedStatus(Env.STATUS_TOBESOLD, error => {
                  if (error) {
                    Logger.error(`Failed to create BTC Sell order ${response.order_id} with errro ${error}`)
                  }
                })
              }
            })
          }, orderCount++ * 1500)
        })
      } else {
        Logger.info(`No pending BTC Sell Orders to create.`)
      }
    })
  }
}

const Bot = new App()
Bot.init()
