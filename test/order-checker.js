const test = require('ava')
const OrderChecker = require('../modules/order-checker')
const Bitbay = require('../modules/bitbay')
const Logger = require('../modules/log')
const Env = require('../config/env')
const Mongoose = require('mongoose')

const mockup = require('../db/mock')
const nock = require('nock')

const LoggerInstance = new Logger()
const BitbayInstance = new Bitbay(LoggerInstance)
const Checker = new OrderChecker(BitbayInstance)

const mockEndpoint = Env.API_URL

const {
  inActiveOrdersMock,
  activeOrdersMock,
  shuffleOrdersMock
 } = mockup

Mongoose.connect(Env.MONGO_CONNECTION_STRING)
Mongoose.Promise = global.Promise

nock(mockEndpoint)
  .post('')
  .reply(200, shuffleOrdersMock)

test('getOrders needs to return 3 objects', t => {
  return Checker.getOrders(Env.STATUS_NEW)
    .then(result => {
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
  const notPresentOrderId = 0

  t.is(typeof Checker.getInactiveOrder(inActiveOrdersMock, inActiveOrderId), 'object')
  t.is(Checker.getInactiveOrder(inActiveOrdersMock, notPresentOrderId), false)
})
