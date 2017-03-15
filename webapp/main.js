/* globals fetch */
const updateTables = function () {
  fetch('./get-orders')
    .then(
      function (response) {
        if (response.status !== 200) {
          console.log('Looks like there was a problem. Status Code: ' +
            response.status)
          return
        }

        // Examine the text in the response
        response.json().then(function (data) {
          document.querySelector('#new tbody').innerHTML = data.new
          document.querySelector('#bought tbody').innerHTML = data.bought
          document.querySelector('#to-be-sold tbody').innerHTML = data.tobesold
          document.querySelector('#sold tbody').innerHTML = data.sold

          document.querySelector('#sold h1 span').innerHTML = data.profit
        })
      }
    )
    .catch(function (err) {
      console.log('Fetch Error :-S', err)
    })
}

setInterval(() => {
  updateTables()
}, 5000)
