<template>
  <el-dialog v-model="visible" title="视频预览" width="60%" append-to-body :z-index="3100" @close="handleClose">
    <video v-if="videoUrl" :src="videoUrl" controls autoplay class="preview-video">您的浏览器不支持视频播放</video>
  </el-dialog>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue';

  interface Props {
    modelValue: boolean;
    videoUrl?: string;
  }

  const props = defineProps<Props>();
  const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
  }>();

  const visible = ref(false);

  // 监听 modelValue 变化
  watch(
    () => props.modelValue,
    (val) => {
      visible.value = val;
    }
  );

  // 监听 visible 变化
  watch(visible, (val) => {
    emit('update:modelValue', val);
  });

  // 关闭对话框
  const handleClose = () => {
    visible.value = false;
  };
</script>

<style scoped lang="scss">
  .preview-video {
    width: 100%;
    height: auto;
    min-height: 300px;
    max-height: 70vh;
  }
</style>
