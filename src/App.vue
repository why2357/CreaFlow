<template>
  <el-config-provider :locale="appStore.locale" :size="size">
    <router-view />
  </el-config-provider>
</template>

<script setup lang="ts">
  import useAppStore from '@/store/modules/app';
  import useSettingsStore from '@/store/modules/settings';
  import { handleThemeStyle } from '@/utils/theme';

  const appStore = useAppStore();
  const size = computed(() => appStore.size as any);

  onMounted(() => {
    nextTick(() => {
      // 初始化主题样式
      handleThemeStyle(useSettingsStore().theme);
    });
  });
</script>
