<template>
  <div class="apps">
    <h1 class="mb-4">Bitcoin Applications <small class="text-muted">(testnet only)</small></h1>
    <div class="row">
      <div class="col-lg-4 mb-4">
        <router-link class="link-unstyled" to="/apps/payment">
        <div class="card bg-primary text-white">
          <div class="card-body">
            <b-icon-credit-card class="card-img-top mb-4" font-scale="5" variant="light" />
            <h5 class="card-title">Payment Request</h5>
            <p class="card-text">Display a request for payment to an address.</p>
          </div>
        </div>
        </router-link>
      </div>
      <div class="col-lg-4 mb-4">
        <router-link class="link-unstyled" to="/apps/timelock">
        <div class="card bg-primary text-white">
          <div class="card-body">
            <b-icon-lock class="card-img-top mb-4" font-scale="5" variant="light" />
            <h5 class="card-title">Timelock</h5>
            <p class="card-text">Lock bitcoin that will be unlocked in the future.</p>
          </div>
        </div>
        </router-link>
      </div>
      <div class="col-lg-4 mb-4">
        <router-link class="link-unstyled" to="/apps/multisig">
        <div class="card bg-primary text-white">
          <div class="card-body">
            <b-icon-arrows-move class="card-img-top mb-4" font-scale="5" variant="light" />
            <h5 class="card-title">Multisig</h5>
            <p class="card-text">Lock your bitcoin behind multiple keys to increase your security.</p>
          </div>
        </div>
        </router-link>
      </div>
    </div>
    <div class="row">
      <div class="col-lg-4 mb-4">
        <router-link class="link-unstyled" to="/apps/proof-of-funds">
        <div class="card bg-primary text-white">
          <div class="card-body">
            <b-icon-key class="card-img-top mb-4" font-scale="5" variant="light" />
            <h5 class="card-title">Proof of Funds</h5>
            <p class="card-text">Sign a message with your bitcoin addresses as proof.</p>
          </div>
        </div>
        </router-link>
      </div>
      <div class="col-lg-4 mb-4">
        <router-link class="link-unstyled" to="/apps/write-on-chain">
        <div class="card bg-primary text-white">
          <div class="card-body">
            <b-icon-pencil class="card-img-top mb-4" font-scale="5" variant="light" />
            <h5 class="card-title">Write on chain</h5>
            <p class="card-text">Write a permanent message on chain.</p>
          </div>
        </div>
        </router-link>
      </div>
      <div class="col-lg-4 mb-4">
        <div class="card bg-secondary text-white">
          <div class="card-body">
            <b-icon-bezier2 class="card-img-top mb-4" font-scale="5" variant="light" />
            <h5 class="card-title">Coinjoin</h5>
            <p class="card-text">Join your utxos with other users to increase your privacy.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.apps {
  .card {
  }
}
</style>
