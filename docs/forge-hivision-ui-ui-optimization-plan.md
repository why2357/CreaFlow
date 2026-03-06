# 创流（Forge HiVision）UI 美化方案

> **项目路径**: `D:\Project\forge-hivision-ui`  
> **设计主题**: "电影工坊" - 深色、戏剧性、专业创作感  
> **文档用途**: 供 Cursor AI 根据此文档修改代码

---

## 📋 目录

1. [配色系统优化](#一配色系统优化)
2. [字体系统升级](#二字体系统升级)
3. [项目创建页面优化](#三项目创建页面优化)
4. [项目列表页卡片优化](#四项目列表页卡片优化)
5. [整体布局优化](#五整体布局优化)
6. [交互动画增强](#六交互动画增强)
7. [背景氛围增强](#七背景氛围增强)
8. [Element Plus 组件覆盖](#八element-plus-组件覆盖)
9. [实施优先级](#九实施优先级)

---

## 一、配色系统优化

### 1.1 修改文件

📁 `src/assets/styles/variables.module.scss`

### 1.2 当前问题

```scss
// 当前配色（过于通用）
$--color-primary: #409eff;  // Element Plus 默认蓝
$blue: #324157;
$light-blue: #3a71a8;
```

### 1.3 修改方案

**完整替换 `variables.module.scss` 中的配色部分：**

```scss
// ============================================
// 配色系统 - "电影工坊" 主题
// ============================================

:root {
  // ---- 主色调：戏剧性橙金 ----
  --el-color-primary: #ff6b35;
  --el-color-primary-light-3: #ff8c5a;
  --el-color-primary-light-5: #ffa07a;
  --el-color-primary-light-7: #ffb899;
  --el-color-primary-light-9: #ffd4c4;
  --el-color-primary-dark-2: #e55a28;
  
  // ---- 背景层次（深色系） ----
  --bg-primary: #0a0a0f;
  --bg-secondary: #141420;
  --bg-elevated: #1c1c2e;
  --bg-surface: #242438;
  
  // ---- 文字层次 ----
  --text-primary: #f5f5f7;
  --text-secondary: #a0a0b0;
  --text-muted: #6a6a7a;
  
  // ---- 渐变强调 ----
  --gradient-primary: linear-gradient(135deg, #ff6b35 0%, #ffa726 100%);
  --gradient-glow: linear-gradient(135deg, rgba(255,107,53,0.2) 0%, rgba(255,167,38,0.1) 100%);
  
  // ---- 语义色（柔和版） ----
  --color-success: #4ade80;
  --color-warning: #fbbf24;
  --color-danger: #f87171;
  --color-info: #60a5fa;
  
  // ---- 边框与分割 ----
  --border-subtle: rgba(255,255,255,0.05);
  --border-emphasis: rgba(255,107,53,0.2);
  
  // ---- 阴影层次 ----
  --shadow-sm: 0 2px 8px rgba(0,0,0,0.3);
  --shadow-md: 0 4px 24px rgba(0,0,0,0.4);
  --shadow-lg: 0 8px 40px rgba(0,0,0,0.5);
  --shadow-glow: 0 4px 16px rgba(255,107,53,0.4);

  // ---- 菜单系统（保留原有变量，更新值） ----
  --menuBg: #0a0a0f;
  --menuColor: #a0a0b0;
  --menuActiveText: #ff6b35;
  --menuHover: #1c1c2e;

  --subMenuBg: #0a0a0f;
  --subMenuActiveText: #ff6b35;
  --subMenuHover: #1c1c2e;
  --subMenuTitleHover: #1c1c2e;

  --fixedHeaderBg: rgba(10,10,15,0.8);
  --tableHeaderBg: var(--bg-elevated);
  --tableHeaderTextColor: var(--text-secondary);
}

// ---- 暗色模式增强 ----
html.dark {
  --menuBg: #0a0a0f;
  --menuColor: #a0a0b0;
  --menuActiveText: #ff6b35;
  --menuHover: #1c1c2e;

  --subMenuBg: #0a0a0f;
  --subMenuActiveText: #ff6b35;
  --subMenuHover: #1c1c2e;
  --subMenuTitleHover: #1c1c2e;

  --fixedHeaderBg: rgba(10,10,15,0.8);
  --tableHeaderBg: var(--bg-elevated);
  --tableHeaderTextColor: var(--text-secondary);

  // Element Plus 暗色覆盖
  .el-tree-node__content {
    --el-color-primary-light-9: rgba(255,107,53,0.1);
  }
}

// ============================================
// 基础颜色变量（SCSS）
// ============================================

$blue: #324157;
$light-blue: #3a71a8;
$red: #f87171;
$pink: #f472b6;
$green: #4ade80;
$tiffany: #4ab7bd;
$yellow: #fbbf24;
$panGreen: #4ade80;

// ============================================
// 菜单主题（更新为深色）
// ============================================

$base-menu-color: var(--menuColor);
$base-menu-hover: var(--menuHover);
$base-menu-color-active: var(--menuActiveText);
$base-menu-background: var(--menuBg);
$base-logo-title-color: #f5f5f7;

$base-menu-light-color: rgba(0, 0, 0, 0.7);
$base-menu-light-background: #ffffff;
$base-logo-light-title-color: #ff6b35;

$base-sub-menu-background: var(--subMenuBg);
$base-sub-menu-hover: var(--subMenuHover);
$base-sub-menu-title-hover: var(--subMenuTitleHover);

// ============================================
// 表单与表格
// ============================================

$fixed-header-bg: var(--fixedHeaderBg);
$table-header-bg: var(--tableHeaderBg);
$table-header-text-color: var(--tableHeaderTextColor);

// ============================================
// Element Plus 主色覆盖
// ============================================

$--color-primary: #ff6b35;
$--color-success: #4ade80;
$--color-warning: #fbbf24;
$--color-danger: #f87171;
$--color-info: #60a5fa;

// ============================================
// 布局尺寸
// ============================================

$base-sidebar-width: 200px; // 从 240px 收窄

// ============================================
// 导出变量（供 JS 使用）
// ============================================

:export {
  menuColor: $base-menu-color;
  menuLightColor: $base-menu-light-color;
  menuColorActive: $base-menu-color-active;
  menuBackground: $base-menu-background;
  menuLightBackground: $base-menu-light-background;
  subMenuBackground: $base-sub-menu-background;
  subMenuHover: $base-sub-menu-hover;
  sideBarWidth: $base-sidebar-width;
  logoTitleColor: $base-logo-title-color;
  logoLightTitleColor: $base-logo-light-title-color;
  primaryColor: $--color-primary;
  successColor: $--color-success;
  dangerColor: $--color-danger;
  infoColor: $--color-info;
  warningColor: $--color-warning;
}
```

---

## 二、字体系统升级

### 2.1 修改文件

📁 `src/assets/styles/index.scss`

### 2.2 当前问题

```scss
// 当前字体（系统默认，缺乏辨识度）
font-family: Helvetica Neue, Helvetica, PingFang SC, 
             Hiragino Sans GB, Microsoft YaHei, Arial, sans-serif;
```

### 2.3 修改方案

**在 `index.scss` 文件顶部添加字体引入，并修改 body 字体设置：**

```scss
// ============================================
// 在文件最顶部添加字体引入
// ============================================

@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');

// ============================================
// 修改 body 字体设置
// ============================================

body {
  height: 100%;
  margin: 0;
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  // 替换原有字体
  font-family: 'Outfit', 'PingFang SC', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, sans-serif;
  // 添加背景色（配合深色主题）
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

// ============================================
// 添加标题字体类（可选使用）
// ============================================

.font-display {
  font-family: 'Space Grotesk', 'PingFang SC', sans-serif;
  letter-spacing: -0.02em;
}

.font-mono {
  font-family: 'JetBrains Mono', 'Consolas', monospace;
}

// ============================================
// 添加全局文字颜色类
// ============================================

.text-primary {
  color: var(--text-primary);
}

.text-secondary {
  color: var(--text-secondary);
}

.text-muted {
  color: var(--text-muted);
}

.text-accent {
  color: var(--el-color-primary);
}
```

---

## 三、项目创建页面优化

### 3.1 修改文件

📁 `src/views/workbench/project-creation/index.vue`

### 3.2 优化内容

#### 3.2.1 步骤导航条样式（`<style>` 部分）

**替换 `.step-tabs` 相关样式：**

```scss
// ============================================
// 步骤导航条 - 胶片条设计
// ============================================

.step-tabs {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0;
  padding: 8px 24px;
  border-radius: 40px;
  // 深色背景 + 磨砂玻璃
  background: rgba(28,28,46,0.6);
  border: 1px solid var(--border-emphasis);
  backdrop-filter: blur(10px);
  box-shadow: var(--shadow-md);
  transition: opacity 0.3s ease;

  &.tabs-initializing {
    opacity: 0.6;
    pointer-events: none;
  }

  // 胶片孔洞装饰（左侧）
  &::before,
  &::after {
    content: '';
    position: absolute;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: rgba(255,107,53,0.3);
    transition: all 0.3s;
  }
  
  &::before {
    left: 12px;
  }
  
  &::after {
    right: 12px;
  }

  // ============================================
  // 单个步骤标签
  // ============================================

  .step-tab {
    display: flex;
    height: 32px;
    padding: 0 20px;
    justify-content: center;
    align-items: center;
    position: relative;
    gap: 8px;
    border: none;
    cursor: pointer;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

    &.tab-disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    // 步骤内容
    .step-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    // 步骤图标
    .step-icon {
      width: 18px;
      height: 18px;
      font-size: 18px;
      color: var(--text-muted);
      transition: all 0.3s;
    }

    // 步骤名称
    .step-name {
      color: var(--text-secondary);
      font-size: 14px;
      font-weight: 500;
      letter-spacing: 0.3px;
      text-align: center;
      white-space: nowrap;
      transition: all 0.3s;
    }

    // ============================================
    // 悬停状态
    // ============================================

    &:hover:not(.tab-disabled):not(.active) {
      background: rgba(255,107,53,0.1);
      border-radius: 16px;

      .step-icon {
        color: var(--el-color-primary) !important;
      }

      .step-name {
        color: var(--el-color-primary);
      }
    }

    // ============================================
    // 激活状态
    // ============================================

    &.active {
      background: var(--gradient-primary);
      border-radius: 16px;
      box-shadow: var(--shadow-glow), 0 0 0 1px rgba(255,107,53,0.5);

      .step-icon {
        color: white !important;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        animation: iconPulse 2s ease-in-out infinite;
      }

      .step-name {
        color: white;
        font-weight: 700;
        text-shadow: 0 1px 2px rgba(0,0,0,0.2);
      }
      
      .dropdown-icon {
        color: white;
      }
    }

    // ============================================
    // 下拉触发器
    // ============================================

    .dropdown-trigger {
      display: inline-flex;
      align-items: center;
      margin-left: 4px;
      padding: 2px 6px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        background: rgba(255,255,255,0.2);

        .dropdown-icon {
          transform: rotate(180deg);
        }
      }

      .dropdown-icon {
        font-size: 12px;
        transition: transform 0.3s;
      }
    }
  }
}

// ============================================
// 图标脉冲动画
// ============================================

@keyframes iconPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.08);
  }
}

// ============================================
// 下拉菜单样式
// ============================================

:deep(.el-dropdown-menu__item) {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  transition: all 0.3s;

  &:hover {
    background-color: rgba(255,107,53,0.1);
    color: var(--el-color-primary);
  }

  .step-icon {
    transition: color 0.3s;
  }

  &:hover .step-icon {
    color: var(--el-color-primary);
  }
}
```

#### 3.2.2 全局加载遮罩样式

**替换 `.global-loading-overlay` 相关样式：**

```scss
// ============================================
// 全局加载遮罩
// ============================================

.global-loading-overlay {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 2000;
  display: flex;
  justify-content: center;
  align-items: center;
  // 深色背景 + 磨砂
  background: rgba(10,10,15,0.95);
  backdrop-filter: blur(20px);

  .loading-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    padding: 48px 64px;
    border-radius: 24px;
    // 渐变背景
    background: linear-gradient(135deg, 
      rgba(255,107,53,0.1) 0%, 
      rgba(28,28,46,0.9) 100%);
    border: 1px solid var(--border-emphasis);
    box-shadow: 
      var(--shadow-lg),
      inset 0 1px 0 rgba(255,255,255,0.05);

    .loading-icon {
      color: var(--el-color-primary);
      animation: rotate 1.5s linear infinite;
      filter: drop-shadow(0 0 20px rgba(255,107,53,0.5));
    }

    .loading-text {
      color: var(--text-primary);
      font-size: 16px;
      font-weight: 600;
      letter-spacing: 1px;
    }
  }
}

// 保持原有的旋转动画
@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}
```

#### 3.2.3 顶部导航栏样式

**替换 `.top-header` 相关样式：**

```scss
// ============================================
// 顶部导航栏
// ============================================

.top-header {
  position: relative;
  z-index: 100;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 64px;
  padding: 0 24px;
  // 深色背景 + 磨砂
  background: rgba(10,10,15,0.6);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-sm);

  .header-left {
    .logo-back {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 8px 12px;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        background: rgba(255,107,53,0.1);
        
        .project-title {
          color: var(--el-color-primary);
        }
      }
      
      .line-sty {
        width: 1px;
        height: 20px;
        flex-shrink: 0;
        border-radius: 23px;
        background: rgba(255,255,255,0.1);
      }

      .el-icon {
        transition: transform 0.3s;
      }

      &:hover .el-icon {
        transform: translateX(-3px);
      }

      .project-title {
        color: var(--text-primary);
        font-size: 20px;
        font-weight: 700;
        letter-spacing: 0.3px;
        font-family: 'Space Grotesk', sans-serif;
      }
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 20px;

    .notifications {
      padding: 10px;
      border-radius: 50%;
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        background: rgba(255,107,53,0.1);
      }

      .el-icon {
        color: var(--text-secondary);
        transition: color 0.3s;
      }

      &:hover .el-icon {
        color: var(--el-color-primary);
      }

      .notification-badge {
        :deep(.el-badge__content) {
          border: 2px solid var(--bg-primary);
          background: var(--gradient-primary);
          font-weight: 600;
        }
      }
    }

    .user-avatar {
      border: 2px solid var(--border-subtle);
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        border-color: var(--el-color-primary);
        box-shadow: var(--shadow-glow);
        transform: scale(1.05);
      }
    }
  }
}
```

#### 3.2.4 主内容区样式

**替换 `.center-content` 相关样式：**

```scss
// ============================================
// 主内容区
// ============================================

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.center-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: 24px;
  overflow: hidden;
  // 渐变背景
  background: linear-gradient(180deg, 
    transparent 0%, 
    rgba(255,107,53,0.02) 100%);

  .step-content {
    flex: 1;
    overflow: hidden;
    // 页面加载动画
    animation: contentFadeIn 0.6s ease-out;
  }

  .bottom-actions {
    display: flex;
    justify-content: end;
    margin-top: 16px;
    padding-bottom: 16px;

    .el-button {
      height: 44px;
      border-radius: 22px;
      font-size: 15px;
      font-weight: 600;
      letter-spacing: 0.5px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        transform: translateY(-2px);
      }

      &:active {
        transform: translateY(0);
      }

      &.el-button--primary {
        background: var(--gradient-primary);
        border: none;
        box-shadow: var(--shadow-glow);

        &:hover {
          box-shadow: 0 6px 24px rgba(255,107,53,0.5);
        }
      }
    }

    .next-sty {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 6px;
      width: 88px;
      height: 36px;
      padding: 8px 16px;
      border-radius: 10px;
      background: var(--gradient-primary);
      box-shadow: var(--shadow-glow);
    }
  }
}

// ============================================
// 页面加载动画
// ============================================

@keyframes contentFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// ============================================
// 淡入淡出动画
// ============================================

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// ============================================
// 步骤切换动画
// ============================================

.step-fade-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.step-fade-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.6, 1);
}

.step-fade-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.step-fade-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
```

---

## 四、项目列表页卡片优化

### 4.1 修改文件

📁 `src/views/workbench/project-admin/index.vue`

### 4.2 优化内容

#### 4.2.1 项目卡片样式

**替换 `.project-card` 相关样式：**

```scss
// ============================================
// 项目卡片
// ============================================

.project-card {
  position: relative;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  width: 280px;
  height: 226px;
  overflow: hidden;
  border-radius: 16px;
  // 深色背景
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-md), inset 0 1px 0 rgba(255,255,255,0.05);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  
  // 底部发光线（悬停时显示）
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 2px;
    background: var(--gradient-primary);
    border-radius: 0 0 16px 16px;
    transition: width 0.4s ease;
    z-index: 10;
  }

  &:hover {
    transform: translateY(-8px);
    box-shadow: 
      var(--shadow-lg),
      0 0 0 1px rgba(255,107,53,0.3);
    
    &::after {
      width: 60%;
    }
    
    .cover-image {
      transform: scale(1.05);
    }
    
    .card-actions {
      opacity: 1;
    }
  }

  // ============================================
  // 卡片封面
  // ============================================

  .card-cover {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 164px;
    overflow: hidden;
    cursor: pointer;

    .cover-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s ease;
    }

    .cover-placeholder {
      color: white;
      opacity: 0.8;
    }

    // 底部渐变遮罩
    &::before {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 60px;
      background: linear-gradient(to top, 
        rgba(0,0,0,0.6) 0%, 
        transparent 100%);
      z-index: 1;
      pointer-events: none;
    }

    // ============================================
    // 积分显示
    // ============================================

    .points-badge {
      position: absolute;
      top: 12px;
      left: 12px;
      z-index: 2;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      background: var(--gradient-primary);
      color: white;
      backdrop-filter: blur(10px);
      box-shadow: 0 2px 8px rgba(255,107,53,0.3);
      display: flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;

      // 关闭按钮样式
      .close-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        color: white;
        font-size: 12px;
        opacity: 0;
        pointer-events: none;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          background-color: var(--color-danger);
        }
      }

      // 悬浮时显示关闭按钮
      &:hover .close-icon {
        opacity: 1;
        pointer-events: auto;
      }
    }

    // ============================================
    // 角色标签
    // ============================================

    .role-badge {
      position: absolute;
      top: 12px;
      right: 12px;
      z-index: 2;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.5px;
      backdrop-filter: blur(10px);
      display: flex;
      width: 40px;
      height: 24px;
      justify-content: center;
      align-items: center;
      flex-shrink: 0;
      border-radius: 8px;

      &.director {
        background: var(--gradient-primary);
        border: none;
        color: white;
        box-shadow: 0 2px 8px rgba(255,107,53,0.3);
      }

      &.specialist {
        background: rgba(96,165,250,0.2);
        border: 1px solid rgba(96,165,250,0.4);
        color: #60a5fa;
      }
    }
  }

  // ============================================
  // 卡片信息
  // ============================================

  .card-info {
    display: flex;
    flex: 1;
    flex-direction: column;
    justify-content: space-between;
    padding: 14px;
    cursor: pointer;
    background: var(--bg-elevated);
    border-top: 1px solid var(--border-subtle);

    .project-name {
      margin: 0 0 8px;
      overflow: hidden;
      color: var(--text-primary);
      font-size: 14px;
      font-weight: 600;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .project-time {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 0;
      color: var(--text-secondary);
      font-size: 12px;

      .el-icon {
        font-size: 12px;
      }
    }
  }

  // ============================================
  // 操作菜单按钮
  // ============================================

  .card-actions {
    position: absolute;
    bottom: 12px;
    right: 12px;
    z-index: 3;
    opacity: 0;
    transition: opacity 0.3s;

    // 下拉菜单展开时保持可见
    &.dropdown-active {
      opacity: 1;
    }

    .action-btn {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 28px;
      height: 28px;
      border-radius: 8px;
      background: rgba(28,28,46,0.9);
      border: 1px solid var(--border-subtle);
      box-shadow: var(--shadow-sm);
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        background: var(--bg-surface);
        border-color: var(--el-color-primary);
        transform: scale(1.1);
      }

      .el-icon {
        color: var(--text-secondary);
        font-size: 16px;
      }
    }
  }
}
```

#### 4.2.2 滚动箭头样式

**替换 `.scroll-arrow` 相关样式：**

```scss
// ============================================
// 滚动箭头
// ============================================

.projects-scroll-wrapper {
  position: relative;

  .scroll-arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 10;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: var(--bg-surface);
    border: 1px solid var(--border-emphasis);
    box-shadow: var(--shadow-md);
    cursor: pointer;
    transition: all 0.3s;

    .el-icon {
      font-size: 20px;
      color: var(--el-color-primary);
      transition: all 0.3s;
    }

    &:hover {
      background: var(--gradient-primary);
      border-color: transparent;
      box-shadow: 
        0 8px 24px rgba(255,107,53,0.4),
        0 0 0 2px rgba(255,107,53,0.3);

      .el-icon {
        color: white;
        transform: scale(1.2);
      }
    }

    &.left {
      left: -22px;
    }

    &.right {
      right: -22px;
    }
  }
}
```

#### 4.2.3 容器样式

**替换 `.project-container` 相关样式：**

```scss
// ============================================
// 项目容器
// ============================================

.project-container {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  width: 100%;
  height: calc(100vh - 60px);
  padding: 0 24px 24px;
  overflow-y: auto;
  overflow-x: hidden;
  // 渐变背景
  background: linear-gradient(180deg, 
    transparent 0%, 
    rgba(255,107,53,0.02) 100%);

  // 自定义滚动条样式
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    border-radius: 3px;
    background-color: rgba(144,147,153,0.3);
    transition: background-color 0.3s;

    &:hover {
      background-color: rgba(144,147,153,0.5);
    }
  }
}

// ============================================
// 全部项目区域
// ============================================

.all-projects-section {
  margin-bottom: 48px;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;

    .title-section {
      .main-title {
        margin: 0 0 6px;
        color: var(--text-primary);
        font-size: 20px;
        font-weight: 600;
      }

      .sub-title {
        margin: 0;
        color: var(--text-secondary);
        font-size: 14px;
      }
    }

    .add-btn {
      border-radius: 10px;
      background: var(--gradient-primary);
      border: none;
      box-shadow: var(--shadow-glow);
      
      &:hover {
        box-shadow: 0 6px 20px rgba(255,107,53,0.5);
        transform: translateY(-2px);
      }
    }
  }
}

// ============================================
// 项目横向滚动列表
// ============================================

.project-list-horizontal {
  display: flex;
  gap: 20px;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 8px 0 16px;
  scroll-behavior: smooth;

  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

// ============================================
// 空状态
// ============================================

.empty-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 80px 20px;

  .empty-image {
    margin-bottom: 24px;
  }

  .empty-text {
    margin: 0 0 32px;
    color: var(--text-secondary);
    font-size: 14px;
    text-align: center;
  }

  .add-btn {
    display: flex;
    justify-content: center;
    align-items: center;
    min-width: 100px;
    padding: 12px 28px;
    border-radius: 10px;
    background: var(--gradient-primary);
    border: none;
    box-shadow: var(--shadow-glow);
    
    &:hover {
      box-shadow: 0 6px 20px rgba(255,107,53,0.5);
      transform: translateY(-2px);
    }
  }
}

// ============================================
// 加载提示卡片
// ============================================

.loading-tip-card {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 8px;
  width: 200px;
  height: 226px;
  color: var(--text-secondary);
  font-size: 14px;
  background: rgba(28,28,46,0.5);
  border-radius: 12px;

  .el-icon {
    font-size: 24px;
    color: var(--el-color-primary);
  }
}

// ============================================
// 删除选项红色高亮
// ============================================

:deep(.delete-item) {
  color: var(--color-danger);
  
  &:hover {
    color: var(--color-danger);
    background: rgba(248,113,113,0.1);
    
    .el-icon {
      color: var(--color-danger);
    }
  }
}
```

---

## 五、整体布局优化

### 5.1 修改文件

📁 `src/layout/index.vue` 的 `<style>` 部分

### 5.2 优化内容

```scss
// ============================================
// 应用包装器
// ============================================

.app-wrapper {
  @include clearfix;

  position: relative;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  // 深色背景
  background-color: var(--bg-primary);

  .main-container {
    background-repeat: no-repeat;
    background-size: contain;
  }

  &.mobile.openSidebar {
    position: fixed;
    top: 0;
  }
}

// ============================================
// 抽屉背景
// ============================================

.drawer-bg {
  position: absolute;
  top: 0;
  z-index: 999;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(4px);
}

// ============================================
// 固定头部
// ============================================

.fixed-header {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 9;
  width: calc(100% - #{$base-sidebar-width});
  // 深色背景 + 磨砂
  background: var(--fixedHeaderBg);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-sm);
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
```

---

## 六、交互动画增强

### 6.1 修改文件

📁 `src/assets/styles/transition.scss`（或在组件中添加）

### 6.2 新增动画

```scss
// ============================================
// 页面加载动画
// ============================================

@keyframes contentFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// ============================================
// 卡片入场动画
// ============================================

@keyframes cardFloatIn {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

// 卡片入场动画类
.card-animate-in {
  animation: cardFloatIn 0.5s ease-out backwards;
  animation-delay: calc(var(--card-index, 0) * 0.08s);
}

// ============================================
// 图标脉冲动画
// ============================================

@keyframes iconPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.08);
  }
}

// ============================================
// 扫描线动画（AI生成进度）
// ============================================

@keyframes scanLine {
  from {
    left: -100%;
  }
  to {
    left: 100%;
  }
}

// 生成中状态
.generating {
  position: relative;
  overflow: hidden;

  // 扫描线效果
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, 
      transparent 0%, 
      rgba(255,107,53,0.1) 50%, 
      transparent 100%);
    animation: scanLine 2s linear infinite;
    pointer-events: none;
    z-index: 10;
  }
}

// ============================================
// 按钮点击反馈
// ============================================

.btn-press-feedback {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:active {
    transform: scale(0.95);
  }
}

// ============================================
// 悬停发光效果
// ============================================

.hover-glow {
  transition: all 0.3s ease;

  &:hover {
    box-shadow: var(--shadow-glow);
  }
}
```

---

## 七、背景氛围增强

### 7.1 修改文件

📁 `src/App.vue` 或 `src/assets/styles/index.scss`

### 7.2 添加全局背景

```scss
// ============================================
// 在 index.scss 的 body 中添加
// ============================================

body {
  height: 100%;
  margin: 0;
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  font-family: 'Outfit', 'PingFang SC', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, sans-serif;
  
  // 深色主背景
  background-color: var(--bg-primary);
  color: var(--text-primary);
  
  // 渐变氛围
  background-image: 
    radial-gradient(circle at 20% 20%, 
      rgba(255,107,53,0.03) 0%, 
      transparent 50%),
    radial-gradient(circle at 80% 80%, 
      rgba(255,167,38,0.03) 0%, 
      transparent 50%);
  background-attachment: fixed;
  
  // 可选：添加噪点纹理
  &::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.02'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: -1;
  }
}

// 确保暗色模式下背景一致
html.dark body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
}
```

---

## 八、Element Plus 组件覆盖

### 8.1 修改文件

📁 `src/assets/styles/element-ui.scss`

### 8.2 完整覆盖样式

**在文件末尾添加：**

```scss
// ============================================
// Element Plus 组件样式覆盖 - "电影工坊"主题
// ============================================

// ---- 按钮 ----
.el-button--primary {
  background: var(--gradient-primary);
  border: none;
  box-shadow: var(--shadow-glow);
  font-weight: 600;
  letter-spacing: 0.3px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover,
  &:focus {
    background: linear-gradient(135deg, #ff8c5a 0%, #ffb899 100%);
    box-shadow: 0 6px 20px rgba(255,107,53,0.5);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0) scale(0.98);
  }

  &.is-disabled,
  &.is-disabled:hover {
    background: linear-gradient(135deg, 
      rgba(255,107,53,0.5) 0%, 
      rgba(255,167,38,0.5) 100%);
    box-shadow: none;
  }
}

.el-button--default {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
  
  &:hover {
    background: var(--bg-surface);
    border-color: var(--el-color-primary);
    color: var(--el-color-primary);
  }
}

// ---- 输入框 ----
.el-input__wrapper {
  background: rgba(28,28,46,0.5);
  border: 1px solid var(--border-subtle);
  box-shadow: none;
  transition: all 0.3s;

  &:hover {
    border-color: rgba(255,107,53,0.3);
  }

  &.is-focus {
    border-color: var(--el-color-primary);
    box-shadow: 0 0 0 3px rgba(255,107,53,0.1);
  }

  input {
    color: var(--text-primary);
    
    &::placeholder {
      color: var(--text-muted);
    }
  }
}

.el-textarea__inner {
  background: rgba(28,28,46,0.5);
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
  
  &:hover {
    border-color: rgba(255,107,53,0.3);
  }
  
  &:focus {
    border-color: var(--el-color-primary);
    box-shadow: 0 0 0 3px rgba(255,107,53,0.1);
  }
}

// ---- 对话框 ----
.el-overlay {
  background-color: rgba(0,0,0,0.6);
  backdrop-filter: blur(4px);
}

.el-dialog {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  box-shadow: 
    var(--shadow-lg),
    inset 0 1px 0 rgba(255,255,255,0.05);

  .el-dialog__header {
    border-bottom: 1px solid var(--border-subtle);
    padding: 20px 24px;
  }

  .el-dialog__title {
    color: var(--text-primary);
    font-weight: 600;
    font-size: 18px;
  }

  .el-dialog__headerbtn {
    top: 20px;
    right: 20px;
    
    .el-dialog__close {
      color: var(--text-secondary);
      
      &:hover {
        color: var(--el-color-primary);
      }
    }
  }

  .el-dialog__body {
    color: var(--text-primary);
    padding: 24px;
  }

  .el-dialog__footer {
    border-top: 1px solid var(--border-subtle);
    padding: 16px 24px;
  }
}

// ---- 下拉菜单 ----
.el-dropdown-menu {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-lg);
  border-radius: 12px;
  padding: 8px;

  .el-dropdown-menu__item {
    color: var(--text-secondary);
    border-radius: 8px;
    padding: 10px 16px;
    margin: 2px 0;
    transition: all 0.3s;

    &:hover {
      background: rgba(255,107,53,0.1);
      color: var(--el-color-primary);
    }

    &.is-disabled {
      color: var(--text-muted);
    }
  }
}

// ---- 标签页 ----
.el-tabs {
  &__header {
    border-bottom: 1px solid var(--border-subtle);
  }

  &__item {
    color: var(--text-secondary);
    font-weight: 500;
    transition: all 0.3s;

    &.is-active {
      color: var(--el-color-primary);
    }

    &:hover {
      color: var(--el-color-primary-light-3);
    }
  }

  &__active-bar {
    background: var(--gradient-primary);
    height: 3px;
    border-radius: 2px;
  }
}

// ---- 标签 ----
.el-tag {
  border-radius: 6px;
  font-weight: 500;
  
  &.el-tag--primary {
    background: rgba(255,107,53,0.1);
    border-color: rgba(255,107,53,0.3);
    color: var(--el-color-primary);
  }
  
  &.el-tag--success {
    background: rgba(74,222,128,0.1);
    border-color: rgba(74,222,128,0.3);
    color: var(--color-success);
  }
  
  &.el-tag--warning {
    background: rgba(251,191,36,0.1);
    border-color: rgba(251,191,36,0.3);
    color: var(--color-warning);
  }
  
  &.el-tag--danger {
    background: rgba(248,113,113,0.1);
    border-color: rgba(248,113,113,0.3);
    color: var(--color-danger);
  }
}

// ---- 消息提示 ----
.el-message {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-lg);
  border-radius: 12px;
  
  .el-message__content {
    color: var(--text-primary);
  }
  
  &.el-message--success {
    border-color: rgba(74,222,128,0.3);
    
    .el-message__icon {
      color: var(--color-success);
    }
  }
  
  &.el-message--warning {
    border-color: rgba(251,191,36,0.3);
    
    .el-message__icon {
      color: var(--color-warning);
    }
  }
  
  &.el-message--error {
    border-color: rgba(248,113,113,0.3);
    
    .el-message__icon {
      color: var(--color-danger);
    }
  }
}

// ---- 确认框 ----
.el-message-box {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-lg);
  border-radius: 16px;

  .el-message-box__title {
    color: var(--text-primary);
    font-weight: 600;
  }

  .el-message-box__content {
    color: var(--text-secondary);
  }
}

// ---- 卡片 ----
.el-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  box-shadow: var(--shadow-md);
  transition: all 0.3s;

  &:hover {
    box-shadow: var(--shadow-lg);
  }

  .el-card__header {
    border-bottom: 1px solid var(--border-subtle);
    color: var(--text-primary);
    font-weight: 600;
  }

  .el-card__body {
    color: var(--text-secondary);
  }
}

// ---- 表格 ----
.el-table {
  background: transparent;
  color: var(--text-primary);

  &::before {
    background-color: var(--border-subtle);
  }

  th.el-table__cell {
    background: var(--bg-elevated);
    color: var(--text-secondary);
    border-bottom: 1px solid var(--border-subtle);
    font-weight: 600;
  }

  td.el-table__cell {
    border-bottom: 1px solid var(--border-subtle);
  }

  tr {
    background: transparent;

    &:hover {
      background: rgba(255,107,53,0.05);
    }
  }

  .el-table__row--striped {
    background: rgba(255,255,255,0.02);
  }
}

// ---- 分页 ----
.el-pagination {
  .el-pager li {
    background: transparent;
    color: var(--text-secondary);
    
    &.is-active {
      background: var(--gradient-primary);
      color: white;
    }
    
    &:hover {
      color: var(--el-color-primary);
    }
  }
  
  button {
    background: transparent;
    color: var(--text-secondary);
    
    &:hover {
      color: var(--el-color-primary);
    }
  }
}

// ---- 选择器 ----
.el-select-dropdown {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-lg);
  border-radius: 12px;

  .el-select-dropdown__item {
    color: var(--text-secondary);

    &:hover {
      background: rgba(255,107,53,0.1);
      color: var(--el-color-primary);
    }

    &.is-selected {
      color: var(--el-color-primary);
      font-weight: 600;
    }
  }
}

// ---- 开关 ----
.el-switch {
  &.is-checked {
    .el-switch__core {
      background: var(--gradient-primary);
      border-color: transparent;
    }
  }
}

// ---- 滑块 ----
.el-slider {
  &__bar {
    background: var(--gradient-primary);
  }

  &__button {
    border-color: var(--el-color-primary);
  }
}

// ---- 进度条 ----
.el-progress {
  &__bar {
    background: var(--gradient-primary);
  }

  &__text {
    color: var(--text-primary);
  }
}

// ---- 面包屑 ----
.el-breadcrumb {
  &__item {
    .el-breadcrumb__inner {
      color: var(--text-secondary);

      &:hover {
        color: var(--el-color-primary);
      }
    }

    &:last-child {
      .el-breadcrumb__inner {
        color: var(--text-primary);
      }
    }
  }

  &__separator {
    color: var(--text-muted);
  }
}

// ---- 表单 ----
.el-form-item {
  &__label {
    color: var(--text-secondary);
    font-weight: 500;
  }
}

// ---- 上传 ----
.el-upload-dragger {
  background: var(--bg-elevated);
  border: 2px dashed var(--border-subtle);
  border-radius: 12px;
  transition: all 0.3s;

  &:hover {
    border-color: var(--el-color-primary);
    background: rgba(255,107,53,0.05);
  }

  .el-icon--upload {
    color: var(--el-color-primary);
  }

  .el-upload__text {
    color: var(--text-secondary);

    em {
      color: var(--el-color-primary);
    }
  }
}

// ---- 空状态 ----
.el-empty {
  &__description {
    color: var(--text-secondary);
  }
}

// ---- 加载 ----
.el-loading-mask {
  background: rgba(10,10,15,0.8);
  backdrop-filter: blur(4px);
}

.el-loading-spinner {
  .circular {
    .path {
      stroke: var(--el-color-primary);
    }
  }

  .el-loading-text {
    color: var(--text-primary);
  }
}

// ---- Tooltip ----
.el-tooltip__popper {
  background: var(--bg-surface) !important;
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
  box-shadow: var(--shadow-md);
  border-radius: 8px;
}

// ---- Popover ----
.el-popover {
  &.el-popper {
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    box-shadow: var(--shadow-lg);
    border-radius: 12px;
    color: var(--text-primary);
  }
}

// ---- 抽屉 ----
.el-drawer {
  background: var(--bg-elevated);

  &__header {
    color: var(--text-primary);
    border-bottom: 1px solid var(--border-subtle);
    padding: 20px 24px;
    margin-bottom: 0;
  }

  &__body {
    color: var(--text-secondary);
    padding: 24px;
  }
}

// ---- 日期选择器 ----
.el-date-picker {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);

  .el-date-table {
    th {
      color: var(--text-secondary);
    }

    td {
      &.available:hover {
        color: var(--el-color-primary);
      }

      &.today span {
        color: var(--el-color-primary);
      }

      &.current:not(.disabled) span {
        background: var(--gradient-primary);
      }
    }
  }
}
```

---

## 九、实施优先级

### 9.1 P0 - 立即可做（1-2天）

**影响最大、风险最小的基础改造**

1. ✅ **修改配色系统** (`variables.module.scss`)
   - 替换主色调为橙金色系
   - 添加背景层次变量
   - 更新菜单主题色

2. ✅ **引入新字体** (`index.scss`)
   - 添加 Google Fonts 引入
   - 更新 body 字体设置
   - 添加字体工具类

3. ✅ **覆盖 Element Plus 按钮样式** (`element-ui.scss`)
   - 主按钮渐变背景
   - 悬停发光效果
   - 点击反馈

4. ✅ **优化全局背景** (`index.scss` 或 `App.vue`)
   - 添加渐变氛围
   - 可选噪点纹理

### 9.2 P1 - 短期优化（3-5天）

**核心页面的视觉升级**

1. 🎨 **项目创建页步骤条** (`project-creation/index.vue`)
   - 胶片条设计
   - 图标脉冲动画
   - 连接线效果

2. 🎨 **项目卡片样式** (`project-admin/index.vue`)
   - 深色背景
   - 底部发光线
   - 悬停变换增强

3. 🎨 **侧边栏深色主题** (`sidebar.scss`)
   - 深色渐变背景
   - 激活项高亮
   - 发光装饰

4. 🎨 **添加卡片入场动画** (`transition.scss`)
   - 渐入 + 上浮
   - 交错延迟

### 9.3 P2 - 中期完善（1-2周）

**增强交互体验**

1. 🎬 **AI 生成进度动画**
   - 扫描线效果
   - 呼吸发光

2. 🎬 **页面加载动画**
   - 内容渐入
   - 骨架屏（可选）

3. 🎬 **滚动箭头交互** (`project-admin/index.vue`)
   - 渐变背景
   - 悬停发光

4. 🎬 **全局微交互覆盖**
   - 所有按钮点击反馈
   - 输入框聚焦效果
   - 下拉菜单动画

### 9.4 P3 - 长期打磨（持续）

**品牌化与细节完善**

1. 🌟 **自定义图标库**
   - 双色图标
   - 动态图标

2. 🌟 **主题切换动画**
   - 深色/浅色过渡
   - 颜色渐变

3. 🌟 **空状态插画**
   - 品牌化设计
   - 动态效果

4. 🌟 **品牌元素**
   - Logo 优化
   - 自定义加载动画
   - Favicon

---

## 十、实施建议

### 10.1 渐进式实施

1. **先修改全局样式**（配色、字体、Element Plus 覆盖）
2. **再优化核心页面**（项目创建页、项目列表页）
3. **最后打磨细节**（动画、微交互）

### 10.2 测试要点

- ✅ 深色/浅色模式切换是否正常
- ✅ 所有 Element Plus 组件是否受影响
- ✅ 响应式布局是否正常
- ✅ 动画性能是否流畅
- ✅ 可访问性（对比度、焦点状态）

### 10.3 回滚方案

建议在修改前：
1. 创建 Git 分支 `feature/ui-optimization`
2. 每完成一个优先级，提交一次
3. 遇到问题可快速回滚

### 10.4 兼容性注意

- 字体引入需要网络连接
- `backdrop-filter` 在旧浏览器可能不支持
- 噪点纹理可能影响性能（可选关闭）

---

## 十一、效果对比

| 维度 | 当前 | 优化后 |
|------|------|--------|
| **色调** | 蓝白科技风 `#409eff` | 深橙电影感 `#ff6b35` |
| **字体** | 系统默认 | Outfit + Space Grotesk |
| **背景** | 纯白/灰 `#ffffff` | 深色渐变 `#0a0a0f` |
| **卡片** | 白色扁平 | 深色浮层 + 发光边缘 |
| **按钮** | 纯色 | 渐变 + 发光阴影 |
| **动画** | 基础过渡 | 丰富微交互 |
| **氛围** | 企业后台感 | 电影创作工作室感 |

---

## 十二、快速开始

### 给 Cursor 的指令示例

```
请根据文档 forge-hivision-ui-ui-optimization-plan.md 中的内容，
按照 P0 优先级，依次修改以下文件：

1. src/assets/styles/variables.module.scss - 配色系统
2. src/assets/styles/index.scss - 字体系统
3. src/assets/styles/element-ui.scss - Element Plus 覆盖

请保持原有功能不变，只修改样式部分。
```

---

**文档版本**: v1.0  
**创建日期**: 2026-03-06  
**适用项目**: 创流 (Forge HiVision)  
**设计主题**: "电影工坊" - 深色、戏剧性、专业创作感

---

## 附录：设计理念

### "电影工坊" 主题核心

> **"从企业后台 → 电影级创作工坊"**

**视觉关键词**:
- 🎬 **电影感** - 深色、戏剧性光影、胶片质感
- ✨ **创作工具感** - 专业但不冰冷、有温度的科技感
- 🎭 **艺术感** - 突破传统 UI 框架、界面本身就是艺术品

**差异化记忆点**:
> "一个让你感觉像在电影后期工作室的 AI 创作平台"

**与竞品差异**:
- 不像 Runway 那样冰冷科技感
- 不像剪映那样工具化
- 而是 **"电影人的创作伙伴"** 氛围

---

**文档结束**
