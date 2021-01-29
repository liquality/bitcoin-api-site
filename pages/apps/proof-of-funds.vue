<template>
  <div class="proof-of-funds">
    <h1 class="mb-4">Proof of Funds <small class="text-muted">(testnet only)</small></h1>
    <form @submit.prevent="sign">
      <div class="form-group">
        <label for="message">Message</label>
        <input type="text"
          class="form-control" name="message" id="message" v-model="message" aria-describedby="messageHelp" placeholder="Enter the message you would like to sign" :disabled="hasSigned">
        <small id="messageHelp" class="form-text text-muted">Message will be signed by all addresses</small>
      </div>
      <div v-if="hasSigned" class="form-row">
        <div v-for="item in sigs" :key="item.address" class="col-lg-6 col-sm-12 pb-3">
          <div class="proof-of-funds_address border border-success p-2">
            <label class="form-check-label" :for="item.address">
              {{ item.address }} <a class="btn btn-link btn-sm" target="_blank" :href="getAddressLink(item.address, item.sig)"><b-icon-box-arrow-up-right /></a>
            </label>
            <div class="text-primary">{{ item.balance }} BTC <span class="text-muted">${{ getFiatValue(item.balance) }}</span></div>
            <div class="text-success">Sig: {{ shortHash(item.sig) }} <button type="button" class="btn btn-link btn-sm" @click="copy(item.sig)"><b-icon-clipboard /></button></div>
          </div>
        </div>
      </div>
      <div v-else class="form-group">
        <label for="addresses">Addresses
          <div v-if="loading" class="spinner-border spinner-border-sm" role="status">
            <span class="sr-only">Loading...</span>
          </div>
          <template v-else>
            ({{ numSelected }} Selected)
            <button type="button" class="btn btn-sm btn-secondary mr-2" @click="selectAllAddresses">Select All</button>
            <span class="text-primary">Total: {{ totalBalance }} BTC</span>
            <span class="text-muted">${{ getFiatValue(totalBalance) }}</span>
          </template>
        </label>
        <div class="form-row">
          <div v-for="(item, index) in balances" :key="item.address" class="col-lg-6 col-sm-12 pb-3">
            <div class="proof-of-funds_address form-check form-check-inline border p-2">
              <input class="form-check-input" type="checkbox" v-model="selected[index]" :id="item.address">
              <label class="form-check-label" :for="item.address">
                {{ item.address }}
              </label>
              <div class="text-primary">{{ item.balance }} BTC <span class="text-muted">${{ getFiatValue(item.balance) }}</span></div>
            </div>
          </div>
        </div>
      </div>
      <div class="text-right">
        <button v-if="hasSigned" type="button" class="btn btn-danger" @click="reset">Reset</button>
        <button v-else type="submit" class="btn btn-primary">Sign</button>
      </div>
    </form>
  </div>
</template>

<script>
import BN from 'bignumber.js'
import qs from 'query-string'
import { getAddresses, signMessage } from '@/utils/wallet'
import { getUtxos } from '@/utils/blockchain'
import { getFiatRate } from '@/utils/fiat'
import { shortHash } from '@/utils/display'

export default {
  data () {
    return {
      loading: false,
      message: null,
      balances: [],
      selected: [],
      sigs: []
    }
  },
  computed: {
    hasSigned () {
      return this.sigs.length > 0
    },
    numSelected () {
      return (this.selected.filter(selected => selected)).length
    },
    selectedItems () {
      return this.selected.map((a, i) => a ? this.balances[i] : null).filter(a => a)
    },
    totalBalance () {
      return this.balances.reduce((total, item, i) => this.selected[i] ? total.plus(BN(item.balance)) : total, BN(0))
    }
  },
  methods: {
    shortHash,
    async load () {
      if (process.client) {
        this.loading = true
        this.fiatRate = await getFiatRate('usd')
        await this.addBalances(await getAddresses(0, 200, false))
        await this.addBalances(await getAddresses(0, 200, true))
        this.loading = false
      }
    },
    async addBalances (addresses) {
      for (const item of addresses) {
        const address = item.address
        const utxos = await getUtxos(address)
        const balance = utxos.reduce((result, utxo) => result + utxo.value, 0) / 1e8
        if (balance > 0) {
          this.balances.push({ address, balance })
        }
      }
    },
    async copy (text) {
      await navigator.clipboard.writeText(text)
    },
    getFiatValue (value) {
      return (value * this.fiatRate).toFixed(2)
    },
    getAddressLink (address, sig) {
      const query = qs.stringify({ message: this.message, messageSig: sig })
      return `/address/${address}?${query}`
    },
    selectAllAddresses () {
      this.selected = Array(this.balances.length).fill(true)
    },
    async sign () {
      for (const item of this.selectedItems) {
        const { address, balance } = item
        const sig = await signMessage(this.message, address)
        this.sigs.push({ address, balance, sig })
      }
    },
    reset () {
      Object.assign(this.$data, this.$options.data.apply(this))
      this.load()
    }
  },
  async created () {
    await this.load()
  }
}
</script>

<style lang="scss">
.proof-of-funds {
  .form-check-inline {
    margin-right: 0;
  }
  &_address {
    display: block;
  }
}

</style>
