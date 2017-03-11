const Env = require('../config/env')
const axios = require('axios')
const queryString = require('query-string')
const CryptoJS = require('crypto-js')

class Bitbay {
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
  getOrders () {
    const method = 'orders'
    const market = 'BTCPLN'
    const data = {
      method,
      limit: Env.TRADES_COUNT,
      moment: this.time()
    }
    const postQueryString = queryString.stringify(data)

    return axios.post(Env.API_URL, postQueryString, {
      headers: this.getApiHeaders(postQueryString)
    }).then(function (response) {
      return response.data
    }).catch(error => {
      this.Logger.error(`Error when fetching account info ${error}`)
    })
  }
  getTrades () {
    const method = 'trades'
    const market = 'BTCPLN'
    const data = {
      method,
      count: Env.TRADES_COUNT,
      moment: this.time(),
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
  getPLNBalance () {
    const method = 'info'
    const data = {
      method,
      currency: 'PLN',
      moment: this.time()
    }
    const postQueryString = queryString.stringify(data)

    return axios.post(Env.API_URL, postQueryString, {
      headers: this.getApiHeaders(postQueryString)
    }).then(function (response) {
      if (!response.data.balances) {
        const error = `Error when fetching user PLN balance`
        return Promise.reject(error)
      }
      return response.data.balances.PLN.available
    }).catch(error => {
      this.Logger.error(`Error when fetching user PLN balance: ${error}`)
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
  filterActiveOrders (orders) {
    return this.filterOrders(orders, 'active')
  }
  filterInActiveOrders (orders) {
    return this.filterOrders(orders, 'inactive')
  }
  filterOrders (orders, status) {
    return orders.filter(order => order.status === status)
  }
  createBuyOrder (order) {
    const method = 'trade'
    const currency = 'BTC'
    const type = 'buy'
    const amount = parseFloat(order.size)
    const rate = order.buyPrice
    const allOrNothing = 0
    const data = {
      method,
      currency,
      payment_currency: 'PLN',
      type,
      amount,
      rate,
      allOrNothing,
      moment: this.time()
    }

    const postQueryString = queryString.stringify(data)

    return axios.post(Env.API_URL, postQueryString, {
      headers: this.getApiHeaders(postQueryString)
    }).then(response => {
      console.log(response)
      if (!response.data) {
        const error = `Error when creating order ${response.error}, ${response.errorMsg}`
        return Promise.reject(error)
      }
      return response.data
    }).catch(error => {
      console.log(error)
      this.Logger.error(error)
    })
  }
}
module.exports = Bitbay
