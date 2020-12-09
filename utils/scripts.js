import * as bjs from 'bitcoinjs-lib'
import { getPubKeyHash, getByteCount, witnessStackToScriptWitness } from './bitcoin'
import { getLatestBlock, getUtxos, getFees, sendRawTransaction } from './blockchain'
import { tryGetAddresses } from './wallet'

const OPS = bjs.script.OPS

const SCRIPT_TYPES = {
  TIMELOCK: 'Timelock',
  MULTISIG: 'Multisig'
}

function decodeScript (script) {
  const timelockScript = timelock.decode(script)
  if (timelockScript) return { type: SCRIPT_TYPES.TIMELOCK, ...timelockScript }
  const multisigScript = multisig.decode(script)
  if (multisigScript) return { type: SCRIPT_TYPES.MULTISIG, ...multisigScript }
}

const multisig = {
  output (m, keys) {
    const network = bjs.networks.testnet
    return bjs.payments.p2ms({ network, m, pubkeys: keys.map(k => Buffer.from(k, 'hex')) }).output
  },
  decode (script) {
    const scriptStack = bjs.script.decompile(bjs.script.fromASM(script))
    const firstIsPushOp = scriptStack[0] >= OPS.OP_1 && scriptStack[0] <= OPS.OP_16
    const firstOpASM = bjs.script.toASM(Buffer.from([scriptStack[0]]))
    const m = parseInt(firstOpASM.replace('OP_', ''))
    if (!firstIsPushOp) return
    const publicKeys = scriptStack.filter(c => c.length === 33).map(c => c.toString('hex'))
    if (!publicKeys.length) return
    const nPushOp = bjs.script.toASM(Buffer.from([scriptStack[publicKeys.length + 1]]))
    const n = parseInt(nPushOp.replace('OP_', ''))
    if (n !== publicKeys.length) return // OP_X matches num publicKeys
    return {
      requiredKeys: m,
      totalKeys: n,
      publicKeys
    }
  },
  async canRedeem (address, script) {
    const scriptDetails = this.decode(script)
    try {
      const addresses = await tryGetAddresses(200, false)
      const walletPublicKeys = addresses.map(a => a.publicKey.toString('hex'))
      const walletContains = scriptDetails.publicKeys.some(pk => walletPublicKeys.includes(pk))
      const utxos = await getUtxos(address)
      return walletContains && utxos.length > 0 // Should not include unconfirmed
    } catch (e) {
      return false
    }
  },
  async createdRedeem (address, script, redeemAddress) {
    const scriptDetails = this.decode(script)
    const network = bjs.networks.testnet
    const utxos = await getUtxos(address)
    const utxo = utxos[0] // TODO: claim all
    if (!utxo) throw new Error('Nothing to redeem')

    const p2ms = bjs.payments.p2ms({ network, m: scriptDetails.requiredKeys, pubkeys: scriptDetails.publicKeys.map(k => Buffer.from(k, 'hex')) })
    const payment = bjs.payments.p2wsh({ redeem: p2ms, network }, { network })

    const psbt = new bjs.Psbt({ network })
    psbt.setVersion(2)
    psbt.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: {
        value: utxo.value,
        script: payment.output
      },
      witnessScript: payment.redeem.output
    })

    const byteCount = getByteCount({ [`MULTISIG-P2WSH:${scriptDetails.requiredKeys}-${scriptDetails.totalKeys}`]: 1 }, { P2WPKH: 1 })
    const feePerByte = (await getFees()).slow
    const fee = byteCount * feePerByte

    psbt.addOutput({
      address: redeemAddress,
      value: utxo.value - fee
    })

    return psbt.toBase64()
  },
  async signRedeem (psbtHex, signAddress) {
    await window.bitcoin.enable()
    const signedPSBTHex = await window.bitcoin.request({ method: 'wallet_signPSBT', params: [psbtHex, 0, signAddress] }) // TODO: all inputs CAL SUPPORT
    return signedPSBTHex
  },
  async sendRedeem (psbtHex) {
    const network = bjs.networks.testnet
    const signedPSBT = bjs.Psbt.fromBase64(psbtHex, { network })
    signedPSBT.finalizeAllInputs()
    const hex = signedPSBT.extractTransaction().toHex()
    return await sendRawTransaction(hex)
  },
  async getSignatures (psbtHex) {
    const network = bjs.networks.testnet
    if (!psbtHex) return []
    const psbt = bjs.Psbt.fromBase64(psbtHex, { network })
    return psbt.data.inputs[0].partialSig.map(psig => ({ publicKey: psig.pubkey.toString('hex'), signature: psig.signature.toString('hex') }))
  },
  getRedeemAddress (psbtHex) {
    const network = bjs.networks.testnet
    if (!psbtHex) return
    const psbt = bjs.Psbt.fromBase64(psbtHex, { network })
    return psbt.txOutputs[0].address
  }
}

