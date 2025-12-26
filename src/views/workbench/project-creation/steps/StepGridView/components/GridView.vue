<template>
  <div class="grid-view-container">
    <!-- 加载中 -->
    <div v-if="loading" v-loading="loading" class="loading-container">
      <div class="loading-content">
        <el-icon class="is-loading" :size="60"><Loading /></el-icon>
        <p class="loading-text">分镜生成中,请稍等...</p>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else-if="scenes.length === 0" class="empty-state">
      <div class="empty-content">
        <img
          style="width: 200px; height: 200px"
          src="https://fc-1327887685.cos.ap-guangzhou.myqcloud.com/dev_forge_hivision/image/2025122417/1482f35c14ad4f8a.png"
          alt=""
        />
        <p class="empty-text">暂无数据</p>
      </div>
    </div>

    <!-- 故事板网格 -->
    <div v-else class="grid-container" ref="gridContainerRef">
      <Draggable
        v-model="localScenes"
        :animation="200"
        :delay="50"
        :delay-on-touch-only="true"
        ghost-class="ghost-card"
        chosen-class="chosen-card"
        drag-class="dragging-card"
        :force-fallback="false"
        handle=".drag-handle"
        item-key="id"
        class="draggable-wrapper"
        @start="handleDragStart"
        @end="handleDragEnd"
      >
        <template #item="{ element: scene, index }">
          <div
            class="grid-card"
            :class="getCardClass(scene)"
            :data-card-index="index"
            :data-scene-id="scene.id"
            @mouseenter="handleCardHover(scene)"
            @mouseleave="handleCardLeave"
          >
            <!-- 画面图片 -->
            <div class="card-image" @click="handleImageClick(scene)">
              <el-image
                v-if="scene.previewOssUrl || scene.originOssUrl"
                :src="scene.previewOssUrl || scene.originOssUrl"
                fit="cover"
                class="shot-image"
                :preview-src-list="[scene.originOssUrl || scene.previewOssUrl]"
                :preview-teleported="true"
                hide-on-click-modal
                :lazy="true"
              />
              <div v-else class="image-placeholder">
                <img
                  src="https://fc-1327887685.cos.ap-guangzhou.myqcloud.com/dev_forge_hivision/image/2025122417/11fb7c9d514e42b0.png"
                  alt="暂无图片"
                  class="placeholder-img"
                />
              </div>
            </div>

            <!-- 悬浮操作按钮 -->
            <transition name="fade">
              <div v-if="hoveredCardId === scene.id" class="hover-actions">
                <SceneActions
                  button-size="default"
                  tooltip-placement="top"
                  :disable-comment="!scene.imgTaskId"
                  @comment="(event: MouseEvent) => handleComment(scene, event)"
                  @insert="handleInsert(scene)"
                  @review="(event: MouseEvent) => handleReview(scene, event)"
                  @delete="handleDelete(scene)"
                />
              </div>
            </transition>

            <!-- 镜号区域 -->
            <div class="card-number-wrapper">
              <!-- 镜号标签 -->
              <div class="card-number drag-handle">
                <svg-icon icon-class="fy-juji" class="icon" />
                <span>{{ String(index + 1).padStart(2, '0') }}</span>
              </div>

              <!-- 状态指示圆点 -->
              <div
                v-if="scene.imgStatus !== undefined"
                class="status-dot"
                :class="[getDotClass(scene.imgStatus), { clickable: canApproveScene }]"
                @click.stop="handleDotClick(scene, $event)"
              ></div>
            </div>

            <!-- 留言数量显示 -->
            <div
              v-if="scene.commentCnt && scene.commentCnt > 0"
              class="comment-count-badge"
              @mouseenter="(event: MouseEvent) => handleViewComments(scene, event)"
            >
              <svg-icon icon-class="fy-comment" class="comment-icon" />
              <span class="count-text">{{ scene.commentCnt }}</span>
            </div>
          </div>
        </template>
      </Draggable>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { dragSortScene } from '@/api/workbench/episode';
  import type { StoryBoardSceneVo } from '@/api/workbench/storyboard/types';
  import { useAutoScroll } from '@/composables/useAutoScroll';
  import { hasProjectPermission } from '@/utils/projectPermission';
  import { Loading } from '@element-plus/icons-vue';
  import { ElMessage } from 'element-plus';
  import { computed, ref, watch } from 'vue';
  import Draggable from 'vuedraggable';
  import SceneActions from '../../components/SceneActions.vue';

  interface Props {
    scenes: StoryBoardSceneVo[];
    loading?: boolean;
  }

  const props = withDefaults(defineProps<Props>(), {
    loading: false
  });

  const emit = defineEmits<{
    (e: 'pass', scene: StoryBoardSceneVo): void;
    (e: 'edit', scene: StoryBoardSceneVo): void;
    (e: 'imageClick', scene: StoryBoardSceneVo): void;
    (e: 'comment', scene: StoryBoardSceneVo, event: MouseEvent): void;
    (e: 'insert', scene: StoryBoardSceneVo): void;
    (e: 'review', scene: StoryBoardSceneVo, event: MouseEvent): void;
    (e: 'delete', scene: StoryBoardSceneVo): void;
    (e: 'statusChange', scene: StoryBoardSceneVo, status: number): void;
    (e: 'viewComments', scene: StoryBoardSceneVo, event: MouseEvent): void;
    (e: 'refresh'): void;
  }>();

  // 悬浮的卡片ID
  const hoveredCardId = ref<number | null>(null);
  const gridContainerRef = ref<HTMLElement>();

  // 本地场景列表 - 用于 VueDraggable
  const localScenes = ref<StoryBoardSceneVo[]>([]);

  // 拖拽状态
  const draggedOldIndex = ref<number>(-1);
  const draggedNewIndex = ref<number>(-1);

  // 初始化自动滚动 composable（垂直滚动）
  const autoScroll = useAutoScroll({
    direction: 'vertical',
    threshold: 350,
    minSpeed: 15,
    maxSpeed: 80
  });

  // 监听 props.scenes 变化,同步到本地列表
  watch(
    () => props.scenes,
    (newScenes) => {
      localScenes.value = [...newScenes];
    },
    { immediate: true, deep: true }
  );

  // 权限检查
  const canApproveScene = computed(() => hasProjectPermission(['scene-approval']));

  // 卡片悬浮 - 使用 requestAnimationFrame 优化性能
  const handleCardHover = (scene: StoryBoardSceneVo) => {
    requestAnimationFrame(() => {
      hoveredCardId.value = scene.id || null;
    });
  };

  // 卡片离开 - 使用 requestAnimationFrame 优化性能
  const handleCardLeave = () => {
    requestAnimationFrame(() => {
      hoveredCardId.value = null;
    });
  };

  // 获取卡片样式类
  const getCardClass = (scene: StoryBoardSceneVo) => {
    const classes: string[] = [];
    if (hoveredCardId.value === scene.id) {
      classes.push('hovered');
    }
    return classes.join(' ');
  };

  // 获取状态文本
  // imgStatus: 0-白色(无状态) 1-橙色(待修改) 2-绿色(通过) 3-红色(拒绝)
  const getStatusText = (status?: number) => {
    switch (status) {
      case 1:
        return '待修改';
      case 2:
        return '通过';
      case 3:
        return '拒绝';
      default:
        return '';
    }
  };

  // 获取圆点颜色类名
  // imgStatus: 0-未判定(灰色) 1-橙色(待修改) 2-绿色(通过) 3-红色(驳回)
  const getDotClass = (status?: number) => {
    switch (status) {
      case 1:
        return 'status-orange';
      case 2:
        return 'status-green';
      case 3:
        return 'status-red';
      case 0:
      default:
        return 'status-gray';
    }
  };

  // 通过
  const handlePass = (scene: StoryBoardSceneVo) => {
    emit('pass', scene);
  };

  // 待修改
  const handleEdit = (scene: StoryBoardSceneVo) => {
    emit('edit', scene);
  };

  // 图片点击
  const handleImageClick = (scene: StoryBoardSceneVo) => {
    emit('imageClick', scene);
  };

  // 评论
  const handleComment = (scene: StoryBoardSceneVo, event: MouseEvent) => {
    emit('comment', scene, event);
  };

  // 插入
  const handleInsert = (scene: StoryBoardSceneVo) => {
    emit('insert', scene);
  };

  // 评审
  const handleReview = (scene: StoryBoardSceneVo, event: MouseEvent) => {
    emit('review', scene, event);
  };

  // 删除
  const handleDelete = (scene: StoryBoardSceneVo) => {
    emit('delete', scene);
  };

  // 状态变更
  const handleStatusChange = (scene: StoryBoardSceneVo, status: number) => {
    emit('statusChange', scene, status);
    // 更新本地状态
    scene.imgStatus = status;
    const statusText = getStatusText(status);
    ElMessage.success(`已将镜号 ${scene.orderNo} 标记为${statusText}`);
  };

  // 查看留言列表
  const handleViewComments = (scene: StoryBoardSceneVo, event: MouseEvent) => {
    emit('viewComments', scene, event);
  };

  // 点击小圆点触发评审
  const handleDotClick = (scene: StoryBoardSceneVo, event: MouseEvent) => {
    // 检查权限,没有权限则不触发事件
    if (!canApproveScene.value) {
      return;
    }
    emit('review', scene, event);
  };

  // ==================== VueDraggable 拖拽排序功能 ====================

  // 开始拖拽
  const handleDragStart = (event: any) => {
    // 记录拖拽开始时的原始索引
    draggedOldIndex.value = event.oldIndex;

    // 初始化鼠标位置
    const initialMouseY = event.originalEvent?.clientY;

    // 启动自动滚动
    autoScroll.start(gridContainerRef.value || null, initialMouseY);
  };

  // 拖拽结束
  const handleDragEnd = async (event: any) => {
    // 停止自动滚动
    autoScroll.stop();

    // 获取拖拽结束时的新索引
    const newIndex = event.newIndex;
    const oldIndex = draggedOldIndex.value;

    // 如果位置没有变化，直接返回
    if (oldIndex === newIndex || oldIndex === -1) {
      draggedOldIndex.value = -1;
      draggedNewIndex.value = -1;
      return;
    }

    try {
      // 获取被拖拽的场景（使用原始列表中的索引）
      const draggedScene = props.scenes[oldIndex];

      if (!draggedScene || !draggedScene.id) {
        ElMessage.error('场景数据无效');
        localScenes.value = [...props.scenes];
        draggedOldIndex.value = -1;
        draggedNewIndex.value = -1;
        return;
      }

      // 确定 targetBasicId
      // 接口定义：targetBasicId 表示"拖到这个镜头的前面"，为 null 表示拖到最后
      let targetBasicId: number | undefined;

      // 在新位置的列表中，找到拖拽后该场景后面的那个场景
      if (newIndex + 1 < localScenes.value.length) {
        // 不是拖到最后
        const nextScene = localScenes.value[newIndex + 1];
        targetBasicId = nextScene.id;
      } else {
        // 拖到最后
        targetBasicId = undefined;
      }

      console.log('拖拽信息:', {
        dragBasicId: draggedScene.id,
        targetBasicId: targetBasicId,
        oldIndex: oldIndex,
        newIndex: newIndex,
        draggedScene: draggedScene,
        nextScene: newIndex + 1 < localScenes.value.length ? localScenes.value[newIndex + 1] : null
      });

      // 调用接口进行排序
      await dragSortScene({
        dragBasicId: draggedScene.id,
        targetBasicId: targetBasicId
      });

      ElMessage.success('镜号顺序调整成功');
      // 刷新列表
      emit('refresh');
    } catch (error) {
      console.error('拖拽排序失败:', error);
      ElMessage.error('拖拽排序失败,请重试');
      // 恢复原始顺序
      localScenes.value = [...props.scenes];
    } finally {
      // 重置拖拽索引
      draggedOldIndex.value = -1;
      draggedNewIndex.value = -1;
    }
  };
