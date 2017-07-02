const Env = require('../config/env.js')
const uuidV1 = require('uuid/v1')
const Calculator = require('./calculator')

class OrderCreator {
  constructor () {
    this.Calculator = new Calculator()
  }
  getAmountPerOrder (available, orderCount) {
    let amountPerOrder = available / orderCount

    while (amountPerOrder < Env.MINIMUM_ORDER_VALUE) {
      orderCount--
      amountPerOrder = available / orderCount
    }

    return {
      amountPerOrder,
      orderCount
    }
  }
  getOrdersToCreate (orderParams) {
    const {
      currentPrice,
      orderCount,
      amountPerOrder,
      fee
     } = orderParams
    const orders = []
    const messages = this.getMessages(orderParams)

    for (let i = 0; i < orderCount; i++) {
      const buyPrice = Number(currentPrice - (i * Env.GAP_AMOUNT))
      const buySize = Number(amountPerOrder / buyPrice).toFixed(8)
      orders.push(this.createOrder(buyPrice, buySize, false, fee))
    }
    return {
      orders,
      messages
    }
  }
  getMessages (orderParams) {
    const {
      available,
      orderCount,
      amountPerOrder,
      currentPrice
    } = orderParams
    const messages = []

    messages.push(`Have ${available} PLN to invest.`)
    messages.push(`Will create ${orderCount} ${Env.TICKER} Buy Order(s) ${amountPerOrder} PLN each.`)
    messages.push(`${Env.TICKER} Buy Orders will start from ${currentPrice} PLN`)

    return messages
  }
  createOrder (buyPrice, buySize, sellMargin = false, fee = false) {
    const id = uuidV1()

    const buyOrderId = 0
    const buyCommision = Number(this.Calculator.getBuyCommision(buySize, fee)).toFixed(8)
    const buyValue = Number(buySize * buyPrice).toFixed(8)

    const sellOrderId = 0
    const sellPrice = this.Calculator.getSellPrice(buyPrice, sellMargin)
    const sellSize = buySize - buyCommision
    const sellCommision = this.Calculator.getSellCommision(sellPrice * sellSize, fee)
    const sellValue = Number(sellSize * sellPrice).toFixed(8)

    const estimatedProfit = this.Calculator.getProfit(buyValue, sellValue, fee)

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
      dateCreated: Math.floor(Date.now() / 1000),
      dateFinished: null,
      status: Env.STATUS_NEW,
      commisionRate: Number(fee || Env.COMMISION)
    }
  }
}

module.exports = OrderCreator
