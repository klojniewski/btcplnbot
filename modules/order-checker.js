const Env = require('../config/env.js')
const Order = require('../models/order')

class OrderChecker {
  constructor (Bitbay) {
    this.Bitbay = Bitbay
  }
  getOrders (statusId) {
    return Promise.all([
      this.Bitbay.getOrders(),
      Order.findByStatusId(statusId),
      this.Bitbay.getBuyPrice()
    ]).then(values => {
      const [ marketOrders, databaseOrders, buyPrice ] = values
      const activeOrders = this.Bitbay.filterActiveOrders(marketOrders)
      const inActiveOrders = this.Bitbay.filterInActiveOrders(marketOrders)
      return {
        orders: {
          activeOrders,
          inActiveOrders,
          databaseOrders
        },
        buyPrice
      }
    })
  }
}

module.exports = OrderChecker
