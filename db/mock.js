const inActiveOrdersMock = [
  {
    order_id: 70847540,
    order_currency: 'BTC',
    order_date: '2017-03-14 15:10:31',
    payment_currency: 'PLN',
    type: 'bid',
    status: 'inactive',
    units: '0.00000000',
    start_units: '0.00471876',
    current_price: '23.68397550',
    start_price: 23.6839755036
  },
  {
    order_id: 70847530,
    order_currency: 'BTC',
    order_date: '2017-03-14 15:10:26',
    payment_currency: 'PLN',
    type: 'bid',
    status: 'inactive',
    units: '0.00471595',
    start_units: '0.00471595',
    current_price: '23.68401965',
    start_price: 23.6840196545
  }]

const activeOrdersMock = [
  {
    order_id: 70847540,
    order_currency: 'BTC',
    order_date: '2017-03-14 15:10:31',
    payment_currency: 'PLN',
    type: 'bid',
    status: 'active',
    units: '0.00000000',
    start_units: '0.00471876',
    current_price: '23.68397550',
    start_price: 23.6839755036
  },
  {
    order_id: 70847530,
    order_currency: 'BTC',
    order_date: '2017-03-14 15:10:26',
    payment_currency: 'PLN',
    type: 'bid',
    status: 'active',
    units: '0.00471595',
    start_units: '0.00471595',
    current_price: '23.68401965',
    start_price: 23.6840196545
  }]

const shuffleOrdersMock = [
  {
    order_id: 70847540,
    order_currency: 'BTC',
    order_date: '2017-03-14 15:10:31',
    payment_currency: 'PLN',
    type: 'bid',
    status: 'active',
    units: '0.00000000',
    start_units: '0.00471876',
    current_price: '23.68397550',
    start_price: 23.6839755036
  },
  {
    order_id: 70847530,
    order_currency: 'BTC',
    order_date: '2017-03-14 15:10:26',
    payment_currency: 'PLN',
    type: 'bid',
    status: 'inactive',
    units: '0.00471595',
    start_units: '0.00471595',
    current_price: '23.68401965',
    start_price: 23.6840196545
  },
  {
    order_id: 70847530,
    order_currency: 'BTC',
    order_date: '2017-03-14 15:10:26',
    payment_currency: 'PLN',
    type: 'bid',
    status: 'active',
    units: '0.00471595',
    start_units: '0.00471595',
    current_price: '23.68401965',
    start_price: 23.6840196545
  }]

module.exports = {
  inActiveOrdersMock,
  activeOrdersMock,
  shuffleOrdersMock
}
