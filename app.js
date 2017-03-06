const Env = require('./config/env')
const Mongoose = require('mongoose')
const Log = require('./modules/log')
const Bitmarket = require('./modules/bitmarket')
const Calculator = require('./modules/calculator')
const uuid = require('uuid');
const Order = require('./models/order.js')
const colors = require('colors')

const Logger = new Log()

class App {
  constructor () {
    this.Bitmarket = new Bitmarket()
    this.Calculator = new Calculator()

    this.available = Env.AMOUNT_PLN
    Mongoose.connect(Env.MONGO_CONNECTION_STRING)

    Logger.info('Bot instance created')
  }
  init () {
    Logger.info('Bot Init')
    this.buyBtc()
    this.sellBtc()

    // setTimeout(() => {
    //   this.init()
    // }, 3000)
  }
  buyBtc () {
    if (this.available > 0) {
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
    Logger.info(`Check the status of orders `)
    this.Bitmarket.getBuyPrice().then((buyPrice) => {
      // create orders
      this.createSellOrders(buyPrice)
    })
  }
  createSellOrders (buyPrice) {
    Order.findByStatusId(Env.STATUS_NEW, (err, newOrders) => {
      Logger.info(`Found ${newOrders.length} BUY orders`)
      newOrders.forEach(order => {
        Logger.info(`Checking order status: ${order.id} `)
        if (order.buyPrice > buyPrice) {
          Logger.info(`BTC bought ${order.id} now create sell order!`)
          this.Bitmarket.createSellOrder().then((buyPrice) => {
            Logger.info(`Order #: ${order.id} has been bought`)
            order.status = Env.STATUS_BOUGHT
            order.save()
          })
        }
      })
    });
  }
  createBuyOrders (currentPrice) {
    Logger.info(`Current BTC Price is: ${currentPrice} PLN`)

    // get available money
    Logger.info(`Have ${this.available} to spent`)
    const amountPerOrder = this.available / Env.ORDER_COUNT
    Logger.info(`Will create ${Env.ORDER_COUNT} orders ${amountPerOrder} PLN each`)

    let startPrice = Math.floor(currentPrice)
    Logger.info(`Orders will start from ${startPrice} PLN`)
    for (let i = 0; i < Env.ORDER_COUNT; i++) {
      const orderPrice = Number(startPrice - (i * Env.GAP_AMOUNT))
      const size = Number(amountPerOrder / orderPrice).toFixed(10)
      const sizeAfterCommision = size - Number(this.Calculator.getBayCommision(size)).toFixed(10)
      const sellPrice = this.Calculator.getSellPrice(orderPrice)
      const estimatedProfit = this.Calculator.getProfit(size, orderPrice, sizeAfterCommision, sellPrice)
      const order = {
        buyPrice: orderPrice,
        sellPrice,
        size,
        sizeAfterCommision,
        estimatedProfit,
        dateCreated: new Date(),
        dateFinished: null,
        status: Env.STATUS_NEW
      }
      if (estimatedProfit > 0) {
        this.Bitmarket.createBuyOrder().then((buyPrice) => {
          this.available = this.available - amountPerOrder
          order.id = uuid.v1()// change to bitmarket order
          Logger.info(`Order created ${order.id}, cash left: ${this.available}`)
          Order(order).save(error => {
            if (error) {
              Logger.error(`Failed to create order ${order.id } with errro ${error}`)
              return
            }
          })
        })
      } else {
        Logger.error(`Estimated profit is too low: ${estimatedProfit}`)
      }
    }
  }
}

const Bot = new App()
Bot.init()
