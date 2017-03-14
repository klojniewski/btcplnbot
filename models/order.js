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
  dateCreated: String,
  dateFinished: String
})

orderSchema.statics.findByStatusId = function (statusId, callback) {
  return this.find({ status: statusId }, callback)
}

orderSchema.statics.findActive = function (callback) {
  return this.find({ status: {$ne: Env.STATUS_SOLD} }, callback)
}

orderSchema.statics.findNew = function (callback) {
  return this.find({ status: {$ne: Env.STATUS_NEW} }, callback)
}

orderSchema.methods.saveUpdatedStatus = function (statusId, callback) {
  this.status = statusId
  if (statusId === Env.STATUS_SOLD) {
    this.dateFinished = new Date()
  }
  this.save({}, callback)
}

module.exports = mongoose.model('Order', orderSchema)
