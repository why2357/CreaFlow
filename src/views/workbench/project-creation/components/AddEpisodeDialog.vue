<template>
  <el-dialog
    v-model="dialogVisible"
    title="新建剧集"
    width="800px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="0" @submit.prevent="handleSubmit">
      <!-- 剧集名称 -->
      <div class="form-section">
        <div class="form-label">剧集名称</div>
        <el-form-item prop="episodeName">
          <el-input v-model="form.episodeName" placeholder="请输入剧集名称" maxlength="50" show-word-limit />
        </el-form-item>
      </div>

      <!-- 剧情输入方式 -->
      <div class="form-section">
        <div class="form-label-row">
          <div class="form-label">剧情</div>
          <el-dropdown trigger="click" @command="handleModeChange">
            <span class="mode-selector">
              {{ inputMode === 'text' ? '剧情' : '上传拆分脚本' }}
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="text" :class="{ 'is-active': inputMode === 'text' }">
                  <el-icon v-if="inputMode === 'text'" class="check-icon"><Check /></el-icon>
                  剧情
                </el-dropdown-item>
                <el-dropdown-item command="upload" :class="{ 'is-active': inputMode === 'upload' }">
                  <el-icon v-if="inputMode === 'upload'" class="check-icon"><Check /></el-icon>
                  上传拆分脚本
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>

        <el-form-item prop="storyText">
          <!-- 文本输入模式 -->
          <div v-if="inputMode === 'text'" class="text-input-wrapper">
            <el-input
              style="width: 100%"
              v-model="form.storyText"
              type="textarea"
              placeholder="请输入剧情内容"
              :rows="8"
              maxlength="5000"
              resize="none"
              class="story-textarea"
            />
            <div class="textarea-footer">
              <!-- 左下角：模型选择 -->
              <el-dropdown trigger="click" @command="handleModelChange">
                <span class="model-selector">
                  {{ currentModelName }}
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      v-for="model in modelOptions"
                      :key="model.value"
                      :command="model.value"
                      :class="{ 'is-active': form.modelCode === model.value }"
                    >
                      <el-icon v-if="form.modelCode === model.value" class="check-icon"><Check /></el-icon>
                      {{ model.label }}
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>

              <!-- 右下角：字数统计 -->
              <div class="char-count">{{ form.storyText.length }}/5000</div>
            </div>
          </div>

          <!-- 文件上传模式 -->
          <el-upload
            v-else
            ref="uploadRef"
            :auto-upload="false"
            :limit="1"
            accept=".doc,.docx,.xls,.xlsx"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            :file-list="fileList"
            drag
            class="upload-area"
          >
            <div class="upload-content">
              <el-icon class="upload-icon"><UploadFilled /></el-icon>
              <div class="upload-text">将文件拖到此处，或<span class="upload-link">点击上传</span></div>
              <div class="upload-tip">您可以上传剧本的，支持：excel格式</div>
            </div>
          </el-upload>
        </el-form-item>
      </div>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          <el-icon v-if="!loading"><MagicStick /></el-icon>
          {{ loading ? '生成中...' : '立即生成' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { createEpisodeByTemplate, createEpisodeByText } from '@/api/workbench/episode';
  import type { EpisodeCreateRequest } from '@/api/workbench/project/types';
  import { useProjectStore } from '@/store/modules/project';
  import { convertModelsToOptions, getDefaultModel, getModelName } from '@/utils/projectUtils';
  import { ArrowDown, Check, MagicStick, UploadFilled } from '@element-plus/icons-vue';
  import type { FormInstance, FormRules, UploadFile } from 'element-plus';
  import { ElMessage } from 'element-plus';
  import { computed, ref, watch } from 'vue';

  interface Props {
    modelValue: boolean;
    projectId: number;
    nextEpisodeNumber: number;
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void;
    (e: 'success'): void;
  }

  const props = defineProps<Props>();

  const emit = defineEmits<Emits>();

  const projectStore = useProjectStore();

  // 加载状态
  const loading = ref(false);

  // 动态获取模型选项（文生文模型用于剧本生成）
  const modelOptions = computed(() => {
    return convertModelsToOptions(projectStore.t2tModelInfoList);
  });

  // 表单引用
  const formRef = ref<FormInstance>();
  const uploadRef = ref();

  // 对话框可见性
  const dialogVisible = ref(false);

  // 输入模式：text-文本输入, upload-文件上传
  const inputMode = ref<'text' | 'upload'>('text');

  // 表单数据
  const form = ref<EpisodeCreateRequest>({
    episodeName: '',
    storyText: '',
    modelCode: 'gemini',
    projectId: props.projectId
  });

  // 文件列表
  const fileList = ref<UploadFile[]>([]);
  const uploadedFile = ref<File | undefined>(undefined);

  // 当前模型名称
  const currentModelName = computed(() => {
    return getModelName(projectStore.t2tModelInfoList, form.value.modelCode) || '请选择模型';
  });

  // 表单验证规则
  const rules: FormRules = {
    episodeName: [{ required: true, message: '请输入剧集名称', trigger: 'blur' }],
    storyText: [
      {
        required: true,
        validator: (_rule, _value, callback) => {
          if (inputMode.value === 'text' && !form.value.storyText.trim()) {
            callback(new Error('请输入剧情内容'));
          } else if (inputMode.value === 'upload' && !uploadedFile.value) {
            callback(new Error('请上传剧本文件'));
          } else {
            callback();
          }
        },
        trigger: 'change'
      }
    ]
  };

  // 监听外部 modelValue 变化
  watch(
    () => props.modelValue,
    (val) => {
      dialogVisible.value = val;
      if (val) {
        // 打开对话框时初始化表单
        initForm();
      }
    },
    { immediate: true }
  );

  // 监听内部 dialogVisible 变化
  watch(dialogVisible, (val) => {
    emit('update:modelValue', val);
  });

  // 初始化表单
  const initForm = () => {
    form.value = {
      episodeName: '',
      storyText: '',
      modelCode: getDefaultModel(projectStore.t2tModelInfoList),
      projectId: props.projectId
    };
    inputMode.value = 'text';
    fileList.value = [];
    uploadedFile.value = undefined;
  };

  // 切换输入模式
  const handleModeChange = (mode: 'text' | 'upload') => {
    inputMode.value = mode;
    if (mode === 'text') {
      // 切换到文本模式，清空文件
      fileList.value = [];
      uploadedFile.value = undefined;
    } else {
      // 切换到上传模式，清空文本
      form.value.storyText = '';
    }
    // 清除验证提示
    formRef.value?.clearValidate('storyText');
  };

  // 切换模型
  const handleModelChange = (modelCode: string) => {
    form.value.modelCode = modelCode;
  };

  // 文件变化
  const handleFileChange = (file: UploadFile, fileListParam: UploadFile[]) => {
    uploadedFile.value = file.raw;
    fileList.value = fileListParam;
    // 清除验证错误
    formRef.value?.clearValidate('storyText');
  };

  // 文件移除
  const handleFileRemove = () => {
    fileList.value = [];
    uploadedFile.value = undefined;
  };

  // 提交表单
  const handleSubmit = async () => {
    if (!formRef.value) return;

    await formRef.value.validate(async (valid) => {
      if (!valid) return;

      // 验证剧情内容
      if (inputMode.value === 'text' && !form.value.storyText.trim()) {
        return;
      }

      if (inputMode.value === 'upload' && !uploadedFile.value) {
        return;
      }

      try {
        loading.value = true;

        if (inputMode.value === 'text') {
          // 剧情文本模式：调用 /hivision/story/episode/create
          await createEpisodeByText({
            projectId: form.value.projectId,
            episodeName: form.value.episodeName,
            storyText: form.value.storyText,
            modelCode: form.value.modelCode
          });
          ElMessage.success('剧集创建成功');
        } else {
          // 上传拆分剧本模式：调用 /hivision/story/episode/template/upload
          if (!uploadedFile.value) {
            ElMessage.error('请上传剧本文件');
            return;
          }
          await createEpisodeByTemplate({
            projectId: form.value.projectId,
            episodeName: form.value.episodeName,
            file: uploadedFile.value
          });
        }

        // 关闭对话框
        dialogVisible.value = false;
        // 触发成功事件，通知父组件刷新列表
        emit('success');
      } catch (error) {
        console.error('创建剧集失败:', error);
        ElMessage.error('创建剧集失败，请重试');
      } finally {
        loading.value = false;
      }
    });
  };

  // 取消
  const handleCancel = () => {
    dialogVisible.value = false;
  };

  // 对话框关闭后重置表单
  const handleClosed = () => {
    formRef.value?.resetFields();
    initForm();
  };
</script>

<style scoped lang="scss">
  .form-section {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .form-label {
    margin-bottom: 12px;
    color: #1d2129;
    font-size: 14px;
    font-weight: 500;
  }

  .form-label-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  // 模式选择器
  .mode-selector {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-radius: 4px;
    color: #5252ff;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      background: #f5f5ff;
    }

    .el-icon {
      font-size: 12px;
    }
  }

  // 文本输入区域
  .text-input-wrapper {
    position: relative;
    width: 100%;

    .story-textarea {
      :deep(.el-textarea__inner) {
        padding-bottom: 40px;
      }
    }

    .textarea-footer {
      position: absolute;
      bottom: 8px;
      left: 0;
      right: 0;
      z-index: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 12px;
    }

    .model-selector {
      display: inline-flex;
      align-items: center;
      padding: 4px 8px;
      border-radius: 4px;
      color: #86909c;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        background: #f7f8fa;
        color: #5252ff;
      }
    }

    .char-count {
      color: #86909c;
      font-size: 12px;
    }
  }

  // 文件上传区域
  .upload-area {
    :deep(.el-upload) {
      width: 100%;
    }

    :deep(.el-upload-dragger) {
      padding: 40px 20px;
      border: 1px dashed #d9d9d9;
      border-radius: 8px;
      background: #fafafa;
      transition: all 0.3s;
      width: 770px;

      &:hover {
        border-color: #5252ff;
        background: #f5f5ff;
      }
    }

    .upload-content {
      text-align: center;
    }

    .upload-icon {
      margin-bottom: 16px;
      color: #bfbfbf;
      font-size: 48px;
    }

    .upload-text {
      margin-bottom: 8px;
      color: #4e5969;
      font-size: 14px;

      .upload-link {
        color: #5252ff;
        cursor: pointer;
      }
    }

    .upload-tip {
      color: #86909c;
      font-size: 12px;
    }
  }

  // 对话框底部
  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  // 下拉菜单样式
  :deep(.el-dropdown-menu__item) {
    position: relative;
    padding-left: 32px;

    &.is-active {
      color: #5252ff;
      background-color: #f5f5ff;
    }

    .check-icon {
      position: absolute;
      top: 50%;
      left: 10px;
      transform: translateY(-50%);
      color: #5252ff;
      font-size: 16px;
    }
  }

  // 表单项样式覆盖
  :deep(.el-form-item) {
    margin-bottom: 0;

    .el-form-item__error {
      padding-top: 4px;
    }
  }

  // 输入框样式
  :deep(.el-input__inner) {
    border-radius: 4px;
  }

  :deep(.el-textarea__inner) {
    border-radius: 4px;
    font-family: inherit;
  }

  // 按钮样式
  :deep(.el-button) {
    padding: 8px 20px;
    border-radius: 4px;
    font-size: 14px;

    &.el-button--primary {
      background-color: #5252ff;
      border-color: #5252ff;

      &:hover {
        background-color: #7375ff;
        border-color: #7375ff;
      }
    }
  }
</style>
