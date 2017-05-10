const Order = require('../models/order')

class OrderChecker {
  constructor (bitbay) {
    this.Bitbay = bitbay
  }
  getOrders (statusId, url = null) {
    return Promise.all([
      this.Bitbay.getOrders(url),
      Order.findByStatusId(statusId)
    ])
    .then(([marketOrders, databaseOrders]) => {
      const activeOrders = this.Bitbay.filterActiveOrders(marketOrders)
      const inActiveOrders = this.Bitbay.filterInActiveOrders(marketOrders)
      return {
        activeOrders,
        inActiveOrders,
        databaseOrders
      }
    })
  }
  checkIfOrderIsBought (inActiveOrders, orderId) {
    const boughtOrder = inActiveOrders.filter(({order_id: id, units}) => {
      return orderId === id && units === '0.00000000'
    })
    return !!boughtOrder.length
  }
  checkIfOrderIsActive (activeOrders, orderId) {
    return activeOrders.some(({order_id: id}) => id === orderId)
  }
  checkIfOrderIsInActive (inActiveOrders, orderId) {
    return inActiveOrders.some(({order_id: id}) => id === orderId)
  }
  getInactiveOrder (inActiveOrders, orderId) {
    const boughtOrder = inActiveOrders.filter(({order_id: id}) => {
      return orderId === id
    })
    return boughtOrder.length ? boughtOrder[0] : false
  }
}

module.exports = OrderChecker
