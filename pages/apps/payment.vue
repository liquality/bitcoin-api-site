<template>
  <div>
    <h1 class="mb-4">Payment <small class="text-muted">(testnet only)</small></h1>
    <div class="row">
      <div class="col">
        <div class="row mb-2">
          <div class="input-group col">
            <div class="input-group-prepend"><span class="input-group-text">Address</span></div>
            <input type="text" class="form-control" v-model="address">
          </div>
        </div>
        <div class="row mb-2">
          <div class="input-group col">
            <div class="input-group-prepend"><span class="input-group-text">Amount</span></div>
            <input type="number" step="0.00000001" min="0" class="form-control" v-model="amount">
          </div>
        </div>
        <PayWithLiquality :address="address" :amount="amount" @sent="setTx" />
        <div v-if="tx">
          <small><span class="text-muted">Transaction:</span> <a :href="explorerLink(tx)" target="_blank">{{ shortHash(tx) }}</a></small>
        </div>
      </div>
      <div class="col-lg-3 col-md-4">
        <div class="qrcode p-4 border">
          <client-only>
            <img :src="qrcode" alt="QR Code" />
          </client-only>
        </div>
        <div>
          <small>Balance: <span class="text-primary">{{ balance }}</span> BTC</small>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import QR from 'qrcode'
import qs from 'query-string'
import { explorerLink, shortHash } from '@/utils/display'
import { getBalance } from '@/utils/blockchain'
import PayWithLiquality from '@/components/PayWithLiquality'

export default {
  components: {
    PayWithLiquality
  },
  data () {
    return {
      qrcode: null,
      tx: null,
      amount: 0.00001,
      address: 'tb1qp6hf0hev83klhxwgmlltrmkcl6wdatz7n95nzz',
      balance: 0
    }
  },
  computed: {
  },
  methods: {
    shortHash,
    explorerLink,
    async copy (text) {
      await navigator.clipboard.writeText(text)
    },
    async refreshBalance () {
      this.balance = await getBalance(this.address)
    },
    updateQR () {
      let uri = `bitcoin:${this.address}`
      const query = {}
      if (this.amount) query.amount = this.amount
      const querystring = qs.stringify(query)
      if (querystring) uri += `?${querystring}`
      QR.toDataURL(uri, { width: 500, margin: 0 }, (err, url) => {
        this.qrcode = url
        if (err) { throw new Error('Making QR failed') }
      })
    },
    setTx (tx) {
      this.tx = tx
      setTimeout(this.refreshBalance.bind(this), 2000)
    }
  },
  created () {
    this.updateQR()
    this.refreshBalance()
    setInterval(this.refreshBalance.bind(this), 5000)
  },
  watch: {
    amount () {
      this.updateQR()
    },
    address () {
      this.updateQR()
      this.refreshBalance()
    }
  }
}
</script>

<style lang="scss">
.qrcode {
  width: 100%;
  img {
    width: 100%;
  }
}
</style>
