const test = require('ava')
const Calculator = require('../modules/calculator')

const Calc = new Calculator()

const buyPrice = 4000
const sellPrice = 6000

test('Calculates sell price bigger than buyPrice', t => {
  t.is(Calc.getSellPrice(buyPrice) > buyPrice, true)
  t.is(typeof Calc.getSellPrice(buyPrice), 'number')
})

test('Calculates Buy commision that needs to be small', t => {
  t.is(Calc.getBuyCommision(buyPrice) < (buyPrice / 100), true)
  t.is(Calc.getBuyCommision(buyPrice) > 0, true)
  t.is(typeof Calc.getBuyCommision(buyPrice), 'number')
})

test('Calculates Sell commision that needs to be small', t => {
  t.is(Calc.getSellCommision(buyPrice) < (buyPrice / 100), true)
  t.is(Calc.getSellCommision(buyPrice) > 0, true)
  t.is(typeof Calc.getSellCommision(buyPrice), 'number')
})

test('Calculates profit that needs to exclude commision rate', t => {
  t.is(Calc.getProfit(buyPrice, sellPrice) < sellPrice - buyPrice, true)
  t.is(typeof Calc.getProfit(buyPrice, sellPrice), 'number')
})
