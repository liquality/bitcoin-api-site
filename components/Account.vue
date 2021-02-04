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
import { mapState, mapActions } from 'vuex'
import { addressShort } from '@/utils/display'
import { createIcon } from '@download/blockies'
import { isWalletEnabled, getAddresses } from '@/utils/wallet'

export default {
  data () {
    return {
      account: null,
      icon: null,
      showAccountModal: false
    }
  },
  computed: {
    ...mapState(['connected'])
  },
  methods: {
    addressShort,
    ...mapActions(['connectWallet', 'setConnected']),
    async connect () {
      try {
        await this.connectWallet()
      } catch (e) {
        this.$bvToast.toast('Ensure wallet is connected on correct network', {
          autoHideDelay: 5000,
          noCloseButton: true,
          top: 100
        })
      } // Wallet not available or connected
    },
    async setup () {
      const accounts = await getAddresses(0, 1)
      this.account = accounts[0]
      this.icon = createIcon({
        seed: this.account.address,
        scale: 3,
        bgcolor: '#fff'
      }).toDataURL()
    },
    reset () {
      this.icon = null
      this.account = null
    },
    async copy (text) {
      await navigator.clipboard.writeText(text)
    }
  },
  async mounted () {
    if (await isWalletEnabled()) {
      try {
        await this.connectWallet()
      } catch (e) {
        console.warn(e)
      }
    }
  },
  watch: {
    connected (newValue) {
      if (newValue) this.setup()
      else this.reset()
    }
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
