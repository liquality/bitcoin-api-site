const axios = require('axios')

const BASE_URL = '/api'

async function newShortLink (name, link) {
  const result = await axios.post(`${BASE_URL}/shortlink/new`, { name, link })
  return result.data
}

async function isShortLinkAvailable (name) {
  try {
    await axios.post(`${BASE_URL}/shortlink/available`, { name })
    return true
  } catch (e) {
    if (e.response.status === 400) {
      return false
    } else {
      throw e
    }
  }
}

export { newShortLink, isShortLinkAvailable }
