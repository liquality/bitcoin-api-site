import BN from 'bignumber.js'

async function sendTransaction (address, amount) {
  await window.bitcoin.enable()
  return window.bitcoin.request({ method: 'wallet_sendTransaction', params: [address, BN(amount).times(1e8).toNumber()] })
}

async function signMessage (message, address) {
  await window.bitcoin.enable()
  return await window.bitcoin.request({ method: 'wallet_signMessage', params: [message, address] })
}

async function tryGetAddresses (index = 0, num = 200, change = false) {
  try {
    const addresses = await getAddresses(index, num, change)
    return addresses
  } catch (e) {
    return []
  }
}

async function getAddresses (index = 0, num = 200, change = false) {
  const addresses = await window.bitcoin.request({ method: 'wallet_getAddresses', params: [index, num, change] })
  // TODO: put conversion to hex back in the CAL
  return addresses.map(addr => ({ ...addr, publicKey: Buffer.from(addr.publicKey.data) }))
}

async function isWalletEnabled () {
  return (await tryGetAddresses(0, 1)).length > 0
}

export { isWalletEnabled, sendTransaction, signMessage, tryGetAddresses, getAddresses }
