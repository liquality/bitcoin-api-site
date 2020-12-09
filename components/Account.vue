<template>
  <div class="account">
    <Modal v-if="showAccountModal" @close="showAccountModal = false" type="modal-md" title="Account">
      <div class="modal-body">
        <small class="text-muted">Identity Address</small>
        <p>{{ account.address }}</p>
        <a @click="copy(account.publicKey.toString('hex'))" class="text-primary"><b-icon-clipboard /> <small>Copy Public Key</small></a>
      </div>
    </Modal>
    <button v-if="account" type="button" class="btn btn-primary" @click="showAccountModal = true">
      {{ addressShort(account.address) }} <img class="icon ml-2" :src="icon" />
    </button>
    <button v-else type="button" class="btn btn-primary" @click="connect">
      Connect Wallet
    </button>
  </div>
</template>

<script>
import { addressShort } from '@/utils/display'
import { createIcon } from '@download/blockies'
import { connect } from '@/utils/wallet'

export default {
  data () {
    return {
      account: null,
      icon: null,
      showAccountModal: false
    }
  },
  methods: {
    addressShort,
    async connect () {
      const accounts = await connect()
      this.account = accounts[0]
      this.icon = createIcon({
        seed: this.account.address,
        scale: 3
      }).toDataURL()
    },
    async copy (text) {
      await navigator.clipboard.writeText(text)
    }
  },
  async created () {
    try {
      await window.bitcoin.request({ method: 'wallet_getAddresses', params: [] }) // TODO: should this be something in injection?
      const connectedNetwork = await window.bitcoin.request({ method: 'wallet_getConnectedNetwork', params: [] })
      if (connectedNetwork.name !== 'bitcoin_testnet') {
        alert('Select testnet in the wallet before connecting')
        throw new Error('Invalid network')
      }
      await this.connect()
    } catch (e) {} // Wallet not available or connected
  }
}
</script>

<style lang="scss">
.account {
  .icon {
    position: relative;
    top: -2px;
    border-radius: 50%;
  }
  .modal {
    margin-top: -200px;
    a {
      cursor: pointer;
    }
    .modal-header {
      border-bottom: 0;
    }
    .modal-body {
      padding-top: 0;
    }
  }
}
</style>
