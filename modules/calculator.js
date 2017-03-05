const Env = require('../config/env.js')

class Calculator {
  constructor () {

  }
  getSellPrice (buyPrice) {
    return buyPrice + Env.SELL_PRICE_MARGIN
  }
  getBayCommision (btcSize) {
    return btcSize * Env.COMMISION_BUY_MAKER / 100
  }
  getSellCommision (plnValue) {
    return plnValue * Env.COMMISION_SELL_MAKER / 100
  }
  getProfit (buySize, buyPrice, sellSize, sellPrice) {
    const buy = buySize * buyPrice;
    const sell = sellSize * sellPrice
    return sell - this.getSellCommision(sell) - buy
  }
}
module.exports = Calculator
