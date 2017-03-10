const Env = require('../config/env.js')

class OrderCreator {
  constructor (Calculator, Logger) {
    this.Calculator = Calculator
    this.Logger = Logger
  }
  create (currentPrice, available) {
    let startPrice = currentPrice - Env.START_PRICE_MARGIN
    let orders = []
    const amountPerOrder = available / Env.ORDER_COUNT
    this.Logger.info(`Have ${available} to spent`)
    this.Logger.info(`Will create ${Env.ORDER_COUNT} orders ${amountPerOrder} PLN each`)
    this.Logger.info(`Orders will start from ${startPrice} PLN`)
    for (let i = 0; i < Env.ORDER_COUNT; i++) {
      const buyPrice = Number(startPrice - (i * Env.GAP_AMOUNT))
      const size = Number(amountPerOrder / buyPrice).toFixed(8)
      const commisionBuy = Number(this.Calculator.getBayCommision(size)).toFixed(8)
      const sizeAfterCommision = size - commisionBuy
      const sellPrice = this.Calculator.getSellPrice(buyPrice)
      const commisionSell = this.Calculator.getSellCommision(sellPrice * sizeAfterCommision)
      const cost = Number(size * buyPrice).toFixed(8)
      const estimatedProfit = this.Calculator.getProfit(size, buyPrice, sizeAfterCommision, sellPrice)
      orders.push({
        buyPrice,
        cost,
        sellPrice,
        size,
        sizeAfterCommision,
        commisionBuy,
        commisionSell,
        estimatedProfit,
        dateCreated: new Date(),
        dateFinished: null,
        status: Env.STATUS_NEW,
        commisionRate: Env.COMMISION
      })
    }
    return orders
  }
}
module.exports = OrderCreator
