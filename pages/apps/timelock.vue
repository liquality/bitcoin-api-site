<template>
  <div class="timelock">
    <h1 class="mb-4">Timelock</h1>
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
          <small class="text-muted">Timelock Address</small>
          <div>
            <a :href="explorerLink(timelockAddress)" target="_blank" class="h4 text-primary">{{ timelockAddress }}</a>
            <CopyButton @click="copy(timelockAddress)"><b-icon-clipboard /></CopyButton>
            <div><small class="text-muted">This is your time lock address. If you want to add funds into the time lock, please send funds to this address.</small></div>
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col">
          <small class="text-muted">Balance</small>
          <p><span class="text-primary">{{ balance }}</span> BTC <button class="btn btn-sm btn-light" @click="refreshBalance"><b-icon-arrow-repeat /></button></p>
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
        <button class="btn btn-primary" type="button" @click="redeem" :disabled="balance == 0 || redeemTx || !canRedeem">
          <template v-if="redeemTx">Redeemed</template>
          <template v-else-if="!canRedeem">Timelocked</template>
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
      <div class="form-row">
        <div class="form-group col-md-6">
          <div class="input-group">
            <div class="input-group-prepend"><span class="input-group-text">Amount</span></div>
            <input type="number" step="0.00000001" min="0" class="form-control" v-model="amount" autocomplete="off" data-lpignore="true" />
            <div class="input-group-append"><span class="input-group-text">BTC</span></div>
          </div>
        </div>
      </div>
      <div class="form-row">
        <div class="col form-group">
          <template v-if="showTimelockAddress">
            <small>Timelock Address</small>
            <p class="text-primary">{{ timelockAddress }}</p>
          </template>
        </div>
        <div class="col text-right">
          <button v-if="connected" class="btn btn-primary" type="submit" :disabled="!isValid">Lock</button>
          <button v-else class="btn btn-primary" type="button" @click="connectWallet">Connect Wallet</button>
        </div>
      </div>
    </form>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'
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
      amount: 0,
      created: false,
      showTimelockAddress: false,
      redeemTx: null,
      balance: 0,
      canRedeem: false
    }
  },
  computed: {
    ...mapState(['connected']),
    timestamp () {
      return this.time && Math.round((new Date(this.time)).getTime() / 1000)
    },
    claimAddressValid () {
      const validAddress = validateBitcoinAddress(this.claimAddress)
      return validAddress && validAddress.network === network.name && ['p2pkh', 'p2wpkh'].includes(validAddress.type)
    },
    isValid () {
      if (this.timestamp && this.claimAddress && this.amount && parseFloat(this.amount) > 0) return true
      return false
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
    ...mapActions(['connectWallet']),
    shortHash,
    explorerLink,
    timestampToString,
    async defaultClaimAddress () {
      const addresses = await getAddresses(0, 1)
      const address = addresses[0]
      this.claimAddress = address.address
    },
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
      this.showTimelockAddress = true
      await scripts.timelock.fund(this.timelockAddress, this.amount)
      this.created = true
      this.$router.push({ query: { claimAddress: this.claimAddress, timestamp: this.timestamp } }, () => this.updateData())
    },
    async redeem () {
      const addresses = await getAddresses(0, 200)
      const signAddress = addresses.find(a => a.address === this.claimAddress)
      this.redeemTx = await scripts.timelock.redeem(this.timelockAddress, this.timelockScriptPretty, signAddress)
    },
    async updateData () {
      if (this.created) {
        this.balance = await getBalance(this.timelockAddress)
        this.canRedeem = await scripts.timelock.canRedeem(this.timelockScriptPretty)
      }
    }
  },
  watch: {
    connected (newValue) {
      if (newValue && !this.claimAddress) {
        this.defaultClaimAddress()
      }
    }
  },
  async mounted () {
    if (this.$route.query.claimAddress) {
      this.claimAddress = this.$route.query.claimAddress
      const date = new Date(this.$route.query.timestamp * 1000)
      date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
      this.time = date.toISOString().slice(0, 16)
      this.created = true
      await this.updateData()
    } else if (this.connected) {
      await this.defaultClaimAddress()
    }
    this.interval = setInterval(() => this.updateData(), 5000)
  }
}
</script>

<style lang="scss">
.timelock {
}
</style>
