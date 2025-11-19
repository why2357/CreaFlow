<template>
  <div ref="waterfallContainerRef" class="waterfall-view-container" @wheel="handleWheel">
    <!-- 加载中 -->
    <div v-if="loading" v-loading="loading" class="loading-container">
      <div class="loading-content">
        <el-icon class="is-loading" :size="60"><Loading /></el-icon>
        <p class="loading-text">加载中，请稍等...</p>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else-if="waterfallData.length === 0" class="empty-state">
      <div class="empty-content">
        <img style="width: 200px; height: 200px" src="../../../../../../assets/images/no-image-light.png" alt="" />
        <p class="empty-text">暂无数据</p>
      </div>
    </div>

    <!-- 瀑布流容器 -->
    <div v-else class="waterfall-container">
      <!-- 每一列对应一个 WaterfallItem -->
      <div
        v-for="(item, index) in waterfallData"
        :key="item.id"
        :ref="(el) => setColumnRef(el, item.id)"
        class="waterfall-column"
        :style="{ width: columnWidths[item.id] ? `${columnWidths[item.id]}px` : 'auto' }"
      >
        <!-- 第一张图片（当前选中的图片） -->
        <div class="main-image-wrapper" @mouseenter="handleMainImageHover(item)" @mouseleave="handleMainImageLeave">
          <!-- 有图片时显示 -->
          <el-image
            v-if="item.selectImg?.previewOssUrl || item.selectImg?.originOssUrl"
            :src="item.selectImg?.previewOssUrl || item.selectImg?.originOssUrl"
            fit="contain"
            class="main-image"
            :preview-src-list="[item.selectImg?.originOssUrl || item.selectImg?.previewOssUrl]"
            :preview-teleported="true"
            :z-index="9999"
            @load="(e: Event) => handleImageLoad(e, item.id)"
          />

          <!-- 空图片占位符 -->
          <div v-else class="empty-image-placeholder" :style="{ height: `${mainImageHeight}px`, width: '100%' }">
            <div class="placeholder-content">
              <svg-icon icon-class="fy-image" class="placeholder-icon" />
              <p class="placeholder-text">暂无画面</p>
              <p class="placeholder-hint">{{ item.sceneHint || item.dialogues || '等待生成分镜画面' }}</p>
            </div>
          </div>

          <!-- 悬浮操作按钮 -->
          <transition name="fade">
            <div v-if="hoveredMainImageId === item.id" class="hover-actions">
              <SceneActions
                button-size="default"
                tooltip-placement="top"
                :disable-comment="!item.imgTaskId"
                @comment="(event: MouseEvent) => handleComment(item, event)"
                @insert="handleInsert(item)"
                @review="(event: MouseEvent) => handleReview(item, event)"
                @delete="handleDeleteScene(item)"
              />
            </div>
          </transition>

          <!-- 镜号区域 -->
          <div class="card-number-wrapper">
            <!-- 镜号标签 -->
            <div class="card-number">
              <svg-icon icon-class="fy-juji" class="icon" />
              <span>{{ String(index + 1).padStart(2, '0') }}</span>
            </div>

            <!-- 状态指示圆点 -->
            <div v-if="item.imgStatus !== undefined" class="status-dot" :class="getDotClass(item.imgStatus)"></div>
          </div>
        </div>

        <!-- 镜头提示与台词 -->
        <div class="scene-info">
          <div v-if="item.sceneHint" class="scene-hint">
            <svg-icon icon-class="fy-jingtou" class="info-icon" />
            <span class="info-text">{{ item.sceneHint }}</span>
          </div>
          <div v-if="item.dialogues" class="scene-dialogue">
            <svg-icon icon-class="fy-taici" class="info-icon" />
            <span class="info-text">{{ item.dialogues }}</span>
          </div>
        </div>

        <!-- 历史图片列表 -->
        <div
          v-if="item.historyImgs && item.historyImgs.length > 0"
          class="history-images"
          :style="{ maxHeight: `calc(100vh - ${mainImageHeight + 330}px)` }"
        >
          <div class="history-box">
            <div
              v-for="historyImg in item.historyImgs"
              :key="historyImg.id"
              class="history-image-item"
              @mouseenter="hoveredHistoryImageId = historyImg.id"
              @mouseleave="hoveredHistoryImageId = null"
            >
              <el-image
                :src="historyImg.imgMaterial?.previewOssUrl || historyImg.imgMaterial?.originOssUrl"
                fit="contain"
                class="history-image"
                :preview-src-list="[historyImg.imgMaterial?.originOssUrl || historyImg.imgMaterial?.previewOssUrl]"
                :preview-teleported="true"
                :z-index="9999"
              />
              <!-- 右上角操作按钮 -->
              <transition name="fade">
                <div v-if="shouldShowActions(historyImg.id)" class="top-right-actions">
                  <el-tooltip content="替换" placement="top">
                    <div class="action-btn replace-btn" @click.stop="handleReplaceConfirm(item.id, historyImg.id)">
                      <svg-icon icon-class="fy-tihuan" />
                    </div>
                  </el-tooltip>
                  <el-tooltip :content="historyImg.isCollect ? '取消收藏' : '收藏'" placement="top">
                    <div
                      class="action-btn collect-btn"
                      :class="{ active: historyImg.isCollect }"
                      @click.stop="handleCollect(historyImg.id, historyImg.isCollect)"
                    >
                      <svg-icon v-if="historyImg.isCollect" icon-class="fy-starfilled" style="color: #ff7d00" />
                      <svg-icon v-else icon-class="fy-star" />
                    </div>
                  </el-tooltip>
                </div>
              </transition>
              <!-- 右下角更多按钮 -->
              <transition name="fade">
                <div v-if="shouldShowActions(historyImg.id)" class="bottom-right-actions">
                  <el-dropdown
                    trigger="click"
                    @command="(command: string) => handleMoreAction(command, item.id, historyImg)"
                    @visible-change="(visible: boolean) => (visible ? handleDropdownShow(historyImg.id) : handleDropdownHide())"
                  >
                    <div class="action-btn more-btn" @click.stop>
                      <svg-icon icon-class="fy-more" />
                    </div>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="download">
                          <svg-icon icon-class="fy-download" />
                          <span style="margin-left: 8px">下载</span>
                        </el-dropdown-item>
                        <el-dropdown-item command="delete">
                          <svg-icon icon-class="fy-del" />
                          <span style="margin-left: 8px">删除</span>
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </transition>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 替换确认对话框 -->
    <el-dialog v-model="replaceDialogVisible" title="替换分镜" width="400px" :append-to-body="true">
      <div>是否替换为新分镜</div>
      <template #footer>
        <div class="dialog-footer footer-box">
          <el-button @click="cancelReplace">取消</el-button>
          <el-button type="primary" @click="confirmReplace">确认</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import type { WaterfallItem } from '@/api/workbench/episode/waterfall';
  import { Loading } from '@element-plus/icons-vue';
  import { computed, onMounted, ref, watch } from 'vue';
  import SceneActions from '../../components/SceneActions.vue';

  interface Props {
    waterfallData: WaterfallItem[];
    loading?: boolean;
    aspectRatio?: string; // '1:1' | '16:9' | '9:16' | '4:3' | '3:4'
  }

  const props = withDefaults(defineProps<Props>(), {
    loading: false,
    aspectRatio: '16:9'
  });

  const emit = defineEmits<{
    (e: 'replace', basicId: number, historyDetailId: number): void;
    (e: 'collect', historyDetailId: number, isCollect: boolean): void;
    (e: 'download', historyImg: any): void;
    (e: 'delete', historyDetailId: number): void;
    (e: 'comment', item: WaterfallItem, event: MouseEvent): void;
    (e: 'insert', item: WaterfallItem): void;
    (e: 'review', item: WaterfallItem, event: MouseEvent): void;
    (e: 'deleteScene', item: WaterfallItem): void;
  }>();

  const waterfallContainerRef = ref<HTMLElement>();
  const hoveredMainImageId = ref<number | null>(null);
  const hoveredHistoryImageId = ref<number | null>(null);
  const activeDropdownImageId = ref<number | null>(null); // 记录当前打开下拉菜单的图片ID
  const columnWidths = ref<Record<number, number>>({});
  const emptyColumnHeights = ref<Record<number, number>>({}); // 存储空镜头的高度
  const columnRefs = new Map<number, HTMLElement>();
  const replaceDialogVisible = ref(false);
  const replaceInfo = ref<{ basicId: number; historyDetailId: number } | null>(null);

  // 设置列引用
  const setColumnRef = (el: any, itemId: number) => {
    if (el) {
      columnRefs.set(itemId, el as HTMLElement);
    }
  };

  // 根据宽高比计算主图片的固定高度
  const mainImageHeight = computed(() => {
    // 竖版和正方形比例使用固定高度
    const squareHeight = 260; // 1:1 的高度
    const verticalHeight = 462; // 9:16 的高度
    const defaultHeight = 320; // 横版默认高度

    const heightMap: Record<string, number> = {
      '1:1': squareHeight, // 正方形固定高度 260px
      '16:9': defaultHeight,
      '9:16': verticalHeight,
      '4:3': defaultHeight,
      '3:4': 347 // 3:4 的高度
    };

    return heightMap[props.aspectRatio] || defaultHeight;
  });

  // 计算列宽的通用函数
  const calculateColumnWidth = (imageAspectRatio: number) => {
    // 固定宽度为 260px（用于竖版和正方形）
    const fixedWidth = 260;
    const containerHeight = 320;

    // 根据项目配置的宽高比判断是否使用固定宽度
    const ratioMap: Record<string, { useFixedWidth: boolean; ratio: number }> = {
      '1:1': { useFixedWidth: true, ratio: 1 }, // 正方形使用固定宽度
      '16:9': { useFixedWidth: false, ratio: 16 / 9 },
      '9:16': { useFixedWidth: true, ratio: 9 / 16 }, // 竖版使用固定宽度
      '4:3': { useFixedWidth: false, ratio: 4 / 3 },
      '3:4': { useFixedWidth: true, ratio: 3 / 4 } // 竖版使用固定宽度
    };

    const config = ratioMap[props.aspectRatio] || { useFixedWidth: false, ratio: 16 / 9 };

    // 如果使用固定宽度（竖版或正方形），返回固定宽度
    if (config.useFixedWidth) {
      return fixedWidth;
    }

    // 横版比例根据实际图片宽高比计算宽度
    const calculatedWidth = Math.round(containerHeight * imageAspectRatio);
    const minWidth = 280;
    const maxWidth = 500;
    return Math.max(minWidth, Math.min(maxWidth, calculatedWidth));
  };

  // 计算空镜头高度的通用函数（根据项目配置的宽高比）
  const calculateEmptyColumnHeight = (width: number) => {
    // 根据项目配置的宽高比计算高度
    const ratioMap: Record<string, number> = {
      '1:1': 1,
      '16:9': 16 / 9,
      '9:16': 9 / 16,
      '4:3': 4 / 3,
      '3:4': 3 / 4
    };

    const aspectRatioValue = ratioMap[props.aspectRatio] || 16 / 9;
    const calculatedHeight = Math.round(width / aspectRatioValue);

    // 正方形比例使用固定高度 260px
    if (props.aspectRatio === '1:1') {
      return 260;
    }

    // 竖版比例使用更大的高度范围
    const isVertical = props.aspectRatio === '9:16' || props.aspectRatio === '3:4';
    if (isVertical) {
      const minHeight = props.aspectRatio === '9:16' ? 462 : 347;
      return Math.max(minHeight, calculatedHeight);
    }

    // 横版比例使用默认高度范围
    const minHeight = 280;
    const maxHeight = 320;
    return Math.max(minHeight, Math.min(maxHeight, calculatedHeight));
  };

  // 为空镜头设置默认高度（根据宽度计算）
  const initializeEmptyColumnHeight = (itemId: number, width: number) => {
    emptyColumnHeights.value[itemId] = calculateEmptyColumnHeight(width);
  };

  // 获取已加载图片的平均宽度，用于空镜头
  const getAverageColumnWidth = () => {
    const widths = Object.values(columnWidths.value);
    if (widths.length === 0) {
      // 如果没有任何已加载的图片，根据项目配置的宽高比返回默认宽度
      const ratioMap: Record<string, number> = {
        '1:1': 1,
        '16:9': 16 / 9,
        '9:16': 9 / 16,
        '4:3': 4 / 3,
        '3:4': 3 / 4
      };
      const defaultRatio = ratioMap[props.aspectRatio] || 16 / 9;
      return calculateColumnWidth(defaultRatio);
    }
    // 返回平均宽度
    const sum = widths.reduce((acc, width) => acc + width, 0);
    return Math.round(sum / widths.length);
  };

  // 处理图片加载完成，计算列宽
  const handleImageLoad = (event: Event, itemId: number) => {
    const img = event.target as HTMLImageElement;
    if (!img) return;

    // 获取图片的实际尺寸
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;

    // 根据图片宽高比计算实际显示宽度
    const aspectRatio = naturalWidth / naturalHeight;
    const finalWidth = calculateColumnWidth(aspectRatio);

    // 更新列宽
    columnWidths.value[itemId] = finalWidth;

    // 更新所有空镜头的宽度
    updateEmptyColumnWidths();
  };

  // 更新所有空镜头的宽度和高度
  const updateEmptyColumnWidths = () => {
    const averageWidth = getAverageColumnWidth();
    props.waterfallData.forEach((item) => {
      // 如果没有图片，则使用平均宽度和计算的高度
      if (!item.selectImg?.previewOssUrl && !item.selectImg?.originOssUrl) {
        columnWidths.value[item.id] = averageWidth;
        // 根据宽度计算对应的高度
        initializeEmptyColumnHeight(item.id, averageWidth);
      }
    });
  };

  // 初始化空镜头宽度
  onMounted(() => {
    updateEmptyColumnWidths();
  });

  // 监听数据变化，更新空镜头宽度
  watch(
    () => props.waterfallData,
    () => {
      updateEmptyColumnWidths();
    },
    { deep: true }
  );

  // 获取状态样式类（用于圆形徽章）
  const getStatusClass = (status: number) => {
    switch (status) {
      case 0:
        return 'status-gray'; // 灰色-未生成
      case 1:
        return 'status-orange'; // 橙色-生成中
      case 2:
        return 'status-green'; // 绿色-通过
      case 3:
        return 'status-red'; // 红色-待修改
      default:
        return 'status-gray';
    }
  };

  // 获取状态圆点样式类
  const getDotClass = (status: number) => {
    switch (status) {
      case 0:
        return 'status-gray'; // 灰色-未生成
      case 1:
        return 'status-orange'; // 橙色-生成中
      case 2:
        return 'status-green'; // 绿色-通过
      case 3:
        return 'status-red'; // 红色-待修改
      default:
        return 'status-gray';
    }
  };

  // 主图片 hover
  const handleMainImageHover = (item: WaterfallItem) => {
    hoveredMainImageId.value = item.id;
  };

  // 主图片 leave
  const handleMainImageLeave = () => {
    hoveredMainImageId.value = null;
  };

  // 留言
  const handleComment = (item: WaterfallItem, event: MouseEvent) => {
    emit('comment', item, event);
  };

  // 插入镜头
  const handleInsert = (item: WaterfallItem) => {
    emit('insert', item);
  };

  // 评审
  const handleReview = (item: WaterfallItem, event: MouseEvent) => {
    emit('review', item, event);
  };

  // 删除场景
  const handleDeleteScene = (item: WaterfallItem) => {
    emit('deleteScene', item);
  };

  // 替换图片确认对话框
  const handleReplaceConfirm = (basicId: number, historyDetailId: number) => {
    replaceInfo.value = { basicId, historyDetailId };
    replaceDialogVisible.value = true;
  };

  // 确认替换
  const confirmReplace = () => {
    if (replaceInfo.value) {
      emit('replace', replaceInfo.value.basicId, replaceInfo.value.historyDetailId);
      replaceDialogVisible.value = false;
      replaceInfo.value = null;
    }
  };

  // 取消替换
  const cancelReplace = () => {
    replaceDialogVisible.value = false;
    replaceInfo.value = null;
  };

  // 收藏/取消收藏
  const handleCollect = (historyDetailId: number, isCollect: boolean) => {
    emit('collect', historyDetailId, isCollect);
  };

  // 下拉菜单显示时
  const handleDropdownShow = (historyImgId: number) => {
    activeDropdownImageId.value = historyImgId;
  };

  // 下拉菜单隐藏时
  const handleDropdownHide = () => {
    activeDropdownImageId.value = null;
  };

  // 更多操作下拉菜单
  const handleMoreAction = (command: string, _basicId: number, historyImg: any) => {
    if (command === 'download') {
      emit('download', historyImg);
    } else if (command === 'delete') {
      emit('delete', historyImg.id);
    }
  };

  // 判断是否显示操作按钮
  const shouldShowActions = (historyImgId: number) => {
    return hoveredHistoryImageId.value === historyImgId || activeDropdownImageId.value === historyImgId;
  };

  // 处理滚轮事件：Ctrl + 滚轮实现左右滑动
  const handleWheel = (event: WheelEvent) => {
    if (event.ctrlKey && waterfallContainerRef.value) {
      event.preventDefault();
      // deltaY 为正表示向下滚动，为负表示向上滚动
      // 在按下 Ctrl 时，向下滚动向右移动，向上滚动向左移动
      const container = waterfallContainerRef.value.querySelector('.waterfall-container');
      if (container) {
        container.scrollLeft += event.deltaY;
      }
    }
  };
