<template>
  <div class="horizontal-scroll-tabs">
    <!-- 左箭头按钮 -->
    <div v-show="showLeftArrow" class="arrow-button arrow-left" @click="scrollTabs('left')">
      <el-icon><ArrowLeft /></el-icon>
    </div>

    <el-scrollbar ref="scrollbarRef" @wheel="handleWheel">
      <div ref="tabsRef" class="tabs-container">
        <div class="tab-item" :class="{ active: modelValue === null }" @click="handleTabClick(null)">全部</div>
        <div
          v-for="item in items"
          :key="item[itemKey]"
          class="tab-item"
          :class="{ active: modelValue === item[itemKey] }"
          @click="handleTabClick(item[itemKey])"
        >
          {{ item[itemLabel] }}
        </div>
      </div>
    </el-scrollbar>

    <!-- 右箭头按钮 -->
    <div v-show="showRightArrow" class="arrow-button arrow-right" @click="scrollTabs('right')">
      <el-icon><ArrowRight /></el-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue';
  import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue';

  interface Props {
    modelValue: any;
    items: any[];
    itemKey?: string;
    itemLabel?: string;
  }

  interface Emits {
    (e: 'update:modelValue', value: any): void;
    (e: 'change', value: any): void;
  }

  const props = withDefaults(defineProps<Props>(), {
    itemKey: 'id',
    itemLabel: 'name'
  });

  const emit = defineEmits<Emits>();

  const scrollbarRef = ref<any>(null);
  const tabsRef = ref<HTMLElement | null>(null);
  const showLeftArrow = ref(false);
  const showRightArrow = ref(false);

  // 检查是否溢出
  const checkOverflow = () => {
    nextTick(() => {
      if (!scrollbarRef.value || !tabsRef.value) {
        showLeftArrow.value = false;
        showRightArrow.value = false;
        return;
      }

      const scrollbarElement = scrollbarRef.value.$el;
      const wrapElement = scrollbarElement?.querySelector('.el-scrollbar__wrap');

      if (!wrapElement) {
        showLeftArrow.value = false;
        showRightArrow.value = false;
        return;
      }

      const scrollWidth = tabsRef.value.scrollWidth;
      const clientWidth = wrapElement.clientWidth;
      const scrollLeft = wrapElement.scrollLeft;

      // 判断是否需要显示左右箭头
      showLeftArrow.value = scrollLeft > 0;
      showRightArrow.value = scrollLeft + clientWidth < scrollWidth - 1;
    });
  };

  // 处理鼠标滚轮事件
  const handleWheel = (event: WheelEvent) => {
    event.preventDefault();

    if (!scrollbarRef.value) return;

    const scrollbarElement = scrollbarRef.value.$el;
    const wrapElement = scrollbarElement?.querySelector('.el-scrollbar__wrap');

    if (wrapElement) {
      // 将垂直滚动转换为横向滚动
      wrapElement.scrollLeft += event.deltaY;
      // 检查溢出状态
      checkOverflow();
    }
  };

  // 滚动选项卡
  const scrollTabs = (direction: 'left' | 'right') => {
    if (!scrollbarRef.value) return;

    const scrollbarElement = scrollbarRef.value.$el;
    const wrapElement = scrollbarElement?.querySelector('.el-scrollbar__wrap');

    if (wrapElement) {
      const scrollAmount = 200; // 每次滚动的距离
      const targetScroll =
        direction === 'left' ? wrapElement.scrollLeft - scrollAmount : wrapElement.scrollLeft + scrollAmount;

      // 平滑滚动
      wrapElement.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });

      // 延迟检查溢出状态,等待滚动动画完成
      setTimeout(() => {
        checkOverflow();
      }, 300);
    }
  };

  // 处理选项卡点击
  const handleTabClick = (value: any) => {
    emit('update:modelValue', value);
    emit('change', value);
  };

  // 监听滚动事件
  const setupScrollListener = () => {
    nextTick(() => {
      if (!scrollbarRef.value) return;

      const scrollbarElement = scrollbarRef.value.$el;
      const wrapElement = scrollbarElement?.querySelector('.el-scrollbar__wrap');

      if (wrapElement) {
        // 添加滚动事件监听
        wrapElement.addEventListener('scroll', checkOverflow);

        // 保存清理函数
        (scrollbarRef.value as any).__scrollCleanup = () => {
          wrapElement.removeEventListener('scroll', checkOverflow);
        };
      }
    });
  };

  // 初始化
  onMounted(() => {
    checkOverflow();
    setupScrollListener();
    window.addEventListener('resize', checkOverflow);
  });

  // 组件卸载时清理
  onUnmounted(() => {
    window.removeEventListener('resize', checkOverflow);
    // 清理滚动事件监听
    if (scrollbarRef.value && (scrollbarRef.value as any).__scrollCleanup) {
      (scrollbarRef.value as any).__scrollCleanup();
    }
  });

  // 监听列表变化
  watch(
    () => props.items,
    () => {
      nextTick(() => {
        checkOverflow();
      });
    }
  );

  // 暴露方法供父组件使用
  defineExpose({
    checkOverflow
  });
</script>

<style scoped lang="scss">
  .horizontal-scroll-tabs {
    flex: 1;
    overflow: hidden;
    position: relative;
    display: flex;
    align-items: center;
    height: 32px;

    .arrow-button {
      position: absolute;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: rgba(255, 255, 255, 0.95);
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.3s;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

      &:hover {
        background: #fff;
        border-color: #5252ff;
        color: #5252ff;
        box-shadow: 0 2px 12px rgba(82, 82, 255, 0.2);
      }

      &.arrow-left {
        left: 0;
      }

      &.arrow-right {
        right: 0;
      }
    }

    :deep(.el-scrollbar) {
      flex: 1;

      .el-scrollbar__wrap {
        overflow-x: auto;
        overflow-y: hidden;

        // 隐藏滚动条
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;

        &::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
      }

      .el-scrollbar__bar {
        display: none !important;
      }

      .el-scrollbar__view {
        display: flex;
      }
    }

    .tabs-container {
      display: flex;
      gap: 8px;
      white-space: nowrap;
      padding: 0 4px;
    }

    .tab-item {
      display: inline-block;
      height: 28px;
      padding: 4px 16px;
      flex-shrink: 0;
      border: 1px solid #d9d9d9;
      border-radius: 6px;
      background: white;
      color: #595959;
      font-size: 14px;
      line-height: 20px;
      cursor: pointer;
      transition: all 0.3s;
      min-width: 60px;
      max-width: 80px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      &:hover {
        border-color: #5252ff;
        color: #5252ff;
      }

      &.active {
        border-color: #5252ff;
        background: #5252ff;
        color: white;
      }
    }
  }
</style>
