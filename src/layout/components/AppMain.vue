<template>
  <section class="app-main">
    <router-view v-slot="{ Component, route }">
      <transition :enter-active-class="animante" mode="out-in">
        <keep-alive :include="tagsViewStore.cachedViews">
          <component v-if="!route.meta.link" :is="Component" :key="route.path" />
        </keep-alive>
      </transition>
    </router-view>
    <iframe-toggle />
  </section>
</template>

<script setup name="AppMain" lang="ts">
  import useSettingsStore from '@/store/modules/settings';
  import useTagsViewStore from '@/store/modules/tagsView';
  import { ComponentInternalInstance } from 'vue';
  import IframeToggle from './IframeToggle/index.vue';
  const { proxy } = getCurrentInstance() as ComponentInternalInstance;
  const tagsViewStore = useTagsViewStore();

  // 随机动画集合
  const animante = ref<string>('');
  const animationEnable = ref(useSettingsStore().animationEnable);
  watch(
    () => useSettingsStore().animationEnable,
    (val) => {
      animationEnable.value = val;
      if (val) {
        animante.value = proxy?.animate.animateList[
          Math.round(Math.random() * proxy?.animate.animateList.length)
        ] as string;
      } else {
        animante.value = proxy?.animate.defaultAnimate as string;
      }
    },
    { immediate: true }
  );
</script>

<style lang="scss" scoped>
  .app-main {
    position: relative;
    width: 100%;
    padding: 20px 20px 20px 0;

    /* 60 = navbar */
    min-height: calc(100vh - 60px);
    max-height: calc(100vh - 60px);
    overflow: hidden;
  }

  .fixed-header + .app-main {
    padding-top: 60px;
  }
</style>
<style lang="scss">
  // fix css style bug in open el-dialog
  .el-popup-parent--hidden {
    .fixed-header {
      padding-right: 6px;
    }
  }

  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  ::-webkit-scrollbar-track {
    background-color: #f1f1f1;
  }

  ::-webkit-scrollbar-thumb {
    border-radius: 3px;
    background-color: #c0c0c0;
  }
</style>
