<template>
  <div class="step-video">
    <el-empty description="视频制作功能开发中，敬请期待">
      <el-icon :size="100" color="#c0c4cc"><VideoCamera /></el-icon>
    </el-empty>
  </div>
</template>

<script setup lang="ts" name="StepVideo">
  import { VideoCamera } from '@element-plus/icons-vue';
</script>

<style scoped lang="scss">
  .step-video {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    background: white;
  }
</style>
