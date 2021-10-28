<template>
  <div>
    <h1 class="mb-4">Write on chain</h1>
    <form @submit.prevent="write">
      <div class="form-group">
        <label for="message">Message</label>
        <textarea class="form-control" name="message" id="message" v-model="message" placeholder="Enter the message you would like to write on chain" :disabled="working" aria-describedby="messageHelp" cols="80">
        </textarea>
        <small class="form-text text-muted" v-if="!messageValid">Maximum 80 characters per line</small>
        <small class="form-text text-muted" v-if="working">Sending...</small>
      </div>
      <button class="btn btn-primary" type="submit" :disabled="working || !messageValid">Send</button>
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
    messageValid () {
      if (!this.message || !this.message.length) return false
      if (this.message.split('\n').find(line => Buffer.from(line, 'utf8').length > 80)) return false
      return true
    }
  },
  methods: {
    shortHash,
    explorerLink,
    async copy (text) {
      await navigator.clipboard.writeText(text)
    },
    async write () {
      if (!this.messageValid) return

      this.working = true
      this.tx = await scripts.opreturn.send(this.message)
      this.working = false
    }
  }
}
</script>

<style lang="scss" scoped>
#message {
  font-family: monospace !important;
}
</style>
