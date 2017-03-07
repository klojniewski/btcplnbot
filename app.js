const Env = require('./config/env')
const Mongoose = require('mongoose')
const Log = require('./modules/log')
const Bitmarket = require('./modules/bitmarket')
const Calculator = require('./modules/calculator')
const uuid = require('uuid');
const Order = require('./models/order')
const colors = require('colors')

const Logger = new Log()

class App {
  constructor () {
    this.profit = 0
    this.Bitmarket = new Bitmarket(Logger)
    Mongoose.connect(Env.MONGO_CONNECTION_STRING)
    Logger.bold('Bot instance created')
  }
  init () {
    Logger.info('Bot Init, getting account info')
    this.Bitmarket.getInfo().then((data) => {
      this.accountInfo = data.account
      this.available = data.balances.available.PLN - Env.MONEY_LEFT
      this.Calculator = new Calculator(this.accountInfo)
      this.start()
    })
  }
  start () {
    // this.Bitmarket.getTrades().then((data) => {
    //   console.log(data.results)
    //   const trade = this.Bitmarket.getTrade(94708, data.results)
    //   console.log(trade)
    // });
    // return;
    // this.buyBtc()
    this.sellBtc()

    // setTimeout(() => {
    //   this.start()
    // }, 3000)
  }
  buyBtc () {
    if (this.available > 1) {
        // check current price
        this.Bitmarket.getBuyPrice().then((buyPrice) => {
        // create orders
        this.createBuyOrders(buyPrice)
      })
    } else {
      Logger.info(`Not enough money to buy BTC, current cash (${this.available})`.red)
    }
  }
  sellBtc () {
    Logger.info(`Check if order has been made`)

    this.Bitmarket.getTrades().then((trades) => {
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
        this.Bitmarket.getOrders().then((orders) => {
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
      });
    })
  }
  createSellOrders (sellPrice) {
  }
  createBuyOrders (currentPrice) {
    Logger.info(`Current BTC Price is: ${currentPrice} PLN`)

    // get available money
    Logger.info(`Have ${this.available} to spent`)
    const amountPerOrder = this.available / Env.ORDER_COUNT
    Logger.info(`Will create ${Env.ORDER_COUNT} orders ${amountPerOrder} PLN each`)

    let startPrice = Math.floor(currentPrice) - Env.START_PRICE_MARGIN
    Logger.info(`Orders will start from ${startPrice} PLN`)
    for (let i = 0; i < Env.ORDER_COUNT; i++) {
      const orderPrice = Number(startPrice - (i * Env.GAP_AMOUNT))
      const size = Number(amountPerOrder / orderPrice).toFixed(8)
      const commisionBuy = Number(this.Calculator.getBayCommision(size)).toFixed(10)
      const sizeAfterCommision = size - commisionBuy
      const sellPrice = this.Calculator.getSellPrice(orderPrice)
      const commisionSell = this.Calculator.getSellCommision(sellPrice * sizeAfterCommision)
      const estimatedProfit = this.Calculator.getProfit(size, orderPrice, sizeAfterCommision, sellPrice)
      const order = {
        buyPrice: orderPrice,
        sellPrice,
        size,
        sizeAfterCommision,
        commisionBuy,
        commisionSell,
        estimatedProfit,
        dateCreated: new Date(),
        dateFinished: null,
        status: Env.STATUS_NEW
      }
      if (estimatedProfit > 0) {
        this.Bitmarket.createBuyOrder(order).then((resp) => {
          if (resp.id) {
            this.available = this.available - amountPerOrder
            order.id = resp.id
            Logger.info(`Order created ${order.id}, cash left: ${this.available}`)
            Order(order).save(error => {
              if (error) {
                Logger.error(`Failed to create order ${order.id } with errro ${error}`)
                return
              }
            })
          }
        })
      } else {
        Logger.error(`Estimated profit is too low: ${estimatedProfit}, skipping`)
        break
      }
    }
  }
}

const Bot = new App()
Bot.init()
