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
  getTransactions () {
    const method = 'transactions'
    const market = 'BTC-PLN'
    const data = {
      method,
      market,
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
  getHistory () {
    const method = 'history'
    const currency = 'BTC'
    const data = {
      method,
      currency,
      limit: 20,
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
  createBTCSellOrder (order) {
    const method = 'trade'
    const type = 'sell'
    const currency = 'BTC'
    const amount = order.sellSize
    const payment_currency = 'PLN'// eslint-disable-line
    const rate = order.sellPrice
    const data = {
      method,
      currency,
      payment_currency,// eslint-disable-line
      type,
      amount,
      rate,
      moment: this.time()
    }

    const postQueryString = queryString.stringify(data)

    return axios.post(Env.API_URL, postQueryString, {
      headers: this.getApiHeaders(postQueryString)
    }).then(response => {
      if (!response.data || !response.data.success) {
        const error = `Error when creating order ${response.error}, ${response.errorMsg}`
        return Promise.reject(error)
      }
      return response.data
    }).catch(error => {
      this.Logger.error(error)
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
  checkIfOrderIsBought (inActiveOrders, orderId) {
    const boughtOrder = inActiveOrders.filter(inActiveOrder => {
      return orderId === inActiveOrder.order_id &&
        inActiveOrder.units === '0.00000000'
    })
    return boughtOrder.length === 1
  }
  checkIfOrderIsActive (activeOrders, orderId) {
    return activeOrders.find(order => parseInt(order.order_id) === orderId)
  }
  checkIfOrderIsInActive (inActiveOrders, orderId) {
    return inActiveOrders.find(order => parseInt(order.order_id) === orderId)
  }
  createBTCBuyOrder (order) {
    const method = 'trade'
    const currency = 'BTC'
    const payment_currency = 'PLN'// eslint-disable-line
    const type = 'buy'
    const amount = order.buySize
    const rate = order.buyPrice
    const data = {
      method,
      currency,
      payment_currency,// eslint-disable-line
      type,
      amount,
      rate,
      moment: this.time()
    }

    const postQueryString = queryString.stringify(data)

    return axios.post(Env.API_URL, postQueryString, {
      headers: this.getApiHeaders(postQueryString)
    }).then(response => {
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
