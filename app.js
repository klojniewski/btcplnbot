const Env = require('./config/env')
const Mongoose = require('mongoose')
const Log = require('./modules/log')
const Bitbay = require('./modules/Bitbay')
const Calculator = require('./modules/calculator')
const Order = require('./models/order')
const colors = require('colors')
const OrderCreator = require('./modules/order-creator')

const Logger = new Log()

class App {
  constructor () {
    this.profit = 0
    this.Bitbay = new Bitbay(Logger)
    Mongoose.connect(Env.MONGO_CONNECTION_STRING)
    Mongoose.Promise = global.Promise
    Logger.bold('Bot instance created')
  }
  init () {
    Logger.info('Bot Init, getting account info.')
    this.Bitbay.getPLNBalance().then(PLN => {
      this.available = PLN - Env.MONEY_LEFT
      this.Calculator = new Calculator()
      this.Creator = new OrderCreator(this.Calculator, Logger)
      this.start()
    })
  }
  start () {
    // this.buyBtc()
    // this.checkBTCBuyOrderStatus()
    this.createBTCSellOrders()

    // setTimeout(() => {
    //   this.start()
    // }, 3000)
  }
  buyBtc () {
    // buy only when cach available
    if (this.available > 1) {
        // check current price
      this.Bitbay.getBuyPrice().then((buyPrice) => {
        // create orders
        this.createBuyOrders(buyPrice)
      })
    } else {
      Logger.info(`Not enough money to buy BTC, current cash (${this.available}) PLN`)
    }
  }
  checkBTCBuyOrderStatus () {
    Logger.info(`Check if BTC Buy order(s) have been made.`)
    Promise.all([
      this.Bitbay.getOrders(),
      Order.findByStatusId(Env.STATUS_NEW),
      this.Bitbay.getBuyPrice()
    ]).then(values => {
      const [ marketOrders, databaseOrder, buyPrice ] = values
      const activeOrders = this.Bitbay.filterActiveOrders(marketOrders)
      const inActiveOrders = this.Bitbay.filterInActiveOrders(marketOrders)
      let lostOrders = []
      Logger.info(`Found ${databaseOrder.length} BTC buy order(s) to check.`)
      databaseOrder.forEach(dbOrder => {
        const dbOrderId = parseInt(dbOrder.id)
        const isActive = activeOrders.find(order => parseInt(order.order_id) === dbOrderId)
        const isInActive = inActiveOrders.find(order => parseInt(order.order_id) === dbOrderId)
        const isBought = this.Bitbay.findBoughtOrder(dbOrder, inActiveOrders)

        if (isBought) {
          Logger.success(`#${dbOrderId} has been bought! Changing order status`)
          dbOrder.saveUpdatedStatus(Env.STATUS_BOUGHT)
        } else if (isActive || isInActive) {
          const priceMargin = Number(dbOrder.buyPrice - buyPrice).toFixed(2)
          Logger.info(`#${dbOrderId} is waiting, ${dbOrder.buyPrice} vs ${buyPrice} (${priceMargin} PLN)`)
        } else {
          lostOrders.push(dbOrder)
        }
      })
      if (lostOrders.length) {
        const lostOrdersIds = lostOrders.map(order => order.id)
        Logger.error(`Lost ${lostOrders.length} orders: ${lostOrdersIds}`)
      }
    })
    return
    this.Bitbay.getOrders().then(trades => {
      const activeOrders = trades.filter(trade => trade.status === 'active')
      const inActiveOrders = trades.filter(trade => trade.status === 'inactive')

      Logger.info(`Currently you have ${trades.length} active order(s)`)
      Order.findByStatusId(Env.STATUS_NEW, (error, newOrders) => {
        Logger.info(`Found ${newOrders.length} pending BUY in DB`)
        let pendingOrderIds = []
        newOrders.forEach(order => {
          const orderTraded = tradesIds.indexOf(order.id) > -1
          if (orderTraded) {
            Logger.success(`Order status: ${order.id}: bought `)
            Logger.info(`Creating sell order `)
          } else {
            pendingOrderIds.push(parseInt(order.id, 10))
          }
        })
        return
        this.Bitbay.getOrders().then((orders) => {
          const buyOrdersIds = orders.map(order => {
            return order.id
          })
          let confirmedOrders = []
          let lostOrders = []
          pendingOrderIds.forEach(orderId => {
            const orderWaiting = buyOrdersIds.indexOf(orderId) > -1
            if (orderWaiting) {
              confirmedOrders.push(orderId)
            } else {
              lostOrders.push(orderId)
            }
          })
          if (confirmedOrders.length) {
            Logger.info(`Confirmed that ${confirmedOrders.length} are pending on the exchange`)
          }
          if (lostOrders.length) {
            Logger.error(`Lost ${lostOrders.length} orders: ${lostOrders.join(',')}`)
          }
        })
      })
    })
  }
  createBTCSellOrders () {
    Order.findByStatusId(Env.STATUS_BOUGHT).then(orders => {
      if (orders.length) {
        Logger.info(`Creating ${orders.length} BTC Sell Order(s)`)
        orders.forEach(order => {
          this.createBTCSellOrder(order)
        })
      }
    })
  }
  createBTCSellOrder (order) {
    Logger.info(`Creating BTC Sell Order #${order.id}`)
    this.Bitbay.createBTCSellOrder(order).then(response => {
      if (response.order_id) {
        // orderToCreate.id = resp.order_id  --> need to create sell_order_id
        order.saveUpdatedStatus(Env.STATUS_TOBESOLD, error => {
          if (error) {
            Logger.error(`Failed to create BTC Sell order ${response.order_id} with errro ${error}`)
          }
        })
      }
    })
  }
  createSellOrders (sellPrice) {
  }
  createBuyOrders (currentPrice) {
    currentPrice = Math.floor(currentPrice)
    Logger.info(`Current BTC Price is: ${currentPrice} PLN`)
    const ordersToCreate = this.Creator.create(currentPrice, this.available)
    ordersToCreate.forEach(orderToCreate => {
      if (orderToCreate.estimatedProfit > 0) {
        this.Bitbay.createBuyOrder(orderToCreate).then(resp => {
          if (resp.order_id) {
            this.available = this.available - orderToCreate.cost
            orderToCreate.id = resp.order_id
            Logger.info(`Order created ${orderToCreate.id}, cash left: ${this.available}`)
            Order(orderToCreate).save(error => {
              if (error) {
                Logger.error(`Failed to create order ${orderToCreate.id} with errro ${error}`)
              }
            })
          }
        })
      } else {
        Logger.error(`Estimated profit is too low: ${estimatedProfit}, skipping`)
      }
    })
  }
}

const Bot = new App()
Bot.init()
