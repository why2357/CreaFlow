<template>
  <div class="navbar">
    <div class="right-menu flex align-center">
      <template v-if="appStore.device !== 'mobile'">
        <!-- 充值按钮 -->
        <RechargeButton ref="rechargeButtonRef" />

        <!-- 消息通知 -->
        <!-- <el-tooltip content="消息" effect="dark" placement="bottom">
          <div class="right-menu-item hover-effect">
            <el-popover placement="bottom" trigger="click" transition="el-zoom-in-top" :width="300" :persistent="false">
              <template #reference>
                <el-badge :value="newNotice > 0 ? newNotice : ''" :max="99">
                  <svg-icon icon-class="message" style="font-size: 20px" />
                </el-badge>
              </template>
              <template #default>
                <notice></notice>
              </template>
            </el-popover>
          </div>
        </el-tooltip> -->
      </template>

      <!-- 用户头像下拉菜单 -->
      <UserProfileDropdown />
    </div>
  </div>
</template>

<script setup lang="ts">
  import RechargeButton from '@/components/RechargeButton/index.vue';
  import UserProfileDropdown from '@/components/UserProfileDropdown/index.vue';
  import useAppStore from '@/store/modules/app';
  import useNoticeStore from '@/store/modules/notice';
  import { ref } from 'vue';

  const appStore = useAppStore();
  const noticeStore = storeToRefs(useNoticeStore());
  const newNotice = ref(<number>0);
  const rechargeButtonRef = ref<InstanceType<typeof RechargeButton>>();

  // 监听消息数量
  watch(
    () => noticeStore.state.value.notices,
    (newVal) => {
      newNotice.value = newVal.filter((item: any) => !item.read).length;
    },
    { deep: true }
  );

  /**
   * 刷新充值按钮积分
   * 在生成图片或扣点后调用此方法
   */
  const refreshWalletPoints = () => {
    rechargeButtonRef.value?.refresh();
  };

  // 暴露方法供父组件调用
  defineExpose({
    initTenantList: () => {}, // 保留接口兼容性
    refreshWalletPoints
  });
</script>

<style lang="scss" scoped>
  :deep(.el-badge__content.is-fixed) {
    top: 12px;
  }

  .flex {
    display: flex;
  }

  .align-center {
    align-items: center;
  }

  .navbar {
    position: relative;
    display: flex;
    align-items: center;
    height: 60px;
    padding: 0 24px;
    overflow: hidden;
    background: transparent;

    .right-menu {
      display: flex;
      align-items: center;
      height: 100%;
      gap: 16px;
      margin-left: auto;

      &:focus {
        outline: none;
      }

      .right-menu-item {
        display: inline-flex;
        justify-content: center;
        align-items: center;
        height: 40px;
        border-radius: 8px;
        color: #5a5e66;
        font-size: 18px;

        &.hover-effect {
          cursor: pointer;
          transition: all 0.3s;

          &:hover {
            background: rgb(82 82 255 / 8%);
          }
        }
      }
    }
  }
</style>
