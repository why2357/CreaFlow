<template>
  <el-dialog
    v-model="dialogVisible"
    :show-close="false"
    :close-on-click-modal="false"
    width="900px"
    class="select-workflow-dialog"
    align-center
  >
    <div class="workflow-dialog-container">
      <!-- 关闭按钮 -->
      <button class="close-btn" @click="handleCancel">
        <span class="close-icon-x"></span>
      </button>

      <!-- 标题 -->
      <div class="dialog-header">
        <h2 class="dialog-title">选择创作模式</h2>
        <p class="dialog-subtitle">请根据您的创作需求，选择适合的工作流</p>
      </div>

      <!-- 卡片区域 -->
      <div class="cards-container">
        <!-- 经典工作流卡片 -->
        <div
          class="workflow-card classic-card"
          :class="{
            'is-selected': selectedMode === 'classic',
            'is-unselected': selectedMode && selectedMode !== 'classic'
          }"
          @click="selectMode('classic')"
        >
          <div class="pattern-classic"></div>
          <div class="card-icon-wrapper classic-icon">
            <svg
              class="card-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
              <line x1="7" y1="2" x2="7" y2="22"></line>
              <line x1="17" y1="2" x2="17" y2="22"></line>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <line x1="2" y1="7" x2="7" y2="7"></line>
              <line x1="2" y1="17" x2="7" y2="17"></line>
              <line x1="17" y1="17" x2="22" y2="17"></line>
              <line x1="17" y1="7" x2="22" y2="7"></line>
            </svg>
          </div>
          <div class="card-indicator" :class="{ 'is-active': selectedMode === 'classic' }">
            <div class="indicator-dot"></div>
          </div>
          <h3 class="card-title">经典工作流</h3>
          <p class="card-desc">分步精准控制，打磨每一帧绝美分镜。</p>
          <div class="card-tag classic-tag">适合专业微调</div>
        </div>

        <!-- Seedance 2.0 卡片 -->
        <div
          class="workflow-card seedance-card"
          :class="{
            'is-selected': selectedMode === 'seedance',
            'is-unselected': selectedMode && selectedMode !== 'seedance'
          }"
          @click="selectMode('seedance')"
        >
          <div class="pattern-nextgen"></div>
          <div class="card-icon-wrapper seedance-icon">
            <svg
              class="card-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"
              ></path>
              <path d="M5 3v4"></path>
              <path d="M19 17v4"></path>
              <path d="M3 5h4"></path>
              <path d="M17 19h4"></path>
            </svg>
          </div>
          <div class="card-indicator" :class="{ 'is-active': selectedMode === 'seedance' }">
            <div class="indicator-dot"></div>
          </div>
          <h3 class="card-title">Seedance 2.0</h3>
          <p class="card-desc">端到端一键生成，享受极致流畅的创作魔法。</p>
          <div class="card-tag seedance-tag">
            <span>全新 AI 模型</span>
            <span class="pulse-badge">
              <span class="pulse-dot"></span>
            </span>
          </div>
        </div>
      </div>

      <!-- 底部按钮 -->
      <div class="dialog-footer">
        <button class="btn-cancel" @click="handleCancel">取消</button>
        <button class="btn-confirm" :disabled="!selectedMode" @click="handleConfirm">继续创建</button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts" name="SelectWorkflowDialog">
  import { ref, watch } from 'vue';

  interface Props {
    modelValue: boolean;
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void;
    (e: 'confirm', mode: 'classic' | 'seedance'): void;
  }

  const props = defineProps<Props>();
  const emit = defineEmits<Emits>();

  const selectedMode = ref<'classic' | 'seedance' | null>(null);

  const dialogVisible = ref(props.modelValue);

  watch(
    () => props.modelValue,
    (val) => {
      dialogVisible.value = val;
      if (!val) {
        // 关闭时重置选择
        selectedMode.value = null;
      }
    }
  );

  watch(dialogVisible, (val) => {
    emit('update:modelValue', val);
  });

  const selectMode = (mode: 'classic' | 'seedance') => {
    selectedMode.value = mode;
  };

  const handleConfirm = () => {
    if (selectedMode.value) {
      emit('confirm', selectedMode.value);
      dialogVisible.value = false;
    }
  };

  const handleCancel = () => {
    dialogVisible.value = false;
  };
