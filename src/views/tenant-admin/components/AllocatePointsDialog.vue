<template>
  <!-- 遮罩层 -->
  <transition name="fade">
    <div v-if="visible" class="dialog-overlay">
      <!-- 弹窗主体 -->
      <transition name="scale">
        <div v-if="visible" class="dialog-container" :class="allocMode" @click.stop>
          <!-- 头部区域 -->
          <div class="dialog-header">
            <div class="header-content">
              <h2 class="dialog-title">
                {{ allocMode === 'add' ? '发放点数 (充值)' : '扣减点数 (回收)' }}
              </h2>
              <p class="dialog-subtitle">当前对象: {{ tenantName }}</p>
            </div>
            <div class="mode-switcher">
              <button
                type="button"
                class="mode-btn add"
                :class="{ active: allocMode === 'add' }"
                @click="allocMode = 'add'"
              >
                发放 +
              </button>
              <button
                type="button"
                class="mode-btn reduce"
                :class="{ active: allocMode === 'reduce' }"
                @click="allocMode = 'reduce'"
              >
                扣减 -
              </button>
            </div>
          </div>

          <!-- 内容区域 -->
          <div class="dialog-body">
            <!-- 金额输入 -->
            <div class="form-group">
              <label class="form-label">涉及金额 (RMB)</label>
              <div class="input-wrapper">
                <span class="currency-symbol">¥</span>
                <input
                  v-model.number="formData.amount"
                  type="number"
                  class="text-input"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            <!-- 点数输入 -->
            <div class="form-group">
              <label class="form-label">变动点数 (Points)</label>
              <div class="input-wrapper">
                <input
                  v-model.number="formData.points"
                  type="number"
                  class="text-input"
                  placeholder="0"
                  step="100"
                  min="0"
                />
              </div>
            </div>

            <!-- 余额预览 -->
            <div class="balance-preview">
              <div class="balance-item">
                <span class="label">当前余额:</span>
                <span class="value">{{ formatNumber(currentBalance) }}</span>
              </div>
              <div class="arrow">→</div>
              <div class="balance-item">
                <span class="label">预计余额:</span>
                <span class="value preview" :class="allocMode">{{ formatNumber(previewBalance) }}</span>
              </div>
            </div>

            <!-- 错误提示 -->
            <div v-if="errorMessage" class="error-message">
              {{ errorMessage }}
            </div>
          </div>

          <!-- 底部按钮 -->
          <div class="dialog-footer">
            <button type="button" class="btn btn-cancel" @click="handleClose">取消</button>
            <button
              type="button"
              class="btn btn-confirm"
              :class="allocMode"
              :disabled="loading || !isValid"
              @click="handleConfirm"
            >
              {{ loading ? '处理中...' : `确认${allocMode === 'add' ? '发放' : '扣减'}` }}
            </button>
          </div>
        </div>
      </transition>
    </div>
  </transition>
</template>

