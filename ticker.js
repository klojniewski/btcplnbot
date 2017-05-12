const Env = require('./config/env')
const Mongoose = require('mongoose')
const Log = require('./modules/log')
const Bitbay = require('./modules/bitbay')
const Ticker = require('./models/ticker')
const colors = require('colors')// eslint-disable-line

class App {
  constructor () {
    Mongoose.connect(Env.MONGO_CONNECTION_STRING)
    Mongoose.Promise = global.Promise
    this.Logger = new Log()
    this.Bitbay = new Bitbay(this.Logger)
    this.Logger.bold('Ticker instance created.')
  }
  init () {
    setInterval(() => {
      this.saveTicker()
    }, 60 * 1000)
  }
  saveTicker () {
    this.Bitbay.getTicker()
      .then(resp => {
        Ticker({
          bid: resp.bid,
          ask: resp.ask,
          vwap: resp.vwap,
          time: Math.floor(Date.now() / 1000)
        }).save(error => {
          if (error) {
            this.Logger.error(`Failed to save ticker data with error ${error}.`)
          }
        })
      })
  }
}

const tickerLogger = new App()
tickerLogger.init()
