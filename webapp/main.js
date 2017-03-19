/* globals Vue */
const API_URL = '//localhost:4000/'
const app = new Vue({// eslint-disable-line
  el: '#app',
  data: {
    title: 'BTCPLN Bot Dashboard',
    orders: {
      new: {},
      bought: {},
      tobesold: {},
      sold: {}
    },
    profit: ''
  },
  methods: {
    fetchData: function () {
      this.$http.get(API_URL + 'get-orders').then(response => {
        const data = response.body
        this.profit = data.profit.toFixed(2) + ' PLN'
        this.orders.new = data.new
        this.orders.bought = data.bought
        this.orders.tobesold = data.tobesold
        this.orders.sold = data.sold
      })
    }
  },
  created: function () {
    this.fetchData()

    setInterval(() => {
      this.fetchData()
    }, 6000)
  }
})

Vue.component('order-item', {
  props: ['order'],
  template: `
    <tr>
      <td>{{ order.buyPrice.toFixed(2) }} PLN</td>
      <td>{{ order.buySize.toFixed(6) }} BTC</td>
      <td>{{ order.buyValue.toFixed(2) }} PLN</td>
      <td>{{ order.sellPrice.toFixed(2) }} PLN </td>
      <td>{{ order.sellSize.toFixed(6) }} BTC</td>
      <td>{{ order.sellValue.toFixed(2) }} PLN</td>
      <td>{{ order.estimatedProfit.toFixed(2) }} PLN</td>
      <td>{{ order.dateCreated }}</td>
      <td>{{ order.dateFinished || '-' }}</td>
    </tr>
  `
})

Vue.component('table-header', {
  props: [],
  template: `
    <tr>
      <th>Buy Price</th>
      <th>Buy Size</th>
      <th>Buy Value</th>
      <th>Sell Price</th>
      <th>Sell Size</th>
      <th>Sell Value</th>
      <th>Profit</th>
      <th>Started</th>
      <th>Finished</th>
    </tr>`
})
