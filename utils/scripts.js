import BigNumber from 'bignumber.js'
import * as bjs from 'bitcoinjs-lib'
import { network } from '@/config'
import { getPubKeyHash, getByteCount, witnessStackToScriptWitness } from './bitcoin'
import { getLatestBlock, getTransaction, getUtxos, getFees, sendRawTransaction } from './blockchain'
import { getAddresses, tryGetAddresses, sendTransaction } from './wallet'
import { getInputs } from './tx'

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

const multisend = {
  async send (sendAddresses, amounts) {
    const targets = sendAddresses.map((addr, i) => ({
      address: addr,
      value: BigNumber(amounts[i]).times(1e8).toNumber(),
      external: true
    }))

    const { inputs, outputs } = await getInputs(targets)

    const psbt = new bjs.Psbt({ network })
    psbt.setVersion(2)

    const externalAddresses = await getAddresses(0, 500, false)
    const changeAddresses = await getAddresses(0, 500, true)
    const allAddresses = [...externalAddresses, ...changeAddresses]

    const inputsToSign = []
    for (const [index, input] of inputs.entries()) {
      const inputTx = await getTransaction(input.txid)
      const prevout = inputTx.vout[input.vout]
      const inputAddress = prevout.scriptpubkey_address
      const { derivationPath } = allAddresses.find(a => a.address === inputAddress)
      inputsToSign.push({ index, derivationPath })
      psbt.addInput({
        hash: input.txid,
        index: input.vout,
        witnessUtxo: {
          value: input.value,
          script: Buffer.from(prevout.scriptpubkey, 'hex')
        }
      })
    }

    for (const output of outputs) {
      psbt.addOutput({
        address: output.address,
        value: output.value
      })
    }

    const psbtBase64 = psbt.toBase64()
    const signedPSBTBase64 = await window.bitcoin.request({ method: 'wallet_signPSBT', params: [psbtBase64, inputsToSign] }) // TODO: all inputs CAL SUPPORT
    const signedPSBT = bjs.Psbt.fromBase64(signedPSBTBase64, { network })
    signedPSBT.finalizeAllInputs()

    const hex = signedPSBT.extractTransaction().toHex()
    return sendRawTransaction(hex)
  }
}

const multisig = {
  output (m, keys) {
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
      const addresses = await tryGetAddresses(0, 200, false)
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
    const utxos = await getUtxos(address)
    if (!utxos.length) throw new Error('Nothing to redeem')

    const p2ms = bjs.payments.p2ms({ network, m: scriptDetails.requiredKeys, pubkeys: scriptDetails.publicKeys.map(k => Buffer.from(k, 'hex')) })
    const payment = bjs.payments.p2wsh({ redeem: p2ms, network }, { network })

    const psbt = new bjs.Psbt({ network })
    psbt.setVersion(2)

    for (const utxo of utxos) {
      psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        witnessUtxo: {
          value: utxo.value,
          script: payment.output
        },
        witnessScript: payment.redeem.output
      })
    }

    const byteCount = getByteCount({ [`MULTISIG-P2WSH:${scriptDetails.requiredKeys}-${scriptDetails.totalKeys}`]: utxos.length }, { P2WPKH: 1 })
    const feePerByte = (await getFees()).slow
    const fee = byteCount * feePerByte
    const totalValue = utxos.reduce((total, utxo) => total + utxo.value, 0)

    psbt.addOutput({
      address: redeemAddress,
      value: totalValue - fee
    })

    return psbt.toBase64()
  },
  async signRedeem (psbtBase64, derivationPath) {
    await window.bitcoin.enable()
    const psbt = bjs.Psbt.fromBase64(psbtBase64, { network })
    const inputsToSign = psbt.txInputs.map((v, index) => ({ index, derivationPath }))
    const signedPSBTBase64 = await window.bitcoin.request({ method: 'wallet_signPSBT', params: [psbtBase64, inputsToSign] })
    return signedPSBTBase64
  },
  async sendRedeem (psbtBase64) {
    const signedPSBT = bjs.Psbt.fromBase64(psbtBase64, { network })
    signedPSBT.finalizeAllInputs()
    const hex = signedPSBT.extractTransaction().toHex()
    return await sendRawTransaction(hex)
  },
  async getSignatures (psbtBase64) {
    if (!psbtBase64) return []
    const psbt = bjs.Psbt.fromBase64(psbtBase64, { network })
    return psbt.data.inputs[0].partialSig.map(psig => ({ publicKey: psig.pubkey.toString('hex'), signature: psig.signature.toString('hex') }))
  },
  getRedeemAddress (psbtBase64) {
    if (!psbtBase64) return
    const psbt = bjs.Psbt.fromBase64(psbtBase64, { network })
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
  async fund (timelockAddress, amount) {
    return sendTransaction(timelockAddress, amount)
  },
  async canRedeem (script) {
    const scriptDetails = this.decode(script)
    const latestBlock = await getLatestBlock()
    return latestBlock.mediantime >= scriptDetails.timestamp
  },
  async redeem (address, script, redeemAddress) {
    const scriptDetails = this.decode(script)
    const utxos = await getUtxos(address)
    if (!utxos.length) throw new Error('Nothing to redeem')

    const timelockOutput = bjs.script.fromASM(script)
    const payment = bjs.payments.p2wsh({ redeem: { output: timelockOutput }, network }, { network })

    const psbt = new bjs.Psbt({ network })
    psbt.setVersion(2)
    psbt.setLocktime(scriptDetails.timestamp)

    const inputsToSign = []
    for (const [index, utxo] of utxos.entries()) {
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
      inputsToSign.push({ index, derivationPath: redeemAddress.derivationPath })
    }

    const byteCount = getByteCount({ 'TIMELOCK-P2WSH': utxos.length }, { P2WPKH: 1 })
    const feePerByte = (await getFees()).average
    const fee = byteCount * feePerByte
    const totalValue = utxos.reduce((total, utxo) => total + utxo.value, 0)

    if (totalValue < fee) {
      throw new Error(`Value not enough to pay for fee. Value: ${totalValue} sats, Fee ${fee} sats.`)
    }

    psbt.addOutput({
      address: redeemAddress.address,
      value: totalValue - fee
    })

    await window.bitcoin.enable()
    const signedPSBTBase64 = await window.bitcoin.request({ method: 'wallet_signPSBT', params: [psbt.toBase64(), inputsToSign] })
    const signedPSBT = bjs.Psbt.fromBase64(signedPSBTBase64, { network })

    for (const [index, input] of signedPSBT.data.inputs.entries()) {
      const sig = input.partialSig[0].signature
      const timelockInput = bjs.script.compile([
        sig,
        Buffer.from(redeemAddress.publicKey, 'hex')
      ])
      const paymentWithInput = bjs.payments.p2wsh({ redeem: { output: timelockOutput, input: timelockInput, network }, network })

      psbt.finalizeInput(index, () => {
        return { finalScriptWitness: witnessStackToScriptWitness(paymentWithInput.witness) }
      })
    }

    const hex = psbt.extractTransaction().toHex()
    return sendRawTransaction(hex)
  }
}

const scripts = { timelock, multisig, multisend }

export { scripts, SCRIPT_TYPES, decodeScript }
