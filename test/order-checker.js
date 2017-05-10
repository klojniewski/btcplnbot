const test = require('ava')
const OrderChecker = require('../modules/order-checker')
const Bitbay = require('../modules/bitbay')
const Env = require('../config/env')
const Mongoose = require('mongoose')
const BitbayInstance = new Bitbay()
const Checker = new OrderChecker(BitbayInstance)

Mongoose.connect(Env.MONGO_CONNECTION_STRING)
Mongoose.Promise = global.Promise

const inActiveOrdersMock = [
  {
    order_id: 70847540,
    order_currency: 'BTC',
    order_date: '2017-03-14 15:10:31',
    payment_currency: 'PLN',
    type: 'bid',
    status: 'inactive',
    units: '0.00000000',
    start_units: '0.00471876',
    current_price: '23.68397550',
    start_price: 23.6839755036
  },
  {
    order_id: 70847530,
    order_currency: 'BTC',
    order_date: '2017-03-14 15:10:26',
    payment_currency: 'PLN',
    type: 'bid',
    status: 'inactive',
    units: '0.00471595',
    start_units: '0.00471595',
    current_price: '23.68401965',
    start_price: 23.6840196545
  }]

const activeOrdersMock = [
  {
    order_id: 70847540,
    order_currency: 'BTC',
    order_date: '2017-03-14 15:10:31',
    payment_currency: 'PLN',
    type: 'bid',
    status: 'active',
    units: '0.00000000',
    start_units: '0.00471876',
    current_price: '23.68397550',
    start_price: 23.6839755036
  },
  {
    order_id: 70847530,
    order_currency: 'BTC',
    order_date: '2017-03-14 15:10:26',
    payment_currency: 'PLN',
    type: 'bid',
    status: 'active',
    units: '0.00471595',
    start_units: '0.00471595',
    current_price: '23.68401965',
    start_price: 23.6840196545
  }]

test('getOrders needs to return 3 objects', t => {
  return Checker.getOrders(Env.STATUS_NEW).then(result => {
    const { activeOrders, inActiveOrders, databaseOrders } = result
    t.is(typeof activeOrders, 'object')
    t.is(typeof inActiveOrders, 'object')
    t.is(typeof databaseOrders, 'object')
    t.true(inActiveOrders.length > 0)
  })
})

test('checkIfOrderIsBought needs to return true or false', t => {
  const boughtOrderId = 70847540
  const notBoughtOrderId = 70847530
  const notPresentOrderId = 0
  t.is(Checker.checkIfOrderIsBought(inActiveOrdersMock, boughtOrderId), true)
  t.is(Checker.checkIfOrderIsBought(inActiveOrdersMock, notBoughtOrderId), false)
  t.is(Checker.checkIfOrderIsBought(inActiveOrdersMock, notPresentOrderId), false)
})

test('checkIfOrderIsActive needs to return true or false', t => {
  const activeOrderId = 70847540
  const notPresentOrderId = 0

  t.is(Checker.checkIfOrderIsActive(activeOrdersMock, activeOrderId), true)
  t.is(Checker.checkIfOrderIsActive(activeOrdersMock, notPresentOrderId), false)
})

test('checkIfOrderIsInActive needs to return true or false', t => {
  const inActiveOrderId = 70847540
  const notPresentOrderId = 0

  t.is(Checker.checkIfOrderIsInActive(inActiveOrdersMock, inActiveOrderId), true)
  t.is(Checker.checkIfOrderIsInActive(inActiveOrdersMock, notPresentOrderId), false)
})

test('check if getInactiveOrder returns an order', t => {
  const inActiveOrderId = 70847540

  t.is(typeof Checker.getInactiveOrder(inActiveOrdersMock, inActiveOrderId), 'object')
})
