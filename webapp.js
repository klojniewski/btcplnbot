const Webapp = require('./modules/webapp')
const StaticServer = require('./modules/server')

class App {
  constructor () {
    this.webapp = new Webapp()
    this.server = new StaticServer()
  }
  init () {
    this.webapp.run()
    this.server.run()
  }
}

const webapp = new App()
webapp.init()