</script>

<style scoped lang="scss">
  .waterfall-view-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow-x: auto;
    overflow-y: auto;
    // background: #f5f7fa;

    // 滚动条样式
    &::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    &::-webkit-scrollbar-thumb {
      background: #dcdfe6;
      border-radius: 4px;

      &:hover {
        background: #c0c4cc;
      }
    }

    &::-webkit-scrollbar-track {
      background: #f5f7fa;
      border-radius: 4px;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
      // background: rgb(255 255 255 / 90%);

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

    .waterfall-container {
      display: flex;
      gap: 20px;
      padding-bottom: 20px;
      // min-height: 100%;
      overflow-x: auto;

      // 水平滚动条样式
      &::-webkit-scrollbar {
        height: 8px;
      }

      &::-webkit-scrollbar-thumb {
        background: #dcdfe6;
        border-radius: 4px;

        &:hover {
          background: #c0c4cc;
        }
      }

      &::-webkit-scrollbar-track {
        background: #f5f7fa;
        border-radius: 4px;
      }

      .waterfall-column {
        display: flex;
        flex-direction: column;
        flex-shrink: 0;
        background: white;
        border-radius: 6px;
        overflow: hidden;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
        transition: box-shadow 0.3s ease;

        &:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
        }

        .main-image-wrapper {
          position: relative;
          width: 100%;
          // height: 320px;
          overflow: hidden;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f5f7fa;

          &:hover {
            .hover-actions {
              opacity: 1;
            }
          }

          .main-image {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }

          // 空图片占位符
          .empty-image-placeholder {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
            border: 2px dashed #d1d5db;
            border-radius: 4px;

            .placeholder-content {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 40px 20px;
              text-align: center;

              .placeholder-icon {
                width: 64px;
                height: 64px;
                margin-bottom: 16px;
                color: #c9cdd4;
                opacity: 0.6;
              }

              .placeholder-text {
                margin: 0 0 8px 0;
                color: #86909c;
                font-size: 16px;
                font-weight: 500;
              }

              .placeholder-hint {
                margin: 0;
                max-width: 200px;
                color: #a8adb5;
                font-size: 12px;
                line-height: 1.6;
                word-break: break-word;
                overflow: hidden;
                text-overflow: ellipsis;
                display: -webkit-box;
                -webkit-line-clamp: 3;
                line-clamp: 3;
                -webkit-box-orient: vertical;
              }
            }
          }

          // 悬浮操作按钮
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
                border-radius: 4px;
                background: rgba(255, 255, 255, 0.95);
                border: none;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

                &:hover {
                  background: #fff;
                  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

                  .svg-icon {
                    color: #5468ff;
                  }
                }

                .svg-icon {
                  font-size: 16px;
                  color: #4e5969;
                }
              }
            }
          }

          // 镜号区域
          .card-number-wrapper {
            position: absolute;
            top: 8px;
            left: 8px;
            display: flex;
            align-items: center;
            gap: 8px;
            z-index: 5;

            .card-number {
              display: flex;
              align-items: center;
              gap: 4px;
              padding: 3px 8px;
              border-radius: 46px;
              background: rgba(255, 255, 255, 0.9);
              color: #1d2129;
              font-size: 12px;
              font-weight: 600;

              .icon {
                width: 16px;
                height: 16px;
                color: #5252ff;
              }
            }

            .status-dot {
              width: 12px;
              height: 12px;
              border-radius: 50%;

              &.status-gray {
                background-color: #c9cdd4;
              }

              &.status-orange {
                background-color: #ff7d00;
              }

              &.status-green {
                background-color: #23c343;
              }

              &.status-red {
                background-color: #f53f3f;
              }
            }
          }
        }

        // fade 过渡动画
        .fade-enter-active,
        .fade-leave-active {
          transition: opacity 0.3s;
        }

        .fade-enter-from,
        .fade-leave-to {
          opacity: 0;
        }

        .scene-info {
          padding: 12px 16px;
          border-bottom: 1px solid #f2f3f5;
          max-height: 150px;
          min-height: 150px;
          overflow-y: auto;

          // 滚动条样式
          &::-webkit-scrollbar {
            width: 4px;
          }

          &::-webkit-scrollbar-thumb {
            background: #dcdfe6;
            border-radius: 2px;

            &:hover {
              background: #c0c4cc;
            }
          }

          .scene-hint,
          .scene-dialogue {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            margin-bottom: 8px;

            &:last-child {
              margin-bottom: 0;
            }

            .info-icon {
              flex-shrink: 0;
              margin-top: 2px;
              width: 16px;
              height: 16px;
              color: #5252ff;
            }

            .info-text {
              flex: 1;
              color: #4e5969;
              font-size: 14px;
              line-height: 1.6;
              word-break: break-word;
            }
          }
        }

        .history-images {
          gap: 8px;
          padding: 12px;
          overflow-y: auto;
          .history-box {
            display: flex;
            flex-direction: column;
          }

          // 滚动条样式
          &::-webkit-scrollbar {
            width: 4px;
          }

          &::-webkit-scrollbar-thumb {
            background: #dcdfe6;
            border-radius: 2px;

            &:hover {
              background: #c0c4cc;
            }
          }

          .history-image-item {
            position: relative;
            width: 100%;
            border-radius: 4px;
            overflow: hidden;
            cursor: pointer;
            transition: all 0.3s;
            background: #f7f8fa;
            display: flex;
            flex-direction: column;
            margin-bottom: 12px;

            &:last-child {
              margin-bottom: 0;
            }

            .history-image {
              width: 100%;
              object-fit: contain;
              display: block;
              flex-shrink: 0;
              background: #f7f8fa;
            }

            // 右上角操作按钮
            .top-right-actions {
              position: absolute;
              top: 8px;
              right: 8px;
              display: flex;
              gap: 8px;
              z-index: 10;

              .action-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 32px;
                height: 32px;
                border-radius: 4px;
                background: rgba(255, 255, 255, 0.95);
                cursor: pointer;
                transition: all 0.2s;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

                &:hover {
                  background: #fff;
                  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                }

                .svg-icon {
                  width: 16px;
                  height: 16px;
                }

                &.replace-btn {
                  .svg-icon {
                    color: #86909c;
                  }

                  &:hover .svg-icon {
                    color: #4040dd;
                  }
                }

                &.collect-btn {
                  .svg-icon {
                    color: #86909c;
                  }

                  &.active .svg-icon {
                    color: #ff9500;
                  }

                  &:hover .svg-icon {
                    color: #ff9500;
                  }
                }
              }
            }

            // 右下角更多按钮
            .bottom-right-actions {
              position: absolute;
              bottom: 8px;
              right: 8px;
              z-index: 10;

              :deep(.el-dropdown) {
                .action-btn {
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  width: 32px;
                  height: 32px;
                  border-radius: 4px;
                  background: rgba(255, 255, 255, 0.95);
                  cursor: pointer;
                  transition: all 0.2s;
                  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

                  &:hover {
                    background: #fff;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                  }

                  .svg-icon {
                    width: 16px;
                    height: 16px;
                    color: #4e5969;
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  // 下拉菜单样式
  :deep(.el-dropdown-menu) {
    .el-dropdown-menu__item {
      display: flex;
      align-items: center;
      padding: 8px 16px;

      .svg-icon {
        width: 16px;
        height: 16px;
      }
    }
  }
  .footer-box {
    display: flex;
  }
</style>
