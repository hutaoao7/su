<template>
  <view class="assess-page">
    <ScaleRunner 
      scaleId="spin17" 
      title="社交焦虑量表（SPIN-17）"
      submitText="完成详细评估"
    />
  </view>
</template>

<script>
import ScaleRunner from '@/components/scale/ScaleRunner.vue'

export default {
  name: 'SpinAssess',
  components: {
    ScaleRunner
  },
  onLoad() {
    console.log('[ASSESS] nav spin17')
  }
}
</script>

<style scoped>
.assess-page {
  min-height: 100vh;
  background: #FFFFFF;
}


/* 暗黑模式支持 */
@media (prefers-color-scheme: dark) {
  /* 暗黑模式样式 */
}

</style>