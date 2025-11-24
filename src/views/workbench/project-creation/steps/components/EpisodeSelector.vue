<template>
  <el-popover
    v-model:visible="visible"
    placement="bottom-start"
    :width="260"
    trigger="click"
    popper-class="episode-popover"
    :hide-after="0"
    :tabindex="-1"
  >
    <template #reference>
      <slot name="reference">
        <el-button size="small">+ 编辑集数</el-button>
      </slot>
    </template>
    <div class="episode-selector-popover">
      <div class="popover-header">
        <span class="selected-info">选择集数(已选{{ localSelectedIds.length }}个)</span>
        <el-button size="small" type="primary" @click="handleConfirm" :loading="loading"> 确认 </el-button>
      </div>
      <div class="episode-tags-list">
        <el-tooltip
          v-for="episode in episodeList"
          :key="episode.episodeId"
          :content="episode.episodeName"
          placement="top"
          :disabled="!isTextOverflow(episode.episodeName)"
        >
          <div
            class="episode-tag-item"
            :class="{ active: episode.episodeId && localSelectedIds.includes(episode.episodeId!) }"
            @click="episode.episodeId && toggleEpisode(episode.episodeId)"
          >
            <span class="episode-name">{{ episode.episodeName }}</span>
          </div>
        </el-tooltip>
      </div>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
  import type { EpisodeInfo } from '@/api/workbench/project/types';
  import { computed, ref, watch } from 'vue';

  interface Props {
    modelValue: boolean;
    episodeList: EpisodeInfo[];
    selectedEpisodeIds: number[];
    loading?: boolean;
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void;
    (e: 'confirm', selectedIds: number[]): void;
    (e: 'close'): void;
  }

  const props = withDefaults(defineProps<Props>(), {
    loading: false
  });

  const emit = defineEmits<Emits>();

  const visible = computed({
    get: () => props.modelValue,
    set: (value) => {
      emit('update:modelValue', value);
      // 当 popover 关闭时,触发 close 事件
      if (!value) {
        emit('close');
      }
    }
  });

  const localSelectedIds = ref<number[]>([]);

  // Watch for prop changes to update local state
  watch(
    () => props.selectedEpisodeIds,
    (newIds) => {
      localSelectedIds.value = [...newIds];
    },
    { immediate: true }
  );

  // Toggle episode selection
  const toggleEpisode = (episodeId: number) => {
    const index = localSelectedIds.value.indexOf(episodeId);
    if (index > -1) {
      localSelectedIds.value.splice(index, 1);
    } else {
      localSelectedIds.value.push(episodeId);
    }
  };

  // 确认选择
  const handleConfirm = () => {
    emit('confirm', localSelectedIds.value);
  };

  // 判断文本是否溢出（简单判断：超过6个字符认为可能溢出）
  const isTextOverflow = (text: string | undefined): boolean => {
    if (!text) return false;
    return text.length > 6;
  };
</script>

<style scoped lang="scss">
  .episode-selector-popover {
    padding: 8px;

    .popover-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      // padding: 12px 16px;
      // border-bottom: 1px solid #f0f0f0;

      .selected-info {
        color: #86909c;
        font-size: 10px;
        font-weight: 500;
      }
    }

    .episode-tags-list {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      max-height: 300px;
      overflow-y: auto;
      margin-top: 8px;

      .episode-tag-item {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 28px;
        padding: 4px 12px;
        border: 1px solid #d9d9d9;
        border-radius: 6px;
        border: 1px solid #eee;
        background: #fff;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.3s;
        user-select: none;
        min-width: 0;
        color: #86909c;

        &:hover {
          border-color: #ffa940;
          color: #ffa940;
          background: #fffbf5;
        }

        &.active {
          color: #ff7d00;
          font-weight: 500;
          border-radius: 6px;
          border: 1px solid #ffcf8b;
          background: #fff7e8;
        }

        .episode-name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          width: 100%;
          text-align: center;
        }
      }
    }
  }
</style>

<style lang="scss">
  // 全局样式
  // Popover 样式
  .episode-popover.el-popover {
    padding: 0 !important;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgb(0 0 0 / 15%);
  }
</style>