<script setup lang="ts">
  import { allocatePoints } from '@/api/system/tenant-admin/index';
  import type { PointsAllocateRequestDto } from '@/api/system/tenant-admin/types';
  import { ElMessage } from 'element-plus';
  import { computed, reactive, ref, watch } from 'vue';

  interface Props {
    modelValue: boolean;
    tenantId?: string;
    tenantName?: string;
    currentBalance?: number;
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void;
    (e: 'success'): void;
  }

  const props = defineProps<Props>();
  const emit = defineEmits<Emits>();

  const loading = ref(false);
  const visible = ref(false);
  const allocMode = ref<'add' | 'reduce'>('add');
  const errorMessage = ref('');

  const formData = reactive({
    amount: 0,
    points: 0
  });

  // 预计余额
  const previewBalance = computed(() => {
    const current = props.currentBalance || 0;
    const change = formData.points || 0;
    return allocMode.value === 'add' ? current + change : current - change;
  });

  // 表单验证
  const isValid = computed(() => {
    const amount = formData.amount || 0;
    const points = formData.points || 0;

    // 金额和点数不能同时为零
    if (amount <= 0 && points <= 0) {
      return false;
    }

    // 扣减模式下，点数不能大于当前余额
    if (allocMode.value === 'reduce' && props.currentBalance !== undefined && points > props.currentBalance) {
      return false;
    }

    return true;
  });

  // 监听表单变化，更新错误提示
  watch(
    () => [formData.amount, formData.points, allocMode.value, props.currentBalance],
    () => {
      const amount = formData.amount || 0;
      const points = formData.points || 0;

      // 检查金额和点数是否同时为零
      if (amount <= 0 && points <= 0) {
        errorMessage.value = '涉及金额和变动点数不能同时为零，至少填写一项';
      } else if (
        allocMode.value === 'reduce' &&
        props.currentBalance !== undefined &&
        points > 0 &&
        points > props.currentBalance
      ) {
        errorMessage.value = '扣减点数不能大于当前余额';
      } else {
        errorMessage.value = '';
      }
    }
  );

  // 监听 modelValue 变化
  watch(
    () => props.modelValue,
    (val) => {
      visible.value = val;
      if (val) {
        // 重置表单
        allocMode.value = 'add';
        formData.amount = 0;
        formData.points = 0;
        errorMessage.value = '';
      }
    }
  );

  // 监听 visible 变化
  watch(visible, (val) => {
    emit('update:modelValue', val);
  });

  // 关闭对话框
  const handleClose = () => {
    visible.value = false;
  };

  // 格式化数字（添加千分位）
  const formatNumber = (num?: number) => {
    if (num === null || num === undefined) {
      return '0';
    }
    return num.toLocaleString('zh-CN');
  };

  // 确认分配
  const handleConfirm = async () => {
    if (!props.tenantId) {
      ElMessage.error('未选择租户');
      return;
    }

    if (!isValid.value) {
      ElMessage.error('请填写完整信息');
      return;
    }

    try {
      loading.value = true;
      const params: PointsAllocateRequestDto = {
        tenantId: props.tenantId,
        amount: formData.amount,
        points: formData.points,
        currency: 'CNY',
        rechargeFrom: 1, // 1-系统发放
        rechargeType: allocMode.value === 'add' ? 1 : 2 // 1-发放 2-扣减
      };
      await allocatePoints(params);
      ElMessage.success(`点数${allocMode.value === 'add' ? '发放' : '扣减'}成功`);
      visible.value = false;
      emit('success');
    } catch (error) {
      console.error('点数分配失败:', error);
    } finally {
      loading.value = false;
    }
  };
</script>

