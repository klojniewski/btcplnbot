const mongoose = require('mongoose')

const requestlogSchema = mongoose.Schema({
  id: {type: String, required: true, unique: true},
  orderId: Number,
  dataSent: String,
  dataReceived: String,
  type: String,
  dateCreated: Number
})

module.exports = mongoose.model('Requestlog', requestlogSchema)
