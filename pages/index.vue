<template>
  <div class="mt-4">
    <div class="text-center">
      <img :src="logo" class="hero mb-4" />
    </div>
    <h1 class="mb-4 text-center">Bitcoin Wallet API</h1>
    <div class="row mb-2">
      <div class="col">
        <h4 class="mb-2">Web Applications</h4>
        <p>Develop rich Bitcoin applications that interact with user wallets in ways that were not possible before, like signing messages and custom transactions.</p>
      </div>
      <div class="col">
        <h4 class="mb-2">Wallets</h4>
        <p>Expose your wallet functionality to web applications to give users a more usable experience. <br /> <a href="https://chrome.google.com/webstore/detail/liquality-wallet/kpfopkelmapcoipemfendmdcghnegimn" target="_blank">Download the first compatible wallet</a></p>
      </div>
    </div>
    <div class="mb-2">
      <pre v-highlightjs><code class="javascript">await bitcoin.enable()

await bitcoin.request({
  method: 'wallet_sendTransaction',
  params: [ 'tb1qp6hf0hev83klhxwgmlltrmkcl6wdatz7n95nzz', 200000 ]
})</code></pre>
    </div>
    <div class="row text-center">
      <div class="col-md-6 pt-2">
        <router-link to="/apps"><div class="border border-primary rounded p-4">Explore Applications <b-icon-chevron-right /></div></router-link>
      </div>
      <div class="col-md-6 pt-2">
        <a href="https://liquality.io/documentation/web_extension/bitcoin/getting_started/" target="_blank"><div class="border border-primary rounded p-4">Get Started <b-icon-chevron-right /></div></a>
      </div>
    </div>
  </div>
</template>

<script>
export default {}
</script>

<style>
.search-button {
  cursor: pointer;
}
</style>

<script>
import LiqualityLogo from '@/assets/icons/logo.svg'

export default {
  data () {
    return {
      search: ''
    }
  },
  computed: {
    logo () {
      return LiqualityLogo
    }
  },
  methods: {
    go () {
      if (this.search) {
        window.location = `/address/${this.search}`
      }
    }
  }
}
</script>

<style lang="scss">
.hero {
  width: 200px;
  height: auto;
}

code.hljs {
  border-radius: 10px;
  padding: 16px;
}
</style>
