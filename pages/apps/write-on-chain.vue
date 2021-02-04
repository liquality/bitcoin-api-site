<template>
  <div>
    <h1 class="mb-4">Write on chain</h1>
    <form @submit.prevent="write">
      <div class="form-group">
        <label for="message">Message</label>
        <input type="text"
          class="form-control" name="message" id="message" v-model="message" aria-describedby="messageHelp" placeholder="Enter the message you would like to write on chain" :disabled="working">
        <small class="form-text text-muted" v-if="messageSize !== 0 && !canWrite">Message size should be less than 80 bytes</small>
      </div>
      <button class="btn btn-primary" type="submit" :disabled="working || !canWrite">Write</button>
    </form>
    <div v-if="result" class="mt-3">
      <small class="text-muted">Transaction</small>
      <div><a :href="explorerLink(result.hash)" target="_blank" class="h4 text-primary">{{ shortHash(result.hash) }}</a><button class="btn btn-sm btn-light" @click="copy(result.hash)"><b-icon-clipboard /></button></div>
    </div>
  </div>
</template>

<script>
import { explorerLink, shortHash } from '@/utils/display'
import { script } from 'bitcoinjs-lib'

export default {
  data () {
    return {
      message: null,
      working: false,
      result: null
    }
  },
  computed: {
    messageSize () {
      if (!this.message) return 0
      return Buffer.from(this.message, 'utf8').length
    },
    script () {
      return script.compile([
        script.OPS.OP_RETURN,
        Buffer.from(this.message, 'utf8')
      ])
    },
    canWrite () {
      return this.messageSize <= 80 && this.messageSize > 0
    }
  },
  methods: {
    shortHash,
    explorerLink,
    async copy (text) {
      await navigator.clipboard.writeText(text)
    },
    async write () {
      if (!this.canWrite) return

      this.working = true
      this.result = await window.bitcoin.request({ method: 'wallet_sendTransaction', params: [this.script.toJSON(), 0] })
      this.working = false
    }
  }
}
</script>
