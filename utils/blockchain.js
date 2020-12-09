const axios = require('axios')

const BASE_URL = 'https://blockstream.info/testnet/api'

async function getFees () {
  return { slow: 1, average: 2, fast: 3 }
  // mainnet: https://mempool.space/api/v1/fees/recommended
}

async function getLatestBlock () {
  const result = await axios.get(`${BASE_URL}/blocks`)
  const blocks = result.data
  return blocks[0]
  // TODO: make sure median time is used
}

async function getTransactions (address) {
  const result = await axios.get(`${BASE_URL}/address/${address}/txs`)
  return result.data
}

async function getUtxos (address) {
  const result = await axios.get(`${BASE_URL}/address/${address}/utxo`)
  return result.data
}

async function getBalance (address) {
  const utxos = await getUtxos(address)
  const balance = utxos.reduce((result, utxo) => result + utxo.value, 0) / 1e8
  return balance
}

async function sendRawTransaction (hex) {
  const result = await axios.post(`${BASE_URL}/tx`, hex)
  return result.data
}

export { getLatestBlock, getTransactions, getUtxos, getBalance, getFees, sendRawTransaction }
