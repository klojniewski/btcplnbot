# btcplnbot

Simple trading bot to BitBay.net

## System requirements

- node.js > 7
- npm > 4
- MongoDB

## Installation

1. Rename `config/env.js-example` to `config/env.js`.
2. Create empty MongoDB database.
3. Change API keys, Exchange commision value and database link in `config/env.jg` file.
4. Run `npm install`.

## Running

`npm start`

## Running Webapp

`node webapp.js`

## Todo

- when creating BTC buy order, I'm calculating price on SELL price, check if my calculated price is lower than highest BUY Price
- save API response when creating ORDER
- add time & date to communicates
- extract front & backend from webapp
- use static file server
