<template>
  <div>
    <h1 class="mb-4">Multisig</h1>
    <div v-if="created">
      <div class="row">
        <div class="col">
          <div class="alert alert-outline alert-danger d-flex justify-content-between align-items-center" role="alert">
            <div><b-icon-info-circle-fill /> Attention! Save this link or you may lose access to your funds.</div>
            <div>
              <button class="btn btn-sm btn-primary" @click="copyLink"><b-icon-clipboard /> Copy Link</button>
              <button class="btn btn-sm btn-primary" @click="downloadBackup"><b-icon-download /> Download Backup</button>
            </div>
          </div>
        </div>
      </div>
      <div class="row mb-4">
        <div class="col">
          <small class="text-muted">Multisig Address</small>
          <div>
            <a :href="explorerLink(multisigAddress)" target="_blank" class="h4 text-primary">{{ multisigAddress }}</a>
            <CopyButton @click="copy(multisigAddress)"><b-icon-clipboard /></CopyButton>
            <div><small class="text-muted">This is your multi-sig address. If you want to add funds into the multi-sig please send funds to this address.</small></div>
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col">
          <small class="text-muted">Balance</small>
          <p><span class="text-primary">{{ balance }}</span> BTC <button class="btn btn-sm btn-light" @click="refreshBalance"><b-icon-arrow-repeat /></button></p>
        </div>
        <div class="col">
          <small class="text-muted">Total Keys</small>
          <p>{{ totalKeys }}</p>
        </div>
        <div class="col">
          <small class="text-muted">Required Keys</small>
          <p>{{ requiredKeys }}</p>
        </div>
      </div>
      <small class="text-muted">Public Keys</small>
      <div class="row" v-for="(publicKey, i) in publicKeys" :key="i">
        <div class="col">
          <b-icon-key /> {{ publicKey }}
        </div>
      </div>
      <div class="row mt-4">
        <form @submit.prevent="sign" autocomplete="off" class="col">
          <div class="form-group">
            <h5>Spend <span class="text-primary">{{ balance }}</span> BTC</h5>
            <div class="input-group">
              <div class="input-group-prepend"><span class="input-group-text">To</span></div>
              <input type="text" class="form-control" v-model="redeemAddress" :disabled="psbt" />
            </div>
          </div>
          <span class="badge" :class="{ 'badge-warning': !isComplete, 'badge-success': isComplete }">{{ numSignatures }} / {{ requiredKeys }} Signatures</span>
          <button v-if="isComplete" type="button" class="btn btn-secondary float-right" disabled>Redeemed</button>
          <span v-else-if="signed" class="float-right">
            <small class="text-muted">Send this to the other signers</small>
            <button type="button" class="btn btn-primary" @click="copyLink">
              <b-icon-clipboard /> Copy Link
            </button>
          </span>
          <button type="button" class="btn btn-primary float-right" v-else-if="redeemTx" disabled>
            Redeemed
          </button>
          <button type="submit" class="btn btn-primary float-right" v-else-if="lastSig">
            Sign &amp; Send
          </button>
          <button type="submit" class="btn btn-primary float-right" v-else-if="canRedeem">
            Sign
          </button>
          <button type="button" class="btn btn-primary float-right" v-else disabled>
            Nothing to redeem
          </button>
          <button type="button" class="btn btn-danger float-right mr-2" v-if="psbt" @click="resetSignatures()">
            Reset
          </button>
          <div v-if="redeemTx">
            <small><span class="text-muted">Redeem Transaction:</span> <a :href="explorerLink(redeemTx)" target="_blank">{{ shortHash(redeemTx) }}</a></small>
          </div>
        </form>
      </div>
    </div>
    <form v-else @submit.prevent="create" autocomplete="off">
      <small class="text-muted"><b-icon-info-circle /> To get public keys, you can connect your wallet and click through to your account.</small>
      <div class="form-row mt-2">
        <div class="form-group col-md-6">
          <div class="input-group">
            <div class="input-group-prepend"><span class="input-group-text">Total Keys</span></div>
            <select v-model.number="totalKeys" class="form-control" :class="{'is-invalid': totalKeys && !totalKeysValid}">
              <option disabled value="">Select total</option>
              <option>1</option>
              <option>2</option>
              <option>3</option>
              <option>4</option>
              <option>5</option>
              <option>6</option>
              <option>7</option>
              <option>8</option>
              <option>9</option>
              <option>10</option>
            </select>
          </div>
        </div>
        <div class="form-group col-md-6">
          <div class="input-group">
            <div class="input-group-prepend"><span class="input-group-text">Required Keys</span></div>
            <select v-model.number="requiredKeys" class="form-control" :class="{'is-invalid': requiredKeys && !requiredKeysValid}">
              <option disabled value="">Select required</option>
              <option v-for="n in (totalKeys ? totalKeys : 1)" :key="n">{{ n }}</option>
            </select>
          </div>
          <small v-if="requiredKeys && !requiredKeysValid" class="text-danger">Required Keys must be less than total keys.</small>
        </div>
      </div>
      <label v-if="totalKeys > 0">Public Keys</label>
      <div class="form-row">
        <div v-for="(n, i) in totalKeys" :key="i" class="col-lg-6 col-sm-12 pb-3">
          <div class="input-group">
            <div class="input-group-prepend"><span class="input-group-text"><b-icon-key /></span></div>
            <input type="text" class="form-control" v-model="publicKeys[i]" :class="{'is-valid': isPublicKeyValid(publicKeys[i])}" autocomplete="off" data-lpignore="true" />
          </div>
        </div>
      </div>
      <div class="text-right">
        <button class="btn btn-primary" type="submit" :disabled="!isValid">Create</button>
      </div>
    </form>
  </div>
