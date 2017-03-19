const Env = require('../config/env')
const mongoose = require('mongoose')

const orderSchema = mongoose.Schema({
  id: {type: String, required: true, unique: true},
  buyOrderId: {type: Number, required: true, unique: true},
  buyPrice: Number,
  buySize: Number,
  buyCommision: Number,
  buyValue: Number,
  sellOrderId: {type: Number, default: 0},
  sellPrice: Number,
  sellSize: Number,
  sellCommision: Number,
  sellValue: Number,
  commisionRate: Number,
  estimatedProfit: Number,
  status: {type: Number, default: Env.STATUS_NEW},
  dateCreated: Number,
  dateFinished: Number
})

orderSchema.statics.findByStatusId = function (statusId, callback) {
  return this.find({ status: statusId }, callback).sort({ dateCreated: 1 })
}

orderSchema.statics.findActive = function (callback) {
  return this.find({ status: {$ne: Env.STATUS_SOLD} }, callback)
}

orderSchema.statics.findNew = function (callback) {
  return this.find({ status: Env.STATUS_NEW }, callback)
}

orderSchema.methods.saveUpdatedStatus = function (statusId, callback) {
  this.status = statusId
  if (statusId === Env.STATUS_SOLD || statusId === Env.STATUS_CANCELED) {
    this.dateFinished = Math.floor(Date.now() / 1000)
  }
  this.save({}, callback)
}

module.exports = mongoose.model('Order', orderSchema)
