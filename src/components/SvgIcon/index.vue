<template>
  <svg :class="svgClass" aria-hidden="true" :style="color ? { color: color } : {}">
    <use :xlink:href="iconName" />
  </svg>
</template>

<script setup lang="ts">
  import { propTypes } from '@/utils/propTypes';

  const props = defineProps({
    iconClass: propTypes.string.isRequired,
    className: propTypes.string.def(''),
    color: propTypes.string.def('')
  });
  const iconName = computed(() => `#icon-${props.iconClass}`);
  const svgClass = computed(() => {
    if (props.className) {
      return `svg-icon ${props.className}`;
    }
    return 'svg-icon';
  });
</script>

<style scope lang="scss">
  .sub-el-icon,
  .nav-icon {
    position: relative;
    display: inline-block;
    margin-right: 12px;
    font-size: 15px;
  }

  .svg-icon {
    position: relative;
    width: 1em;
    height: 1em;
    fill: currentcolor;
    vertical-align: -2px;
  }
</style>
