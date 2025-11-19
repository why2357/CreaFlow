<template>
  <div class="fff-input-inner">
    <transition
      :enter-active-class="proxy?.animate.searchAnimate.enter"
      :leave-active-class="proxy?.animate.searchAnimate.leave"
    >
      <div class="card-sty-box" v-show="showSearch">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="项目名称" prop="projectId">
              <el-select
                v-model="queryParams.projectId"
                placeholder="请选择项目"
                clearable
                filterable
                style="width: 240px"
                @change="handleProjectChange"
              >
                <el-option
                  v-for="project in projectList"
                  :key="project.projectId"
                  :label="project.projectName"
                  :value="project.projectId"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="剧集名称" prop="episodeId">
              <el-select
                v-model="queryParams.episodeId"
                placeholder="请选择剧集"
                clearable
                filterable
                style="width: 240px"
                :disabled="!queryParams.projectId || episodeList.length === 0"
                @change="handleEpisodeChange"
              >
                <el-option
                  v-for="episode in episodeList"
                  :key="episode.id"
                  :label="episode.episodeName"
                  :value="episode.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="项目人员" prop="userId">
              <el-select
                v-model="queryParams.userId"
                placeholder="请选择项目人员"
                clearable
                filterable
                style="width: 240px"
                :disabled="!queryParams.projectId"
              >
                <el-option
                  v-for="user in projectUserList"
                  :key="user.userId"
                  :label="user.nickName"
                  :value="user.userId"
                />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button @click="resetQuery" icon="Refresh">重置</el-button>
              <el-button type="primary" @click="handleQuery" icon="Search">查询</el-button>
            </el-form-item>
          </el-form>

          <!-- Project Progress Section -->
          <div v-if="progressData" class="progress-section">
            <el-divider />
            <div class="progress-header">项目进度</div>
            <div class="progress-content">
              <div class="progress-item">
                <span class="progress-label">编剧剧本:</span>
                <el-tag :type="progressData.hasScript ? 'success' : 'info'">
                  {{ progressData.hasScript ? '完成' : '未完成' }}
                </el-tag>
              </div>
              <div class="progress-item">
                <span class="progress-label">图片进度:</span>
                <span class="progress-value"
                  >{{ progressData.approvalImgCount || 0 }}/{{ progressData.totalImgCount || 0 }}</span
                >
              </div>
              <div class="progress-item">
                <span class="progress-label">视频进度:</span>
                <span class="progress-value"
                  >{{ progressData.approvalVideoCount || 0 }}/{{ progressData.totalVideoCount || 0 }}</span
                >
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </transition>

    <el-card shadow="hover">
      <!-- Empty state when no episodes -->
      <el-empty
        v-if="!loading && episodeList.length === 0 && queryParams.projectId"
        description="该项目暂无剧集数据，请先创建剧集"
      />

      <!-- Data table -->
      <template v-else>
        <el-table v-loading="loading" :data="projectDataList" @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column label="用户ID" align="center" prop="userId" min-width="100" show-overflow-tooltip />
          <el-table-column label="用户名称" align="center" prop="nickName" min-width="120" show-overflow-tooltip />
          <el-table-column label="手机号码" align="center" prop="phonenumber" min-width="130" show-overflow-tooltip />
          <el-table-column label="有效生图/生产图片次数" align="center" min-width="180" show-overflow-tooltip>
            <template #default="scope">
              <span>{{ scope.row.validImgCnt || 0 }}/{{ scope.row.genImgCnt || 0 }}</span>
            </template>
          </el-table-column>
          <el-table-column label="有效视频/生产视频次数" align="center" min-width="180" show-overflow-tooltip>
            <template #default="scope">
              <span>{{ scope.row.validVideoCnt || 0 }}/{{ scope.row.genVideoCnt || 0 }}</span>
            </template>
          </el-table-column>
          <el-table-column label="累计消耗点数" align="center" prop="consumePoint" min-width="120" />
          <el-table-column label="消耗时间" align="center" prop="consumeTime" min-width="170">
            <template #default="scope">
              <span>{{ parseTime(scope.row.consumeTime) }}</span>
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
      </template>
    </el-card>
  </div>
</template>

