const axios = require('axios')
const memoize = require('memoizee')

const BASE_URL = 'https://api.blockchain.info'

async function getRecommendedFees (address) {
  const result = await axios.get(`${BASE_URL}/mempool/fees`)
  return result.data
}

const getRecommendedFeesCached = memoize(getRecommendedFees, { maxAge: 60 * 1000 })

export { getRecommendedFeesCached as getRecommendedFees }
