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
    this.Bitmarket = new Bitmarket()
    Mongoose.connect(Env.MONGO_CONNECTION_STRING)
    Logger.info('Bot instance created')
  }
  init () {
    Logger.info('Bot Init, getting account info')
    this.Bitmarket.getInfo().then((data) => {
      this.accountInfo = data.account
      this.available = data.balances.available.PLN
      this.Calculator = new Calculator(this.accountInfo)
      this.start()
    })
  }
  start () {
    this.buyBtc()
    this.sellBtc()

    setTimeout(() => {
      this.start()
    }, 3000)
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
    Logger.info(`Check the status of orders`)
    this.Bitmarket.getSellPrice().then((sellPrice) => {
      // create orders
      this.createSellOrders(sellPrice)
    })
  }
  createSellOrders (sellPrice) {
    Order.findByStatusId(Env.STATUS_NEW, (error, newOrders) => {
      Logger.info(`Found ${newOrders.length} BUY orders`)
      newOrders.forEach(order => {
        Logger.info(`Checking order status: ${order.id} `)
        if (order.sellPrice > sellPrice) {
          Logger.success(`BTC bought ${order.id} now create sell order!`)
          this.Bitmarket.createSellOrder().then((sellPrice) => {
            order.status = Env.STATUS_BOUGHT
            order.save()
            this.profit += order.estimatedProfit
          })
        } else {
          const diff = order.sellPrice - sellPrice
          Logger.info(`Order #: ${order.id}, ${order.sellPrice} vs ${sellPrice} (${diff}) PLN`)
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
        Logger.error(`Estimated profit is too low: ${estimatedProfit}, skipping`)
        break;
      }
    }
  }
}

const Bot = new App()
Bot.init()
