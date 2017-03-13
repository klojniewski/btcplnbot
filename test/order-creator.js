const test = require('ava')
const OrderCreator = require('../modules/order-creator')
const Calculator = require('../modules/calculator')
const Env = require('../config/env')

const Calc = new Calculator()
const Logger = {
  info (message) {
    return ''
  },
  error (message) {
    return ''
  },
  success (message) {
    return ''
  },
  extra (message) {
    return ''
  },
  bold (message) {
    return ''
  }
}
const Creator = new OrderCreator(Calc, Logger, null)

const buyPrice = 4000
const buySize = 0.1
const commision = Env.COMMISION

const Order = Creator.createOrder(buyPrice, buySize)

test('Buy Price is set', t => {
  t.is(Order.buyPrice, buyPrice)
})

test('Buy Size is set', t => {
  t.is(Order.buySize, buySize)
})

test('BuyCommission test', t => {
  t.is(Order.buyCommision, Number(buySize * commision / 100).toFixed(8))
})

test('Sell Commision test', t => {
  t.is(Order.sellCommision > 0.0001, true)
})

test('Buy Size needs to be bigger than sell Size', t => {
  t.true(Order.buySize > Order.sellSize)
})

test('Estimated profit needs to be bigger than 0.001 PLN', t => {
  t.is(Order.estimatedProfit > 0.001, true)
})

test('getOrders needs to return at least 1 order', t => {
  t.is(Creator.getOrders(6000, 10000).length > 0, true)
})
