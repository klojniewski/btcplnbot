# Bitbay BTC Volatility Bot

Simple volatility trading bot for BitBay.net

## System requirements

- node.js > 7
- npm > 4
- MongoDB

## Installation

1. Rename `config/env.js-example` to `config/env.js`.
2. Update your envirionment configuration in `config/env.js`. If production change the `isDev` flag to false.
3. Create empty MongoDB database.
4. Import `orders` collection from the backup (db/orders.json). https://docs.mongodb.com/manual/reference/program/mongoexport/
5. Change API keys, Exchange commision value and database link in `config/env.jg` file.
6. Run `npm install`.

## Running

`npm start`

## Running Tests

`npm test`

## Running Webapp

`npm run webapp`

## Todo

- when creating BTC buy order, I'm calculating price on SELL price, check if my calculated price is lower than highest BUY Price
- save API response when creating ORDER
- add time & date to communicates
- extract front & backend from webapp
- use static file server
- move Math.floor(Date.now() / 1000) to utils.js
- add integration tests:
-- create order
-- cancel order
-- get history
-- get info
- support for TESTING API credimentials
- change current functions into pure functions (ex. remove Env injections)
- add formatting helpers in webapp (PLN, BTC)
- change getPLNBalance into getInfo method
- use fee balue from getInfo API endpoint
- ./main.css is not loading in webapp
- ROI calculation based on deposits history
- tests for Configuration (config/env.js)
