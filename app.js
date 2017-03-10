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
    Logger.bold('Bot instance created')
  }
  init () {
    Logger.info('Bot Init, getting account info')
    this.Bitbay.getPLNBalance().then(PLN => {
      this.available = PLN - Env.MONEY_LEFT
      this.Calculator = new Calculator()
      this.Creator = new OrderCreator(this.Calculator, Logger)
      this.start()
    })
  }
  start () {
    // this.Bitbay.getTrades().then((data) => {
    //   console.log(data.results)
    //   const trade = this.Bitbay.getTrade(94708, data.results)
    //   console.log(trade)
    // });
    // return;
    this.buyBtc()
    // this.sellBtc()

    // setTimeout(() => {
    //   this.start()
    // }, 3000)
  }
  buyBtc () {
    if (this.available > 1) {
        // check current price
      this.Bitbay.getBuyPrice().then((buyPrice) => {
        // create orders
        this.createBuyOrders(buyPrice)
      })
    } else {
      Logger.info(`Not enough money to buy BTC, current cash (${this.available})`)
    }
  }
  sellBtc () {
    Logger.info(`Check if order has been made`)

    this.Bitbay.getTrades().then((trades) => {
      Logger.info(`Fetched last ${trades.length} trades`)
      const tradesIds = trades.map(order => {
        return order.id
      })
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
  createSellOrders (sellPrice) {
  }
  createBuyOrders (currentPrice) {
    currentPrice = Math.floor(currentPrice)
    Logger.info(`Current BTC Price is: ${currentPrice} PLN`)
    const ordersToCreate = this.Creator.create(currentPrice, this.available)
    ordersToCreate.forEach(orderToCreate => {
      if (orderToCreate.estimatedProfit > 0) {
        this.Bitbay.createBuyOrder(orderToCreate).then((resp) => {
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
