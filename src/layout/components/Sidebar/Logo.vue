<template>
  <div class="sidebar-logo-container" :class="{ collapse: collapse }">
    <transition :enter-active-class="proxy?.animate.logoAnimate.enter" mode="out-in">
      <router-link to="/">
        <div class="sidebar-logo-link">
          <img :src="logo" class="sidebar-logo" />
          <div class="sidebar-title">{{ title }}</div>
        </div>
      </router-link>
    </transition>
  </div>
</template>

<script setup lang="ts">
  import logo from '@/assets/logo/logo.png';
  import { ComponentInternalInstance } from 'vue';
  const { proxy } = getCurrentInstance() as ComponentInternalInstance;

  defineProps({
    collapse: {
      type: Boolean,
      required: true
    }
  });

  const title = ref('FCLOUDVISION');
</script>

<style lang="scss" scoped>
  .sidebarLogoFade-enter-active {
    transition: opacity 1.5s;
  }

  .sidebarLogoFade-enter,
  .sidebarLogoFade-leave-to {
    opacity: 0;
  }

  .sidebar-logo-container {
    position: relative;
    width: 100%;
    overflow: hidden;
    background: transparent;
    text-align: center;

    & .sidebar-logo-link {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 60px;
      height: 60px;
      margin-bottom: 20px;

      & .sidebar-logo {
        width: 40px;
        height: 40px;
        flex-shrink: 0;
      }

      & .sidebar-title {
        margin: 0;
        color: #333;
        font-family: 'PingFang SC', sans-serif;
        font-size: 20px;
        font-style: normal;
        font-weight: 600;
        line-height: 20px;
        white-space: nowrap;
      }
    }

    &.collapse {
      .sidebar-logo {
        margin-right: 0;
      }
    }
  }
</style>
