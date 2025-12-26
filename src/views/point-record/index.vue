<template>
  <div class="fff-input-inner">
    <transition
      :enter-active-class="proxy?.animate.searchAnimate.enter"
      :leave-active-class="proxy?.animate.searchAnimate.leave"
    >
      <div class="card-sty-box" v-show="showSearch">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="流水号" prop="walletTransactionId">
              <el-input
                v-model="queryParams.walletTransactionId"
                placeholder="请输入流水号"
                clearable
                style="width: 240px"
                @keyup.enter="handleQuery"
              />
            </el-form-item>
            <el-form-item label="用户ID" prop="transUserId">
              <el-input
                v-model="queryParams.transUserId"
                placeholder="请输入用户ID"
                clearable
                style="width: 240px"
                @keyup.enter="handleQuery"
              />
            </el-form-item>
            <el-form-item label="用户名称" prop="nickName">
              <el-input
                v-model="queryParams.nickName"
                placeholder="请输入用户名称"
                clearable
                style="width: 240px"
                @keyup.enter="handleQuery"
              />
            </el-form-item>
            <el-form-item label="手机号" prop="phoneNumber">
              <el-input
                v-model="queryParams.phoneNumber"
                placeholder="请输入手机号"
                clearable
                style="width: 240px"
                @keyup.enter="handleQuery"
              />
            </el-form-item>
            <el-form-item label="流水类型" prop="transType">
              <el-select v-model="queryParams.transType" placeholder="请选择流水类型" clearable style="width: 240px">
                <el-option label="支出" :value="1" />
                <el-option label="返还" :value="2" />
              </el-select>
            </el-form-item>
            <el-form-item label="流水名称" prop="transName">
              <el-select v-model="queryParams.transName" placeholder="请选择流水名称" clearable style="width: 240px">
                <el-option
                  v-for="walletType in walletTypeList"
                  :key="walletType.code"
                  :label="walletType.desc"
                  :value="walletType.desc"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="使用场景" prop="selectedProjectId">
              <el-select
                v-model="selectedProjectId"
                placeholder="请选择使用场景"
                clearable
                style="width: 240px"
                @change="handleProjectChange"
              >
                <el-option
                  v-for="project in projectList"
                  :key="project.id"
                  :label="project.projectName"
                  :value="project.id || ''"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="记录时间" style="width: 340px">
              <el-date-picker
                v-model="dateRange"
                value-format="YYYY-MM-DD"
                type="daterange"
                range-separator="-"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                @change="handleDateChange"
              />
            </el-form-item>
            <el-form-item>
              <el-button @click="resetQuery" icon="Refresh">重置</el-button>
              <el-button type="primary" @click="handleQuery" icon="Search">搜索</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </transition>

    <el-card shadow="hover">
      <el-table v-loading="loading" :data="transactionList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column
          label="流水号"
          align="center"
          prop="walletTransactionId"
          min-width="120"
          fixed="left"
          show-overflow-tooltip
        />
        <el-table-column label="用户ID" align="center" prop="transUserId" min-width="120" show-overflow-tooltip />
        <el-table-column label="用户名称" align="center" prop="nickName" min-width="120" show-overflow-tooltip />
        <el-table-column label="手机号码" align="center" prop="phoneNumber" min-width="120" show-overflow-tooltip />
        <el-table-column label="流水类型" align="center" prop="transType" width="100">
          <template #default="scope">
            <spam v-if="scope.row.transType === 1">支出</spam>
            <span v-else-if="scope.row.transType === 2">返还</span>
            <span v-else>/</span>
          </template>
        </el-table-column>
        <el-table-column label="流水名称" align="center" prop="transName" min-width="120" show-overflow-tooltip />
        <el-table-column label="使用场景" align="center" prop="projectName" min-width="120" show-overflow-tooltip />
        <el-table-column label="点数数额" align="center" prop="pointsCost" width="120" />
        <el-table-column label="消耗时间" align="center" prop="createTime" width="170">
          <template #default="scope">
            <span>{{ parseTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-show="total > 0"
        :total="total"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        @pagination="getList"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts" name="PointRecord">
  import { getWalletTypes, listTransaction } from '@/api/transaction';
  import { TransactionQuery, TransactionVO, WalletTypeVO } from '@/api/transaction/types';
  import { getAllProjects } from '@/api/workbench/project';
  import { ProjectResponse } from '@/api/workbench/project/types';
  import { ElMessage } from 'element-plus';
  import { getCurrentInstance, onMounted, reactive, ref } from 'vue';

  const { proxy } = getCurrentInstance() as any;

  const loading = ref(true);
  const showSearch = ref(true);
  const transactionList = ref<TransactionVO[]>([]);
  const projectList = ref<ProjectResponse[]>([]);
  const walletTypeList = ref<WalletTypeVO[]>([]);
  const total = ref(0);
  const dateRange = ref<[DateModelType, DateModelType]>(['', '']);
  const ids = ref<number[]>([]);
  const single = ref(true);
  const multiple = ref(true);

  // 用于界面绑定的单选项目ID
  const selectedProjectId = ref<number | undefined>(undefined);

  const queryParams = reactive<TransactionQuery>({
    pageNum: 1,
    pageSize: 10,
    walletTransactionId: undefined,
    transUserId: undefined,
    nickName: undefined,
    phoneNumber: undefined,
    transName: undefined,
    transType: undefined,
    projectIdList: undefined,
    startTime: undefined,
    endTime: undefined
  });

  const getProjectList = async () => {
    try {
      const res = await getAllProjects();
      projectList.value = res.rows;
    } catch (error) {
      console.error('Get project list failed:', error);
      ElMessage.error('获取项目列表失败');
      projectList.value = [];
    }
  };

  const getWalletTypeList = async () => {
    try {
      const res = await getWalletTypes();
      walletTypeList.value = res.data || [];
    } catch (error) {
      console.error('Get wallet types failed:', error);
      ElMessage.error('获取流水名称列表失败');
      walletTypeList.value = [];
    }
  };

  const getList = async () => {
    loading.value = true;
    try {
      const res = await listTransaction(queryParams);
      transactionList.value = res.rows || [];
      total.value = res.total || 0;
    } catch (error) {
      console.error('Get transaction list failed:', error);
    } finally {
      loading.value = false;
    }
  };

  const handleProjectChange = (value: number | undefined) => {
    // 将单选的项目ID转换为数组格式
    if (value !== undefined && value !== null) {
      queryParams.projectIdList = [value];
    } else {
      queryParams.projectIdList = undefined;
    }
  };

  const handleQuery = () => {
    queryParams.pageNum = 1;
    getList();
  };

  const resetQuery = () => {
    dateRange.value = ['', ''];
    selectedProjectId.value = undefined;
    queryParams.walletTransactionId = undefined;
    queryParams.transUserId = undefined;
    queryParams.nickName = undefined;
    queryParams.phoneNumber = undefined;
    queryParams.transName = undefined;
    queryParams.transType = undefined;
    queryParams.projectIdList = undefined;
    queryParams.startTime = undefined;
    queryParams.endTime = undefined;
    handleQuery();
  };

  const handleDateChange = (value: [string, string]) => {
    if (value && value.length === 2) {
      queryParams.startTime = value[0];
      queryParams.endTime = value[1];
    } else {
      queryParams.startTime = undefined;
      queryParams.endTime = undefined;
    }
  };

  const handleSelectionChange = (selection: TransactionVO[]) => {
    ids.value = selection.map((item) => item.walletTransactionId as number);
    single.value = selection.length !== 1;
    multiple.value = !selection.length;
  };

  const parseTime = (time: any) => {
    if (!time) return '';
    const date = new Date(time);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  onMounted(() => {
    getProjectList();
    getWalletTypeList();
    getList();
  });
</script>

<style scoped lang="scss">
  .card-sty-box {
    margin-bottom: 20px;
    border-radius: 8px !important;
  }
  .new-add-btn {
    height: 28px;
    line-height: 28px;
    padding: 10px;
    gap: 10px;
    border-radius: 4px;
    border: 1px solid #5252ff;
    background: #f3f3ff;
    color: #5252ff;
    font-size: 13px;
  }
  .btn-op {
    height: 28px;
    line-height: 28px;
    padding: 7px 12px;
    gap: 10px;
    border-radius: 100px;
    border: 1px solid #dcdfe6;
    color: #5252ff;
    font-size: 13px;
  }
</style>
