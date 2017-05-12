const Env = require('../config/env.js')
const Mongoose = require('mongoose')
const express = require('express')
const path = require('path')
const Order = require('../models/order')
const Bitbay = require('../modules/bitbay')
const Log = require('../modules/log')

class WebApp {
  constructor () {
    Mongoose.connect(Env.MONGO_CONNECTION_STRING)
    Mongoose.Promise = global.Promise
    this.Logger = new Log()
    this.Bitbay = new Bitbay(this.Logger)
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
