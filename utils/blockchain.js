import axios from 'axios'
import { network } from '@/config'

async function getBaseUrl () {
  return network.name === 'testnet' ? 'https://liquality.io/testnet/electrs' : 'https://liquality.io/electrs'
}

async function getFees () {
  if (network.name === 'testnet') {
    return { slow: 1, average: 2, fast: 3 }
  } else {
    const result = await axios.get('https://mempool.space/api/v1/fees/recommended')
    return { slow: result.data.hourFee, average: result.data.halfHourFee, fast: result.data.fastestFee }
  }
}

async function getLatestBlock () {
  const baseUrl = await getBaseUrl()
  const result = await axios.get(`${baseUrl}/blocks`)
  const blocks = result.data
  return blocks[0]
}

async function getTransaction (hash) {
  const baseUrl = await getBaseUrl()
  const result = await axios.get(`${baseUrl}/tx/${hash}`)
  return result.data
}

async function getTransactions (address) {
  const baseUrl = await getBaseUrl()
  const result = await axios.get(`${baseUrl}/address/${address}/txs`)
  return result.data
}

async function getUtxos (address) {
  const baseUrl = await getBaseUrl()
  const result = await axios.get(`${baseUrl}/address/${address}/utxo`)
  return result.data
}

async function getBalance (address) {
  const utxos = await getUtxos(address)
  const balance = utxos.reduce((result, utxo) => result + utxo.value, 0) / 1e8
  return balance
}

async function sendRawTransaction (hex) {
  const baseUrl = await getBaseUrl()
  const result = await axios.post(`${baseUrl}/tx`, hex)
  return result.data
}

export { getLatestBlock, getTransaction, getTransactions, getUtxos, getBalance, getFees, sendRawTransaction }
