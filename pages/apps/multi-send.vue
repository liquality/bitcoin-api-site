<template>
  <div>
    <h1 class="mb-4">Multi Send</h1>
    <form @submit.prevent="send" autocomplete="off">
      <div class="form-row mt-2">
        <div class="form-group col">
          <div class="input-group">
            <div class="input-group-prepend"><span class="input-group-text">Number of Recipients</span></div>
            <select v-model.number="numRecipients" class="form-control" :class="{'is-invalid': numRecipients && !numRecipientsValid}">
              <option disabled value="">Select number</option>
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
      </div>
      <label v-if="numRecipients > 0">Payments</label>
      <div v-for="(n, i) in numRecipients" :key="i" class="form-row">
        <div class="col-lg-9 col-sm-12 pb-3">
          <div class="input-group">
            <div class="input-group-prepend"><span class="input-group-text">Address</span></div>
            <input type="text" class="form-control" v-model="addresses[i]" :class="{'is-valid': isAddressValid(addresses[i])}" autocomplete="chrome-off" data-lpignore="true" />
          </div>
        </div>
        <div class="col-lg-3 col-sm-12 pb-3">
          <div class="input-group">
            <input type="number" step="0.00000001" min="0" class="form-control" v-model="amounts[i]" autocomplete="off" data-lpignore="true" />
            <div class="input-group-append"><span class="input-group-text">BTC</span></div>
          </div>
        </div>
      </div>
      <div class="row align-items-center">
        <div class="col" v-if="tx">
          <span class="text-muted">Transaction:</span> <a :href="explorerLink(tx)" target="_blank">{{ shortHash(tx) }}</a>
        </div>
        <div class="col text-right">
          <button v-if="connected" class="btn btn-primary" type="submit" :disabled="!isValid">Send</button>
          <button v-else class="btn btn-primary" type="button" @click="connectWallet()">Connect Wallet</button>
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
import { scripts } from '@/utils/scripts'

export default {
  data () {
    return {
      numRecipients: null,
      addresses: [],
      amounts: [],
      tx: null
    }
  },
  computed: {
    ...mapState(['connected']),
    numRecipientsValid () {
      return Number.isInteger(this.numRecipients)
    },
    isValid () {
      const recipientsValid = this.addresses.length && this.addresses.length === this.numRecipients && this.addresses.every(addr => this.isAddressValid(addr))
      const amountsValid = this.amounts.length && this.amounts.length === this.numRecipients && this.amounts.every(amount => amount)
      if (!this.numRecipientsValid || !recipientsValid || !amountsValid) return false
      return true
    }
  },
  methods: {
    ...mapActions(['connectWallet']),
    shortHash,
    explorerLink,
    timestampToString,
    isAddressValid (address) {
      const validAddress = validateBitcoinAddress(address)
      return validAddress && validAddress.network === network.name && ['p2pkh', 'p2wpkh'].includes(validAddress.type)
    },
    async copy (text) {
      await navigator.clipboard.writeText(text)
    },
    async copyLink () {
      await this.copy(window.location.href)
    },
    async send () {
      this.tx = await scripts.multisend.send(this.addresses, this.amounts.map(parseFloat))
    }
  }
}
</script>

<style lang="scss">
</style>
