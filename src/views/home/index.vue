<template>
  <div class="home-page">
    <!-- 背景视频 -->
    <video
      ref="bgVideoRef"
      class="video-background"
      autoplay
      muted
      loop
      playsinline
      preload="auto"
      :poster="bgPoster"
      :src="bgVideo"
    ></video>
    <div class="overlay"></div>

    <!-- Hero 区域 -->
    <div class="hero-section">
      <header>
        <div class="nav-left">
          <a href="#" class="logo">CreaFlow</a>
          <nav class="nav-container">
            <div class="nav-item">
              <a href="#" class="nav-link">功能</a>
              <div class="full-width-dropdown">
                <div class="dropdown-content align-left-features">
                  <div class="simple-vertical-menu">
                    <a href="#feature-control" class="simple-menu-link">精细化人工可控</a>
                    <a href="#feature-auto" class="simple-menu-link">全链路自动化生产</a>
                    <a href="#feature-collab" class="simple-menu-link">多人协同提效</a>
                  </div>
                </div>
              </div>
            </div>

            <div class="nav-item">
              <a href="#cases" class="nav-link">案例</a>
            </div>

            <div class="nav-item">
              <a href="#" class="nav-link">加入社区</a>
              <div class="full-width-dropdown">
                <div class="dropdown-content">
                  <div style="display: flex; gap: 60px; align-items: center; justify-content: center">
                    <div style="text-align: center">
                      <img
                        src="https://fc-1327887685.cos.ap-guangzhou.myqcloud.com/dev_forge_hivision/image/2025122516/6e9faa5b07554ef2.png"
                        alt="WeChat"
                        loading="lazy"
                        style="background: #fff; padding: 8px; border-radius: 12px; margin-bottom: 12px; width: 200px"
                      />
                      <h4 style="color: #fff; margin-bottom: 4px">微信交流群</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="nav-item">
              <a href="#" class="nav-link">资源</a>
              <div class="full-width-dropdown">
                <div class="dropdown-content">
                  <div style="display: flex; gap: 40px; justify-content: center">
                    <a
                      href="https://sharetronic.feishu.cn/wiki/GrVkwC2sKirZOlkrjxCckBUUnIb?from=from_parent_docx"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="simple-menu-link"
                      style="font-size: 16px"
                      >用户手册</a
                    >
                  </div>
                </div>
              </div>
            </div>
          </nav>
        </div>
        <div class="nav-right">
          <a @click="goToLogin" class="btn-solid">立即体验</a>
        </div>
      </header>

      <div class="hero-content">
        <span class="hero-brand">CreaFlow</span>
        <h1>全链路 AIGC 创意生成工场</h1>
        <div class="input-bar">
          <input v-model="searchText" type="text" placeholder="开启团队的创意构成..." />
          <button class="create-btn" @click="goToLogin">创作</button>
        </div>
      </div>
    </div>

    <!-- 主内容 -->
    <div class="scrolling-content">
      <div class="section-container">
        <!-- 功能卡片 -->
        <div id="features" class="features-grid">
          <a @click="goToLogin" class="feature-card" id="feature-control">
            <div class="card-content">
              <h3>精细化人工可控</h3>
              <p>不再是"开盲盒"。通过首尾帧与关键帧控制，让 AI 精准执行你的导演意图。</p>
              <div class="card-btn">立即体验</div>
            </div>
            <img
              src="https://fc-1327887685.cos.ap-guangzhou.myqcloud.com/dev_forge_hivision/image/2025122516/059111cdbdce4e64.jpg"
              alt="Preview"
              class="feature-img"
              loading="lazy"
            />
          </a>

          <a @click="goToLogin" class="feature-card" id="feature-auto">
            <div class="card-content">
              <h3>全链路自动化生产</h3>
              <p>从漫画图片一键转化为色彩流畅的动态视频，大幅缩短从静态到动态的制作周期。</p>
              <div class="card-btn">立即体验</div>
            </div>
            <img
              src="https://fc-1327887685.cos.ap-guangzhou.myqcloud.com/dev_forge_hivision/image/2025122516/3373adddd57b4b29.jpg"
              alt="Preview"
              class="feature-img"
              loading="lazy"
            />
          </a>

          <a @click="goToLogin" class="feature-card" id="feature-collab">
            <div class="card-content">
              <h3>多人协同提效</h3>
              <p>团队资产云端共享，项目进度无缝流转，让创作团队像一个人一样高效协作。</p>
              <div class="card-btn">立即体验</div>
            </div>
            <img
              src="https://fc-1327887685.cos.ap-guangzhou.myqcloud.com/dev_forge_hivision/image/2025122516/32e625ba6f3446da.jpg"
              alt="Preview"
              class="feature-img"
              loading="lazy"
            />
          </a>
        </div>

        <!-- 场景案例 -->
        <div id="cases" class="case-section">
          <h2>CreaFlow 场景案例</h2>
          <div class="case-tabs">
            <div
              v-for="(tab, index) in caseTabs"
              :key="index"
              :class="['case-tab', { active: currentCaseIndex === index }]"
              @click="jumpToVideo(index)"
            >
              {{ tab }}
            </div>
          </div>

          <div class="carousel-viewport">
            <div class="carousel-track" ref="videoTrackRef">
              <div
                v-for="(video, index) in allVideoItems"
                :key="index"
                :class="['video-item', { active: index === trackIndex }]"
                :data-id="video.id"
              >
                <video
                  :data-src="video.src"
                  muted
                  playsinline
                  preload="none"
                  crossorigin="anonymous"
                  :ref="(el) => (videoRefs[index] = el as HTMLVideoElement)"
                ></video>
              </div>
            </div>
          </div>
        </div>

        <!-- 为什么选择 -->
        <div class="why-choose">
          <h2 style="font-weight: 700">CreaFlow AI 赋能团队协作</h2>
          <p class="subtitle">打造权责分明、成本可控的工业化生产流</p>
          <div class="reasons-grid">
            <div class="reason-item" v-for="reason in reasons" :key="reason.icon">
              <div class="icon-box">{{ reason.icon }}</div>
              <h4>{{ reason.title }}</h4>
              <p>{{ reason.desc }}</p>
            </div>
          </div>
        </div>

        <!-- FAQ -->
        <div class="faq-section">
          <div class="faq-container">
            <div class="faq-header">
              <h2>常见问答</h2>
              <p>您可以在这里找到关于 CreaFlow 的常见问题解答，帮助您快速了解和使用我们的服务。</p>
            </div>
            <div class="faq-list">
              <div class="faq-item" v-for="(faq, index) in faqs" :key="index">
                <details>
                  <summary>{{ faq.question }}</summary>
                  <div class="faq-answer">{{ faq.answer }}</div>
                </details>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- CTA Banner -->
      <div class="cta-banner">
        <video
          ref="ctaVideoRef"
          class="cta-bg-video"
          :data-src="ctaVideo"
          autoplay
          muted
          loop
          playsinline
          preload="none"
          crossorigin="anonymous"
        ></video>
        <div class="cta-content">
          <h2>让创意自由，让创作高效</h2>
          <a @click="goToLogin" class="btn-solid" style="font-size: 16px; padding: 12px 32px">立即体验</a>
        </div>
      </div>

      <!-- CTA 倒影 -->
      <div class="cta-reflection-container">
        <video
          ref="ctaReflectionVideoRef"
          class="cta-reflection-video"
          :data-src="ctaVideo"
          autoplay
          muted
          loop
          playsinline
          preload="none"
          crossorigin="anonymous"
        ></video>
      </div>

      <!-- Footer -->
      <footer class="site-footer">
        <div class="footer-content">
          <div class="footer-brand">
            <h3>CreaFlow</h3>
            <p>CreaFlow, 让想象发生</p>
          </div>

          <div class="footer-links">
            <div class="link-col">
              <h4>功能</h4>
              <a href="#feature-control">精细化人工可控</a>
              <a href="#feature-auto">全链路自动化生产</a>
              <a href="#feature-collab">多人协同提效</a>
            </div>
            <div class="link-col">
              <h4>支持</h4>
              <a
                href="https://sharetronic.feishu.cn/wiki/GrVkwC2sKirZOlkrjxCckBUUnIb?from=from_parent_docx"
                target="_blank"
                rel="noopener noreferrer"
                >用户手册</a
              >
            </div>
            <div class="link-col">
              <h4>公司</h4>
              <a href="mailto:ivy@firpersimmon.com">联系邮箱: ivy@firpersimmon.com</a>
            </div>
          </div>

          <div class="footer-qr">
            <div class="qr-box">
              <img
                src="https://fc-1327887685.cos.ap-guangzhou.myqcloud.com/dev_forge_hivision/image/2025122516/6e9faa5b07554ef2.png"
                alt="QR Code"
                loading="lazy"
              />
            </div>
            <p>CreaFlow 官方交流群</p>
          </div>
        </div>

        <div class="footer-bottom">
          <div class="footer-legal">
            <a href="https://beian.miit.gov.cn/#/Integrated/index" target="_blank" rel="noopener noreferrer"
              >ICP备2025150536号-1</a
            >
          </div>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { nextTick, onMounted, onUnmounted, reactive, ref } from 'vue';
  import { useRouter } from 'vue-router';

  const router = useRouter();

  // 视频URL配置
  const VIDEO_URLS = {
    bg: {
      hd: 'https://fc-1327887685.cos.ap-guangzhou.myqcloud.com/dev_forge_hivision/video/2025122516/b62b4c2d785b4623.mp4', // 清晰版
      sd: 'https://fc-1327887685.cos.ap-guangzhou.myqcloud.com/dev_forge_hivision/video/2025122516/59853cf3fc524745.mp4', // 模糊版
      poster:
        'https://fc-1327887685.cos.ap-guangzhou.myqcloud.com/dev_forge_hivision/image/2025122516/5676457f763b4dc8.png' // 首帧占位图
    }
  };

  const bgVideo = ref('');
  const bgPoster = VIDEO_URLS.bg.poster;
  const ctaVideo =
    'https://fc-1327887685.cos.ap-guangzhou.myqcloud.com/dev_forge_hivision/video/2025122610/99fb5b80b92b488e.mp4';

  // 数据
  const searchText = ref('');
  const bgVideoRef = ref<HTMLVideoElement | null>(null);
  const ctaVideoRef = ref<HTMLVideoElement | null>(null);
  const ctaReflectionVideoRef = ref<HTMLVideoElement | null>(null);

  const caseTabs = ['动漫创作', '广告营销', '互动娱乐', '文旅宣传', '影视制作'];

  const videoData = [
    {
      src: 'https://fc-1327887685.cos.ap-guangzhou.myqcloud.com/dev_forge_hivision/video/2025122611/8f7786590942450a.mp4',
      id: 0
    },
    {
      src: 'https://fc-1327887685.cos.ap-guangzhou.myqcloud.com/dev_forge_hivision/video/2025122611/7a4696b9665944d5.mp4',
      id: 1
    },
    {
      src: 'https://fc-1327887685.cos.ap-guangzhou.myqcloud.com/dev_forge_hivision/video/2025122611/757f56d50f7e4f7a.mp4',
      id: 2
    },
    {
      src: 'https://fc-1327887685.cos.ap-guangzhou.myqcloud.com/dev_forge_hivision/video/2025122611/bab1de1264d943fb.mp4',
      id: 3
    },
    {
      src: 'https://fc-1327887685.cos.ap-guangzhou.myqcloud.com/dev_forge_hivision/video/2025122611/13f3b1cf156a4362.mp4',
      id: 4
    }
  ];

  const reasons = [
    {
      icon: '⚡',
      title: '全链路自动化闭环',
      desc: '大幅压缩创作周期'
    },
    {
      icon: '✨',
      title: '精细化可控 + 人工介入',
      desc: '平衡效率与质量'
    },
    {
      icon: '♾️',
      title: '适配团队协同',
      desc: '降低协作与落地门槛'
    }
  ];

  const faqs = [
    {
      question: '什么是 CreaFlow?',
      answer: 'CreaFlow 是一款先进的 AI 视频生成工具，致力于通过人工智能技术将您的创意转化为高质量的动态视频。'
    },
    {
      question: 'CreaFlow 的用途是什么?',
      answer: '它可以用于动漫创作、广告营销、影视制作等多个领域，帮助创作者大幅提升生产效率。'
    },
    {
      question: '生成的视频是否有版权问题?',
      answer: '用户使用 CreaFlow 生成的内容版权归用户所有，可用于商业用途（需符合平台使用规范）。'
    },
    {
      question: '如何联系技术支持?',
      answer: '您可以通过页面底部的官方邮箱或加入我们的社区与我们取得联系。'
    }
  ];

  // 轮播逻辑
  const currentCaseIndex = ref(0);
  const trackIndex = ref(0);
  const videoTrackRef = ref<HTMLElement | null>(null);
  const videoRefs = reactive<(HTMLVideoElement | null)[]>([]);

  const totalVideos = videoData.length;
  // 优化：只在首尾各克隆一个，从15个元素减少到7个
  const allVideoItems = [
    { ...videoData[videoData.length - 1], id: -1 }, // 克隆最后一个
    ...videoData,
    { ...videoData[0], id: totalVideos } // 克隆第一个
  ];

  let resizeTimeout: number | null = null;
  let videoObserver: IntersectionObserver | null = null;
  let isJumping = false; // 标志位：防止跳转时触发多次 transitionend

  const goToLogin = () => {
    router.push('/login');
  };

  const updateCarousel = (animate = true) => {
    if (!videoTrackRef.value) return;

    // 更新视频播放状态
    allVideoItems.forEach((_, i) => {
      const video = videoRefs[i];
      if (!video) return;

      // 懒加载：只加载当前和相邻视频
      const shouldLoad = Math.abs(i - trackIndex.value) <= 1;

      if (shouldLoad && !video.src && video.dataset.src) {
        video.src = video.dataset.src;
        video.load();
      }

      // 播放控制
      if (video.src) {
        video.play().catch((e) => console.log('视频播放被阻止:', e));

        if (i === trackIndex.value) {
          // 当前视频: 不循环，播放完自动切换
          video.loop = false;
          if (animate || video.ended) {
            video.currentTime = 0;
          }
          video.onended = () => {
            nextVideo();
          };
        } else {
          // 其他视频: 循环播放
          video.loop = true;
          video.onended = null;
        }
      }
    });

    // 计算并应用轨道位移
    nextTick(() => {
      const track = videoTrackRef.value;
      if (!track) return;

      const items = track.querySelectorAll('.video-item');
      const activeItem = items[trackIndex.value] as HTMLElement;

      if (activeItem) {
        const itemCenterOffset = activeItem.offsetLeft + activeItem.offsetWidth / 2;
        const translateX = -itemCenterOffset;
        track.style.transform = `translateX(${translateX}px)`;
      }
    });
  };

  const jumpToVideo = (index: number) => {
    // 因为数组开头有一个克隆元素，所以实际索引需要 +1
    trackIndex.value = index + 1;
    currentCaseIndex.value = index;
    updateCarousel(true);
  };

  const nextVideo = () => {
    trackIndex.value++;
    currentCaseIndex.value = (currentCaseIndex.value + 1) % totalVideos;
    updateCarousel(true);
  };

  const handleTransitionEnd = () => {
    // 防止在跳转过程中重复触发
    if (isJumping) return;

    // 无限循环的关键：在克隆边界处无缝跳转
    if (trackIndex.value === 0) {
      // 从头部克隆跳转到真实最后一个
      performSeamlessJump(totalVideos);
    } else if (trackIndex.value === totalVideos + 1) {
      // 从尾部克隆跳转到真实第一个
      performSeamlessJump(1);
    }
  };

  // 执行无缝跳转的辅助函数
  const performSeamlessJump = (targetIndex: number) => {
    if (!videoTrackRef.value) return;

    isJumping = true;
    const track = videoTrackRef.value;

    // 1. 移除过渡动画
    track.style.transition = 'none';

    // 2. 立即跳转到目标位置
    trackIndex.value = targetIndex;
    updateCarousel(false);

    // 3. 等待浏览器完成渲染后，恢复过渡动画
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (videoTrackRef.value) {
          videoTrackRef.value.style.transition = 'transform 0.8s cubic-bezier(0.19, 1, 0.22, 1)';
          // 短暂延迟后解除跳转标志，避免立即触发下一次 transitionend
          setTimeout(() => {
            isJumping = false;
          }, 50);
        }
      });
    });
  };

  const handleResize = () => {
    if (resizeTimeout) clearTimeout(resizeTimeout);
    resizeTimeout = window.setTimeout(() => {
      if (videoTrackRef.value) {
        videoTrackRef.value.style.transition = 'none';
        updateCarousel(false);
        nextTick(() => {
          if (videoTrackRef.value) {
            videoTrackRef.value.style.transition = 'transform 0.8s cubic-bezier(0.19, 1, 0.22, 1)';
          }
        });
      }
    }, 200);
  };

  // 监听滚动，为 header 添加 scrolled 类
  const handleScroll = () => {
    const header = document.querySelector('header');
    if (header) {
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }
  };

  // 检测网络质量并选择合适的视频
  const detectNetworkAndSetVideo = async (): Promise<string> => {
    // 方法1: 使用 Network Information API (如果可用)
    const connection =
      (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

    if (connection) {
      const effectiveType = connection.effectiveType; // '4g', '3g', '2g', 'slow-2g'
      const downlink = connection.downlink; // 下行速度 (Mbps)

      console.log('网络类型:', effectiveType, '下行速度:', downlink, 'Mbps');

      // 根据网络类型选择视频
      if (effectiveType === '4g' || (downlink && downlink > 5)) {
        console.log('检测到良好网络，使用高清视频');
        return VIDEO_URLS.bg.hd;
      } else {
        console.log('检测到较慢网络，使用标清视频');
        return VIDEO_URLS.bg.sd;
      }
    }

    // 方法2: 通过测速小文件来检测网速
    try {
      const testStartTime = Date.now();
      // 使用poster图片进行测速（约几KB-几十KB）
      const response = await fetch(VIDEO_URLS.bg.poster, {
        method: 'HEAD',
        cache: 'no-cache'
      });
      const testEndTime = Date.now();
      const duration = testEndTime - testStartTime;

      console.log('网络测试耗时:', duration, 'ms');

      // 如果响应时间小于500ms，认为网络良好
      if (duration < 500 && response.ok) {
        console.log('测速结果良好，使用高清视频');
        return VIDEO_URLS.bg.hd;
      } else {
        console.log('测速结果一般，使用标清视频');
        return VIDEO_URLS.bg.sd;
      }
    } catch (error) {
      console.warn('网络检测失败，降级使用标清视频:', error);
      return VIDEO_URLS.bg.sd;
    }
  };

  // 创建视频懒加载观察器
  const setupVideoLazyLoad = () => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const video = entry.target as HTMLVideoElement;
            const videoSrc = video.dataset.src;

            if (videoSrc && !video.src) {
              video.src = videoSrc;
              video.load();
              // 自动播放（已经有 autoplay 属性的会自动播放）
              video.play().catch(() => {
                // 如果自动播放失败，静音后重试
                video.muted = true;
                video.play().catch((e) => console.log('视频播放失败:', e));
              });

              // 加载后停止观察
              observer.unobserve(video);
            }
          }
        });
      },
      {
        rootMargin: '50px', // 提前 50px 开始加载
        threshold: 0.01
      }
    );

    return observer;
  };

  onMounted(async () => {
    // 检测网络并设置背景视频源
    bgVideo.value = await detectNetworkAndSetVideo();

    // 初始化到第一个真实视频（跳过索引0的克隆元素）
    trackIndex.value = 1;
    currentCaseIndex.value = 0;

    await nextTick();

    // 1. 立即加载首屏背景视频（不需要懒加载）
    if (bgVideoRef.value && bgVideo.value) {
      bgVideoRef.value.load();
      bgVideoRef.value.play().catch((e) => console.log('背景视频自动播放被阻止:', e));
    }

    // 2. 设置懒加载观察器
    videoObserver = setupVideoLazyLoad();

    // 3. 观察 CTA 视频
    if (ctaVideoRef.value) {
      videoObserver.observe(ctaVideoRef.value);
    }
    if (ctaReflectionVideoRef.value) {
      videoObserver.observe(ctaReflectionVideoRef.value);
    }

    nextTick(() => {
      if (videoTrackRef.value) {
        videoTrackRef.value.style.transition = 'none';
        updateCarousel(false);

        nextTick(() => {
          if (videoTrackRef.value) {
            videoTrackRef.value.style.transition = 'transform 0.8s cubic-bezier(0.19, 1, 0.22, 1)';
            videoTrackRef.value.addEventListener('transitionend', handleTransitionEnd);
          }
        });
      }
    });

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);

    // 处理锚点链接的平滑滚动
    document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((anchor) => {
      anchor.addEventListener('click', function (e) {
        const href = (this as HTMLAnchorElement).getAttribute('href');

        if (href === '#') {
          e.preventDefault();
          return;
        }

        if (href && href.startsWith('#')) {
          e.preventDefault();
          const targetId = href.substring(1);
          const targetElement = document.getElementById(targetId);
          if (targetElement) {
            // 获取目标元素的位置
            const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
            // 固定头部高度 + 额外间距
            const headerHeight = 200;
            const offset = 100; // 额外的顶部间距，调小让内容位置偏下
            // 滚动到目标位置，减去头部高度和额外间距
            window.scrollTo({
              top: targetPosition - headerHeight - offset,
              behavior: 'smooth'
            });
          }
        }
      });
    });
  });

  onUnmounted(() => {
    if (videoTrackRef.value) {
      videoTrackRef.value.removeEventListener('transitionend', handleTransitionEnd);
    }
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('scroll', handleScroll);
    if (resizeTimeout) clearTimeout(resizeTimeout);

    // 清理懒加载观察器
    if (videoObserver) {
      videoObserver.disconnect();
    }
  });
