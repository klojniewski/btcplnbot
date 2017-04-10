const mongoose = require('mongoose')

const tickerSchema = mongoose.Schema({
  time: Number,
  bid: Number,
  ask: Number,
  vwap: Number
})

module.exports = mongoose.model('Ticker', tickerSchema)
