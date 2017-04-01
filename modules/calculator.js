const Env = require('../config/env.js')

class Calculator {
  constructor () {
    this.commissionMaker = Env.COMMISION
    this.sellPriceMargin = Env.SELL_PRICE_MARGIN
  }
  getStartPrice (buyPrice, volatility) {
    return buyPrice - ((volatility / 4.2) * buyPrice)
  }
  getSellPrice (buyPrice, sellMargin) {
    return buyPrice + (sellMargin || this.sellPriceMargin)
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
  getVolatility (min, max, vwap) {
    const minVolatility = (vwap - min) / vwap
    const maxVolatility = (max - vwap) / vwap

    return minVolatility + maxVolatility
  }
}
module.exports = Calculator
