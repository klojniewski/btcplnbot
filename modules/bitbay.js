const Env = require('../config/env')
const axios = require('axios')
const queryString = require('query-string')
const CryptoJS = require('crypto-js')

class Bitbay {
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
    }).then(function (response) {
      return response.data
    }).catch(error => {
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
    }).then(function (response) {
      return response.data
    }).catch(error => {
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
    }).then(function (response) {
      return response.data
    }).catch(error => {
      this.Logger.error(`Error when fetching account info ${error}`)
    })
  }
  getHistory () {
    const currency = 'BTC'
    const data = Object.assign({}, this.getBase('history'), {
      currency,
      limit: 20
    })
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
    const market = 'BTCPLN'
    const data = Object.assign({}, this.getBase('trades'), {
      count: Env.TRADES_COUNT,
      market
    })
    const postQueryString = queryString.stringify(data)

    return axios.post(Env.API_URL, postQueryString, {
      headers: this.getApiHeaders(postQueryString)
    }).then(function (response) {
      return response.data.data.results
    }).catch(error => {
      this.Logger.error(`Error when fetching account info ${error}`)
    })
  }
  getInfo () {
    const currency = 'PLN'
    const data = Object.assign({}, this.getBase('info'), {
      currency
    })
    const postQueryString = queryString.stringify(data)

    return axios.post(Env.API_URL, postQueryString, {
      headers: this.getApiHeaders(postQueryString)
    }).then(function (response) {
      if (!response.data.balances) {
        const error = `Error when fetching user info`
        return Promise.reject(error)
      }
      return response.data
    }).catch(error => {
      this.Logger.error(`Error when fetching user info: ${error}`)
    })
  }
  getPLNBalance () {
    const currency = 'PLN'
    const data = Object.assign({}, this.getBase('info'), {
      currency
    })
    const postQueryString = queryString.stringify(data)

    return axios.post(Env.API_URL, postQueryString, {
      headers: this.getApiHeaders(postQueryString)
    }).then(function (response) {
      if (!response.data.balances) {
        const error = `Error when fetching user PLN balance`
        return Promise.reject(error)
      }
      return response.data.balances.PLN
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
  getTicker () {
    return axios.get(Env.TICKER_URL)
      .then(function (response) {
        return response
      })
      .catch(error => {
        this.Logger.error(`Error when fetching ticker ${error}`)
      })
  }
  createBTCSellOrder (order) {
    const type = 'sell'
    const currency = 'BTC'
    const amount = order.sellSize
    const payment_currency = 'PLN'// eslint-disable-line
    const rate = order.sellPrice
    const data = Object.assign({}, this.getBase('trade'), {
      currency,
      payment_currency,// eslint-disable-line
      type,
      amount,
      rate
    })

    const postQueryString = queryString.stringify(data)

    return axios.post(Env.API_URL, postQueryString, {
      headers: this.getApiHeaders(postQueryString)
    }).then(response => {
      if (!response.data || !response.data.success) {
        const error = `Error when creating order, Error code: ${response.error || response.data.code}, ${response.errorMsg || response.data.message}`
        console.log('Data:', data)
        return Promise.reject(error)
      } else {
        return response.data
      }
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
  createBTCBuyOrder (order) {
    const currency = 'BTC'
    const payment_currency = 'PLN'// eslint-disable-line
    const type = 'buy'
    const amount = order.buySize
    const rate = order.buyPrice

    const data = Object.assign({}, this.getBase('trade'), {
      currency,
      payment_currency,// eslint-disable-line
      type,
      amount,
      rate
    })

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
