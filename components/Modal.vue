<template>
  <div>
    <div class="modal-backdrop"></div>
    <div class="modal d-block" tabindex="-1" role="dialog">
      <div :class="{
        'modal-dialog modal-dialog-centered': true,
        [type]: true
      }" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{title}}</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close" @click="$emit('close')">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <slot></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    type: {
      type: String,
      default: 'modal-lg'
    },
    title: {
      type: String
    }
  },
  methods: {
    close (e) {
      if (!e) return
      if (!e.target) return
      const { className } = e.target
      if (!className) return
      if (typeof className !== 'string') return
      if (className.split(' ').includes('modal')) {
        this.$emit('close')
      }
    }
  }
}
</script>

<style lang="scss">
.modal-backdrop {
  background-color: hsla(0, 0%, 0%, 0.5)!important;
}
</style>
