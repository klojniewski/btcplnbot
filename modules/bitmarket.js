const Env = require('../config/env')
const axios = require('axios')
const queryString = require('query-string')
const CryptoJS = require("crypto-js");
const Logger = require('../modules/log')

class BitMarket {
  constructor () {

  }
  time () {
    return Math.floor(new Date().getTime() / 1000);
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
        return response.data.data
      }).catch(function (error) {
        Logger.error(`Error when fetching account info ${error}`)
      });
  }
  getOrders () {
    const method = 'orders'
    const market = 'BTCPLN'
    const data = {
      method,
      tonce: this.time(),
      market,
    }
    const postQueryString = queryString.stringify(data)

    return axios.post(Env.API_URL, postQueryString, {
        headers: this.getApiHeaders(postQueryString)
      }).then(function (response) {
        return response.data.data
      }).catch(function (error) {
        Logger.error(`Error when fetching account info ${error}`)
      });
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
        return response.data.data
      }).catch(function (error) {
        Logger.error(`Error when fetching account info ${error}`)
      });
  }
  getBuyPrice () {
    return axios.get(Env.TICKER_URL)
      .then(function (response) {
        return Number(response.data.ask)
      })
      .catch(function (error) {
        Logger.error(`Error when fetching ticker ${error}`)
      });
  }
  getSellPrice () {
    return axios.get(Env.TICKER_URL)
      .then(function (response) {
        return Number(response.data.bid)
      })
      .catch(function (error) {
        Logger.error(`Error when fetching ticker ${error}`)
      });
  }
  createSellOrder () {
    return axios.get(Env.TICKER_URL)
      .then(function (response) {
        return Number(response.data.bid)
      })
      .catch(function (error) {
        Logger.error(`Error when fetching ticker ${error}`)
      });
  }
  createBuyOrder () {
    return axios.get(Env.TICKER_URL)
      .then(function (response) {
        return Number(response.data.bid)
      })
      .catch(function (error) {
        Logger.error(`Error when fetching ticker ${error}`)
      });
  }
}
module.exports = BitMarket
