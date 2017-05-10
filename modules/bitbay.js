const Env = require('../config/env')
const axios = require('axios')
const queryString = require('query-string')
const CryptoJS = require('crypto-js')

class Bitbay {
  constructor (logger) {
    this.Logger = logger
  }
  getBase (method) {
    return { method, moment: this.getTimestamp() }
  }
  getTimestamp () {
    return Math.floor(new Date().getTime() / 1000)
  }
  getApiHeaders (postQueryString) {
    const signagure = CryptoJS.HmacSHA512(postQueryString, Env.KEY_PRIVATE)
    return {
      'API-Key': Env.KEY_PUBLIC,
      'API-Hash': signagure.toString()
    }
  }
  getOrders () {
    const data = Object.assign({}, this.getBase('orders'), {
      limit: Env.TRADES_COUNT
    })
    const postQueryString = queryString.stringify(data)

    return axios.post(Env.API_URL, postQueryString, {
      headers: this.getApiHeaders(postQueryString)
    })
    .then(({data}) => data)
    .catch(error => {
      this.Logger.error(`Error when fetching account info ${error}`)
    })
  }
  cancelOrder (orderId) {
    const data = Object.assign({}, this.getBase('cancel'), {
      id: orderId
    })
    const postQueryString = queryString.stringify(data)

    return axios.post(Env.API_URL, postQueryString, {
      headers: this.getApiHeaders(postQueryString)
    })
    .then(({data}) => data)
    .catch(error => {
      this.Logger.error(`Error when canceling the order ${error}`)
    })
  }
  getTransactions () {
    const market = 'BTC-PLN'
    const data = Object.assign({}, this.getBase('transactions'), {
      market
    })
    const postQueryString = queryString.stringify(data)

    return axios.post(Env.API_URL, postQueryString, {
      headers: this.getApiHeaders(postQueryString)
    })
    .then(({data}) => data)
    .catch(error => {
      this.Logger.error(`Error when fetching account info ${error}`)
    })
  }
  getHistory () {
    const params = {
      currency: 'BTC',
      limit: 20
    }
    const data = Object.assign({}, this.getBase('history'), params)
    const postQueryString = queryString.stringify(data)

    return axios.post(Env.API_URL, postQueryString, {
      headers: this.getApiHeaders(postQueryString)
    })
    .then(({data}) => data)
    .catch(error => {
      this.Logger.error(`Error when fetching account info ${error}`)
    })
  }
  getTrades () {
    const params = {
      count: Env.TRADES_COUNT,
      market: 'BTCPLN'
    }
    const data = Object.assign({}, this.getBase('trades'), params)
    const postQueryString = queryString.stringify(data)

    return axios.post(Env.API_URL, postQueryString, {
      headers: this.getApiHeaders(postQueryString)
    })
    .then(({data}) => {
      const { results } = data.data
      return results
    })
    .catch(error => {
      this.Logger.error(`Error when fetching account info ${error}`)
    })
  }
  getInfo () {
    const data = Object.assign({}, this.getBase('info'))
    const postQueryString = queryString.stringify(data)

    return axios.post(Env.API_URL, postQueryString, {
      headers: this.getApiHeaders(postQueryString)
    })
    .then(({data}) => {
      if (!data.balances) {
        const error = `Error when fetching user info`
        return Promise.reject(error)
      }
      return data
    })
    .catch(error => {
      this.Logger.error(`Error when fetching user info: ${error}`)
    })
  }
  getPLNBalance () {
    const params = {
      currency: 'PLN'
    }

    const data = Object.assign({}, this.getBase('info'), params)
    const postQueryString = queryString.stringify(data)

    return axios.post(Env.API_URL, postQueryString, {
      headers: this.getApiHeaders(postQueryString)
    })
    .then(({data}) => {
      const { balances } = data
      if (!balances) {
        const error = `Error when fetching user PLN balance`
        return Promise.reject(error)
      }
      return balances.PLN
    })
    .catch(error => {
      this.Logger.error(`Error when fetching user PLN balance: ${error}`)
    })
  }
  getPrice (type) {
    return axios.get(Env.TICKER_URL)
      .then(({data}) => {
        return type === 'buy'
          ? Number(data.ask)
          : type === 'sell'
            ? Number(data.bid)
          : null
      })
      .catch(error => {
        this.Logger.error(`Error when fetching ticker ${error}`)
      })
  }
  getTicker () {
    return axios.get(Env.TICKER_URL)
      .then(({data}) => data)
      .catch(error => {
        this.Logger.error(`Error when fetching ticker ${error}`)
      })
  }
  createBTCSellOrder (order) {
    const params = {
      currency: 'BTC',
      payment_currency: 'PLN',
      type: 'sell',
      amount: order.sellSize,
      rate: order.sellPrice
    }

    const data = Object.assign({}, this.getBase('trade'), params)
    const postQueryString = queryString.stringify(data)

    return axios.post(Env.API_URL, postQueryString, {
      headers: this.getApiHeaders(postQueryString)
    })
    .then(response => {
      const {
        data,
        error: errorCode,
        errorMsg
      } = response
      if (data && data.success) {
        return data
      } else {
        const error = `Error when creating order, Error code: ${errorCode || data.code}, ${errorMsg || data.message}`
        return Promise.reject(error)
      }
    })
    .catch(error => {
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
  createBTCBuyOrder (order) {
    const params = {
      currency: 'BTC',
      payment_currency: 'PLN',// eslint-disable-line
      type: 'buy',
      amount: order.buySize,
      rate: order.buyPrice
    }

    const data = Object.assign({}, this.getBase('trade'), params)
    const postQueryString = queryString.stringify(data)

    return axios.post(Env.API_URL, postQueryString, {
      headers: this.getApiHeaders(postQueryString)
    })
    .then(({data, error: errorStatus, errorMsg}) => {
      if (!data) {
        const error = `Error when creating order ${errorStatus}, ${errorMsg}`
        return Promise.reject(error)
      }
      return data
    })
    .catch(error => {
      this.Logger.error(error)
    })
  }
}
module.exports = Bitbay
