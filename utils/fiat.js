const axios = require('axios')
const memoize = require('memoizee')

const BASE_URL = 'https://api.coingecko.com/api/v3'

async function getFiatRate (currency) {
  const result = await axios.get(`${BASE_URL}/simple/price?ids=bitcoin&vs_currencies=${currency}`)
  return result.data.bitcoin[currency]
}

const getFiatRateCached = memoize(getFiatRate, { maxAge: 60 * 1000 })

export { getFiatRateCached as getFiatRate }
