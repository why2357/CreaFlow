<template>
  <div>
    <!-- Main -->
    <div class="con-header">
      <div>
        <div class="text-xl font-bold">租户管理</div>
        <p class="text-gray-500 text-sm">管理客户接入、点数配额及用量分析</p>
      </div>
      <el-button type="primary" @click="handleCreateTenant">开通新租户</el-button>
    </div>

    <div class="content_box">
      <!-- Tenant Table -->
      <el-card class="mb-6">
        <div class="table-container" @scroll="handleTenantScroll">
          <el-table v-loading="tableLoading" :data="tenantList" style="width: 100%">
            <el-table-column label="公司名称 / 管理员" min-width="300" fixed="left">
              <template #default="{ row, $index }">
                <div class="font-bold">
                  {{ row.tenantName }}
                  <span class="text-xs text-gray-400"> #{{ 1001 + $index }}</span>
                </div>
                <div class="mt-1 flex flex-wrap gap-1">
                  <el-tag
                    v-for="admin in row.pmUserList"
                    :key="admin.userId"
                    size="small"
                    closable
                    @close="handleRemoveAdmin(row, admin)"
                  >
                    {{ admin.phonenumber }}
                  </el-tag>
                  <span v-if="!row.pmUserList || row.pmUserList.length === 0" class="text-gray-400 text-xs">
                    暂无管理员
                  </span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="pointsAvailable" label="可用积分" min-width="200" show-overflow-tooltip>
              <template #default="{ row }">
                {{ formatNumber(row.pointsAvailable) }}
              </template>
            </el-table-column>
            <el-table-column prop="pointsTotal" label="累计获得积分" min-width="200" show-overflow-tooltip>
              <template #default="{ row }">
                {{ formatNumber(row.pointsTotal) }}
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="累计营收 (RMB)" min-width="200" show-overflow-tooltip>
              <template #default="{ row }"> ¥{{ formatNumber(row.amount) }} </template>
            </el-table-column>
            <el-table-column label="状态">
              <template #default="{ row }">
                <el-tag :type="row.status === 0 ? 'success' : 'danger'">
                  {{ row.status === 0 ? '正常' : '冻结' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="260" fixed="right">
              <template #default="{ row }">
                <el-button size="small" type="primary" @click="handleAllocatePoints(row)">分配点数</el-button>
                <el-button size="small" @click="handleAddAdmin(row)">加管理员</el-button>
                <el-button
                  size="small"
                  :type="row.status === 0 ? 'danger' : 'success'"
                  @click="handleToggleStatus(row)"
                >
                  {{ row.status === 0 ? '冻结' : '解冻' }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <div v-if="tableLoading && tenantList.length > 0" class="loading-more">加载中...</div>
          <div v-if="!tenantHasMore && tenantList.length > 0" class="no-more">没有更多数据</div>
        </div>
      </el-card>

      <!-- Recharge Logs -->
      <el-card>
        <template #header>配额变更流水 (Audit Logs)</template>
        <div class="table-container" @scroll="handleLogsScroll">
          <el-table v-loading="logsLoading" :data="rechargeLogs">
            <el-table-column prop="createTime" label="时间" min-width="200" show-overflow-tooltip>
              <template #default="{ row }">
                {{ formatDate(row.createTime) }}
              </template>
            </el-table-column>
            <el-table-column prop="tenantName" label="租户" min-width="200" show-overflow-tooltip />
            <el-table-column prop="rechargeType" label="类型" min-width="200" show-overflow-tooltip>
              <template #default="{ row }">
                <el-tag
                  :style="{
                    backgroundColor: row.rechargeType === 1 ? 'rgb(238, 242, 255)' : 'rgb(254, 226, 226)',
                    color: row.rechargeType === 1 ? 'rgb(103, 96, 233)' : 'rgb(220, 38, 38)',
                    border: 'none'
                  }"
                  size="small"
                >
                  {{ row.rechargeType === 1 ? '后台发放' : '扣减回收' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="金额 (RMB)" min-width="200" show-overflow-tooltip>
              <template #default="{ row }">
                <span :style="{ color: row.rechargeType === 1 ? 'rgb(103, 96, 233)' : 'rgb(220, 38, 38)' }">
                  {{ row.rechargeType === 1 ? '+ ' : '- ' }}¥{{ formatNumber(row.amount) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="points" label="点数(PTS)" min-width="200" show-overflow-tooltip>
              <template #default="{ row }">
                <span :style="{ color: row.rechargeType === 1 ? 'rgb(103, 96, 233)' : 'rgb(220, 38, 38)' }">
                  {{ row.rechargeType === 1 ? '+ ' : '- ' }}{{ formatNumber(row.points) }}
                </span>
              </template>
            </el-table-column>
          </el-table>
          <div v-if="logsLoading && rechargeLogs.length > 0" class="loading-more">加载中...</div>
          <div v-if="!logsHasMore && rechargeLogs.length > 0" class="no-more">没有更多数据</div>
        </div>
      </el-card>
    </div>

    <!-- Dialogs -->
    <CreateTenantDialog v-model="createDialogVisible" @success="handleRefresh" />
    <AddAdminDialog v-model="adminDialogVisible" :tenant-id="selectedTenant?.id" @success="handleRefresh" />
    <AllocatePointsDialog
      v-model="allocDialogVisible"
      :tenant-id="selectedTenant?.tenantId"
      :tenant-name="selectedTenant?.tenantName"
      :current-balance="selectedTenant?.pointsAvailable"
      @success="handleRefresh"
    />
  </div>
</template>

<script setup lang="ts">
  import { deletePM, getRechargeList, getTenantList, updateTenantStatus } from '@/api/system/tenant-admin/index';
  import type { SysTenantWalletVo, SysUser, SysWalletRechargeVo } from '@/api/system/tenant-admin/types';
  import { formatDate } from '@/utils/sskj';
  import { ElMessage, ElMessageBox } from 'element-plus';
  import { onMounted, ref } from 'vue';
  import AddAdminDialog from './components/AddAdminDialog.vue';
  import AllocatePointsDialog from './components/AllocatePointsDialog.vue';
  import CreateTenantDialog from './components/CreateTenantDialog.vue';

  // 数据状态
  const tenantList = ref<SysTenantWalletVo[]>([]);
  const rechargeLogs = ref<SysWalletRechargeVo[]>([]);
  const tableLoading = ref(false);
  const logsLoading = ref(false);

  // 分页状态 - 租户列表
  const tenantPageNum = ref(1);
  const tenantPageSize = ref(20);
  const tenantHasMore = ref(true);

  // 分页状态 - 点数记录
  const logsPageNum = ref(1);
  const logsPageSize = ref(20);
  const logsHasMore = ref(true);

  // 对话框状态
  const createDialogVisible = ref(false);
  const adminDialogVisible = ref(false);
  const allocDialogVisible = ref(false);
  const selectedTenant = ref<SysTenantWalletVo | null>(null);

  // 格式化数字（添加千分位）
  const formatNumber = (num?: number) => {
    if (num === null || num === undefined) {
      return '0';
    }
    return num.toLocaleString('zh-CN');
  };

  // 初始化加载数据
  onMounted(() => {
    loadTenantList();
    loadRechargeLogs();
  });

  // 加载租户列表
  const loadTenantList = async (isLoadMore = false) => {
    if (!isLoadMore) {
      tenantPageNum.value = 1;
      tenantHasMore.value = true;
    }

    if (!tenantHasMore.value || tableLoading.value) return;

    try {
      tableLoading.value = true;
      const res = await getTenantList({
        pageNum: tenantPageNum.value,
        pageSize: tenantPageSize.value
      });

      const newData = res.rows || [];

      if (isLoadMore) {
        tenantList.value = [...tenantList.value, ...newData];
      } else {
        tenantList.value = newData;
      }

      // 如果返回的数据少于pageSize，说明没有更多数据了
      tenantHasMore.value = newData.length >= tenantPageSize.value;

      if (tenantHasMore.value) {
        tenantPageNum.value++;
      }
    } catch (error) {
      console.error('加载租户列表失败:', error);
      ElMessage.error('加载租户列表失败');
    } finally {
      tableLoading.value = false;
    }
  };

  // 加载充值记录
  const loadRechargeLogs = async (isLoadMore = false) => {
    if (!isLoadMore) {
      logsPageNum.value = 1;
      logsHasMore.value = true;
    }

    if (!logsHasMore.value || logsLoading.value) return;

    try {
      logsLoading.value = true;
      const res = await getRechargeList({
        pageNum: logsPageNum.value,
        pageSize: logsPageSize.value
      });

      const newData = res.rows || [];

      if (isLoadMore) {
        rechargeLogs.value = [...rechargeLogs.value, ...newData];
      } else {
        rechargeLogs.value = newData;
      }

      // 如果返回的数据少于pageSize，说明没有更多数据了
      logsHasMore.value = newData.length >= logsPageSize.value;

      if (logsHasMore.value) {
        logsPageNum.value++;
      }
    } catch (error) {
      console.error('加载充值记录失败:', error);
      ElMessage.error('加载充值记录失败');
    } finally {
      logsLoading.value = false;
    }
  };

  // 租户列表滚动事件
  const handleTenantScroll = (event: Event) => {
    const target = event.target as HTMLElement;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight;
    const clientHeight = target.clientHeight;

    // 距离底部还有100px时开始加载
    if (scrollHeight - scrollTop - clientHeight < 100) {
      loadTenantList(true);
    }
  };

  // 点数记录滚动事件
  const handleLogsScroll = (event: Event) => {
    const target = event.target as HTMLElement;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight;
    const clientHeight = target.clientHeight;

    // 距离底部还有100px时开始加载
    if (scrollHeight - scrollTop - clientHeight < 100) {
      loadRechargeLogs(true);
    }
  };

  // 刷新数据
  const handleRefresh = () => {
    loadTenantList(false);
    loadRechargeLogs(false);
  };

  // 打开创建租户对话框
  const handleCreateTenant = () => {
    createDialogVisible.value = true;
  };

  // 打开添加管理员对话框
  const handleAddAdmin = (tenant: SysTenantWalletVo) => {
    selectedTenant.value = tenant;
    adminDialogVisible.value = true;
  };

  // 打开分配点数对话框
  const handleAllocatePoints = (tenant: SysTenantWalletVo) => {
    if (tenant.status === 1) {
      ElMessage.error('账户已冻结，无法分配点数');
      return;
    }
    selectedTenant.value = tenant;
    allocDialogVisible.value = true;
  };

  // 移除管理员（降级为普通客户）
  const handleRemoveAdmin = async (tenant: SysTenantWalletVo, admin: SysUser) => {
    if (!admin.userId) {
      ElMessage.error('管理员ID不存在');
      return;
    }

    try {
      await ElMessageBox.confirm(`确定要将管理员 "${admin.phonenumber || admin.userName}" 降级为普通客户吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      });

      await deletePM({ userId: admin.userId });
      ElMessage.success('管理员移除成功');
      handleRefresh();
    } catch (error) {
      if (error !== 'cancel') {
        console.error('移除管理员失败:', error);
      }
    }
  };

  // 切换租户状态
  const handleToggleStatus = async (tenant: SysTenantWalletVo) => {
    const action = tenant.status === 0 ? '冻结' : '解冻';
    try {
      await ElMessageBox.confirm(`确认${action}该租户？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      });

      if (!tenant.id) {
        ElMessage.error('租户ID不存在');
        return;
      }

      await updateTenantStatus({
        id: tenant.id,
        status: tenant.status === 0 ? 1 : 0
      });

      ElMessage.success(`${action}成功`);
      handleRefresh();
    } catch (error) {
      if (error !== 'cancel') {
        console.error(`${action}失败:`, error);
      }
    }
  };
</script>

<style scoped>
  .table-container {
    max-height: 500px;
    overflow-y: auto;
  }

  .loading-more,
  .no-more {
    text-align: center;
    padding: 12px 0;
    color: #909399;
    font-size: 14px;
  }

  .loading-more {
    color: #409eff;
  }
  .con-header {
    display: flex;
    align-items: first baseline;
    justify-content: space-between;
  }
  .content_box {
    /* margin-top: 20px; */
  }
</style>
