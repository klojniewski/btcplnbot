const Env = require('../config/env.js')
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
  getInfo () {
    const method = 'info'
    const data = {
      method: 'info',
      tonce: this.time()
    }
    const postQueryString = queryString.stringify(data)
    const sign = CryptoJS.HmacSHA512(postQueryString, Env.KEY_PRIVATE)

    return axios.post(Env.API_URL, postQueryString, {
        headers: {
          'API-Key': Env.KEY_PUBLIC,
          'API-Hash': sign.toString()
        }
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
