<template>
  <div :class="classObj" class="app-wrapper" :style="{ '--current-color': theme }">
    <!-- <div v-if="device === 'mobile' && sidebar.opened" class="drawer-bg" @click="handleClickOutside" /> -->
    <side-bar v-if="!sidebar.hide" class="sidebar-container" />
    <div :class="{ sidebarHide: sidebar.hide }" class="main-container">
      <div :class="{ 'fixed-header': fixedHeader }">
        <navbar ref="navbarRef" @setLayout="setLayout" />
      </div>
      <app-main />
      <settings ref="settingRef" />
    </div>
  </div>
</template>

<script setup lang="ts">
  import useAppStore from '@/store/modules/app';
  import useSettingsStore from '@/store/modules/settings';
  import { AppMain, Navbar, Settings } from './components';
  import SideBar from './components/Sidebar/index.vue';

  const settingsStore = useSettingsStore();
  const theme = computed(() => settingsStore.theme);
  const sidebar = computed(() => useAppStore().sidebar);
  const device = computed(() => useAppStore().device);
  const fixedHeader = computed(() => settingsStore.fixedHeader);

  const classObj = computed(() => ({
    hideSidebar: !sidebar.value.opened,
    openSidebar: sidebar.value.opened,
    withoutAnimation: sidebar.value.withoutAnimation,
    mobile: device.value === 'mobile'
  }));

  const { width } = useWindowSize();
  const WIDTH = 992; // refer to Bootstrap's responsive design

  watchEffect(() => {
    // 禁用响应式自动折叠，侧边栏始终保持展开
    if (width.value - 1 < WIDTH) {
      useAppStore().toggleDevice('mobile');
    } else {
      useAppStore().toggleDevice('desktop');
    }
  });

  const navbarRef = ref(Navbar);
  const settingRef = ref(Settings);

  onMounted(() => {
    nextTick(() => {
      navbarRef.value.initTenantList();
    });
  });

  const handleClickOutside = () => {
    useAppStore().closeSideBar({ withoutAnimation: false });
  };

  const setLayout = () => {
    settingRef.value.openSetting();
  };
</script>

<style lang="scss" scoped>
  @import '@/assets/styles/mixin.scss';
  @import '@/assets/styles/variables.module.scss';

  .app-wrapper {
    @include clearfix;

    position: relative;
    width: 100%;
    height: 100%;
    overflow-y: auto;

    .main-container {
      background-repeat: no-repeat;
      background-size: contain;
    }

    &.mobile.openSidebar {
      position: fixed;
      top: 0;
    }
  }

  .drawer-bg {
    position: absolute;
    top: 0;
    z-index: 999;
    width: 100%;
    height: 100%;
    background: #000000;
    opacity: 0.3;
  }

  .fixed-header {
    position: fixed;
    top: 0;
    right: 0;
    z-index: 9;
    width: calc(100% - #{$base-sidebar-width});
    background: $fixed-header-bg;
    transition: width 0.28s;
  }

  .hideSidebar .fixed-header {
    width: calc(100% - 54px);
  }

  .sidebarHide .fixed-header {
    width: 100%;
  }

  .mobile .fixed-header {
    width: 100%;
  }
</style>
