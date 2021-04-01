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
    <div v-if="tx" class="mt-3">
      <small class="text-muted">Transaction</small>
      <div><a :href="explorerLink(tx)" target="_blank" class="h4 text-primary">{{ shortHash(tx) }}</a><CopyButton @click="copy(tx)"><b-icon-clipboard /></CopyButton></div>
    </div>
  </div>
</template>

<script>
import { explorerLink, shortHash } from '@/utils/display'
import { scripts } from '@/utils/scripts'

export default {
  data () {
    return {
      message: null,
      working: false,
      tx: null
    }
  },
  computed: {
    messageSize () {
      if (!this.message) return 0
      return Buffer.from(this.message, 'utf8').length
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
      this.tx = await scripts.opreturn.send(this.message)
      this.working = false
    }
  }
}
</script>
