const Env = require('../config/env.js')

class Calculator {
  constructor () {
    this.commissionMaker = Env.COMMISION
    this.sellPriceMargin = Env.SELL_PRICE_MARGIN
  }
  getSellPrice (buyPrice) {
    return buyPrice + this.sellPriceMargin
  }
  getBuyCommision (btcSize) {
    return btcSize * this.commissionMaker / 100
  }
  getSellCommision (plnValue) {
    return plnValue * this.commissionMaker / 100
  }
  getProfit (buyValue, sellValue) {
    return sellValue - this.getSellCommision(sellValue) - buyValue
  }
}
module.exports = Calculator
