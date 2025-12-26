import { ref } from 'vue';

/**
 * 自动滚动方向
 */
export type ScrollDirection = 'vertical' | 'horizontal';

/**
 * 自动滚动配置
 */
export interface AutoScrollConfig {
  /** 滚动方向 */
  direction?: ScrollDirection;
  /** 距离视口边缘的触发阈值(px) */
  threshold?: number;
  /** 最小滚动速度(px/帧) */
  minSpeed?: number;
  /** 最大滚动速度(px/帧) */
  maxSpeed?: number;
}

/**
 * 拖拽自动滚动 Composable
 * 当拖拽元素接近视口边缘时,自动触发容器滚动
 *
 * @param config 配置项
 * @returns 自动滚动控制方法
 */
export function useAutoScroll(config: AutoScrollConfig = {}) {
  const {
    direction = 'vertical',
    threshold = 350,
    minSpeed = 15,
    maxSpeed = 80
  } = config;

  // 状态管理
  const isDragging = ref(false);
  let autoScrollFrameId: number | null = null;
  let currentScrollContainer: HTMLElement | null = null;
  let currentMousePosition = 0; // 当前鼠标位置(X或Y)

  /**
   * 自动滚动动画循环
   */
  const autoScrollLoop = () => {
    if (!currentScrollContainer || !isDragging.value) {
      autoScrollFrameId = null;
      return;
    }

    let scrollAmount = 0;

    if (direction === 'vertical') {
      // 垂直滚动
      const distanceFromViewportTop = currentMousePosition;
      const distanceFromViewportBottom = window.innerHeight - currentMousePosition;

      // 向上滚动：鼠标接近视口顶部
      if (
        distanceFromViewportTop < threshold &&
        distanceFromViewportTop > 0 &&
        currentScrollContainer.scrollTop > 0
      ) {
        const ratio = Math.pow(1 - distanceFromViewportTop / threshold, 2);
        scrollAmount = -(minSpeed + (maxSpeed - minSpeed) * ratio);
      }
      // 向下滚动：鼠标接近视口底部
      else if (distanceFromViewportBottom < threshold && distanceFromViewportBottom > 0) {
        const maxScroll = currentScrollContainer.scrollHeight - currentScrollContainer.clientHeight;
        if (currentScrollContainer.scrollTop < maxScroll) {
          const ratio = Math.pow(1 - distanceFromViewportBottom / threshold, 2);
          scrollAmount = minSpeed + (maxSpeed - minSpeed) * ratio;
        }
      }

      // 执行垂直滚动
      if (scrollAmount !== 0) {
        currentScrollContainer.scrollTop += scrollAmount;
      }
    } else {
      // 横向滚动
      const distanceFromViewportLeft = currentMousePosition;
      const distanceFromViewportRight = window.innerWidth - currentMousePosition;

      // 向左滚动：鼠标接近视口左边缘
      if (
        distanceFromViewportLeft < threshold &&
        distanceFromViewportLeft > 0 &&
        currentScrollContainer.scrollLeft > 0
      ) {
        const ratio = Math.pow(1 - distanceFromViewportLeft / threshold, 2);
        scrollAmount = -(minSpeed + (maxSpeed - minSpeed) * ratio);
      }
      // 向右滚动：鼠标接近视口右边缘
      else if (distanceFromViewportRight < threshold && distanceFromViewportRight > 0) {
        const maxScroll = currentScrollContainer.scrollWidth - currentScrollContainer.clientWidth;
        if (currentScrollContainer.scrollLeft < maxScroll) {
          const ratio = Math.pow(1 - distanceFromViewportRight / threshold, 2);
          scrollAmount = minSpeed + (maxSpeed - minSpeed) * ratio;
        }
      }

      // 执行横向滚动
      if (scrollAmount !== 0) {
        currentScrollContainer.scrollLeft += scrollAmount;
      }
    }

    // 继续下一帧
    autoScrollFrameId = requestAnimationFrame(autoScrollLoop);
  };

  /**
   * 处理鼠标移动事件
   */
  const handleMouseMove = (event: MouseEvent) => {
    currentMousePosition = direction === 'vertical' ? event.clientY : event.clientX;

    // 如果还没有启动滚动循环,启动它
    if (isDragging.value && !autoScrollFrameId) {
      autoScrollFrameId = requestAnimationFrame(autoScrollLoop);
    }
  };

  /**
   * 处理拖拽事件(用于捕获拖拽时的鼠标位置)
   */
  const handleDragMove = (event: DragEvent) => {
    const position = direction === 'vertical' ? event.clientY : event.clientX;
    if (position > 0) {
      currentMousePosition = position;
    }
  };

  /**
   * 开始自动滚动
   * @param container 滚动容器元素
   * @param initialPosition 初始鼠标位置
   */
  const start = (container: HTMLElement | null, initialPosition?: number) => {
    if (!container) return;

    isDragging.value = true;
    currentScrollContainer = container;

    if (initialPosition !== undefined) {
      currentMousePosition = initialPosition;
    }

    // 添加事件监听器
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('drag', handleDragMove);
    document.addEventListener('dragover', handleDragMove);

    // 立即启动滚动循环
    if (!autoScrollFrameId) {
      autoScrollFrameId = requestAnimationFrame(autoScrollLoop);
    }
  };

  /**
   * 停止自动滚动
   */
  const stop = () => {
    isDragging.value = false;

    if (autoScrollFrameId) {
      cancelAnimationFrame(autoScrollFrameId);
      autoScrollFrameId = null;
    }

    // 移除事件监听器
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('drag', handleDragMove);
    document.removeEventListener('dragover', handleDragMove);

    currentScrollContainer = null;
  };

  return {
    isDragging,
    start,
    stop
  };
}
