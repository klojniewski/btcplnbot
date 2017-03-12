const Env = require('../config/env.js')
const uuidV1 = require('uuid/v1')

class OrderCreator {
  constructor (Calculator, Logger) {
    this.Calculator = Calculator
    this.Logger = Logger
  }
  getOrders (currentPrice, available) {
    let startPrice = currentPrice - Env.START_PRICE_MARGIN
    let orders = []
    const amountPerOrder = available / Env.ORDER_COUNT
    this.Logger.info(`Have ${available} PLN to invest.`)
    this.Logger.info(`Will create ${Env.ORDER_COUNT} BTC Buy Order(s) ${amountPerOrder} PLN each.`)
    this.Logger.info(`BTC Buy Orders will start from ${startPrice} PLN`)
    for (let i = 0; i < Env.ORDER_COUNT; i++) {
      const buyPrice = Number(startPrice - (i * Env.GAP_AMOUNT))
      const buySize = Number(amountPerOrder / buyPrice).toFixed(8)
      orders.push(this.createOrder(buyPrice, buySize))
    }
    return orders
  }
  createOrder (buyPrice, buySize) {
    const id = uuidV1()

    const buyOrderId = 0
    const buyCommision = Number(this.Calculator.getBayCommision(buySize)).toFixed(8)
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
      commisionRate: Env.COMMISION
    }
  }
}

module.exports = OrderCreator
