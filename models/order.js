const Env = require('../config/env')
const mongoose = require('mongoose')

const orderSchema = mongoose.Schema({
  id: {type: String, required: true, unique: true},
  cost: Number,
  buyPrice: Number,
  sellPrice: Number,
  size: Number,
  sizeAfterCommision: Number,
  commisionBuy: String,
  commisionSell: String,
  estimatedProfit: Number,
  dateCreated: String,
  dateFinished: String,
  allOrNothing: {type: Number, default: 1},
  status: {type: Number, default: Env.STATUS_NEW},
  market: {type: String, default: 'BTCPLN'}
})

orderSchema.statics.findByStatusId = function (statusId, callback) {
  return this.find({ status: statusId }, callback)
}

orderSchema.methods.saveUpdatedStatus = function (statusId, callback) {
  this.status = statusId
  this.save({}, callback)
}

module.exports = mongoose.model('Order', orderSchema)