const timelock = {
  template () {
    return [
      '<timestamp>',
      OPS.OP_CHECKLOCKTIMEVERIFY,
      OPS.OP_DROP,
      OPS.OP_DUP,
      OPS.OP_HASH160,
      '<pubkeyhash>',
      OPS.OP_EQUALVERIFY,
      OPS.OP_CHECKSIG
    ]
  },
  output (address, timestamp) {
    const template = this.template()
    template[0] = bjs.script.number.encode(timestamp)
    template[5] = getPubKeyHash(address)
    return bjs.script.compile(template)
  },
  decode (script) {
    const scriptStack = bjs.script.decompile(bjs.script.fromASM(script))
    const valid = this.template().every((c, i) => (typeof c === 'string' && c.startsWith('<')) || c === scriptStack[i])
    if (!valid) return
    return {
      timestamp: bjs.script.number.decode(scriptStack[0]),
      pubKeyHash: scriptStack[5].toString('hex')
    }
  },
  async canRedeem (script) {
    const scriptDetails = this.decode(script)
    const latestBlock = await getLatestBlock()
    return latestBlock.mediantime >= scriptDetails.timestamp // TODO: change to median time when available
  },
  async redeem (address, script, redeemAddress) {
    console.log(address, script, redeemAddress)
    const scriptDetails = this.decode(script)
    const network = bjs.networks.testnet
    const utxos = await getUtxos(address)
    const utxo = utxos[0] // TODO: claim all
    if (!utxo) throw new Error('Nothing to redeem')

    const timelockOutput = bjs.script.fromASM(script)
    const payment = bjs.payments.p2wsh({ redeem: { output: timelockOutput }, network }, { network })

    const psbt = new bjs.Psbt({ network })
    psbt.setVersion(2)
    psbt.setLocktime(scriptDetails.timestamp)
    psbt.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: {
        value: utxo.value,
        script: payment.output
      },
      sequence: 0,
      witnessScript: payment.redeem.output
    })

    const byteCount = getByteCount({ 'TIMELOCK-P2WSH': 1 }, { P2WPKH: 1 })
    const feePerByte = (await getFees()).slow
    const fee = byteCount * feePerByte

    psbt.addOutput({
      address: redeemAddress.address,
      value: utxo.value - fee
    })

    await window.bitcoin.enable()
    const signedPSBTHex = await window.bitcoin.request({ method: 'wallet_signPSBT', params: [psbt.toBase64(), 0, redeemAddress.address] }) // TODO: all inputs CAL SUPPORT
    const signedPSBT = bjs.Psbt.fromBase64(signedPSBTHex, { network })

    const sig = signedPSBT.data.inputs[0].partialSig[0].signature

    const timelockInput = bjs.script.compile([
      sig,
      Buffer.from(redeemAddress.publicKey, 'hex')
    ])
    const paymentWithInput = bjs.payments.p2wsh({ redeem: { output: timelockOutput, input: timelockInput, network }, network })

    const getFinalScripts = () => {
      return { finalScriptWitness: witnessStackToScriptWitness(paymentWithInput.witness) }
    }

    psbt.finalizeInput(0, getFinalScripts)

    const hex = psbt.extractTransaction().toHex()
    return sendRawTransaction(hex) // TODO: SEND RAW TRANSACTIOJN - SUPPORT IN BITCOIN CAL
  }
}

const scripts = { timelock, multisig }

export { scripts, SCRIPT_TYPES, decodeScript }