<style scoped>
  /* 动画效果 */
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }

  .scale-enter-active,
  .scale-leave-active {
    transition: all 0.3s ease;
  }

  .scale-enter-from,
  .scale-leave-to {
    opacity: 0;
    transform: scale(0.95);
  }

  /* 遮罩层 */
  .dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    padding: 20px;
  }

  /* 弹窗容器 */
  .dialog-container {
    background: white;
    border-radius: 16px;
    width: 100%;
    max-width: 480px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    overflow: hidden;
  }

  /* 头部区域 */
  .dialog-header {
    padding: 20px 40px 20px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 24px;
    transition: background-color 0.3s ease;
  }

  .dialog-container.add .dialog-header {
    background: #eef2ff;
  }

  .dialog-container.reduce .dialog-header {
    background: #fff5f5;
  }

  .header-content {
    flex: 1;
  }

  .dialog-title {
    font-size: 18px;
    font-weight: 700;
    margin: 0 0 8px 0;
    line-height: 1.3;
  }

  .dialog-container.add .dialog-title {
    color: #5b4fc3;
  }

  .dialog-container.reduce .dialog-title {
    color: #d32f2f;
  }

  .dialog-subtitle {
    font-size: 12px;
    margin: 0;
    line-height: 1.5;
  }

  .dialog-container.add .dialog-subtitle {
    color: #5b4fc3;
  }

  .dialog-container.reduce .dialog-subtitle {
    color: #d32f2f;
  }

  /* 模式切换器 */
  .mode-switcher {
    display: flex;
    gap: 8px;
  }

  .mode-btn {
    padding: 8px 20px;
    font-size: 14px;
    font-weight: 600;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .mode-btn.add {
    background: #e8eaf6;
    color: #666;
  }

  .mode-btn.add.active {
    background: #5b4fc3;
    color: white;
  }

  .mode-btn.reduce {
    background: #f5f5f5;
    color: #666;
  }

  .mode-btn.reduce.active {
    background: #d32f2f;
    color: white;
  }

  /* 内容区域 */
  .dialog-body {
    padding: 20px 40px 32px;
  }

  .form-group {
    margin-bottom: 24px;
  }

  .form-label {
    display: block;
    font-size: 15px;
    font-weight: 600;
    color: #333;
    margin-bottom: 12px;
  }

  /* 输入框容器 */
  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    background: #f5f7fa;
    border: 2px solid transparent;
    border-radius: 8px;
    transition: all 0.2s ease;
  }

  /* 发放模式聚焦时的蓝色边框 */
  .dialog-container.add .input-wrapper:focus-within {
    border-color: #5b4fc3;
  }

  /* 回收模式聚焦时的红色边框 */
  .dialog-container.reduce .input-wrapper:focus-within {
    border-color: #d32f2f;
  }

  .currency-symbol {
    position: absolute;
    left: 16px;
    font-size: 18px;
    font-weight: 600;
    color: #999;
    pointer-events: none;
  }

  .text-input {
    width: 100%;
    padding: 14px 16px;
    font-size: 16px;
    font-weight: 500;
    color: #333;
    background: transparent;
    border: none;
    outline: none;
  }

  .input-wrapper .currency-symbol + .text-input {
    padding-left: 36px;
  }

  .text-input::placeholder {
    color: #ccc;
  }

  /* 输入框箭头 */
  .input-arrows {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding-right: 12px;
  }

  .arrow {
    font-size: 10px;
    color: #999;
    cursor: pointer;
    user-select: none;
    line-height: 1;
  }

  .arrow:hover {
    color: #666;
  }

  /* 移除数字输入框的默认按钮 */
  input[type='number']::-webkit-inner-spin-button,
  input[type='number']::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  input[type='number'] {
    -moz-appearance: textfield;
    appearance: textfield;
  }

  /* 余额预览 */
  .balance-preview {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    background: #f5f5f5;
    border-radius: 8px;
    margin-top: 24px;
  }

  .balance-item {
    display: flex;
    /* flex-direction: column; */
    gap: 6px;
  }

  .balance-item .label {
    font-size: 13px;
    color: #666;
    font-weight: 500;
  }

  .balance-item .value {
    font-size: 20px;
    font-weight: 700;
    color: #333;
  }

  .balance-item .value.preview.add {
    color: #5b4fc3;
  }

  .balance-item .value.preview.reduce {
    color: #d32f2f;
  }

  .balance-preview .arrow {
    font-size: 18px;
    color: #ccc;
    margin: 0 16px;
  }

  /* 错误提示 */
  .error-message {
    margin-top: 16px;
    padding: 12px 16px;
    background: #fff5f5;
    border: 1px solid #ffcdd2;
    border-radius: 8px;
    color: #c62828;
    font-size: 14px;
    font-weight: 500;
  }

  /* 底部按钮 */
  .dialog-footer {
    padding: 0 40px 32px;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  .btn {
    padding: 12px 28px;
    font-size: 15px;
    font-weight: 600;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    outline: none;
  }

  .btn-cancel {
    background: #f5f5f5;
    color: #666;
  }

  .btn-cancel:hover {
    background: #e0e0e0;
  }

  .btn-confirm {
    min-width: 120px;
    color: white;
  }

  .btn-confirm.add {
    background: linear-gradient(135deg, #5b4fc3 0%, #7c6fd6 100%);
  }

  .btn-confirm.add:hover:not(:disabled) {
    background: linear-gradient(135deg, #4a3fb0 0%, #6b5ec5 100%);
  }

  .btn-confirm.reduce {
    background: linear-gradient(135deg, #d32f2f 0%, #e53935 100%);
  }

  .btn-confirm.reduce:hover:not(:disabled) {
    background: linear-gradient(135deg, #c62828 0%, #d32f2f 100%);
  }

  .btn-confirm:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
