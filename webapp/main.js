/* globals Vue, moment, fetch, VueTables, window */
Vue.use(VueTables.client, {
  compileTemplates: true,
  filterByColumn: true,
  texts: {
    filter: 'Search:'
  },
  datepickerOptions: {
    showDropdowns: true
  }
})
const API_URL = `//${window.location.host}/`

const app = new Vue({// eslint-disable-line
  el: '#app',
  ready: function () {
    this.fetchData()

    setTimeout(() => {
      this.fetchData()
    }, 10 * 1000)
  },
  methods: {
    fetchData: function () {
      Promise.all([
        this.fetchRates(),
        this.fetchOrders(),
        this.fetchInfo()
      ]).then(values => {
        const [ratesResponse, ordersResponse, infoResponse] = values

        ratesResponse.json().then(data => {
          this.bitBay = data

          ordersResponse.json().then(this.parseOrders)
          infoResponse.json().then(this.parseInfo)
        })
      })
    },
    fetchRates: function () {
      return fetch('https://bitbay.net/API/Public/BTCPLN/ticker.json')
    },
    fetchOrders: function () {
      return fetch(API_URL + 'get-all')
    },
    fetchInfo: function () {
      return fetch(API_URL + 'get-info')
    },
    parseOrders: function (data) {
      let profit = 0
      let activeCount = 0
      let toBeSoldCount = 0
      let finishedCount = 0
      let canceledCount = 0
      data.map(object => {
        object.dateCreated = moment(new Date(Number(object.dateCreated) * 1000))
        object.dateFinished = moment(new Date(Number(object.dateFinished) * 1000))
        if (object.status === 4) {
          profit += object.estimatedProfit
          finishedCount++
        }
        if (object.status === 1) {
          activeCount++
        }
        if (object.status === 3) {
          toBeSoldCount++
        }
        if (object.status === 5) {
          canceledCount++
        }
        object.toBuy = this.bitBay.ask - object.buyPrice
        object.toSell = object.sellPrice - this.bitBay.bid
        return object
      })
      this.tableData = data
      this.profit = profit
      this.title = `[${Number(this.profit).toFixed(2)}] BTC PLN Bot`
      this.activeCount = activeCount
      this.toBeSoldCount = toBeSoldCount
      this.finishedCount = finishedCount
      this.canceledCount = canceledCount
    },
    parseInfo: function (data) {
      const invested = data.balances.PLN.locked
      this.invested = Number(invested).toFixed(2) + ' PLN'
      this.roi = Number(this.profit / invested * 100).toFixed(2) + '%'
    }
  },
  data: {
    bitBay: {},
    activeCount: 0,
    toBeSoldCount: 0,
    finishedCount: 0,
    canceledCount: 0,
    invested: 0,
    roi: 0,
    columns: ['buyPrice', 'toBuy', 'buySize', 'buyValue', 'sellPrice', 'toSell', 'sellSize', 'sellValue', 'estimatedProfit', 'status', 'dateCreated', 'dateFinished'],
    options: {
      toMomentFormat: true,
      perPage: 50,
      dateFormat: 'YYYY-MM-DD HH:mm',
      dateColumns: ['dateCreated', 'dateFinished'],
      headings: {
        buyPrice: 'Buy Price',
        buyValue: 'Buy Value',
        buySize: 'Buy Size',
        sellPrice: 'Sell Price',
        sellValue: 'Sell Value',
        sellSize: 'Sell Size'
      },
      templates: {
        buyPrice: item => {
          return `${item.buyPrice.toFixed(2)} PLN`
        },
        buyValue: item => {
          return `${item.buyValue.toFixed(2)} PLN`
        },
        buySize: item => {
          return `<span title="#${item.buyOrderId}">${item.buySize.toFixed(8)} BTC</span>`
        },
        toBuy: item => {
          return `${item.toBuy.toFixed(2)} PLN`
        },
        sellPrice: item => {
          return `${item.sellPrice.toFixed(2)} PLN`
        },
        sellValue: item => {
          return `${item.sellValue.toFixed(2)} PLN`
        },
        toSell: item => {
          return `${item.toSell.toFixed(2)} PLN`
        },
        sellSize: item => {
          return `<span title="#${item.sellOrderId}">${item.sellSize.toFixed(8)} BTC</span>`
        },
        estimatedProfit: item => {
          return `${item.estimatedProfit.toFixed(2)} PLN`
        }
      },
      listColumns: {
        status: [{
          id: 1,
          text: 'BTC to Buy'
        }, {
          id: 3,
          text: 'BTC to Sell'
        }, {
          id: 4,
          text: 'Sold'
        }, {
          id: 5,
          text: 'Canceled'
        }]
      }
    },
    tableData: [],
    profit: 0,
    title: 'BTC PLN BOT'
  }
})
