<template>
  <div v-if="episodeList && episodeList.length > 0" class="episode-tags-display">
    <!-- 显示前3个剧集标签 -->
    <el-tooltip
      v-for="(ep, idx) in displayEpisodes"
      :key="idx"
      :content="ep.episodeName || ''"
      placement="top"
      :disabled="!isEpisodeNameOverflow(ep.episodeName)"
    >
      <el-tag size="small" type="warning" class="episode-tag-ellipsis">
        <span class="episode-tag-text">{{ ep.episodeName }}</span>
      </el-tag>
    </el-tooltip>

    <!-- +N 标签，点击查看全部 -->
    <el-popover
      v-if="extraCount > 0"
      v-model:visible="popoverVisible"
      placement="bottom-start"
      :width="260"
      trigger="click"
      popper-class="episode-tags-popover"
    >
      <template #reference>
        <el-tag size="small" type="warning" class="episode-tag-more"> +{{ extraCount }} </el-tag>
      </template>
      <div class="all-episodes-content">
        <div class="popover-header">
          <span class="title">查看全部剧集</span>
        </div>
        <div class="episode-tags-list">
          <el-tooltip
            v-for="episode in episodeList"
            :key="episode.episodeId"
            :content="episode.episodeName || ''"
            placement="top"
            :disabled="!isTextOverflow(episode.episodeName)"
          >
            <div class="episode-tag-item">
              <span class="episode-name">{{ episode.episodeName }}</span>
            </div>
          </el-tooltip>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue';

  interface EpisodeItem {
    episodeId?: number;
    episodeName?: string;
  }

  interface Props {
    episodeList?: EpisodeItem[];
  }

  const props = withDefaults(defineProps<Props>(), {
    episodeList: () => []
  });

  const popoverVisible = ref(false);

  // 获取显示的剧集（最多3个）
  const displayEpisodes = computed(() => {
    return props.episodeList?.slice(0, 2) || [];
  });

  // 获取超出数量
  const extraCount = computed(() => {
    return Math.max(0, (props.episodeList?.length || 0) - 2);
  });

  // 判断剧集名称是否溢出（简单判断：超过4个字符认为可能溢出）
  const isEpisodeNameOverflow = (name: string | undefined): boolean => {
    if (!name) return false;
    return name.length > 4;
  };

  // 判断文本是否溢出（用于全部剧集弹窗，超过6个字符认为可能溢出）
  const isTextOverflow = (text: string | undefined): boolean => {
    if (!text) return false;
    return text.length > 6;
  };
</script>

<style scoped lang="scss">
  :deep(.el-tag) {
    display: flex;
    height: 16px;
    padding: 2px 6px;
    line-height: 16px;
    justify-content: center;
    align-items: center;
    border-radius: 62px;
    border: 0.556px solid #ffcf8b;
    background: #fff7e8;

    .el-tag__content {
      display: flex;
      justify-content: center;
      align-items: center;
      text-align: center;
    }
  }
  .episode-tags-display {
    position: absolute;
    top: 8px;
    right: 8px;
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    max-width: calc(100% - 16px);
    z-index: 1;
    justify-content: flex-end;

    .episode-tag-ellipsis {
      max-width: 60px;
      cursor: default;

      .episode-tag-text {
        display: inline-block;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .episode-tag-more {
      cursor: pointer;

      &:hover {
        opacity: 0.8;
      }
    }
  }

  .all-episodes-content {
    padding: 8px;

    .popover-header {
      margin-bottom: 12px;

      .title {
        color: #1d2129;
        font-size: 14px;
        font-weight: 600;
      }
    }

    .episode-tags-list {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      max-height: 300px;
      overflow-y: auto;

      .episode-tag-item {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 28px;
        padding: 4px 12px;
        border-radius: 6px;
        border: 1px solid #ffcf8b;
        background: #fff7e8;
        font-size: 12px;
        color: #ff7d00;
        font-weight: 500;
        min-width: 0;
        user-select: none;

        .episode-name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          width: 100%;
          text-align: center;
        }
      }

      // 滚动条样式
      &::-webkit-scrollbar {
        width: 6px;
      }

      &::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 3px;
      }

      &::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 3px;

        &:hover {
          background: #a8a8a8;
        }
      }
    }
  }
</style>

<style lang="scss">
  // 全局样式
  .episode-tags-popover.el-popover {
    padding: 0 !important;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgb(0 0 0 / 15%);
  }
</style>
