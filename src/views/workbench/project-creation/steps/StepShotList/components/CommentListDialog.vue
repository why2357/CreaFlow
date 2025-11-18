<template>
  <el-popover
    v-if="props.basicId && props.basicId > 0"
    :key="`comment-popover-${props.basicId}`"
    v-model:visible="popoverVisible"
    :virtual-ref="triggerRef"
    trigger="manual"
    virtual-triggering
    placement="bottom-start"
    :width="382"
    popper-class="comment-list-popover"
    :offset="8"
    @show="loadComments"
    @hide="handleClose"
  >
    <div v-loading="loading" class="comment-list">
      <!-- 标题栏 -->
      <div class="comment-header">
        <svg-icon icon-class="fy-comment" class="header-icon" />
        <span class="header-title">留言</span>
      </div>

      <!-- 留言列表 -->
      <div v-if="comments.length === 0" class="empty-state">
        <div class="empty-text">暂无留言</div>
      </div>
      <div v-else class="comment-items">
        <div v-for="comment in comments" :key="comment.id" class="comment-item">
          <div
            class="avatar"
            :style="{
              background: getRoleBgColor(comment.roleKey),
              color: getRoleTextColor(comment.roleKey)
            }"
          >
            {{ getRoleShortName(comment.roleKey) }}
          </div>
          <div class="comment-content-wrapper">
            <div class="comment-info">
              <div>
                <span class="username">{{ comment.commentUsername || '匿名用户' }}</span>
                <span class="time">{{ formatTime(comment.createTime) }}</span>
              </div>
              <svg-icon @click="handleDelete(comment.id!)" icon-class="fy-del" class="delete-icon" />
              <!-- <el-icon  ">
                <Close />
              </el-icon> -->
            </div>
            <div class="comment-bubble">
              <p class="comment-text">{{ comment.comment }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
  import { deleteSceneComment, getSceneCommentList } from '@/api/workbench/storyboard';
  import type { SceneCommentVo } from '@/api/workbench/storyboard/types';
  import { getRoleBgColor, getRoleShortName, getRoleTextColor } from '@/utils/roleUtils';
  import { ElMessage, ElMessageBox } from 'element-plus';
  import { computed, ref } from 'vue';

  interface Props {
    modelValue: boolean;
    basicId: number;
    sceneType: number;
    triggerRef?: HTMLElement;
    // 可选的评论列表，如果提供则直接使用，不调用接口
    commentList?: SceneCommentVo[];
  }

  const props = defineProps<Props>();
  const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
    (e: 'change'): void;
  }>();

  const popoverVisible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  });

  const triggerRef = computed(() => props.triggerRef);

  const loading = ref(false);
  const comments = ref<SceneCommentVo[]>([]);

  // 记录上次加载的 basicId，用于检测是否切换了场景
  const lastLoadedBasicId = ref<number | null>(null);

  // 关闭弹窗时清空评论列表
  const handleClose = () => {
    comments.value = [];
    lastLoadedBasicId.value = null;
  };

  // 加载留言列表
  const loadComments = async () => {
    // 如果 basicId 发生变化，立即清空评论列表，防止显示旧数据
    if (lastLoadedBasicId.value !== props.basicId) {
      comments.value = [];
      lastLoadedBasicId.value = props.basicId;
    }

    // 显示加载状态，提升用户体验
    loading.value = true;

    // 添加最小加载时间，确保用户看到加载状态
    const minLoadingTime = 300; // 300ms
    const startTime = Date.now();

    try {
      // 如果传入了 commentList，则直接使用，不调用接口
      if (props.commentList && props.commentList.length > 0) {
        // 按创建时间降序排序，显示所有评论
        const sortedComments = [...props.commentList]
          .filter((comment) => comment && comment.id) // 过滤无效评论
          .sort((a, b) => {
            const timeA = new Date(a.createTime || 0).getTime();
            const timeB = new Date(b.createTime || 0).getTime();
            return timeB - timeA;
          });

        // 确保最小加载时间
        const elapsed = Date.now() - startTime;
        if (elapsed < minLoadingTime) {
          await new Promise((resolve) => setTimeout(resolve, minLoadingTime - elapsed));
        }

        comments.value = sortedComments;
        console.log('使用传入的 commentList，无需调用接口');
        return;
      }

      // 否则调用接口获取（只显示最新的一条）
      console.log('调用接口获取评论列表');
      const res = await getSceneCommentList({
        basicId: props.basicId,
        sceneType: props.sceneType
      });
      const allComments = res.data || [];
      // 过滤无效评论并按创建时间降序排序，取最新的一条
      const validComments = allComments.filter((comment) => comment && comment.id);
      if (validComments.length > 0) {
        const sortedComments = validComments.sort((a, b) => {
          const timeA = new Date(a.createTime || 0).getTime();
          const timeB = new Date(b.createTime || 0).getTime();
          return timeB - timeA;
        });
        comments.value = [sortedComments[0]];
      } else {
        comments.value = [];
      }

      // 确保最小加载时间
      const elapsed = Date.now() - startTime;
      if (elapsed < minLoadingTime) {
        await new Promise((resolve) => setTimeout(resolve, minLoadingTime - elapsed));
      }
    } catch (error) {
      console.error('加载留言列表失败:', error);
      ElMessage.error('加载留言列表失败');
      comments.value = [];

      // 即使出错也确保最小加载时间
      const elapsed = Date.now() - startTime;
      if (elapsed < minLoadingTime) {
        await new Promise((resolve) => setTimeout(resolve, minLoadingTime - elapsed));
      }
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
      }
    }
  };

  // 格式化时间 - 显示年月日 时:分
  const formatTime = (time?: Date) => {
    if (!time) return '';
    const date = new Date(time);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute}`;
  };
</script>

<style scoped lang="scss">
  .comment-list {
    width: 100%;
    background: #fff;

    // 标题栏样式 - 按 Figma 设计
    .comment-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      border-bottom: 1px solid #e5e6eb;
      background: #f7f8fa;

      .header-icon {
        width: 16px;
        height: 16px;
        color: #5252ff;
      }

      .header-title {
        font-size: 12px;
        font-weight: 500;
        color: #101828;
        line-height: 12px;
      }
    }

    // 空状态
    .empty-state {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 40px 16px;

      .empty-text {
        font-size: 14px;
        color: #86909c;
      }
    }

    // 留言列表
    .comment-items {
      padding: 12px;

      .comment-item {
        display: flex;
        gap: 12px;
        align-items: flex-start;

        // 头像样式 - 按 Figma 设计
        .avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          flex-shrink: 0;
          line-height: 12px;
          box-shadow: 0 2px 6px rgba(108, 92, 231, 0.2);
        }

        // 留言内容区
        .comment-content-wrapper {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;

          // 用户信息行
          .comment-info {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            height: 20px;

            .username {
              font-size: 12px;
              font-weight: 600;
              color: #1d2129;
              line-height: 12px;
              margin-right: 16px;
            }

            .time {
              font-size: 12px;
              font-weight: 400;
              color: #86909c;
              line-height: 12px;
            }
            // 删除图标
            .delete-icon {
              flex-shrink: 0;
              width: 14px;
              height: 14px;
              color: #86909c;
              cursor: pointer;
              transition: color 0.2s;
              margin-top: 2px;

              &:hover {
                color: #f53f3f;
              }
            }
          }

          // 留言气泡 - 按 Figma 设计
          .comment-bubble {
            position: relative;
            background: #f7f8fa;
            padding: 10px 16px;
            border-radius: 0 16px 16px 16px; // 左上角直角，其他圆角
            display: flex;
            align-items: flex-start;
            gap: 8px;

            .comment-text {
              flex: 1;
              font-size: 12px;
              font-weight: 400;
              color: #4e5969;
              line-height: 18px;
              word-break: break-word;
              white-space: pre-wrap;
              margin: 0;
            }
          }
        }
      }
    }
  }
</style>

<style lang="scss">
  .comment-list-popover {
    padding: 0 !important;
    border-radius: 8px !important;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(224, 231, 255, 0.25), 0 10px 15px rgba(224, 231, 255, 0.5) !important;
  }
</style>
