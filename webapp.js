const Webapp = require('./modules/webapp')

class App {
  constructor () {
    this.webapp = new Webapp()
  }
  init () {
    this.webapp.run()
  }
}

const webapp = new App()
webapp.init()
