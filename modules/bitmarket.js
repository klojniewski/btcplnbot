const Env = require('../config/env.js')
const axios = require('axios')

class BitMarket {
  constructor () {

  }
  getBuyPrice () {
    return axios.get(Env.TICKER_URL)
      .then(function (response) {
        return Number(response.data.ask)
      })
      .catch(function (error) {
        Winston.log('error', 'Error when fetching ticker', error)
      });
  }
  getSellPrice () {
    return axios.get(Env.TICKER_URL)
      .then(function (response) {
        return Number(response.data.bid)
      })
      .catch(function (error) {
        Winston.log('error', 'Error when fetching ticker', error)
      });
  }
  createSellOrder () {
    return axios.get(Env.TICKER_URL)
      .then(function (response) {
        return Number(response.data.bid)
      })
      .catch(function (error) {
        Winston.log('error', 'Error when fetching ticker', error)
      });
  }
  createBuyOrder () {
    return axios.get(Env.TICKER_URL)
      .then(function (response) {
        return Number(response.data.bid)
      })
      .catch(function (error) {
        Winston.log('error', 'Error when fetching ticker', error)
      });
  }
}
module.exports = BitMarket
