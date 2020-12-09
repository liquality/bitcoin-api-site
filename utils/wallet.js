import BN from 'bignumber.js'

async function sendTransaction (address, amount) {
  await window.bitcoin.enable()
  return window.bitcoin.request({ method: 'wallet_sendTransaction', params: [address, BN(amount).times(1e8).toNumber()] })
}

async function signMessage (message, address) {
  await window.bitcoin.enable()
  return await window.bitcoin.request({ method: 'wallet_signMessage', params: [message, address] })
}

async function tryGetAddresses (num = 200, change = false) {
  try {
    const addresses = await window.bitcoin.request({ method: 'wallet_getAddresses', params: [0, num, change] })
    return addresses.map(addr => ({ ...addr, publicKey: Buffer.from(addr.publicKey.data) }))
  } catch (e) {
    return []
  }
}

async function getAddresses (num = 200, change = false) {
  await window.bitcoin.enable()
  return tryGetAddresses(num, change)
}

async function connect () {
  const addresses = await window.bitcoin.enable()
  // TODO: put back into CAL
  return addresses.map(addr => ({ ...addr, publicKey: Buffer.from(addr.publicKey.data) }))
}

export { connect, sendTransaction, signMessage, tryGetAddresses, getAddresses }
