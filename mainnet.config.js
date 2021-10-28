import { networks } from 'bitcoinjs-lib'

const network = { name: 'mainnet', ...networks.bitcoin }

const MAINNET_URL = 'https://bitcoin-mainnet.liquality.io'
const TESTNET_URL = 'https://bitcoin.liquality.io'

export { network, MAINNET_URL, TESTNET_URL }
