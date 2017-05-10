const Order = require('../models/order')

class OrderChecker {
  constructor (bitbay) {
    this.Bitbay = bitbay
  }
  getOrders (statusId) {
    return Promise.all([
      this.Bitbay.getOrders(),
      Order.findByStatusId(statusId)
    ]).then(values => {
      const [ marketOrders, databaseOrders ] = values
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
    const boughtOrder = inActiveOrders.filter(inActiveOrder => {
      return orderId === inActiveOrder.order_id &&
        inActiveOrder.units === '0.00000000'
    })
    return boughtOrder.length === 1
  }
  checkIfOrderIsActive (activeOrders, orderId) {
    return activeOrders.some(order => order.order_id === orderId)
  }
  checkIfOrderIsInActive (inActiveOrders, orderId) {
    return inActiveOrders.some(order => order.order_id === orderId)
  }
  getInactiveOrder (inActiveOrders, orderId) {
    const boughtOrder = inActiveOrders.filter(inActiveOrder => {
      return orderId === inActiveOrder.order_id
    })
    return boughtOrder.length ? boughtOrder[0] : false
  }
}

module.exports = OrderChecker
