import * as base58 from 'bs58'
import * as bjs from 'bitcoinjs-lib'
import * as varuint from 'bip174/src/lib/converter/varint'
import * as classify from 'bitcoinjs-lib/src/classify'
import * as bitcoinMessage from 'bitcoinjs-message'

const ADDR_TYPES = {
  P2PKH: 'P2PKH',
  P2SH: 'P2SH',
  P2WPKH: 'P2WPKH',
  P2WSH: 'P2WSH',
  UNKNOWN: 'UNKNOWN'
}

function getAddressType (address) {
  // bech32
  if (Object.keys(bjs.networks).find(network => address.startsWith(bjs.networks[network].bech32))) {
    return address.length > 42 ? ADDR_TYPES.P2WSH : ADDR_TYPES.P2WPKH
  }
  // base58
  const prefix = base58.decode(address).toString('hex').substring(0, 2)
  if (Object.keys(bjs.networks).find(network => Buffer.from([bjs.networks[network].scriptHash]).toString('hex') === prefix)) {
    return ADDR_TYPES.P2SH
  }
  if (Object.keys(bjs.networks).find(network => Buffer.from([bjs.networks[network].pubKeyHash]).toString('hex') === prefix)) {
    return ADDR_TYPES.P2PKH
  }
  return ADDR_TYPES.UNKNOWN
}

function verifyMessage (message, address, sig) {
  try {
    return bitcoinMessage.verify(message, address, Buffer.from(sig, 'hex'), '\u0018Bitcoin Signed Message:\n', true)
  } catch (e) {
    console.warn(e)
    return false
  }
}

function verifyScript (address, script) {
  const addressType = getAddressType(address)
  const output = bjs.script.fromASM(script)
  const network = bjs.networks.testnet
  let payment
  try {
    if (addressType === ADDR_TYPES.P2WSH) {
      payment = bjs.payments.p2wsh({ redeem: { output, network } }, network)
    }
    if (addressType === ADDR_TYPES.P2SH) {
      payment = bjs.payments.p2sh({ redeem: { output, network } }, network)
    }
    // TODO wrapped segwit (p2sh(p2wsh))
    return payment && payment.address === address
  } catch (e) { }
  return false
}

function getPubKeyHash (address) {
  const outputScript = bjs.address.toOutputScript(address, bjs.networks.testnet)
  const type = classify.output(outputScript)
  if (![classify.types.P2PKH, classify.types.P2WPKH].includes(type)) {
    throw new Error('Not possible to derive public key hash.')
  }

  try {
    const bech32 = bjs.address.fromBech32(address)
    return bech32.data
  } catch (e) {
    const base58 = bjs.address.fromBase58Check(address)
    return base58.hash
  }
}

function getScriptAddress (scriptOutput) {
  const network = bjs.networks.testnet
  return bjs.payments.p2wsh({ redeem: { output: scriptOutput }, network }, { network }).address
}

function getByteCount (inputs, outputs) {
  var totalWeight = 0
  var hasWitness = false
  var inputCount = 0
  var outputCount = 0
  // assumes compressed pubkeys in all cases.
  const types = {
    inputs: {
      'MULTISIG-P2SH': 49 * 4,
      'MULTISIG-P2WSH': 6 + (41 * 4),
      'MULTISIG-P2SH-P2WSH': 6 + (76 * 4),
      'TIMELOCK-P2WSH': 6 + (41 * 4),
      P2PKH: 148 * 4,
      P2WPKH: 108 + (41 * 4),
      'P2SH-P2WPKH': 108 + (64 * 4)
    },
    outputs: {
      P2SH: 32 * 4,
      P2PKH: 34 * 4,
      P2WPKH: 31 * 4,
      P2WSH: 43 * 4
    }
  }

  function checkUInt53 (n) {
    if (n < 0 || n > Number.MAX_SAFE_INTEGER || n % 1 !== 0) throw new RangeError('value out of range')
  }

  function varIntLength (number) {
    checkUInt53(number)

    return (
      number < 0xfd ? 1
        : number <= 0xffff ? 3
          : number <= 0xffffffff ? 5
            : 9
    )
  }

  Object.keys(inputs).forEach(function (key) {
    checkUInt53(inputs[key])
    if (key === 'TIMELOCK-P2WSH') {
      const multiplyer = 1 // TODO: 4 for legacy
      totalWeight += ((73 * 1) + (34 * 1)) * multiplyer * inputs[key]
      totalWeight += types.inputs[key] * inputs[key]
      totalWeight += 30 // bcuz y not
    } else if (key.slice(0, 8) === 'MULTISIG') {
      // ex. "MULTISIG-P2SH:2-3" would mean 2 of 3 P2SH MULTISIG
      const keyParts = key.split(':')
      if (keyParts.length !== 2) throw new Error('invalid input: ' + key)
      const newKey = keyParts[0]
      const mAndN = keyParts[1].split('-').map(function (item) { return parseInt(item) })

      totalWeight += types.inputs[newKey] * inputs[key]
      const multiplyer = (newKey === 'MULTISIG-P2SH') ? 4 : 1
      totalWeight += ((73 * mAndN[0]) + (34 * mAndN[1])) * multiplyer * inputs[key]
    } else {
      totalWeight += types.inputs[key] * inputs[key]
    }
    inputCount += inputs[key]
    if (key.indexOf('W') >= 0) hasWitness = true
  })

  Object.keys(outputs).forEach(function (key) {
    checkUInt53(outputs[key])
    totalWeight += types.outputs[key] * outputs[key]
    outputCount += outputs[key]
  })

  if (hasWitness) totalWeight += 2

  totalWeight += 8 * 4
  totalWeight += varIntLength(inputCount) * 4
  totalWeight += varIntLength(outputCount) * 4

  return Math.ceil(totalWeight / 4)
}

// TODO: This is copy pasta because it's not exported from bitcoinjs-lib
// https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/test/integration/csv.spec.ts#L477
function witnessStackToScriptWitness (witness) {
  let buffer = Buffer.allocUnsafe(0)

  function writeSlice (slice) {
    buffer = Buffer.concat([buffer, Buffer.from(slice)])
  }

  function writeVarInt (i) {
    const currentLen = buffer.length
    const varintLen = varuint.encodingLength(i)

    buffer = Buffer.concat([buffer, Buffer.allocUnsafe(varintLen)])
    varuint.encode(i, buffer, currentLen)
  }

  function writeVarSlice (slice) {
    writeVarInt(slice.length)
    writeSlice(slice)
  }

  function writeVector (vector) {
    writeVarInt(vector.length)
    vector.forEach(writeVarSlice)
  }

  writeVector(witness)

  return buffer
}

export { ADDR_TYPES, getAddressType, getPubKeyHash, getScriptAddress, verifyMessage, verifyScript, getByteCount, witnessStackToScriptWitness }
