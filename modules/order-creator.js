const Env = require('../config/env.js')
const uuidV1 = require('uuid/v1')
const Calculator = require('./calculator')

class OrderCreator {
  constructor () {
    this.Calculator = new Calculator()
  }
  getOrdersToCreate (currentPrice, available) {
    const startPrice = currentPrice - Env.START_PRICE_MARGIN
    const orders = []
    const orderCount = Env.ORDER_COUNT
    const amountPerOrder = available / orderCount
    const messages = this.getMessages(available, orderCount, amountPerOrder, startPrice)
    for (let i = 0; i < orderCount; i++) {
      const buyPrice = Number(startPrice - (i * Env.GAP_AMOUNT))
      const buySize = Number(amountPerOrder / buyPrice).toFixed(8)
      orders.push(this.createOrder(buyPrice, buySize))
    }
    return {
      orders,
      messages
    }
  }
  getMessages (available, count, amountPerOrder, startPrice) {
    const messages = []
    messages.push(`Have ${available} PLN to invest.`)
    messages.push(`Will create ${count} BTC Buy Order(s) ${amountPerOrder} PLN each.`)
    messages.push(`BTC Buy Orders will start from ${startPrice} PLN`)
    return messages
  }
  createOrder (buyPrice, buySize) {
    const id = uuidV1()

    const buyOrderId = 0
    const buyCommision = Number(this.Calculator.getBuyCommision(buySize)).toFixed(8)
    const buyValue = Number(buySize * buyPrice).toFixed(8)

    const sellOrderId = 0
    const sellPrice = this.Calculator.getSellPrice(buyPrice)
    const sellSize = buySize - buyCommision
    const sellCommision = this.Calculator.getSellCommision(sellPrice * sellSize)
    const sellValue = Number(sellSize * sellPrice).toFixed(8)

    const estimatedProfit = this.Calculator.getProfit(buyValue, sellValue)

    return {
      id,
      buyOrderId,
      buyPrice,
      buySize,
      buyCommision,
      buyValue,
      sellOrderId,
      sellPrice,
      sellSize,
      sellCommision,
      sellValue,
      estimatedProfit,
      dateCreated: new Date(),
      dateFinished: null,
      status: Env.STATUS_NEW,
      commisionRate: Number(Env.COMMISION)
    }
  }
}

module.exports = OrderCreator
