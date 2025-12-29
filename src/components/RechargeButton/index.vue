<template>
  <el-button class="recharge-btn" :loading="loading">
    <svg-icon icon-class="fy-recharge" style="margin-right: 4px; width: 16px; height: 16px" />
    {{ walletPoints }}
  </el-button>
</template>

<script setup lang="ts">
  import { getWalletPoints } from '@/api/system/userCenter';
  import { onMounted, ref } from 'vue';

  const walletPoints = ref<number>(0);
  const loading = ref(false);

  /**
   * 获取钱包积分
   */
  const fetchWalletPoints = async () => {
    try {
      loading.value = true;
      const res = await getWalletPoints();
      if (res.code === 200 && res.data !== undefined) {
        walletPoints.value = res.data;
      }
    } catch (error) {
      console.error('获取钱包积分失败:', error);
    } finally {
      loading.value = false;
    }
  };

  onMounted(() => {
    fetchWalletPoints();
  });

  /**
   * 暴露刷新方法供外部调用
   * 在生成图片或扣点后调用此方法刷新积分
   */
  defineExpose({
    refresh: fetchWalletPoints
  });
</script>

<style lang="scss" scoped>
  .recharge-btn {
    display: flex;
    padding: 8px 15px 8px 14px;
    justify-content: center;
    align-items: center;
    border-radius: 8px;
    border: 1px solid #ffd9b0;
    background: #fffbeb;
    color: #f54900;
    font-family: Inter;
    font-size: 12px;
    font-style: normal;
    font-weight: 500;
    line-height: 16px;
  }
</style>
