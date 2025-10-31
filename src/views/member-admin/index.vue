<template>
  <div class="p-2">
    <transition
      :enter-active-class="proxy?.animate.searchAnimate.enter"
      :leave-active-class="proxy?.animate.searchAnimate.leave"
    >
      <div class="mb-[10px]" v-show="showSearch">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="用户ID" prop="userId">
              <el-input
                v-model="queryParams.userId"
                placeholder="请输入用户ID"
                clearable
                style="width: 240px"
                @keyup.enter="handleQuery"
              />
            </el-form-item>
            <el-form-item label="用户名称" prop="userName">
              <el-input
                v-model="queryParams.userName"
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
            <el-form-item label="注册时间" style="width: 340px">
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
              <el-button type="primary" @click="handleQuery" icon="Search">搜索</el-button>
              <el-button @click="resetQuery" icon="Refresh">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </transition>

    <el-card shadow="hover">
      <template #header>
        <el-row :gutter="10">
          <el-col :span="1.5">
            <el-button type="primary" plain @click="handleAdd" icon="Plus">新增用户</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
        </el-row>
      </template>

      <el-table v-loading="loading" :data="memberList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="用户id" align="center" prop="userId" width="100" />
        <el-table-column label="用户名称" align="center" prop="userName" show-overflow-tooltip />
        <el-table-column label="手机号码" align="center" prop="phonenumber" width="120" />
        <el-table-column label="累计消耗点数" align="center" prop="consumePoint" width="140" sortable />
        <el-table-column label="注册时间" align="center" prop="createTime" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="250" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="用量统计" placement="top">
              <el-button link type="success" @click="handleUsageStats(scope.row)"> 用量统计 </el-button>
            </el-tooltip>
            <el-tooltip content="模型统计" placement="top">
              <el-button link type="primary" @click="handleModelStats(scope.row)"> 模型统计 </el-button>
            </el-tooltip>
            <el-tooltip content="删除账号" placement="top">
              <el-button link type="danger" @click="handleDelete(scope.row)"> 删除账号 </el-button>
            </el-tooltip>
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

    <add-member ref="addMemberRef" @success="getList" />
  </div>
</template>

<script setup lang="ts" name="MemberAdmin">
  import { delMember, listMember } from '@/api/system/user';
  import { MemberQuery, MemberVO } from '@/api/system/user/types';
  import { ElMessage, ElMessageBox } from 'element-plus';
  import { getCurrentInstance, onMounted, reactive, ref } from 'vue';
  import AddMember from './components/AddMember.vue';

  const { proxy } = getCurrentInstance() as any;

  const loading = ref(true);
  const showSearch = ref(true);
  const memberList = ref<MemberVO[]>([]);
  const total = ref(0);
  const dateRange = ref<[]>([]);
  const addMemberRef = ref();
  const ids = ref<number[]>([]);
  const single = ref(true);
  const multiple = ref(true);

  const queryParams = reactive<MemberQuery>({
    pageNum: 1,
    pageSize: 10,
    userId: undefined,
    userName: undefined,
    phoneNumber: undefined,
    createDateStart: undefined,
    createDateEnd: undefined
  });

  const getList = async () => {
    loading.value = true;
    try {
      const res = await listMember(queryParams);
      memberList.value = res.rows;
      total.value = res.total;
    } catch (error) {
      console.error('Get member list failed:', error);
    } finally {
      loading.value = false;
    }
  };

  const handleQuery = () => {
    queryParams.pageNum = 1;
    getList();
  };

  const resetQuery = () => {
    dateRange.value = [];
    queryParams.userId = undefined;
    queryParams.userName = undefined;
    queryParams.phoneNumber = undefined;
    queryParams.createDateStart = undefined;
    queryParams.createDateEnd = undefined;
    handleQuery();
  };

  const handleDateChange = (value: [string, string]) => {
    if (value && value.length === 2) {
      queryParams.createDateStart = value[0];
      queryParams.createDateEnd = value[1];
    } else {
      queryParams.createDateStart = undefined;
      queryParams.createDateEnd = undefined;
    }
  };

  const handleSelectionChange = (selection: MemberVO[]) => {
    ids.value = selection.map((item) => item.userId as number);
    single.value = selection.length !== 1;
    multiple.value = !selection.length;
  };

  const handleAdd = () => {
    addMemberRef.value.open();
  };

  const handleUsageStats = (row: MemberVO) => {
    ElMessage.info(`View usage stats for user: ${row.userName}`);
  };

  const handleModelStats = (row: MemberVO) => {
    ElMessage.info(`View model stats for user: ${row.userName}`);
  };

  const handleDelete = async (row: MemberVO) => {
    const userId = row.userId;
    if (!userId) {
      ElMessage.error('User ID does not exist');
      return;
    }

    try {
      await ElMessageBox.confirm(`你确定要删除用户 "${row.userName}"?`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      });

      await delMember(userId as number);
      ElMessage.success('Delete successfully');
      await getList();
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('Delete member failed:', error);
      }
    }
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
    getList();
  });
</script>

<style scoped lang="scss"></style>
