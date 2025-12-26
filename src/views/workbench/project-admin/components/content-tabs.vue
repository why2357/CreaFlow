<template>
  <div class="content-tabs">
    <div class="tabs-header">
      <div class="tabs-nav">
        <div
          v-for="tab in tabs"
          :key="tab.key"
          class="tab-item"
          :class="{ active: activeTab === tab.key }"
          @click="handleTabClick(tab.key)"
        >
          {{ tab.label }}
        </div>
      </div>
    </div>

    <div class="tabs-content">
      <div v-if="activeTab === 'recommend'" class="content-grid">
        <div
          v-for="item in recommendList"
          :key="item.id"
          class="content-card"
          @click="handleCardClick(item)"
          @mouseenter="handleMouseEnter($event, item)"
          @mouseleave="handleMouseLeave($event)"
        >
          <!-- 图片 -->
          <img :src="item.cover" :alt="item.title" class="card-image" loading="lazy" />

          <!-- 视频 -->
          <video v-if="item.video" :data-src="item.video" class="card-video" muted loop playsinline preload="none" />

          <!-- 渐变遮罩 -->
          <!-- <div class="card-overlay"></div> -->
        </div>
      </div>
    </div>

    <!-- 视频预览对话框 -->
    <el-dialog v-model="showVideoDialog" title="视频预览" width="80%" center @close="handleCloseVideo">
      <div class="video-container">
        <video v-if="currentVideo" :src="currentVideo" controls autoplay style="width: 100%; max-height: 70vh" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue';

  interface ContentItem {
    id: string;
    cover: string;
    title: string;
    description: string;
    tag?: string;
    video?: string;
    aspectRatio?: number; // 图片宽高比（宽/高）
  }

  interface Tab {
    key: string;
    label: string;
  }

  const tabs = ref<Tab[]>([
    { key: 'recommend', label: '推荐' }
    // { key: 'animation', label: '动漫' },
    // { key: 'film', label: '影视' }
  ]);

  const activeTab = ref('recommend');

  // 导入本地图片和视频
  const getAssetUrl = (path: string) => {
    return new URL(`../../../../assets/home/${path}`, import.meta.url).href;
  };

  // Mock 数据 - 推荐
  const recommendList = ref<ContentItem[]>([
    {
      id: '2',
      cover:
        'https://fc-1327887685.cos.ap-guangzhou.myqcloud.com/dev_forge_hivision/image/2025122517/0d8abf8571a84d17.png',
      video:
        'https://fc-1327887685.cos.ap-guangzhou.myqcloud.com/dev_forge_hivision/video/2025122517/fb2eaa810aa44494.mp4',
      title: '作品案例 02',
      description: '精彩视频案例展示',
      aspectRatio: 2 // 5:4
    },
    {
      id: '1',
      cover:
        'https://fc-1327887685.cos.ap-guangzhou.myqcloud.com/dev_forge_hivision/image/2025122417/d05913dd329b44d5.png',
      video:
        'https://fc-1327887685.cos.ap-guangzhou.myqcloud.com/dev_forge_hivision/video/2025122417/0aff83d261894e51.mp4',
      title: '作品案例 01',
      description: '精彩视频案例展示',
      aspectRatio: 1.5 // 3:2 横图
    },
    {
      id: '3',
      cover:
        'https://fc-1327887685.cos.ap-guangzhou.myqcloud.com/dev_forge_hivision/image/2025122517/655aaadd575b448f.png',
      video:
        'https://fc-1327887685.cos.ap-guangzhou.myqcloud.com/dev_forge_hivision/video/2025122517/0e9d1391d01f4f6f.mp4',
      title: '作品案例 03',
      description: '精彩视频案例展示',
      aspectRatio: 2.5 // 16:9 宽屏
    },

    {
      id: '5',
      cover:
        'https://fc-1327887685.cos.ap-guangzhou.myqcloud.com/dev_forge_hivision/image/2025122517/605cf21ac7c947f6.png',
      video:
        'https://fc-1327887685.cos.ap-guangzhou.myqcloud.com/dev_forge_hivision/video/2025122517/587c72087abf419d.mp4',
      title: '作品案例 05',
      description: '精彩视频案例展示',
      aspectRatio: 1.89 // 16:10
    },
    {
      id: '6',
      cover:
        'https://fc-1327887685.cos.ap-guangzhou.myqcloud.com/dev_forge_hivision/image/2025122517/0345cbdad2a14070.png',
      video:
        'https://fc-1327887685.cos.ap-guangzhou.myqcloud.com/dev_forge_hivision/video/2025122517/a136b13c67bb480c.mp4',
      title: '作品案例 06',
      description: '精彩视频案例展示',
      aspectRatio: 2.3 // 4:3
    },
    {
      id: '11',
      cover:
        'https://fc-1327887685.cos.ap-guangzhou.myqcloud.com/dev_forge_hivision/image/2025122517/ea5b32d85bab4191.png',
      video:
        'https://fc-1327887685.cos.ap-guangzhou.myqcloud.com/dev_forge_hivision/video/2025122517/7cbf408705914370.mp4',
      title: '作品案例 11',
      description: '精彩视频案例展示',
      aspectRatio: 1.2 // 6:5
    },
    {
      id: '4',
      cover:
        'https://fc-1327887685.cos.ap-guangzhou.myqcloud.com/dev_forge_hivision/image/2025122517/360a9660f9c54de2.png',
      video:
        'https://fc-1327887685.cos.ap-guangzhou.myqcloud.com/dev_forge_hivision/video/2025122517/b9b2567bbd024201.mp4',
      title: '作品案例 04',
      description: '精彩视频案例展示',
      aspectRatio: 3 // 1:1 正方形
    },
    {
      id: '7',
      cover:
        'https://fc-1327887685.cos.ap-guangzhou.myqcloud.com/dev_forge_hivision/image/2025122517/c74f940e9825428b.png',
      video:
        'https://fc-1327887685.cos.ap-guangzhou.myqcloud.com/dev_forge_hivision/video/2025122517/23771eacbf414f69.mp4',
      title: '作品案例 07',
      description: '精彩视频案例展示',
      aspectRatio: 1.6 // 7:5
    },

    {
      id: '8',
      cover:
        'https://fc-1327887685.cos.ap-guangzhou.myqcloud.com/dev_forge_hivision/image/2025122517/f15d88d547a74979.png',
      video:
        'https://fc-1327887685.cos.ap-guangzhou.myqcloud.com/dev_forge_hivision/video/2025122517/ab1c00f1075c4b5a.mp4',
      title: '作品案例 08',
      description: '精彩视频案例展示',
      aspectRatio: 1.2 // 6:5
    },
    {
      id: '9',
      cover:
        'https://fc-1327887685.cos.ap-guangzhou.myqcloud.com/dev_forge_hivision/image/2025122517/df3c66fd99c54f3d.png',
      video:
        'https://fc-1327887685.cos.ap-guangzhou.myqcloud.com/dev_forge_hivision/video/2025122517/91e7b7c662534b35.mp4',
      title: '作品案例 09',
      description: '精彩视频案例展示',
      aspectRatio: 1.2 // 6:5
    },
    {
      id: '10',
      cover:
        'https://fc-1327887685.cos.ap-guangzhou.myqcloud.com/dev_forge_hivision/image/2025122517/407c826f4428401e.png',
      video:
        'https://fc-1327887685.cos.ap-guangzhou.myqcloud.com/dev_forge_hivision/video/2025122517/4a4e5a6e35cc4089.mp4',
      title: '作品案例 10',
      description: '精彩视频案例展示',
      aspectRatio: 1.2 // 6:5
    }
  ]);

  const handleTabClick = (key: string) => {
    activeTab.value = key;
  };

  // 视频预览相关
  const showVideoDialog = ref(false);
  const currentVideo = ref('');

  const handleCardClick = (item: ContentItem) => {
    if (item.video) {
      // 确保使用实际的视频URL，而不是data-src
      currentVideo.value = item.video;
      showVideoDialog.value = true;
    }
  };

  const handleCloseVideo = () => {
    showVideoDialog.value = false;
    currentVideo.value = '';
  };

  // 防抖计时器 Map，用于存储每个卡片的计时器
  const hoverTimers = new Map<HTMLElement, number>();

  // 鼠标进入卡片，加载并播放视频（带防抖）
  const handleMouseEnter = (event: MouseEvent, item: ContentItem) => {
    if (!item.video) return;

    const card = event.currentTarget as HTMLElement;

    // 清除之前的计时器（如果存在）
    const existingTimer = hoverTimers.get(card);
    if (existingTimer) {
      clearTimeout(existingTimer);
      hoverTimers.delete(card);
    }

    // 标记鼠标在卡片上
    card.dataset.isHovering = 'true';

    // 设置防抖延迟（300ms）
    const timer = setTimeout(() => {
      // 再次检查鼠标是否还在卡片上
      if (card.dataset.isHovering !== 'true') return;

      const img = card.querySelector('.card-image') as HTMLImageElement;
      const video = card.querySelector('.card-video') as HTMLVideoElement;

      if (img && video) {
        // 懒加载优化：只有悬停时才加载视频
        if (!video.src && video.dataset.src) {
          video.src = video.dataset.src;
          video.load();

          // 等待视频准备好后再切换显示，避免网络慢时出现空白
          const onVideoReady = () => {
            // 检查鼠标是否还在卡片上
            if (card.dataset.isHovering === 'true') {
              img.style.opacity = '0';
              video.style.opacity = '1';
              video.play().catch((err) => console.error('视频播放失败:', err));
            }
            video.removeEventListener('canplay', onVideoReady);
          };

          video.addEventListener('canplay', onVideoReady, { once: true });
        } else if (video.src) {
          // 视频已加载过，直接切换并播放
          img.style.opacity = '0';
          video.style.opacity = '1';
          video.play().catch((err) => console.error('视频播放失败:', err));
        }
      }

      hoverTimers.delete(card);
    }, 300) as unknown as number;

    hoverTimers.set(card, timer);
  };

  // 鼠标离开卡片，暂停视频并保持显示当前画面
  const handleMouseLeave = (event: MouseEvent) => {
    const card = event.currentTarget as HTMLElement;

    // 清除防抖计时器
    const timer = hoverTimers.get(card);
    if (timer) {
      clearTimeout(timer);
      hoverTimers.delete(card);
    }

    // 标记鼠标已离开卡片
    card.dataset.isHovering = 'false';

    const video = card.querySelector('.card-video') as HTMLVideoElement;
    if (video && video.src) {
      // 只暂停视频，保持视频显示（不切换回图片）
      video.pause();
    }
  };
