<template>
  <div>
    <header class="container">
      <b-navbar toggleable="md" type="primary">
        <router-link to="/" class="navbar-brand mr-4"><Logo class="logo" /></router-link>
        <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>
        <b-collapse id="nav-collapse" is-nav>
          <b-navbar-nav class="mr-auto">
            <b-nav-item to="/apps">Apps</b-nav-item>
            <b-nav-item target="_blank" href="https://liquality.io/documentation/web_extension/bitcoin/getting_started/">Docs</b-nav-item>
            <b-nav-item target="_blank" href="https://chrome.google.com/webstore/detail/liquality-wallet/kpfopkelmapcoipemfendmdcghnegimn">Wallet</b-nav-item>
            <b-nav-item target="_blank" href="https://liquality.io">Liquality</b-nav-item>
          </b-navbar-nav>
          <div class="d-flex">
            <b-dropdown id="network-dropdown" :text="network.name" variant="link" size="sm" toggle-class="network-button" class="mr-2">
              <b-dropdown-item @click="setNetwork('mainnet')">Mainnet</b-dropdown-item>
              <b-dropdown-item @click="setNetwork('testnet')">Testnet</b-dropdown-item>
            </b-dropdown>
            <Account />
          </div>
        </b-collapse>
      </b-navbar>
    </header>
    <b-modal id="modal-center" centered v-model="showWarningModal" hide-header hide-footer>
      <div class="text-center text-danger">
        <p><b-icon-exclamation-triangle variant="danger" font-scale="2" /></p>
        <h4>Warning!</h4>
        <p>This is alpha software that has not been fully audited. Use at your own risk.</p>
        <p><button class="btn btn-danger" @click="updateNetwork({ network: 'mainnet' }); showWarningModal = false">I Understand</button></p>
      </div>
    </b-modal>
    <div class="bg-light pt-4 pb-4">
      <main class="container">
        <Nuxt />
      </main>
    </div>
    <footer class="text-center pt-4 pb-4">
      <a class="text-secondary" href="https://github.com/liquality" target="_blank"><GithubIcon /> Github</a>
      <a class="text-secondary" href="https://twitter.com/Liquality_io" target="_blank"><TwitterIcon /> Twitter</a>
      <a class="text-secondary" href="https://t.me/liquality" target="_blank"><TelegramIcon /> Telegram</a>
    </footer>
  </div>
</template>

<style lang="scss">
@import '~/assets/scss/custom.scss';

.network-button {
  color: $danger;
}

.logo {
  height: 20px;
  width: auto;
}

.navbar {
  padding-left: 0 !important;
  padding-right: 0 !important;
}

.testnet-label {
  position: absolute;
  bottom: 0;
  left: 3px;
}

.link-unstyled, .link-unstyled:link, .link-unstyled:hover {
  color: inherit;
  text-decoration: inherit;
}

#network-dropdown {
  .dropdown-toggle {
    text-transform: capitalize;
  }
}

footer svg {
  width: 24px;
  fill: $secondary;
}

footer a {
  padding: 0 10px;
}
</style>

<script>
import { network, MAINNET_URL, TESTNET_URL } from '@/config'
import Logo from '@/assets/icons/logo.svg?inline'
import GithubIcon from '@/assets/icons/github.svg?inline'
import TwitterIcon from '@/assets/icons/twitter.svg?inline'
import TelegramIcon from '@/assets/icons/telegram.svg?inline'
import Account from '@/components/Account'

export default {
  components: {
    Account,
    Logo,
    GithubIcon,
    TwitterIcon,
    TelegramIcon
  },
  data: () => {
    return {
      showWarningModal: false
    }
  },
  computed: {
    network () {
      return network
    }
  },
  methods: {
    setNetwork (network) {
      if (this.network === network) return

      if (network === 'mainnet') window.location.href = `${MAINNET_URL}${this.$route.fullPath}`
      if (network === 'testnet') window.location.href = `${TESTNET_URL}${this.$route.fullPath}`
    },
    showWarning () {
      if (this.network.name === 'mainnet' && this.$route.path.startsWith('/apps/')) {
        this.showWarningModal = true
      }
    }
  },
  mounted () {
    this.showWarning()
  },
  watch: {
    $route: function () { this.showWarning() }
  }
}
</script>
