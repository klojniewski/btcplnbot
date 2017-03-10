const Env = require('../config/env')
const axios = require('axios')
const queryString = require('query-string')
const CryptoJS = require('crypto-js')

class BitMarket {
  constructor (Logger) {
    this.Logger = Logger
  }
  time () {
    return Math.floor(new Date().getTime() / 1000)
  }
  getApiHeaders (postQueryString) {
    const signagure = CryptoJS.HmacSHA512(postQueryString, Env.KEY_PRIVATE)
    return {
      'API-Key': Env.KEY_PUBLIC,
      'API-Hash': signagure.toString()
    }
  }
  getTrade (tradeId, tradesCollection) {
    return tradesCollection.filter(trade => {
      return trade.id === tradeId
    })[0]
  }
  getTrades () {
    const method = 'trades'
    const market = 'BTCPLN'
    const data = {
      method,
      count: Env.TRADES_COUNT,
      tonce: this.time(),
      market
    }
    const postQueryString = queryString.stringify(data)

    return axios.post(Env.API_URL, postQueryString, {
      headers: this.getApiHeaders(postQueryString)
    }).then(function (response) {
      return response.data.data.results
    }).catch(error => {
      this.Logger.error(`Error when fetching account info ${error}`)
    })
  }
  getOrders (type = 'buy') {
    const method = 'orders'
    const market = 'BTCPLN'
    const data = {
      method,
      tonce: this.time(),
      market
    }
    const postQueryString = queryString.stringify(data)

    return axios.post(Env.API_URL, postQueryString, {
      headers: this.getApiHeaders(postQueryString)
    }).then(function (response) {
      return response.data.data[type]
    }).catch(error => {
      this.Logger.error(`Error when fetching account info ${error}`)
    })
  }
  getInfo () {
    const method = 'info'
    const data = {
      method,
      tonce: this.time()
    }
    const postQueryString = queryString.stringify(data)

    return axios.post(Env.API_URL, postQueryString, {
      headers: this.getApiHeaders(postQueryString)
    }).then(function (response) {
      if (!response.data.data) {
        const error = `Error when fetching user info`
        return Promise.reject(error)
      }
      return response.data.data
    }).catch(error => {
      this.Logger.error(`Error when fetching account info ${error}`)
    })
  }
  getBuyPrice () {
    return axios.get(Env.TICKER_URL)
      .then(function (response) {
        return Number(response.data.ask)
      })
      .catch(error => {
        this.Logger.error(`Error when fetching ticker ${error}`)
      })
  }
  getSellPrice () {
    return axios.get(Env.TICKER_URL)
      .then(function (response) {
        return Number(response.data.bid)
      })
      .catch(error => {
        this.Logger.error(`Error when fetching ticker ${error}`)
      })
  }
  createSellOrder () {
    return axios.get(Env.TICKER_URL)
      .then(function (response) {
        return Number(response.data.bid)
      })
      .catch(error => {
        this.Logger.error(`Error when fetching ticker ${error}`)
      })
  }
  createBuyOrder (order) {
    const method = 'trade'
    const market = 'BTCPLN'
    const type = 'buy'
    const amount = parseFloat(order.size)
    const rate = order.buyPrice
    const allOrNothing = 0
    const data = {
      method,
      market,
      type,
      amount,
      rate,
      allOrNothing,
      tonce: this.time()
    }

    const postQueryString = queryString.stringify(data)

    return axios.post(Env.API_URL, postQueryString, {
      headers: this.getApiHeaders(postQueryString)
    }).then(response => {
      if (!response.data.data) {
        console.log(response)
        const error = `Error when creating order ${response.error}, ${response.errorMsg}`
        return Promise.reject(error)
      }
      return response.data.data
    }).catch(error => {
      console.log(error)
      this.Logger.error(error)
    })
  }
}
module.exports = BitMarket
