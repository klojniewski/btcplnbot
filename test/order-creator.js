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
  let ordersValue = 0
  let ordersProfit = 0
  const available = 12345
  const currentPrice = 1234
  const {
    amountPerOrder,
    orderCount
  } = Creator.getAmountPerOrder(available, Env.ORDER_COUNT)
  const orderParams = {
    currentPrice,
    available,
    amountPerOrder,
    orderCount
  }

  const ordersToCreate = Creator.getOrdersToCreate(orderParams)

  const { orders, messages } = ordersToCreate

  t.true(orders.length > 0)
  t.true(messages.length > 0)

  orders.map(order => {
    ordersValue += parseFloat(order.buyValue)
    ordersProfit += parseFloat(order.estimatedProfit)
  })
  t.true(available.toFixed(3) === ordersValue.toFixed(3))
  t.true(ordersProfit > 0, true)
})

test('getOrders needs to return orders with buyValue', t => {
  const available = 12345
  const currentPrice = 1234
  const { amountPerOrder, orderCount } = Creator.getAmountPerOrder(available, Env.ORDER_COUNT)
  const orderParams = {
    currentPrice,
    available,
    amountPerOrder,
    orderCount
  }

  const ordersToCreate = Creator.getOrdersToCreate(orderParams)

  const { orders, messages } = ordersToCreate

  t.true(orders.length > 0)
  t.true(messages.length > 0)

  const ordersValue = orders.reduce((sum, order) => {
    let newSum = sum += parseFloat(order.buyValue)
    return newSum
  }, 0)
  t.true(available.toFixed(3) === ordersValue.toFixed(3), true)
})

test('getMessages needs to return an array', t => {
  const available = 10000
  const currentPrice = 1234
  const { amountPerOrder, orderCount } = Creator.getAmountPerOrder(available, Env.ORDER_COUNT)
  const orderParams = {
    available,
    orderCount,
    amountPerOrder,
    currentPrice
  }
  const messages = Creator.getMessages(orderParams)

  t.true(messages instanceof Array, true)
})

test('getAmountPerOrder needs to return two objects', t => {
  const available = 10000
  const count = 20
  const { amountPerOrder, orderCount } = Creator.getAmountPerOrder(available, count)

  t.true(amountPerOrder > Env.MINIMUM_ORDER_VALUE, true)
  t.true(orderCount > 0, true)
})
