import coinSelect from 'coinselect'
import { getAddresses } from './wallet'
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

export { getInputs }
