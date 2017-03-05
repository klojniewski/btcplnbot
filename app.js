var Env = require('./config/env.js')
var async = require('async')
var winston = require('winston')
var mongoose = require('mongoose')

mongoose.connect(Env.MONGO_CONNECTION_STRING)

winston.add(winston.transports.File, { filename: 'app.log' })

winston.log('info', 'Getting available balance.')
