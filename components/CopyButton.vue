<template>
  <span>
    <button v-on="$listeners" type="button" class="btn btn-sm btn-light btn-link" @click="copy()" id="copy-button">
      <slot></slot>
    </button>
    <b-tooltip :show.sync="showTooltip" target="copy-button" placement="top" triggers="click">
      Copied!
    </b-tooltip>
  </span>
</template>

<script>
export default {
  data () {
    return {
      showTooltip: false
    }
  },
  methods: {
    copy () {
      this.showTooltip = true
      this.$emit('click')
      setTimeout(() => { this.showTooltip = false }, 1000)
    }
  }
}
</script>
