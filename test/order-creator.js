const test = require('ava')
const OrderCreator = require('../modules/order-creator')
const Env = require('../config/env')

const Creator = new OrderCreator()

const buyPrice = 4000
const buySize = 0.1
const commision = Env.COMMISION

const Order = Creator.createOrder(buyPrice, buySize)

test('Buy Price is set and its a number', t => {
  t.is(Order.buyPrice, buyPrice)
  t.true(Order.buyPrice > 0)
  t.is(typeof Order.buyPrice, 'number')
})

test('Buy Size is set and its a number', t => {
  t.is(Order.buySize, buySize)
  t.true(Order.buySize > 0)
  t.is(typeof Order.buySize, 'number')
})

test('BuyCommission is set', t => {
  t.is(Order.buyCommision, Number(buySize * commision / 100).toFixed(8))
  t.true(Order.buyCommision > 0)
})

test('BuyValue is set', t => {
  t.true(parseFloat(Order.buyValue) > 0)
  t.is(typeof parseFloat(Order.buyValue), 'number')
})

test('Sell Price is set and its a number', t => {
  t.true(Order.sellPrice > 0)
  t.is(typeof Order.sellPrice, 'number')
})

test('Sell Size is set and its a number', t => {
  t.true(Order.sellSize > 0)
  t.is(typeof Order.sellSize, 'number')
})

test('SellCommission is set', t => {
  t.true(Order.sellCommision > 0)
  t.is(Order.buyCommision, Number(buySize * commision / 100).toFixed(8))
})

test('SellValue is set', t => {
  t.true(parseFloat(Order.sellValue) > 0)
  t.is(typeof parseFloat(Order.sellValue), 'number')
})

test('Estimated profit is set', t => {
  t.true(Order.estimatedProfit > 0)
  t.is(typeof Order.estimatedProfit, 'number')
})

test('Status is set', t => {
  t.true(Order.status > 0)
  t.is(typeof Order.status, 'number')
})

test('Commision rate is set', t => {
  t.true(Order.commisionRate > 0)
  t.is(typeof Order.commisionRate, 'number')
})

test('getOrders needs to return at least 1 order', t => {
  const cash = 196000.43
  const price = 5071

  const ordersToCreate = Creator.getOrdersToCreate(price, cash)
  const { orders, messages } = ordersToCreate
  let ordersValue = 0
  let ordersProfit = 0

  t.is(orders.length > 0, true)
  t.is(messages.length > 0, true)

  orders.map(order => {
    ordersValue += parseFloat(order.buyValue)
    ordersProfit += parseFloat(order.estimatedProfit)
  })
  t.true(cash.toFixed(3) === ordersValue.toFixed(3))
  t.true(ordersProfit > 0, true)
})

test('getOrders needs to return orders with buyValue', t => {
  const cash = 12345
  const price = 1234
  const ordersToCreate = Creator.getOrdersToCreate(price, cash)
  const { orders, messages } = ordersToCreate

  t.is(orders.length > 0, true)
  t.is(messages.length > 0, true)

  const ordersValue = orders.reduce((sum, order) => {
    let newSum = sum += parseFloat(order.buyValue)
    return newSum
  }, 0)
  t.true(cash.toFixed(3) === ordersValue.toFixed(3), true)
})

test('getMessages needs to return an array', t => {
  const available = 10000
  const count = 20
  const amountPerOrder = 3000
  const startPrice = 8000
  const messages = Creator.getMessages(available, count, amountPerOrder, startPrice)

  t.true(messages instanceof Array, true)
})
