/* globals Vue, moment, fetch, VueTables */
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
const API_URL = '//localhost:4000/'

const app = new Vue({// eslint-disable-line
  el: '#app',
  ready: function () {
    this.fetchOrders()
    setInterval(() => {
      this.fetchOrders()
    }, 6000)
    this.fetchInfo()
    setInterval(() => {
      this.fetchRates()
    }, 3000)
    this.fetchRates()
  },
  methods: {
    fetchRates: function () {
      fetch('https://bitbay.net/API/Public/BTCPLN/ticker.json').then(response => {
        response.json().then(data => {
          this.bitBay = data
        })
      })
    },
    fetchOrders: function () {
      fetch(API_URL + 'get-all').then(response => {
        response.json().then(data => {
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
            return object
          })
          this.tableData = data
          this.profit = profit
          this.title = `[${Number(this.profit).toFixed(2)}] BTC PLN Bot`
          this.activeCount = activeCount
          this.toBeSoldCount = toBeSoldCount
          this.finishedCount = finishedCount
          this.canceledCount = canceledCount
        })
      })
    },
    fetchInfo: function () {
      fetch(API_URL + 'get-info').then(response => {
        response.json().then(data => {
          const invested = data.balances.PLN.locked
          this.invested = Number(invested).toFixed(2) + ' PLN'
          this.roi = Number(this.profit / invested * 100).toFixed(2) + '%'
        })
      })
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
    columns: ['buyPrice', 'buySize', 'buyValue', 'sellPrice', 'sellSize', 'sellValue', 'estimatedProfit', 'status', 'dateCreated', 'dateFinished'],
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
        sellPrice: item => {
          return `${item.sellPrice.toFixed(2)} PLN`
        },
        sellValue: item => {
          return `${item.sellValue.toFixed(2)} PLN`
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
