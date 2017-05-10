const Env = require('./config/env')
const Mongoose = require('mongoose')
const Log = require('./modules/log')
const Bitbay = require('./modules/bitbay')
const Order = require('./models/order')
const OrderCreator = require('./modules/order-creator')
const OrderChecker = require('./modules/order-checker')
const colors = require('colors')// eslint-disable-line

class App {
  constructor () {
    Mongoose.connect(Env.MONGO_CONNECTION_STRING)
    Mongoose.Promise = global.Promise
    this.Logger = new Log()
    this.Bitbay = new Bitbay(this.Logger)
    this.Checker = new OrderChecker(this.Bitbay)

    this.Logger.bold('Bot instance created.')
  }
  init () {
    this.Creator = new OrderCreator()
    this.earnMoney()
  }
  earnMoney () {
    this.createBTCBuyOrders()
    setTimeout(() => {
      this.checkOrderStatuses()
    }, 20 * 1000)
    setTimeout(() => {
      this.createBTCSellOrders()
    }, 30 * 1000)
    if (Env.IN_LOOP) {
      setTimeout(() => {
        this.Logger.bold('Another round.')
        this.earnMoney()
      }, 60 * 1000)
    }
  }
  checkOrderStatuses () {
    this.checkBTCBuyOrderStatus()
    setTimeout(() => {
      this.checkBTCSellOrderStatus()
    }, 5 * 1000)
  }
  createBTCBuyOrders () {
    this.Logger.info('Bot Init, getting account informations.')
    if (Env.IS_DEV) {
      return
    }
    Promise.all([
      this.Bitbay.getInfo(),
      Order.findActive()
    ]).then(values => {
      const [ accountInfo, activeOrders ] = values
      const balance = accountInfo.balances.PLN
      this.available = balance.available - Env.MONEY_LEFT
      if (activeOrders.length < Env.ACTIVE_ORDERS_LIMIT) {
        if (this.available > Env.MINIMUM_ORDER_VALUE) {
          // check current price
          this.Bitbay.getPrice('buy').then(buyPrice => {
            const { amountPerOrder, orderCount } = this.Creator.getAmountPerOrder(this.available, Env.ORDER_COUNT)
            const orderParams = {
              currentPrice: buyPrice,
              available: this.available,
              orderCount,
              amountPerOrder,
              fee: accountInfo.fee
            }
            const { orders: buyOrdersToCreate, messages } = this.Creator.getOrdersToCreate(orderParams)
            this.Logger.printMessages(messages, 'buy')
            buyOrdersToCreate.forEach((orderToCreate, iterationNo) => {
              if (orderToCreate.estimatedProfit > Env.MINIMUM_PROFIT) {
                setTimeout(() => {
                  this.Bitbay.createBTCBuyOrder(orderToCreate).then(resp => {
                    if (resp.order_id) {
                      this.available = this.available - orderToCreate.buyValue
                      orderToCreate.buyOrderId = resp.order_id
                      this.Logger.buy(`${iterationNo + 1} / ${orderCount} BTC Buy Order Created ${orderToCreate.buyOrderId}, cash left: ${this.available}.`)
                      Order(orderToCreate).save(error => {
                        if (error) {
                          this.Logger.error(`Failed to create BTC Buy Order ${orderToCreate.buyOrderId} with error ${error}.`)
                        }
                      })
                    }
                  })
                }, iterationNo * Env.API_TIMEOUT)
              } else {
                this.Logger.error(`Estimated profit is too low: ${orderToCreate.estimatedProfit}, skipping.`)
              }
            })
          })
        } else {
          const cash = Number(this.available).toFixed(2)
          this.Logger.buy(`Not enough cash to create BTC Buy Orders, current cash: ${cash} PLN.`)
        }
      }
    })
  }
  checkBTCBuyOrderStatus () {
    this.Logger.info(`Check if BTC Buy Order(s) have been made.`)

    Promise.all([
      this.Checker.getOrders(Env.STATUS_NEW),
      this.Bitbay.getPrice('buy')
    ]).then(values => {
      const { activeOrders, inActiveOrders, databaseOrders } = values[0]
      const buyPrice = values[1]
      let lostOrders = []
      if (databaseOrders.length) {
        this.Logger.info(`Found ${databaseOrders.length} BTC Buy Order(s) to check.`)
      } else {
        this.Logger.info(`No pending BTC Buy Orders to check.`)
        return
      }
      databaseOrders.forEach(databaseOrder => {
        const dbOrderId = databaseOrder.buyOrderId
        const isActive = this.Checker.checkIfOrderIsActive(activeOrders, dbOrderId)
        const isInActive = this.Checker.checkIfOrderIsInActive(inActiveOrders, dbOrderId)
        const isBought = this.Checker.checkIfOrderIsBought(inActiveOrders, dbOrderId)

        if (isBought) {
          this.Logger.success(`#${dbOrderId} has been bought! Changing order status.`)
          if (!Env.IS_DEV) {
            databaseOrder.saveUpdatedStatus(Env.STATUS_BOUGHT)
          }
        } else if (isActive) {
          const priceMargin = Number(databaseOrder.buyPrice - buyPrice).toFixed(2)
          this.Logger.info(`#${dbOrderId} is waiting, ${databaseOrder.buyPrice} vs ${buyPrice} (${priceMargin} PLN)`)
        } else if (isInActive) {
          this.Logger.info(`#${dbOrderId} found as INACTIVE.`)
          if (!Env.IS_DEV) {
            databaseOrder.apiResponseBuy = this.Checker.getInactiveOrder(inActiveOrders, dbOrderId)
            databaseOrder.saveUpdatedStatus(Env.STATUS_INACTIVE_BUY)
          }
        } else {
          lostOrders.push(databaseOrder)
        }
      })
      if (lostOrders.length) {
        const lostOrdersIds = lostOrders.map(order => order.buyOrderId)
        this.Logger.error(`Lost ${lostOrders.length} Orders: ${lostOrdersIds}`)
      }
    })
  }
  checkBTCSellOrderStatus () {
    this.Logger.sell(`Check if BTC Sell Order(s) have been sold.`)

    Promise.all([
      this.Checker.getOrders(Env.STATUS_TOBESOLD),
      this.Bitbay.getPrice('sell')
    ]).then(values => {
      const { activeOrders, inActiveOrders, databaseOrders } = values[0]
      const sellPrice = values[1]
      let lostOrders = []
      if (databaseOrders.length) {
        this.Logger.sell(`Found ${databaseOrders.length} BTC Sell Order(s) to check.`)
      } else {
        this.Logger.sell(`No pending BTC Sell Orders to check.`)
        return
      }
      databaseOrders.forEach(dbOrder => {
        const dbOrderId = dbOrder.sellOrderId
        const isActive = this.Checker.checkIfOrderIsActive(activeOrders, dbOrderId)
        const isInActive = this.Checker.checkIfOrderIsInActive(inActiveOrders, dbOrderId)
        const isSold = this.Checker.checkIfOrderIsBought(inActiveOrders, dbOrderId)

        if (isSold) {
          const profit = Number(dbOrder.estimatedProfit).toFixed(2)
          this.Logger.success(`#${dbOrderId} has been sold! Profit: ${profit} PLN. Changing Order status.`)
          if (!Env.IS_DEV) {
            dbOrder.saveUpdatedStatus(Env.STATUS_SOLD)
          }
        } else if (isActive) {
          const priceMargin = Number(dbOrder.sellPrice - sellPrice).toFixed(2)
          this.Logger.sell(`#${dbOrderId} is waiting, ${dbOrder.sellPrice} vs ${sellPrice} (${priceMargin} PLN)`)
        } else if (isInActive) {
          if (!Env.IS_DEV) {
            this.Logger.info(`#${dbOrderId} found as INACTIVE.`)
            dbOrder.apiResponseSell = this.Checker.getInactiveOrder(inActiveOrders, dbOrderId)
            dbOrder.saveUpdatedStatus(Env.STATUS_INACTIVE_SELL)
          }
        } else {
          lostOrders.push(dbOrder)
        }
      })
      if (lostOrders.length) {
        const lostOrdersIds = lostOrders.map(order => order.sellOrderId)
        this.Logger.error(`Lost ${lostOrders.length} BTC Sell Orders: ${lostOrdersIds}`)
      }
    })
  }
  createBTCSellOrders () {
    if (Env.IS_DEV) {
      return
    }
    Order.findByStatusId(Env.STATUS_BOUGHT).then(orders => {
      if (orders.length) {
        this.Logger.info(`Creating ${orders.length} BTC Sell Order(s)`)
        orders.forEach((order, iterationNo) => {
          setTimeout(() => {
            this.Logger.info(`${iterationNo + 1} / ${orders.length} Created BTC Sell Order #${order.buyOrderId}`)
            this.Bitbay.createBTCSellOrder(order).then(response => {
              if (response.order_id) {
                order.sellOrderId = response.order_id
                order.saveUpdatedStatus(Env.STATUS_TOBESOLD, error => {
                  if (error) {
                    this.Logger.error(`Failed to create BTC Sell order ${response.order_id} with errro ${error}`)
                  }
                })
              }
            })
          }, iterationNo * Env.API_TIMEOUT)
        })
      } else {
        this.Logger.info(`No pending BTC Sell Orders to create.`)
      }
    })
  }
}

const Bot = new App()
Bot.init()
