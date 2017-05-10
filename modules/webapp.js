const Env = require('../config/env.js')
const Mongoose = require('mongoose')
const express = require('express')
const path = require('path')
const Order = require('../models/order')
const Bitbay = require('../modules/bitbay')
const Calculator = require('../modules/calculator')
const Creator = require('../modules/order-creator')

class WebApp {
  constructor () {
    Mongoose.connect(Env.MONGO_CONNECTION_STRING)
    Mongoose.Promise = global.Promise

    this.Bitbay = new Bitbay()
    this.Calculator = new Calculator()
    this.Creator = new Creator()
  }
  run () {
    const pathPrefix = path.join(`${__dirname}/../webapp/`)
    this.app = express()

    this.app.use(function (req, res, next) {
      res.header('Access-Control-Allow-Origin', '*')
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
      next()
    })

    this.app.get('/', function (req, res) {
      res.sendFile(pathPrefix + 'index.html')
    })

    this.app.get('/main.js', function (req, res) {
      res.sendFile(pathPrefix + 'main.js')
    })

    this.app.get('/vendor/fetch.js', function (req, res) {
      res.sendFile(pathPrefix + 'vendor/fetch.js')
    })

    this.app.get('/main.css', function (req, res) {
      res.sendFile(pathPrefix + 'main.css')
    })

    this.app.get('/get-info', (req, res) => {
      this.Bitbay.getInfo().then(response => {
        res.json(response)
      })
    })

    this.app.get('/calculate', (req, res) => {
      const ticker = this.Bitbay.getTicker().then(data => {// eslint-disable-line
        const volatility = this.Calculator.getVolatility(data.min, data.max, data.vwap)

        this.Bitbay.getPrice('buy').then(buyPrice => {
          const startPrice = this.Calculator.getStartPrice(buyPrice, volatility)
          const priceMargin = buyPrice - startPrice

          const sellMargin = priceMargin
          this.available = 100

          const { amountPerOrder, orderCount } = this.Creator.getAmountPerOrder(this.available, Env.ORDER_COUNT)
          const { orders: buyOrdersToCreate, messages } = this.Creator.getOrdersToCreateByStartPrice(startPrice, this.available, amountPerOrder, orderCount, sellMargin)

          res.json({
            priceMargin,
            buyPrice,
            startPrice,
            volatility,
            data,
            buyOrdersToCreate,
            messages
          })
        })
      })
    })

    this.app.get('/get-orders', function (req, res) {
      Order.find({}).sort({ dateCreated: -1 }).then(resp => {
        const responseHtml = [[], [], [], [], []]
        let profit = 0
        resp.forEach(order => {
          responseHtml[order.status - 1].push(order)
          if (order.status === Env.STATUS_SOLD) {
            profit += order.estimatedProfit
          }
        })
        res.json({
          new: responseHtml[0],
          bought: responseHtml[1],
          tobesold: responseHtml[2],
          sold: responseHtml[3],
          canceled: responseHtml[4],
          profit
        })
      })
    })

    this.app.get('/get-all', function (req, res) {
      Order.find({}).sort({ dateCreated: -1 }).then(resp => {
        res.json(resp)
      })
    })

    this.app.get('/cancel-order/:buyOrderId', (req, res) => {
      const buyOrderId = req.params.buyOrderId
      Order.findOne({
        buyOrderId,
        status: Env.STATUS_NEW
      }).then(orderToCancel => {
        if (orderToCancel) {
          this.Bitbay.cancelOrder(orderToCancel.buyOrderId).then(resp => {
            orderToCancel.saveUpdatedStatus(Env.STATUS_CANCELED)
            res.json(orderToCancel)
          })
        }
      })
    })

    this.app.listen(Env.WEBAPI_PORT, function () {
      console.log(`Webapp is running: http://localhost:${Env.WEBAPI_PORT}/`)
    })
  }
}

module.exports = WebApp
