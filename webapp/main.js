/* globals Vue, moment, fetch, VueTables, window, confirm, alert */
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

const webapp = new Vue({// eslint-disable-line
  el: '#app',
  ready: function () {
    this.fetchData()

    setInterval(() => {
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
    fetchRates: () => fetch('https://bitbay.net/API/Public/BTCPLN/ticker.json'),
    fetchOrders: () => fetch(API_URL + 'get-all'),
    fetchInfo: () => fetch(API_URL + 'get-info'),
    parseOrders: function (data) {
      let profit = 0
      let activeCount = 0
      let toBeSoldCount = 0
      let finishedCount = 0
      let canceledCount = 0
      let inactiveCount = 0
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
        if (object.status === 6 || object.status === 7) {
          inactiveCount++
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
      this.inactiveCount = inactiveCount
    },
    parseInfo: function (data) {
      const investedPLN = parseFloat(data.balances.PLN.locked)
      const investedBTC = parseFloat(data.balances.BTC.locked)
      const investedTotal = investedPLN + investedBTC * this.bitBay.bid
      const totalRoi = this.profit / investedTotal * 100
      const timeOfInvestment = moment().diff('2017-03-01', 'days', true)
      const dailyRoi = totalRoi / timeOfInvestment

      this.invested = Number(investedTotal).toFixed(2) + ' PLN'
      this.roi = Number(totalRoi).toFixed(2) + '%'
      this.yearRoi = Number(dailyRoi * 365).toFixed(2) + '%'
    },
    deleteMe: function (buyOrderId) {
      if (confirm('Are you sure?')) {
        fetch(API_URL + 'cancel-order/' + buyOrderId).then(resp => {
          resp.json().then(canceledOrder => {
            if (canceledOrder) {
              this.tableData = this.tableData.filter(tableItem => {
                return tableItem.buyOrderId !== canceledOrder.buyOrderId
              })
            } else {
              alert('Order not found')
            }
          })
        })
      }
    }
  },
  computed: {
    diff: function () {
      return this.bitBay.max - this.bitBay.min
    },
    volatility: function () {
      const minVolatility = 100 * (this.bitBay.vwap - this.bitBay.min) / this.bitBay.vwap
      const maxVolatility = 100 * (this.bitBay.max - this.bitBay.vwap) / this.bitBay.vwap

      return minVolatility + maxVolatility
    }
  },
  data: {
    bitBay: {},
    activeCount: 0,
    toBeSoldCount: 0,
    finishedCount: 0,
    canceledCount: 0,
    inactiveCount: 0,
    invested: 0,
    volatility: 0,
    roi: 0,
    yearRoi: 0,
    columns: ['buyPrice', 'toBuy', 'buySize', 'buyValue', 'sellPrice', 'toSell', 'sellSize', 'sellValue', 'estimatedProfit', 'status', 'dateCreated', 'dateFinished', 'delete'],
    options: {
      perPage: 50,
      dateFormat: 'YYYY-MM-DD HH:mm',
      dateColumns: ['dateCreated', 'dateFinished'],
      orderBy: {
        column: 'status',
        ascending: true
      },
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
        },
        delete: item => {
          return `<a href='javascript:void(0);' @click='$parent.deleteMe(${item.buyOrderId})'><i class='glyphicon glyphicon-remove-circle'></i></a>`
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
        }, {
          id: 6,
          text: 'Inactive Buy'
        }, {
          id: 7,
          text: 'Inactive Sell'
        }]
      }
    },
    tableData: [],
    profit: 0,
    title: 'BTC PLN BOT'
  }
})