</template>

<script>
import { getScriptAddress } from '@/utils/bitcoin'
import { getAddresses, tryGetAddresses } from '@/utils/wallet'
import { explorerLink, timestampToString, shortHash } from '@/utils/display'
import { getBalance } from '@/utils/blockchain'
import { scripts } from '@/utils/scripts'
import * as bjs from 'bitcoinjs-lib'

export default {
  data () {
    return {
      totalKeys: null,
      requiredKeys: null,
      publicKeys: [],
      balance: 0,
      redeemTx: null,
      created: false,
      signed: false,
      canRedeem: false,
      redeemAddress: null,
      signatures: []
    }
  },
  computed: {
    totalKeysValid () {
      return Number.isInteger(this.totalKeys)
    },
    requiredKeysValid () {
      return Number.isInteger(this.requiredKeys) && this.requiredKeys <= this.totalKeys
    },
    isValid () {
      const pubKeysValid = this.publicKeys.length && this.publicKeys.every(key => this.isPublicKeyValid(key))
      if (!this.totalKeysValid || !this.requiredKeysValid || !pubKeysValid) return false
      return true
    },
    multisigScript () {
      return scripts.multisig.output(this.requiredKeys, this.publicKeys)
    },
    multisigScriptPretty () {
      return bjs.script.toASM(this.multisigScript)
    },
    multisigAddress () {
      return getScriptAddress(this.multisigScript) // TODO: Is this the same as p2wsh(redeem:p2ms).address ???
    },
    isComplete () {
      return this.numSignatures === this.requiredKeys
    },
    numSignatures () {
      return this.signatures.length
    },
    psbt () {
      return this.$route.query.psbt
    },
    lastSig () {
      return this.requiredKeys - this.numSignatures === 1
    }
  },
  methods: {
    shortHash,
    explorerLink,
    timestampToString,
    isPublicKeyValid (publicKey) {
      return publicKey && publicKey.length === 66
    },
    downloadBackup () {
      const text = `BITCOIN APP BACKUP
Url: ${window.location.href}
Type: Multisig
Multisig Address: ${this.multisigAddress}
Script Hex: ${this.multisigScript.toString('hex')}
Script ASM: ${this.multisigScriptPretty}
Total Keys: ${this.totalKeys}
Required Keys: ${this.requiredKeys}
Public Keys List: ${this.publicKeys.join('\n')}
`
      const element = document.createElement('a')
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text))
      element.setAttribute('download', `multisig-${this.requiredKeys}-of-${this.totalKeys}.bak.txt`)
      element.style.display = 'none'
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
    },
    async copy (text) {
      await navigator.clipboard.writeText(text)
    },
    async copyLink () {
      await this.copy(window.location.href)
    },
    async refreshBalance () {
      this.balance = await getBalance(this.multisigAddress)
    },
    async create () {
      this.created = true
      this.$router.push({ query: { ...this.$route.query, totalKeys: this.totalKeys, requiredKeys: this.requiredKeys, publicKeys: this.publicKeys.join(',') } }, () => this.updateData())
      await this.updateData()
    },
    async sign () {
      const psbt = this.psbt ? this.psbt : await scripts.multisig.createdRedeem(this.multisigAddress, this.multisigScriptPretty, this.redeemAddress)
      const scriptDetails = scripts.multisig.decode(this.multisigScriptPretty)
      const addresses = await getAddresses(0, 200)
      const signAddress = addresses.find(a => scriptDetails.publicKeys.includes(a.publicKey.toString('hex')))
      const signedPsbt = await scripts.multisig.signRedeem(psbt, signAddress.derivationPath)
      if (this.lastSig) {
        this.redeemTx = await scripts.multisig.sendRedeem(signedPsbt)
      }
      this.$router.push({ query: { ...this.$route.query, psbt: signedPsbt } }, () => this.updateData())
    },
    async resetSignatures () {
      this.$router.push({ query: { ...this.$route.query, psbt: undefined } }, () => this.updateData())
    },
    async updateData () {
      if (this.created) {
        this.signatures = await scripts.multisig.getSignatures(this.psbt)
        this.redeemAddress = scripts.multisig.getRedeemAddress(this.psbt)
        this.canRedeem = await scripts.multisig.canRedeem(this.multisigAddress, this.multisigScriptPretty)
        await this.refreshBalance()
        if (process.client && !this.signed) {
          const addresses = await tryGetAddresses(0, 200)
          this.signed = addresses.some(a => this.signatures.find(s => s.publicKey === a.publicKey.toString('hex')))
        }
      }
    }
  },
  async mounted () {
    if (this.$route.query.publicKeys) {
      this.totalKeys = parseInt(this.$route.query.totalKeys)
      this.requiredKeys = parseInt(this.$route.query.requiredKeys)
      this.publicKeys = this.$route.query.publicKeys.split(',')
      this.created = true
      await this.updateData()
    }
    this.interval = setInterval(() => this.updateData(), 5000)
  }
}
</script>

<style lang="scss">
</style>
