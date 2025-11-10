<template>
  <el-dialog
    v-model="dialogVisible"
    title="留言"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
    @open="loadComments"
    class="comment-list-dialog"
  >
    <div v-loading="loading" class="comment-list">
      <div v-if="comments.length === 0" class="empty-state">
        <el-empty description="暂无留言" />
      </div>
      <div v-else class="comment-items">
        <div v-for="comment in comments" :key="comment.id" class="comment-item">
          <div class="comment-header">
            <div class="user-info">
              <div class="avatar">{{ getInitial(comment.commentUsername) }}</div>
              <div class="user-details">
                <div class="username">{{ comment.commentUsername }}</div>
                <div class="time">{{ formatTime(comment.createTime) }}</div>
              </div>
            </div>
            <el-button text type="danger" size="small" @click="handleDelete(comment.id!)">删除</el-button>
          </div>
          <div class="comment-content">{{ comment.comment }}</div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
  import { deleteSceneComment, getSceneCommentList } from '@/api/workbench/storyboard';
  import type { SceneCommentVo } from '@/api/workbench/storyboard/types';
  import { ElMessage, ElMessageBox } from 'element-plus';
  import { computed, ref } from 'vue';

  interface Props {
    modelValue: boolean;
    basicId: number;
    sceneType: number;
  }

  const props = defineProps<Props>();
  const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
    (e: 'change'): void;
  }>();

  const dialogVisible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  });

  const loading = ref(false);
  const comments = ref<SceneCommentVo[]>([]);

  // 加载留言列表
  const loadComments = async () => {
    try {
      loading.value = true;
      const res = await getSceneCommentList({
        basicId: props.basicId,
        sceneType: props.sceneType
      });
      comments.value = res.data || [];
    } catch (error) {
      console.error('加载留言列表失败:', error);
      ElMessage.error('加载留言列表失败');
    } finally {
      loading.value = false;
    }
  };

  // 删除留言
  const handleDelete = async (id: number) => {
    try {
      await ElMessageBox.confirm('确定要删除这条留言吗?', '删除留言', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      });

      await deleteSceneComment([id]);
      ElMessage.success('删除成功');
      await loadComments();
      emit('change');
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('删除留言失败:', error);
        ElMessage.error('删除留言失败');
      }
    }
  };

  // 获取用户名首字母
  const getInitial = (username?: string) => {
    if (!username) return '?';
    return username.charAt(0).toUpperCase();
  };

  // 格式化时间
  const formatTime = (time?: Date) => {
    if (!time) return '';
    const date = new Date(time);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    // 小于1分钟
    if (diff < 60000) {
      return '刚刚';
    }
    // 小于1小时
    if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}分钟前`;
    }
    // 小于1天
    if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)}小时前`;
    }
    // 超过1天，显示具体日期
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day} ${hour}:${minute}`;
  };

  const handleClose = () => {
    dialogVisible.value = false;
  };
</script>

<style scoped lang="scss">
  .comment-list-dialog {
    :deep(.el-dialog__header) {
      padding: 20px 24px;
      border-bottom: 1px solid #e5e6eb;

      .el-dialog__title {
        font-size: 16px;
        font-weight: 500;
        color: #1d2129;
      }
    }

    :deep(.el-dialog__body) {
      padding: 24px;
      max-height: 500px;
      overflow-y: auto;
    }

    .comment-list {
      min-height: 200px;

      .empty-state {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 200px;
      }

      .comment-items {
        display: flex;
        flex-direction: column;
        gap: 16px;

        .comment-item {
          padding: 16px;
          background: #f7f8fa;
          border-radius: 8px;
          transition: all 0.3s;

          &:hover {
            background: #f2f3f5;
          }

          .comment-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;

            .user-info {
              display: flex;
              align-items: center;
              gap: 12px;

              .avatar {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                font-weight: 500;
              }

              .user-details {
                .username {
                  font-size: 14px;
                  font-weight: 500;
                  color: #1d2129;
                  margin-bottom: 4px;
                }

                .time {
                  font-size: 12px;
                  color: #86909c;
                }
              }
            }
          }

          .comment-content {
            padding-left: 48px;
            font-size: 14px;
            color: #4e5969;
            line-height: 1.6;
            word-break: break-word;
          }
        }
      }
    }
  }
</style>
