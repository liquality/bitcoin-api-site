<template>
  <div>
    <header class="container">
      <b-navbar toggleable="md" type="primary">
        <a class="navbar-brand mr-4" href="/"><Logo class="logo" /></a>
        <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>
        <b-collapse id="nav-collapse" is-nav>
          <b-navbar-nav class="mr-auto">
            <b-nav-item href="/apps">Apps</b-nav-item>
            <b-nav-item target="_blank" href="https://liquality.io/documentation/web_extension/bitcoin/getting_started/">Docs</b-nav-item>
            <b-nav-item target="_blank" href="https://chrome.google.com/webstore/detail/liquality-wallet/kpfopkelmapcoipemfendmdcghnegimn">Wallet</b-nav-item>
            <b-nav-item target="_blank" href="https://liquality.io">Liquality</b-nav-item>
          </b-navbar-nav>
          <div>
            <Account />
          </div>
        </b-collapse>
      </b-navbar>
    </header>
    <div class="bg-light pt-4 pb-4">
      <main class="container">
        <Nuxt />
      </main>
    </div>
    <footer class="text-center pt-4 pb-4">
      <a class="text-secondary" href="https://github.com/liquality/wallet" target="_blank"><GithubIcon /> Github</a>
      <a class="text-secondary" href="https://twitter.com/Liquality_io" target="_blank"><TwitterIcon /> Twitter</a>
      <a class="text-secondary" href="https://t.me/liquality" target="_blank"><TelegramIcon /> Telegram</a>
    </footer>
  </div>
</template>

<style lang="scss">
@import '~/assets/scss/custom.scss';

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

footer svg {
  width: 24px;
  fill: $secondary;
}

footer a {
  padding: 0 10px;
}
</style>

<script>
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
  }
}
</script>
