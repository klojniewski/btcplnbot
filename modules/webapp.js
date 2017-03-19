const Env = require('../config/env.js')
const Mongoose = require('mongoose')
const express = require('express')
const path = require('path')
const Order = require('../models/order')

class WebApp {
  constructor () {
    Mongoose.connect(Env.MONGO_CONNECTION_STRING)
    Mongoose.Promise = global.Promise
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
    this.app.listen(Env.WEBAPI_PORT, function () {
      console.log(`Webapp is running: http://localhost:${Env.WEBAPI_PORT}/`)
    })
    this.app.get('/main.js', function (req, res) {
      res.sendFile(pathPrefix + 'main.js')
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
  }
}

module.exports = WebApp
