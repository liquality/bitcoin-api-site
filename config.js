import { networks } from 'bitcoinjs-lib'

const network = { name: 'mainnet', ...networks.bitcoin }
const MAINNET_URL = 'https://localhost:4000'
const TESTNET_URL = 'https://localhost:3000'

export { network, MAINNET_URL, TESTNET_URL }
