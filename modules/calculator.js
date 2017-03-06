const Env = require('../config/env.js')

class Calculator {
  constructor (accountInfo) {
    this.commissionMaker = accountInfo.commissionMaker
  }
  getSellPrice (buyPrice) {
    return buyPrice + Env.SELL_PRICE_MARGIN
  }
  getBayCommision (btcSize) {
    return btcSize * this.commissionMaker / 100
  }
  getSellCommision (plnValue) {
    return plnValue * this.commissionMaker / 100
  }
  getProfit (buySize, buyPrice, sellSize, sellPrice) {
    const buy = buySize * buyPrice;
    const sell = sellSize * sellPrice
    return sell - this.getSellCommision(sell) - buy
  }
}
module.exports = Calculator
