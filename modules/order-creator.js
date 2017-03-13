const Env = require('../config/env.js')
const uuidV1 = require('uuid/v1')
const Order = require('../models/order')

class OrderCreator {
  constructor (Calculator, Logger, Bitbay) {
    this.Calculator = Calculator
    this.Logger = Logger
    this.Bitbay = Bitbay
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
      commisionRate: Env.COMMISION
    }
  }
  createBTCBuyOrders (currentPrice, cashAvailable) {
    currentPrice = Math.floor(currentPrice)
    this.Logger.info(`Current BTC ASK Price is: ${currentPrice} PLN, creating BTC Buy Orders.`)
    const ordersToCreate = this.getOrders(currentPrice, cashAvailable)
    ordersToCreate.forEach(orderToCreate => {
      if (orderToCreate.estimatedProfit > 0) {
        this.Bitbay.createBTCBuyOrder(orderToCreate).then(resp => {
          if (resp.order_id) {
            cashAvailable = cashAvailable - orderToCreate.buyValue
            orderToCreate.buyOrderId = resp.order_id
            this.Logger.info(`BTC Buy Order Created ${orderToCreate.buyOrderId}, cash left: ${cashAvailable}.`)
            Order(orderToCreate).save(error => {
              if (error) {
                this.Logger.error(`Failed to create BTC Buy Order ${orderToCreate.buyOrderId} with error ${error}.`)
              }
            })
          }
        })
      } else {
        this.Logger.error(`Estimated profit is too low: ${orderToCreate.estimatedProfit}, skipping.`)
      }
    })
  }
  createBTCSellOrder (order) {
    this.Logger.info(`Creating BTC Sell Order #${order.buyOrderId}`)
    this.Bitbay.createBTCSellOrder(order).then(response => {
      if (response.order_id) {
        order.sellOrderId = response.order_id
        order.saveUpdatedStatus(Env.STATUS_TOBESOLD, error => {
          if (error) {
            this.Logger.error(`Failed to create BTC Sell order ${response.order_id} with errro ${error}`)
          }
        })
      }
    })
  }
}

module.exports = OrderCreator
