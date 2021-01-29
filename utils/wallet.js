import BN from 'bignumber.js'
import coinSelect from 'coinselect'
import { getUtxos, getFees } from './blockchain'

async function getInputs (targets) {
  const maxAddresses = 500
  const addressesPerCall = 10
  let i = 0
  let utxos = []
  while (i < maxAddresses) {
    const externalAddresses = await getAddresses(i, addressesPerCall, false)
    const changeAddresses = await getAddresses(i, addressesPerCall, true)
    const allAddresses = [...externalAddresses, ...changeAddresses]

    const utxoPromises = allAddresses.map(address => getUtxos(address.address))
    const utxosResult = await Promise.all(utxoPromises)
    const utxoList = utxosResult.reduce((all, curr) => {
      return all.concat(curr)
    }, [])

    utxos = [...utxos, ...utxoList]

    const feeRate = (await getFees()).slow

    const { inputs, outputs } = coinSelect(utxos, targets, feeRate)

    if (inputs && inputs.length) {
      const changeOutputIndex = outputs.findIndex(output => !output.external)

      if (changeOutputIndex >= 0) {
        const changeAddress = (await getAddresses(0, 1, true))[0] // address reuse! naughty naughty! lol
        outputs[changeOutputIndex].address = changeAddress.address
      }

      return { inputs, outputs }
    }

    i += addressesPerCall
  }

  throw new Error('not enough balance')
}

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
    const addresses = await window.bitcoin.request({ method: 'wallet_getAddresses', params: [index, num, change] })
    return addresses.map(addr => ({ ...addr, publicKey: Buffer.from(addr.publicKey.data) }))
  } catch (e) {
    return []
  }
}

async function getAddresses (index = 0, num = 200, change = false) {
  await window.bitcoin.enable()
  return tryGetAddresses(index, num, change)
}

async function connect () {
  const addresses = await window.bitcoin.enable()
  // TODO: put back into CAL
  return addresses.map(addr => ({ ...addr, publicKey: Buffer.from(addr.publicKey.data) }))
}

export { connect, sendTransaction, signMessage, tryGetAddresses, getAddresses, getInputs }