</script>

<style scoped lang="scss">
  /* --- 1. 基础重置 --- */
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: -apple-system, 'SF Pro Text', 'SF Pro Icons', 'Helvetica Neue', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  :root {
    --bg-dark: #050505;
    --text-primary: #ffffff;
    --text-secondary: #a1a1a6;
    --accent-purple: #b000ff;
    --accent-blue: #007aff;

    --glass-bg: rgba(0, 0, 0, 0.5);
    --glass-border: rgba(255, 255, 255, 0.1);
    --nav-hover-bg: rgba(255, 255, 255, 0.1);
    --card-bg: #121212;
    --border-color: rgba(255, 255, 255, 0.1);
  }

  html {
    scroll-behavior: smooth;
  }

  .home-page {
    width: 100%;
    overflow-x: hidden;
    color: #ffffff;
    background-color: transparent;
  }

  /* --- 2. 背景视频 --- */
  .video-background {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    object-fit: cover;
    background-color: #000; /* 防止加载时空白 */
    // z-index: -1;
  }

  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.8) 100%);
    z-index: 0;
    pointer-events: none;
  }

  /* --- 3. Hero区域 --- */
  .hero-section {
    position: relative;
    height: 100vh;
    display: flex;
    flex-direction: column;
    z-index: 99;
    margin-top: 0;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 80px;
    width: 100%;
    max-width: 100vw;
    padding: 0 40px;
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 9999;
    transition: background 0.3s ease;
  }

  /* 滚动时header背景加深 */
  header.scrolled {
    background: rgba(0, 0, 0, 0.7);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .nav-left {
    display: flex;
    align-items: center;
    gap: 48px;
    height: 100%;
  }

  .logo {
    font-size: 30px;
    font-weight: 800;
    cursor: pointer;
    color: #ffffff;
    letter-spacing: -0.5px;
    text-decoration: none;
  }

  .nav-container {
    display: flex;
    gap: 0;
    height: 100%;
    align-items: center;
  }

  /* 导航项 */
  .nav-item {
    height: 100%;
    display: flex;
    align-items: center;
    padding: 0 20px;
    cursor: pointer;
    position: static;
  }

  .nav-link {
    color: #a1a1a6;
    text-decoration: none;
    font-size: 15px;
    font-weight: 500;
    transition: color 0.2s;
    position: relative;
    z-index: 1002;
  }

  .nav-item:hover .nav-link {
    color: #ffffff;
  }

  .nav-item:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  /* === 通栏下拉菜单 (Full-Width) === */
  .full-width-dropdown {
    position: absolute;
    top: 80px;
    left: 0;
    width: 100%;
    background: rgba(0, 0, 0, 0.5);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(40px);
    -webkit-backdrop-filter: blur(40px);
    box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5);

    opacity: 0;
    visibility: hidden;
    transform: translateY(-10px);
    transition: all 0.25s ease;
    z-index: 99;
    padding: 30px 0;
  }

  .nav-item:hover .full-width-dropdown {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }

  .dropdown-content {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 40px;
  }

  /* 功能菜单左对齐样式 */
  .align-left-features {
    margin: 0;
    padding-left: 230px;
  }

  /* 垂直纯文字列表样式 */
  .simple-vertical-menu {
    display: flex;
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .simple-menu-link {
    color: rgba(255, 255, 255, 0.7);
    text-decoration: none;
    font-size: 15px;
    font-weight: 500;
    transition: all 0.2s;
    display: block;
    padding: 4px 0;
  }

  .simple-menu-link:hover {
    color: #fff;
    transform: translateX(6px);
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
  }

  .btn-solid {
    background: #ffffff;
    color: #000 !important;
    padding: 8px 24px;
    border-radius: 99px;
    font-weight: 600;
    font-size: 13px;
    text-decoration: none;
    transition: all 0.3s;
    cursor: pointer;
  }

  .btn-solid:hover {
    transform: scale(1.05);
  }

  @media (max-width: 900px) {
    .nav-container {
      display: none;
    }
  }

  /* Hero 内容 */
  .hero-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding-bottom: 12vh;
    text-align: center;
  }

  .hero-brand {
    font-size: clamp(5rem, 14vw, 10rem);
    font-weight: 900;
    color: #fff;
    display: block;
    margin-bottom: 10px;
    letter-spacing: -3px;
    line-height: 1;
    text-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
  }

  h1 {
    font-size: clamp(1.8rem, 4vw, 2.5rem);
    line-height: 1.2;
    margin-bottom: 56px;
    font-weight: 700;
    letter-spacing: 1px;
    background: linear-gradient(90deg, #b000ff, #007aff, #00ffd5, #ffffff, #b000ff);
    background-size: 200% auto;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: flowAnimation 10s linear infinite;
    filter: drop-shadow(0 0 15px rgba(0, 122, 255, 0.3));
  }

  @keyframes flowAnimation {
    0% {
      background-position: 0% center;
    }
    100% {
      background-position: -200% center;
    }
  }

  .input-bar {
    width: 90%;
    max-width: 680px;
    height: 64px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(24px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 99px;
    display: flex;
    align-items: center;
    padding: 6px 8px 6px 24px;
    transition: all 0.3s;
  }

  .input-bar:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.4);
  }

  .input-bar input {
    flex: 1;
    background: transparent;
    border: none;
    color: white;
    font-size: 16px;
    outline: none;
  }

  .create-btn {
    background: #ffffff;
    color: #000;
    border: none;
    height: 50px;
    padding: 0 32px;
    border-radius: 99px;
    font-size: 15px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.3s;
  }

  .create-btn:hover {
    transform: scale(1.03);
  }

  /* --- 4. 主内容容器 --- */
  .scrolling-content {
    position: relative;
    // z-index: 2;
    background-color: transparent;
    background: linear-gradient(to bottom, transparent 0%, #050505 20%);
    width: 100%;
    padding-top: 100px;
    overflow: hidden;
  }

  .section-container {
    width: 95%;
    max-width: 1800px;
    margin: 0 auto;
    padding: 0 20px 120px 20px;
  }

  /* --- 功能卡片 --- */
  .features-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 32px;
    margin-bottom: 160px;
  }

  .feature-card {
    background: linear-gradient(145deg, rgba(28, 28, 30, 0.6) 0%, rgba(10, 10, 10, 0.8) 100%);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 24px;
    padding: 32px;
    aspect-ratio: 4 / 3;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
    overflow: hidden;
    transition: all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
    cursor: pointer;
    text-decoration: none;
  }

  .feature-card:hover {
    transform: translateY(-8px);
    border-color: rgba(255, 255, 255, 0.3);
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  }

  .card-content {
    position: relative;
    z-index: 10;
    transition: transform 0.4s ease;
  }

  .feature-card:hover .card-content {
    transform: translateY(-8px);
  }

  .card-content h3 {
    font-size: 26px;
    margin-bottom: 12px;
    font-weight: 700;
    color: #fff;
  }

  .card-content p {
    color: #a1a1a6;
    font-size: 15px;
    line-height: 1.6;
    max-width: 85%;
  }

  .card-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-top: 20px;
    padding: 10px 24px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 99px;
    font-size: 14px;
    color: #fff;
    width: fit-content;
    transition: all 0.3s;
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(5px);
  }

  .feature-card:hover .card-btn {
    background: #fff;
    color: #000;
    border-color: #fff;
  }

  .feature-img {
    position: absolute;
    right: 0;
    bottom: 0;
    width: 80%;
    height: 70%;
    object-fit: cover;
    border-top-left-radius: 24px;
    z-index: 0;
    opacity: 0.8;
    mask-image: linear-gradient(to top right, black 50%, transparent 100%);
    -webkit-mask-image: linear-gradient(to top right, black 50%, transparent 100%);
    transition: all 0.5s ease;
  }

  .feature-card:hover .feature-img {
    transform: scale(1.05);
    opacity: 1;
  }

  /* --- 场景案例 --- */
  .case-section {
    text-align: center;
    margin-bottom: 160px;
    position: relative;
    width: 100vw;
    left: 50%;
    right: 50%;
    margin-left: -50vw;
    margin-right: -50vw;
  }

  .case-section h2 {
    font-size: 36px;
    font-weight: 700;
    margin-bottom: 40px;
  }

  .case-tabs {
    display: flex;
    justify-content: center;
    gap: 50px;
    margin-bottom: 60px;
  }

  .case-tab {
    font-size: 16px;
    color: #a1a1a6;
    cursor: pointer;
    position: relative;
    padding-bottom: 8px;
    transition: all 0.3s;
    font-weight: 500;
  }

  .case-tab:hover {
    color: #fff;
  }

  .case-tab.active {
    color: #007aff;
    font-weight: 700;
    transform: scale(1.1);
  }

  .case-tab.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 24px;
    height: 3px;
    background-color: #007aff;
    border-radius: 3px;
    box-shadow: 0 0 10px #007aff;
  }

  .carousel-viewport {
    width: 100%;
    height: 500px;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
  }

  .carousel-track {
    display: flex;
    align-items: center;
    position: absolute;
    left: 50%;
    transition: transform 0.8s cubic-bezier(0.19, 1, 0.22, 1);
    will-change: transform;
  }

  .video-item {
    width: 55vw;
    max-width: 900px;
    aspect-ratio: 16 / 9;
    margin: 0 1.5vw;
    border-radius: 20px;
    overflow: hidden;
    position: relative;
    flex-shrink: 0;
    opacity: 0.5;
    filter: brightness(0.5) blur(3px);
    transform: scale(0.85);
    z-index: 1;
    transition: all 0.8s cubic-bezier(0.19, 1, 0.22, 1);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    background: #000;
  }

  .video-item.active {
    opacity: 1;
    filter: brightness(1) blur(0);
    transform: scale(1.05);
    z-index: 10;
    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.15);
  }

  .video-item video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* --- 为什么选择 --- */
  .why-choose {
    text-align: center;
    margin-bottom: 140px;
  }

  .why-choose h2 {
    font-size: 38px;
    margin-bottom: 12px;
    position: relative;
    // z-index: 2;
  }

  .why-choose .subtitle {
    color: #a1a1a6;
    margin-bottom: 72px;
    position: relative;
    // z-index: 2;
  }

  .reasons-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 48px;
    text-align: left;
  }

  .reason-item {
    padding: 32px 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    transition: 0.3s;
    position: relative;
    overflow: hidden;
    border-radius: 16px;
  }

  .reason-item:hover {
    border-color: #b000ff;
    transform: translateY(-4px);
  }

  .reason-item::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
    z-index: 0;
    opacity: 0.8;
    -webkit-mask-image: linear-gradient(to bottom, black 30%, transparent 100%);
    mask-image: linear-gradient(to bottom, black 30%, transparent 100%);
    filter: grayscale(20%) contrast(1.1);
  }

  .reason-item:nth-child(1)::before {
    background-image: url('https://fc-1327887685.cos.ap-guangzhou.myqcloud.com/dev_forge_hivision/image/2025122516/c809e61b072a4867.jpg');
  }

  .reason-item:nth-child(2)::before {
    background-image: url('https://fc-1327887685.cos.ap-guangzhou.myqcloud.com/dev_forge_hivision/image/2025122516/0a3bdb64e44c4bc4.jpg');
    background-position: top center;
  }

  .reason-item:nth-child(3)::before {
    background-image: url('https://fc-1327887685.cos.ap-guangzhou.myqcloud.com/dev_forge_hivision/image/2025122516/a426e2f90d164bb6.jpg');
  }

  .reason-item .icon-box,
  .reason-item h4,
  .reason-item p {
    position: relative;
    // z-index: 2;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
  }

  .icon-box {
    width: 56px;
    height: 56px;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24px;
    font-size: 24px;
    backdrop-filter: blur(5px);
  }

  .reason-item h4 {
    font-size: 20px;
    margin-bottom: 12px;
    font-weight: 700;
  }

  .reason-item p {
    color: rgba(255, 255, 255, 0.9);
  }

  /* --- FAQ --- */
  .faq-section {
    margin-bottom: 0;
    padding-bottom: 120px;
  }

  .faq-container {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 60px;
  }

  .faq-header h2 {
    font-size: 36px;
    font-weight: 700;
    margin-bottom: 16px;
  }

  .faq-header p {
    color: #a1a1a6;
    font-size: 15px;
    line-height: 1.6;
  }

  .faq-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .faq-item {
    background: #121212;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s;
  }

  .faq-item:hover {
    border-color: rgba(255, 255, 255, 0.3);
  }

  details {
    width: 100%;
  }

  summary {
    padding: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    font-size: 16px;
    font-weight: 500;
    list-style: none;
    user-select: none;
  }

  summary::-webkit-details-marker {
    display: none;
  }

  summary::after {
    content: '+';
    font-size: 20px;
    font-weight: 300;
    color: #a1a1a6;
    transition: transform 0.3s;
  }

  details[open] summary::after {
    transform: rotate(45deg);
  }

  details[open] summary {
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .faq-answer {
    padding: 24px;
    color: #a1a1a6;
    font-size: 14px;
    line-height: 1.6;
    background: rgba(255, 255, 255, 0.02);
  }

  /* --- CTA Banner --- */
  .cta-banner {
    width: 100%;
    height: 420px;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    overflow: hidden;
    z-index: 2;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  .cta-bg-video {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 0;
  }

  .cta-banner::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.5));
    z-index: 1;
  }

  .cta-content {
    position: relative;
    z-index: 2;
  }

  .cta-content h2 {
    font-size: 48px;
    font-weight: 700;
    margin-bottom: 32px;
    text-shadow: 0 4px 20px rgba(0, 0, 0, 0.8);
  }

  /* --- 磨砂倒影容器 --- */
  .cta-reflection-container {
    width: 100%;
    height: 350px;
    position: relative;
    overflow: hidden;
    z-index: 1;
    filter: blur(20px);
    opacity: 0.6;
    -webkit-mask-image: linear-gradient(to bottom, black 0%, transparent 70%);
    mask-image: linear-gradient(to bottom, black 0%, transparent 70%);
    transform: scaleY(-1);
    pointer-events: none;
    margin-top: -2px;
  }

  .cta-reflection-video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* --- Footer --- */
  .site-footer {
    background: rgba(0, 0, 0, 0.5);
    padding: 80px 40px 40px;
    position: relative;
    z-index: 3;
    margin-top: -300px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
  }

  .footer-content {
    max-width: 1400px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1.5fr 3fr 1fr;
    gap: 60px;
    margin-bottom: 60px;
  }

  .footer-brand h3 {
    font-size: 24px;
    margin-bottom: 12px;
  }

  .footer-brand p {
    color: #a1a1a6;
    font-size: 14px;
    margin-bottom: 24px;
  }

  .social-icons {
    display: flex;
    gap: 16px;
  }

  .social-circle {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    cursor: pointer;
    transition: 0.3s;
  }

  .social-circle:hover {
    background: #fff;
    color: #000;
  }

  .footer-links {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }

  .link-col h4 {
    font-size: 14px;
    margin-bottom: 20px;
    color: #fff;
  }

  .link-col a {
    display: block;
    color: #a1a1a6;
    text-decoration: none;
    font-size: 13px;
    margin-bottom: 12px;
    transition: color 0.3s;
  }

  .link-col a:hover {
    color: #007aff;
  }

  .footer-qr {
    text-align: right;
  }

  .qr-box {
    width: 100px;
    height: 100px;
    background: #fff;
    padding: 4px;
    border-radius: 8px;
    margin-left: auto;
    margin-bottom: 12px;
  }

  .qr-box img {
    width: 100%;
    height: 100%;
  }

  .footer-qr p {
    font-size: 12px;
    color: #a1a1a6;
  }

  .footer-bottom {
    max-width: 1400px;
    margin: 0 auto;
    padding-top: 30px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: space-between;
    color: #666;
    font-size: 12px;
  }

  .footer-legal span {
    margin-right: 20px;
  }

  .footer-legal a {
    color: inherit;
    text-decoration: none;
  }

  .footer-legal a:hover {
    text-decoration: underline;
  }

  /* --- 响应式 --- */
  @media (max-width: 1024px) {
    .features-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    .faq-container {
      grid-template-columns: 1fr;
      gap: 30px;
    }
    .footer-content {
      grid-template-columns: 1fr;
      gap: 40px;
    }
    .footer-links {
      grid-template-columns: repeat(2, 1fr);
    }
    .footer-qr {
      text-align: left;
    }
    .qr-box {
      margin-left: 0;
    }
    .reason-item::before {
      opacity: 0.3;
    }
    .video-item {
      width: 70vw;
    }
  }

  @media (max-width: 768px) {
    .features-grid {
      grid-template-columns: 1fr;
    }
    .section-container {
      width: 100%;
      padding: 0 20px 100px 20px;
    }
    h1 {
      font-size: 36px;
    }
    .case-tabs {
      gap: 20px;
      font-size: 14px;
      overflow-x: auto;
      white-space: nowrap;
      justify-content: flex-start;
      padding-bottom: 10px;
    }
    .cta-content h2 {
      font-size: 32px;
    }
    .footer-bottom {
      flex-direction: column;
      gap: 10px;
    }
    .reasons-grid {
      grid-template-columns: 1fr;
      gap: 32px;
    }
    .video-item {
      width: 85vw;
      margin: 0 10px;
    }
    .nav-container {
      display: none;
    }
  }
</style>