</script>

<style scoped lang="scss">
  .select-workflow-dialog {
    // 确保遮罩层在最上层
    :deep(.el-overlay) {
      z-index: 9999 !important;
      background-color: rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
    }

    // 确保弹窗容器在最上层
    :deep(.el-dialog) {
      z-index: 10000 !important;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(40px);
      border: 1px solid rgba(255, 255, 255, 0.6);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      border-radius: 2rem;
      overflow: hidden;
    }

    :deep(.el-dialog__body) {
      padding: 0;
    }

    :deep(.el-dialog__header) {
      display: none;
    }
  }

  .workflow-dialog-container {
    position: relative;
    padding: 40px;
    background: linear-gradient(135deg, #fff5eb 0%, #f0f5ff 100%);
    min-height: 400px;
    z-index: 1;
  }

  // 背景图案 - 经典工作流
  .pattern-classic {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 0;
    background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0C13.431 0 0 13.431 0 30c0 16.569 13.431 30 30 30 16.569 0 30-13.431 30-30C60 13.431 46.569 0 30 0zm0 57C15.088 57 3 44.912 3 30S15.088 3 30 3s27 12.088 27 27-12.088 27-27 27zm0-51c-13.255 0-24 10.745-24 24s10.745 24 24 24 24-10.745 24-24-10.745-24-24-24zm0 45c-11.598 0-21-9.402-21-21s9.402-21 21-21 21 9.402 21 21-9.402 21-21 21zm0-39c-9.941 0-18 8.059-18 18s8.059 18 18 18 18-8.059 18-18-8.059-18-18-18zm0 33c-8.284 0-15-6.716-15-15s6.716-15 15-15 15 6.716 15 15-6.716 15-15 15z' fill='%23ea580c' fill-opacity='0.08' fill-rule='evenodd'/%3E%3C/svg%3E");
    mix-blend-mode: multiply;
    opacity: 0.5;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }

  // 背景图案 - Seedance
  .pattern-nextgen {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 0;
    background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l10 20 20 10-20 10-10 20-10-20-20-10 20-10L30 0zm0 13.5L24.5 24.5 13.5 30l11 5.5L30 46.5l5.5-11 11-5.5-11-5.5L30 13.5z' fill='%233b82f6' fill-opacity='0.06' fill-rule='evenodd'/%3E%3C/svg%3E");
    mix-blend-mode: multiply;
    opacity: 0.5;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }

  // 关闭按钮
  .close-btn {
    position: absolute;
    top: 24px;
    right: 24px;
    z-index: 100;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: none;
    background: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.8);
    }

    .close-icon-x {
      position: relative;
      width: 18px;
      height: 18px;

      &::before,
      &::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 14px;
        height: 2px;
        background: #9ca3af;
        border-radius: 2px;
      }

      &::before {
        transform: translate(-50%, -50%) rotate(45deg);
      }

      &::after {
        transform: translate(-50%, -50%) rotate(-45deg);
      }
    }

    &:hover .close-icon-x::before,
    &:hover .close-icon-x::after {
      background: #6b7280;
    }
  }

  // 标题区域
  .dialog-header {
    position: relative;
    z-index: 10;
    text-align: center;
    margin-bottom: 40px;

    .dialog-title {
      font-size: 28px;
      font-weight: 700;
      color: #111827;
      margin: 0 0 12px 0;
    }

    .dialog-subtitle {
      font-size: 16px;
      color: #6b7280;
      margin: 0;
    }
  }

  // 卡片容器
  .cards-container {
    position: relative;
    z-index: 10;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
    margin-bottom: 40px;
  }

  // 工作流卡片
  .workflow-card {
    position: relative;
    z-index: 10;
    padding: 32px 24px;
    border-radius: 16px;
    border: 2px solid transparent;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    align-items: flex-start;

    &.classic-card {
      background: linear-gradient(135deg, rgba(251, 146, 60, 0.08) 0%, rgba(251, 146, 60, 0.03) 100%);

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 40px -15px rgba(234, 88, 12, 0.3);

        .pattern-classic {
          opacity: 0.8;
        }
      }

      &.is-selected {
        border-color: #fb923c;
        box-shadow: 0 0 0 4px rgba(251, 146, 60, 0.1);
      }
    }

    &.seedance-card {
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0.03) 100%);

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 40px -15px rgba(59, 130, 246, 0.3);

        .pattern-nextgen {
          opacity: 0.8;
        }
      }

      &.is-selected {
        border-color: #3b82f6;
        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
      }
    }

    &.is-unselected {
      opacity: 0.6;
      transform: scale(0.98);
    }
  }

  // 卡片图标
  .card-icon-wrapper {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24px;

    &.classic-icon {
      background: rgba(251, 146, 60, 0.15);
      border: 1px solid rgba(251, 146, 60, 0.3);

      .card-icon {
        width: 24px;
        height: 24px;
        color: #ea580c;
      }
    }

    &.seedance-icon {
      background: rgba(59, 130, 246, 0.15);
      border: 1px solid rgba(59, 130, 246, 0.3);

      .card-icon {
        width: 24px;
        height: 24px;
        color: #3b82f6;
      }
    }
  }

  // 指示器
  .card-indicator {
    position: absolute;
    top: 24px;
    right: 24px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 2px solid #d1d5db;
    background: rgba(255, 255, 255, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;

    .indicator-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: transparent;
      transition: all 0.3s ease;
    }
  }

  // 经典工作流选中状态
  .workflow-card.classic-card.is-selected {
    .card-indicator {
      border-color: #fb923c;

      .indicator-dot {
        background: #ea580c;
      }
    }
  }

  // Seedance 选中状态
  .workflow-card.seedance-card.is-selected {
    .card-indicator {
      border-color: #3b82f6;

      .indicator-dot {
        background: #3b82f6;
      }
    }
  }

  // 卡片内容
  .card-title {
    font-size: 20px;
    font-weight: 700;
    color: #111827;
    margin: 0 0 8px 0;
  }

  .card-desc {
    font-size: 14px;
    color: #6b7280;
    margin: 0 0 auto;
    line-height: 1.6;
  }

  .card-tag {
    margin-top: 24px;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 8px;

    &.classic-tag {
      background: rgba(251, 146, 60, 0.15);
      color: #ea580c;
      border: 1px solid rgba(251, 146, 60, 0.3);
    }

    &.seedance-tag {
      background: rgba(59, 130, 246, 0.15);
      color: #3b82f6;
      border: 1px solid rgba(59, 130, 246, 0.3);
    }
  }

  // 呼吸灯动画
  .pulse-badge {
    position: relative;
    width: 8px;
    height: 8px;

    .pulse-dot {
      position: relative;
      width: 100%;
      height: 100%;
      background: #3b82f6;
      border-radius: 50%;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: #3b82f6;
        border-radius: 50%;
        animation: pulse 1.5s ease-out infinite;
      }
    }
  }

  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 0.75;
    }
    50% {
      transform: scale(2);
      opacity: 0;
    }
    100% {
      transform: scale(1);
      opacity: 0;
    }
  }

  // 底部按钮
  .dialog-footer {
    position: relative;
    z-index: 10;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 16px;
  }

  .btn-cancel,
  .btn-confirm {
    padding: 12px 24px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
  }

  .btn-cancel {
    background: transparent;
    color: #6b7280;

    &:hover {
      color: #111827;
    }
  }

  .btn-confirm {
    background: #111827;
    color: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

    &:hover:not(:disabled) {
      background: #000;
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  // 响应式
  @media (max-width: 768px) {
    .cards-container {
      grid-template-columns: 1fr;
    }

    .workflow-dialog-container {
      padding: 24px;
    }
  }
</style>
