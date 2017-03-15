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
    this.app.get('/', function (req, res) {
      res.sendFile(pathPrefix + 'index.html')
    })
    this.app.listen(Env.WEBAPP_PORT, function () {
      console.log(`Webapp is running: http://localhost:${Env.WEBAPP_PORT}/`)
    })
    this.app.get('/main.js', function (req, res) {
      res.sendFile(pathPrefix + 'main.js')
    })

    this.app.get('/get-orders', function (req, res) {
      Order.find({}).then(resp => {
        const responseHtml = [[], [], [], [], []]
        let profit = 0
        resp.forEach(order => {
          responseHtml[order.status - 1].push(`
            <tr>
              <td>${order.buyPrice || ''}</td>
              <td>${order.buySize}</td>
              <td>${order.buyCommision}</td>
              <td>${order.buyValue}</td>
              <td>${order.sellPrice}</td>
              <td>${order.sellSize}</td>
              <td>${order.sellCommision}</td>
              <td>${order.sellValue}</td>
              <td>${order.estimatedProfit}</td>
              <td>${order.dateCreated}</td>
              <td>${order.dateFinished || '-'}</td>
              <td>${order.commisionRate}</td>
            </tr>
          `)
          if (order.status === Env.STATUS_SOLD) {
            profit += order.estimatedProfit
          }
        })
        res.json({
          new: responseHtml[0].join(''),
          bought: responseHtml[1].join(''),
          tobesold: responseHtml[2].join(''),
          sold: responseHtml[3].join(''),
          profit
        })
      })
    })
  }
}

module.exports = WebApp
