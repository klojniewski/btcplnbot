const Env = require('../config/env.js')

class Calculator {
  constructor () {
    this.commissionMaker = Env.COMMISION
    this.sellPriceMargin = Env.SELL_PRICE_MARGIN
  }
  getStartPrice (buyPrice, volatility) {
    return buyPrice - ((volatility / 4.2) * buyPrice)
  }
  getSellPrice (buyPrice, sellMargin = null) {
    return buyPrice + (sellMargin || this.sellPriceMargin)
  }
  getBuyCommision (btcSize, fee = false) {
    return btcSize * (fee || this.commissionMaker) / 100
  }
  getSellCommision (plnValue, fee = false) {
    return plnValue * (fee || this.commissionMaker) / 100
  }
  getProfit (buyValue, sellValue, fee = false) {
    return sellValue - this.getSellCommision(sellValue, fee) - buyValue
  }
  getVolatility (min, max, vwap) {
    const minVolatility = (vwap - min) / vwap
    const maxVolatility = (max - vwap) / vwap

    return minVolatility + maxVolatility
  }
}
module.exports = Calculator
