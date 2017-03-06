const Env = require('./config/env.js')
const Winston = require('winston')
const Mongoose = require('mongoose')
const Bitmarket = require('./modules/bitmarket')
const Calculator = require('./modules/calculator')
const uuid = require('uuid');
const Order = require('./models/order.js')

class App {
  constructor () {
    this.Bitmarket = new Bitmarket()
    this.Calculator = new Calculator()

    this.available = Env.AMOUNT_PLN
    Mongoose.connect(Env.MONGO_CONNECTION_STRING)
    Winston.add(Winston.transports.File, { filename: Env.LOGFILE })
    Winston.log('info', 'Bot instance created')
  }
  init () {
    Winston.log('info', 'Bot Init')
    this.buyBtc()
    // this.sellBtc()

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
      Winston.log('info', `Not enough money to buy BTC, current cash (${this.available})`)
    }
  }
  sellBtc () {
    Winston.log('info', `Check the status of orders `)
    this.Bitmarket.getBuyPrice().then((buyPrice) => {
      // create orders
      this.createSellOrders(buyPrice)
    })
  }
  createSellOrders (buyPrice) {
    Order.findByStatusId(Env.STATUS_NEW, (err, newOrders) => {
      Winston.log('info', `Found ${newOrders.length} BUY orders`)
      newOrders.forEach(order => {
        Winston.log('info', `Checking order status: ${order.id} `)
        if (order.buyPrice > buyPrice) {
          Winston.log('info', `BTC bought ${order.id} now create sell order!`)
          this.Bitmarket.createSellOrder().then((buyPrice) => {
            Winston.log('info', `Order #: ${order.id} has been bought`)
            order.status = Env.STATUS_BOUGHT
            order.save()
          })
        }
      })
    });
  }
  createBuyOrders (currentPrice) {
    Winston.log('info', `Current BTC Price is: ${currentPrice}`)
    // get aviable money
    Winston.log('info', `Have ${this.available} to spent`)
    const amountPerOrder = this.available / Env.ORDER_COUNT
    Winston.log('info', `Will create ${Env.ORDER_COUNT} orders ${amountPerOrder} PLN each`)
    let startPrice = Math.floor(currentPrice)
    Winston.log('info', `Orders will start from ${startPrice} PLN`)
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
          Winston.log('info', `Order created ${order.id}, cash left: ${this.available}`)
          Order(order).save(error => {
            if (error) {
              Winston.log('error', 'Failed to create order' + order.id + ' with errro ' + error)
              return
            }
          })
        })
      } else {
        Winston.log('error', `Estimated profit is too low: ${estimatedProfit}`)
      }
    }
  }
}

const Bot = new App()
Bot.init()