<script setup lang="ts" name="ProjectData">
  import { listEpisodes } from '@/api/workbench/episode';
  import { HivisionProjectEpisodeVo } from '@/api/workbench/episode/types';
  import { listProject, listProjectUsers } from '@/api/workbench/project';
  import { ProjectPageInfoResponseDto, ProjectUserPageInfo } from '@/api/workbench/project/types';
  import { getProjectDataProgress, listProjectData } from '@/api/workbench/projectData';
  import { ProjectDataProgressVO, ProjectDataQuery, ProjectDataVO } from '@/api/workbench/projectData/types';
  import { ElMessage } from 'element-plus';
  import { getCurrentInstance, onMounted, reactive, ref, watch } from 'vue';

  const { proxy } = getCurrentInstance() as any;

  const loading = ref(true);
  const showSearch = ref(true);
  const projectDataList = ref<ProjectDataVO[]>([]);
  const projectList = ref<ProjectPageInfoResponseDto[]>([]);
  const episodeList = ref<HivisionProjectEpisodeVo[]>([]);
  const projectUserList = ref<ProjectUserPageInfo[]>([]);
  const progressData = ref<ProjectDataProgressVO | null>(null);
  const total = ref(0);
  const ids = ref<number[]>([]);
  const single = ref(true);
  const multiple = ref(true);

  const queryParams = reactive<ProjectDataQuery>({
    pageNum: 1,
    pageSize: 10,
    projectId: undefined as any,
    episodeId: undefined as any,
    userId: undefined
  });

  const getProjectList = async () => {
    try {
      const res = await listProject({ pageNum: 1, pageSize: 100 });
      projectList.value = res.rows || [];
      console.log('Project list loaded:', projectList.value.length);

      // Auto-select first project
      if (projectList.value.length > 0) {
        const firstProject = projectList.value[0];
        queryParams.projectId = firstProject.projectId as number;
        await Promise.all([getEpisodeList(queryParams.projectId), getProjectUserList(queryParams.projectId)]);
      }
    } catch (error) {
      console.error('Get project list failed:', error);
      ElMessage.error('获取项目列表失败');
      projectList.value = [];
    }
  };

  const getEpisodeList = async (projectId: number) => {
    try {
      const res = await listEpisodes(projectId);
      episodeList.value = res.data || [];
      console.log('Episode list loaded:', episodeList.value.length);

      // Auto-select first episode
      if (episodeList.value.length > 0) {
        const firstEpisode = episodeList.value[0];
        queryParams.episodeId = firstEpisode.id as number;
        // Fetch progress data only if episode exists
        await getProgress();
      } else {
        // No episodes available - clear data and stop loading
        queryParams.episodeId = undefined as any;
        progressData.value = null;
        projectDataList.value = [];
        total.value = 0;
        loading.value = false;
        ElMessage.info('该项目暂无剧集数据');
      }
    } catch (error) {
      console.error('Get episode list failed:', error);
      ElMessage.error('获取剧集列表失败');
      episodeList.value = [];
      loading.value = false;
    }
  };

  const getProjectUserList = async (projectId: number) => {
    try {
      const res = await listProjectUsers({ projectId, pageNum: 1, pageSize: 100 });
      projectUserList.value = res.rows || [];
      console.log('Project user list loaded:', projectUserList.value.length);
    } catch (error) {
      console.error('Get project user list failed:', error);
      projectUserList.value = [];
    }
  };

  const getProgress = async () => {
    if (!queryParams.projectId || !queryParams.episodeId) {
      return;
    }

    try {
      const res = await getProjectDataProgress({
        projectId: queryParams.projectId,
        episodeId: queryParams.episodeId,
        userId: queryParams.userId
      });
      progressData.value = res.data || null;
    } catch (error) {
      console.error('Get progress data failed:', error);
      progressData.value = null;
    }
  };

  const getList = async () => {
    // Validate required fields
    if (!queryParams.projectId || !queryParams.episodeId) {
      loading.value = false;
      return;
    }

    loading.value = true;
    try {
      const res = await listProjectData(queryParams);
      projectDataList.value = res.rows || [];
      total.value = res.total || 0;
    } catch (error) {
      console.error('Get project data list failed:', error);
      ElMessage.error('获取项目数据失败');
    } finally {
      loading.value = false;
    }
  };

  const handleProjectChange = async (value: number | undefined) => {
    // Clear episode selection and user selection when project changes
    queryParams.episodeId = undefined as any;
    queryParams.userId = undefined;
    episodeList.value = [];
    projectUserList.value = [];
    progressData.value = null;

    if (value) {
      await Promise.all([getEpisodeList(value), getProjectUserList(value)]);
    }
  };

  const handleEpisodeChange = async (value: number | undefined) => {
    // Fetch progress data when episode changes
    if (value && queryParams.projectId) {
      await getProgress();
    } else {
      progressData.value = null;
    }
  };

  const handleQuery = () => {
    queryParams.pageNum = 1;
    getList();
  };

  const resetQuery = async () => {
    queryParams.userId = undefined;
    episodeList.value = [];
    projectDataList.value = [];
    progressData.value = null;
    total.value = 0;

    // Re-load project list and auto-select
    await getProjectList();
  };

  const handleSelectionChange = (selection: ProjectDataVO[]) => {
    ids.value = selection.map((item) => item.userId as number);
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

  // Watch for both projectId and episodeId changes to auto-fetch data
  watch(
    () => [queryParams.projectId, queryParams.episodeId],
    ([newProjectId, newEpisodeId]) => {
      if (newProjectId && newEpisodeId) {
        handleQuery();
      }
    }
  );

  onMounted(() => {
    getProjectList();
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

  .progress-section {
    margin-top: 16px;

    .progress-header {
      font-size: 14px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 12px;
    }

    .progress-content {
      display: flex;
      gap: 24px;
      flex-wrap: wrap;

      .progress-item {
        display: flex;
        align-items: center;
        gap: 8px;

        .progress-label {
          font-size: 14px;
          color: #606266;
        }

        .progress-value {
          font-size: 14px;
          font-weight: 500;
          color: #303133;
        }
      }
    }
  }
</style>
