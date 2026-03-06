<template>
  <span
    class="image-mention-tag"
    :contenteditable="false"
    draggable="true"
    @dragstart="handleDragStart"
    @click="handleClick"
  >
    <span class="mention-content">
      <!-- 图片缩略图 -->
      <span class="mention-icon">
        <img :src="attrs.src" class="mention-thumbnail" draggable="false" />
      </span>
      <!-- 标签文字 -->
      <span class="mention-label">{{ attrs.label }}</span>
    </span>
  </span>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import type { Node } from '@tiptap/core';

  // 定义带 attrs 的 Node 类型
  interface NodeWithAttrs extends Node {
    attrs: Record<string, any>;
  }

  // 定义 NodeView Props 接口
  interface ImageMentionProps {
    node: NodeWithAttrs;
  }

  const props = defineProps<ImageMentionProps>();

  const attrs = computed(() => props.node.attrs);

  // 处理拖拽开始
  const handleDragStart = (e: DragEvent) => {
    if (e.dataTransfer) {
      // 设置拖拽数据
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData(
        'application/json',
        JSON.stringify({
          type: 'image-mention',
          id: props.node.attrs.id,
          src: props.node.attrs.src,
          label: props.node.attrs.label
        })
      );
    }
  };

  // 处理点击 - 可以扩展为预览或编辑
  const handleClick = () => {
    // TODO: 实现点击预览功能
    console.log('点击提及标签:', props.node.attrs);
  };
</script>

<style scoped lang="scss">
  .image-mention-tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 6px;
    margin: 0 2px;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.05);
    color: rgb(83, 100, 113);
    font-size: 14px;
    line-height: 1.5;
    cursor: grab;
    user-select: none;
    transition: all 0.1s linear;

    &:hover {
      background: rgba(0, 0, 0, 0.08);
    }

    &:active {
      cursor: grabbing;
    }
  }

  .mention-content {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .mention-icon {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .mention-thumbnail {
    width: 16px;
    height: 16px;
    border-radius: 2px;
    object-fit: cover;
    pointer-events: none;
  }

  .mention-label {
    font-size: 14px;
    font-weight: 400;
    white-space: nowrap;
  }
</style>