</script>

<style scoped lang="scss">
  .grid-view-container {
    width: 100%;
    height: 100%;
    overflow: hidden;

    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
      background: rgb(255 255 255 / 90%);

      .loading-content {
        text-align: center;

        .loading-text {
          margin-top: 20px;
          color: #606266;
          font-size: 16px;
        }
      }
    }

    .empty-state {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;

      .empty-content {
        text-align: center;

        .empty-text {
          margin-top: 20px;
          color: #909399;
          font-size: 16px;
        }
      }
    }

    .grid-container {
      display: flex;
      flex-wrap: wrap;
      align-content: start;
      gap: 10px;
      width: 100%;
      height: calc(100vh - 180px);
      overflow-y: auto;
      padding: 4px;

      // 滚动条样式
      &::-webkit-scrollbar {
        width: 8px;
      }

      &::-webkit-scrollbar-track {
        background: #f5f7fa;
        border-radius: 4px;
      }

      &::-webkit-scrollbar-thumb {
        background: #c0c4cc;
        border-radius: 4px;
        transition: all 0.3s;

        &:hover {
          background: #909399;
        }
      }

      .draggable-wrapper {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        width: 100%;
      }

      .grid-card {
        position: relative;
        overflow: hidden;
        border-radius: 8px;
        border: 1px solid #e4e7ed;
        box-shadow: 0 2px 8px rgb(0 0 0 / 8%);
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        height: 300px;
        width: 400px;
        flex-shrink: 0;

        &:hover {
          box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.12);
          transform: translateY(-2px);

          .hover-actions {
            opacity: 1;
          }
        }

        &.hovered {
          .hover-actions {
            opacity: 1;
          }
        }

        .card-number-wrapper {
          position: absolute;
          top: 8px;
          left: 8px;
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 10px;

          .card-number {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 3px 8px;
            border-radius: 46px;
            background: rgba(255, 255, 255, 0.9);
            color: #1d2129;
            font-size: 12px;
            font-weight: 500;
            line-height: 1.5;
            user-select: none;
            transition: all 0.3s ease;

            // 拖拽手柄样式
            &.drag-handle {
              cursor: grab;

              &:hover {
                background: rgba(232, 233, 235, 0.95);
                transform: scale(1.1);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
              }

              &:active {
                cursor: grabbing;
                transform: scale(1.05);
              }
            }

            .icon {
              width: 12px;
              height: 12px;
            }
          }

          .status-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            transition: all 0.3s;

            // 可点击样式
            &.clickable {
              cursor: pointer;

              &:hover {
                transform: scale(1.2);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
              }

              &:active {
                transform: scale(1.1);
              }
            }

            // 状态颜色
            &.status-gray {
              background-color: #c9cdd4; // 未判定
            }

            &.status-orange {
              background-color: #ff7d00; // 橙色 - 待修改
            }

            &.status-green {
              background-color: #23c343; // 绿色 - 通过
            }

            &.status-red {
              background-color: #f53f3f; // 红色 - 驳回
            }
          }
        }

        .comment-count-badge {
          position: absolute;
          bottom: 8px;
          left: 8px;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 5px;
          background: #fff;
          cursor: pointer;
          transition: all 0.3s;

          &:hover {
            transform: scale(1.05);
          }

          .comment-icon {
            width: 12px;
            height: 12px;
            font-size: 12px;
            color: #5252ff;
          }

          .count-text {
            position: absolute;
            left: 12px;
            top: -12px;
            display: flex;
            width: 20px;
            height: 20px;
            justify-content: center;
            align-items: center;
            flex-shrink: 0;
            border-radius: 50%;
            background: #5252ff;
            color: #fff;
            font-size: 12px;
            line-height: 20px;
          }
        }

        .card-image {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          height: 100%;
          background: #f5f7fa;

          .shot-image {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }

          .image-placeholder {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            height: 100%;

            .placeholder-img {
              width: 60%;
              height: 60%;
              object-fit: contain;
              opacity: 0.5;
            }
          }
        }

        .hover-actions {
          position: absolute;
          top: 8px;
          right: 8px;
          z-index: 10;
          display: flex;
          gap: 4px;
          opacity: 0;
          transition: opacity 0.3s;

          :deep(.scene-actions) {
            gap: 4px;

            .el-button {
              width: 32px;
              height: 32px;
              padding: 0;
              border-radius: 6px;
              background: #fff;
              border: none;
              box-shadow: none;

              &:hover {
                background: #e8f3ff;

                .svg-icon {
                  color: #5468ff;
                }
              }

              .svg-icon {
                font-size: 14px;
                color: #4e5969;
              }
            }
          }
        }
      }

      // VueDraggable 拖拽样式
      .ghost-card {
        opacity: 0.4;
        background: #e0e7ff;
        border: 2px dashed #5252ff;
        transform: rotate(5deg);
      }

      .chosen-card {
        cursor: grabbing !important;
        transform: scale(1.05);
        box-shadow: 0 8px 24px rgba(82, 82, 255, 0.3);
        border: 2px solid #5252ff;
        z-index: 1000;
      }

      .dragging-card {
        opacity: 0.9;
        transform: scale(1.08) rotate(3deg);
        box-shadow: 0 12px 32px rgba(82, 82, 255, 0.4);
        cursor: grabbing !important;
        transition: none;
      }
    }
  }

  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
</style>