</script>

<style scoped lang="scss">
  .content-tabs {
    margin-bottom: 40px;

    .tabs-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;

      .tabs-nav {
        display: flex;
        gap: 32px;

        .tab-item {
          position: relative;
          padding: 8px 0;
          font-size: 16px;
          font-weight: 500;
          color: #86909c;
          cursor: pointer;
          transition: color 0.3s;

          &:hover {
            color: #303133;
          }

          &.active {
            color: #303133;
            font-weight: 600;

            &::after {
              content: '';
              position: absolute;
              bottom: 0;
              left: 0;
              right: 0;
              height: 3px;
              background: linear-gradient(90deg, #5252ff 0%, #4086ff 100%);
              border-radius: 2px;
            }
          }
        }
      }

      .more-link {
        display: flex;
        align-items: center;
        gap: 4px;
        color: #86909c;
        font-size: 14px;
        cursor: pointer;
        transition: color 0.3s;

        &:hover {
          color: #5252ff;
        }

        .el-icon {
          font-size: 14px;
        }
      }
    }

    .tabs-content {
      .content-grid {
        column-count: 5;
        column-gap: 1px;
        padding: 0;

        @media (max-width: 1600px) {
          column-count: 4;
        }

        @media (max-width: 1200px) {
          column-count: 3;
        }

        @media (max-width: 900px) {
          column-count: 2;
        }

        @media (max-width: 600px) {
          column-count: 1;
        }

        .content-card {
          position: relative;
          width: 100%;
          break-inside: avoid;
          margin-bottom: 1px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

          // 图片样式
          .card-image {
            width: 100%;
            height: auto;
            display: block;
            transition: opacity 0.3s ease;
          }

          // 视频样式
          .card-video {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
          }

          // 渐变遮罩
          .card-overlay {
            position: absolute;
            inset: 0;
            background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.1) 50%, rgba(0, 0, 0, 0.7) 100%);
            opacity: 0;
            transition: opacity 0.4s ease;
            pointer-events: none;
          }

          // 播放图标
          .play-icon {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.8);
            width: 56px;
            height: 56px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 50%;
            color: #5252ff;
            opacity: 0;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
            z-index: 2;

            svg {
              width: 24px;
              height: 24px;
              margin-left: 3px;
            }
          }

          // 标签
          .card-tag {
            position: absolute;
            top: 16px;
            left: 16px;
            padding: 6px 14px;
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.95);
            color: #5252ff;
            font-size: 12px;
            font-weight: 600;
            backdrop-filter: blur(10px);
            z-index: 2;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }

          // 卡片信息
          .card-info {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 20px;
            transform: translateY(10px);
            opacity: 0;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 2;

            .card-title {
              margin: 0;
              font-size: 16px;
              font-weight: 600;
              color: white;
              text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
              line-height: 1.4;
            }
          }

          // 悬浮效果
          &:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
            z-index: 10;

            .card-overlay {
              opacity: 1;
            }

            .play-icon {
              opacity: 1;
              transform: translate(-50%, -50%) scale(1);
            }

            .card-info {
              opacity: 1;
              transform: translateY(0);
            }
          }
        }
      }
    }
  }

  .video-container {
    display: flex;
    justify-content: center;
    align-items: center;
    background: #000;
    border-radius: 8px;
    overflow: hidden;
  }
</style>
