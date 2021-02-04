<template>
  <span class="pay-with-liquality">
    <button type="button" class="btn btn-primary btn-block" v-on="$listeners" @click="pay" :disabled="!address || !amount">
      <b-icon-credit-card class="mr-2" /> Pay
    </button>
  </span>
</template>

<script>
import { sendTransaction } from '@/utils/wallet'

export default {
  props: ['address', 'amount'],
  methods: {
    async pay () {
      const tx = await sendTransaction(this.address, this.amount)
      this.$emit('sent', tx.hash)
    }
  }
}
</script>

<style lang="scss">
  .pay-with-liquality {
    &_icon {
      height: 22px;
      width: auto;
    }
  }
</style>
