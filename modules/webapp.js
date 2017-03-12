const Env = require('../config/env.js')
const express = require('express')
const path = require('path')

class WebApp {
  constructor () {

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
  }
}

module.exports = WebApp
