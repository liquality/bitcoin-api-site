<template>
  <div class="account">
    <b-modal centered v-model="showAccountModal" title="Account" hide-footer>
      <div v-if="account">
        <small class="text-muted">Bitcoin Address</small>
        <p>{{ account.address }} <CopyButton @click="copy(account.address)"><b-icon-clipboard /></CopyButton></p>
        <small class="text-muted">Public Key</small>
        <p class="text-wrap-anywhere">{{ account.publicKey.toString('hex') }} <CopyButton @click="copy(account.publicKey.toString('hex'))"><b-icon-clipboard /></CopyButton></p>
      </div>
    </b-modal>
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
.text-wrap-anywhere {
  overflow-wrap: anywhere;
}

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
