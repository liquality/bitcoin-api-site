<template>
  <div>
    <h1 class="mb-4">Timelock</h1>
    <div v-if="created">
      <div class="row">
        <div class="col">
          <div class="alert alert-outline alert-danger d-flex justify-content-between align-items-center" role="alert">
            <div><b-icon-info-circle-fill /> Attention! Keep this page safe or you may lose access to your funds.</div>
            <div>
              <button class="btn btn-sm btn-primary" @click="copyLink"><b-icon-clipboard /> Copy Link</button>
              <button class="btn btn-sm btn-primary" @click="downloadBackup"><b-icon-download /> Download Backup</button>
            </div>
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col">
          <small class="text-muted">Address</small>
          <div><a :href="explorerLink(timelockAddress)" target="_blank" class="h4 text-primary">{{ timelockAddress }}</a><button class="btn btn-sm btn-light" @click="copy(timelockAddress)"><b-icon-clipboard /></button></div>
          <small>Balance: <span class="text-primary">{{ balance }}</span> BTC</small>
          <button class="btn btn-sm btn-light" @click="refreshBalance"><b-icon-arrow-repeat /></button>
        </div>
      </div>
      <div class="row">
        <div class="col">
          <small class="text-muted">Expiration</small>
          <p>{{ timestampToString(timestamp) }}</p>
        </div>
        <div class="col">
          <small class="text-muted">Redeem Address</small>
          <p>{{ claimAddress }}</p>
        </div>
      </div>
      <div>
        <button class="btn btn-primary" type="button" @click="redeem" :disabled="balance == 0 || redeemTx">
          <template v-if="redeemTx">Redeemed</template>
          <template v-else-if="balance > 0">Redeem</template>
          <template v-else>Nothing To Redeem</template>
        </button>
      </div>
      <div v-if="redeemTx">
        <small><span class="text-muted">Redeem Transaction:</span> <a :href="explorerLink(redeemTx)" target="_blank">{{ shortHash(redeemTx) }}</a></small>
      </div>
    </div>
    <form v-else @submit.prevent="create">
      <div class="form-row">
        <div class="form-group col-md-6">
          <div class="input-group">
            <div class="input-group-prepend"><span class="input-group-text">Claim Address</span></div>
            <input type="text" class="form-control" :class="{'is-valid': claimAddress && claimAddressValid}" v-model="claimAddress" />
          </div>
          <small v-if="claimAddress && !claimAddressValid" class="text-danger">Address invalid. Must be P2PKH or P2WPKH.</small>
        </div>
        <div class="form-group col-md-6">
          <div class="input-group">
            <div class="input-group-prepend"><span class="input-group-text">Unlock Time</span></div>
            <input type="datetime-local" class="form-control" v-model="time">
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
import validateBitcoinAddress from 'bitcoin-address-validation'
import { network } from '@/config'
import { explorerLink, timestampToString, shortHash } from '@/utils/display'
import { getAddresses } from '@/utils/wallet'
import { getScriptAddress } from '@/utils/bitcoin'
import { getBalance } from '@/utils/blockchain'
import { scripts } from '@/utils/scripts'
import * as bjs from 'bitcoinjs-lib'

export default {
  data () {
    return {
      claimAddress: null,
      time: null,
      created: false,
      redeemTx: null,
      balance: 0
    }
  },
  computed: {
    timestamp () {
      return this.time && Math.round((new Date(this.time)).getTime() / 1000)
    },
    claimAddressValid () {
      const validAddress = validateBitcoinAddress(this.claimAddress)
      return validAddress && validAddress.network === network.name && ['p2pkh', 'p2wpkh'].includes(validAddress.type)
    },
    isValid () {
      if (!this.timestamp || !this.claimAddress) return false
      return true
    },
    timelockScript () {
      return scripts.timelock.output(this.claimAddress, this.timestamp)
    },
    timelockScriptPretty () {
      return bjs.script.toASM(this.timelockScript)
    },
    timelockAddress () {
      return getScriptAddress(this.timelockScript)
    }
  },
  methods: {
    shortHash,
    explorerLink,
    timestampToString,
    async copy (text) {
      await navigator.clipboard.writeText(text)
    },
    async copyLink () {
      await this.copy(window.location.href)
    },
    downloadBackup () {
      const text = `BITCOIN APP BACKUP
Url: ${window.location.href}
Type: Timelock
Timelock Address: ${this.timelockAddress}
Script Hex: ${this.timelockScript.toString('hex')}
Script ASM: ${this.timelockScriptPretty}
Claim Address: ${this.claimAddress}
Claim Timestamp: ${this.timestamp}
`
      const element = document.createElement('a')
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text))
      element.setAttribute('download', `timelock-${this.claimAddress}-${this.timestamp}.bak.txt`)
      element.style.display = 'none'
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
    },
    async refreshBalance () {
      this.balance = await getBalance(this.timelockAddress)
    },
    async create () {
      this.created = true
      this.balance = await getBalance(this.timelockAddress)
      this.$router.push({ query: { claimAddress: this.claimAddress, timestamp: this.timestamp } })
    },
    async redeem () {
      const addresses = await getAddresses(0, 200)
      const signAddress = addresses.find(a => a.address === this.claimAddress)
      this.redeemTx = await scripts.timelock.redeem(this.timelockAddress, this.timelockScriptPretty, signAddress)
    }
  },
  async created () {
    if (process.client && this.$route.query.claimAddress) {
      this.claimAddress = this.$route.query.claimAddress
      const date = new Date(this.$route.query.timestamp * 1000)
      date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
      this.time = date.toISOString().slice(0, 16)
      await this.create()
    }
  }
}
</script>

<style lang="scss">
</style>
