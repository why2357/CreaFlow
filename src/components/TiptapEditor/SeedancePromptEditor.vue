<template>
  <div class="seedance-prompt-container" ref="containerRef">
    <!-- 参考图区域（堆叠样式） -->
    <div
      v-if="showReferenceBar && referenceStore.images.length > 0"
      class="reference-images-section"
      :class="{ 'drag-over': isDragOver }"
      @drop="handleDrop"
      @dragover="handleDragOverSection"
      @dragenter="handleDragEnter"
      @dragleave="handleDragLeave"
    >
      <div
        class="reference-images-stack"
        :class="{ 'is-expanded': isHoveringImages }"
        @mouseenter="handleImagesMouseEnter"
        @mouseleave="handleImagesMouseLeave"
      >
        <TransitionGroup name="stack-slide">
          <div
            v-for="(image, index) in referenceStore.images"
            :key="image.id"
            class="reference-image-item"
            :class="{ 'is-hovered': isHoveringImages }"
            :style="getImageStackStyle(index, isHoveringImages)"
            draggable="true"
            @dragstart="handleReferenceDragStart($event, image)"
            @click="handleInsertMentionTag(image)"
          >
            <img :src="image.src" class="reference-thumbnail" />
            <!-- 删除按钮 -->
            <Transition name="delete-fade">
              <div v-if="isHoveringImages" class="delete-button" @click.stop.prevent="handleRemoveReference($event, image.id)">
                <svg-icon icon-class="fy-del" style="width: 12px; height: 12px" />
              </div>
            </Transition>
          </div>

          <!-- 添加按钮 -->
          <div
            v-if="referenceStore.images.length < 3"
            :key="'add-button'"
            class="reference-image-item add-more-button"
            :class="{ 'is-hovered': isHoveringImages, 'is-empty': referenceStore.images.length === 0 }"
            :style="getAddButtonStyle(referenceStore.images.length, isHoveringImages)"
          >
            <el-upload
              :show-file-list="false"
              :before-upload="handleBeforeUpload"
              :http-request="handleUpload"
              :multiple="true"
              class="add-more-upload"
            >
              <div class="add-more-content">
                <svg-icon icon-class="fy-add" style="height: 16px; width: 16px" />
              </div>
            </el-upload>
          </div>
        </TransitionGroup>
      </div>
    </div>

    <!-- 输入框区域（没有参考图时显示） -->
    <div v-if="!showReferenceBar || referenceStore.images.length === 0" class="input-wrapper">
      <div
        ref="editorRef"
        class="prompt-editor"
        :contenteditable="true"
        :data-placeholder="placeholder"
        @input="handleInput"
        @keydown="handleKeydown"
        @focus="isFocused = true"
        @blur="handleBlur"
        @drop="handleDrop"
        @dragover="handleDragOver"
      ></div>
      <!-- 圆形上传按钮 -->
      <div class="input-actions">
        <div class="circular-upload-button-wrapper">
          <el-upload
            :show-file-list="false"
            :before-upload="handleBeforeUpload"
            :http-request="handleUpload"
            :multiple="true"
            class="circular-upload"
          >
            <div class="circular-upload-button">
              <svg-icon icon-class="fy-add" style="height: 18px; width: 18px" />
            </div>
          </el-upload>
        </div>
      </div>
    </div>

    <!-- 只在有参考图时显示输入框（独立于上传区域） -->
    <div v-if="showReferenceBar && referenceStore.images.length > 0" class="input-wrapper-alone">
      <div
        ref="editorRef"
        class="prompt-editor"
        :contenteditable="true"
        :data-placeholder="placeholder"
        @input="handleInput"
        @keydown="handleKeydown"
        @focus="isFocused = true"
        @blur="handleBlur"
        @drop="handleDrop"
        @dragover="handleDragOver"
      ></div>
    </div>

    <!-- 提及标签预览 -->
    <div v-if="mentionTags.length > 0" class="mention-tags-preview">
      <div
        v-for="tag in mentionTags"
        :key="tag.id"
        class="mention-tag-item"
        :class="[
          `mention-tag-${tag.type}`,
          { 'is-selected': selectedPreviewTagId === tag.id }
        ]"
        @click="handlePreviewTagClick(tag)"
        @dblclick="handleInsertTagToEditor(tag)"
      >
        <img v-if="tag.src" :src="tag.src" class="mention-tag-thumb" @click.stop.prevent />
        <svg-icon v-else :icon-class="getTagIcon(tag.type)" class="mention-tag-icon" />
        <span class="mention-tag-label">{{ tag.label }}</span>
        <span v-if="tag.subtitle" class="mention-tag-subtitle">{{ tag.subtitle }}</span>
        <div class="mention-tag-delete" @click.stop.prevent="handleRemoveMentionTag($event, tag.id)">
          <svg-icon icon-class="fy-del" style="width: 10px; height: 10px" />
        </div>
      </div>
    </div>

    <!-- 提及弹窗 -->
    <MentionPopup
      ref="mentionPopupRef"
      :query="mentionQuery"
      :on-select="handleMentionSelect"
      :on-close="handleMentionClose"
    />
  </div>
</template>

<script setup lang="ts">
import { useReferenceStore } from '@/store/modules/reference';
import { ElMessage } from 'element-plus';
import type { ReferenceImage, DragData, MentionOption, MentionType } from '@/types/mention';
import { MentionType as MentionTypeEnum } from '@/types/mention';
import MentionPopup from './MentionPopup.vue';
import { ref, watch, nextTick } from 'vue';

interface Props {
  modelValue: string;
  placeholder?: string;
  showReferenceBar?: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '请输入提示词，输入@可提及图片、角色或场景',
  showReferenceBar: true
});

const emit = defineEmits<Emits>();

const referenceStore = useReferenceStore();

// Refs
const containerRef = ref<HTMLElement>();
const editorRef = ref<HTMLDivElement | null>(null);
const mentionPopupRef = ref<InstanceType<typeof MentionPopup>>();

// 是否聚焦
const isFocused = ref(false);

// hover状态
const isHoveringImages = ref(false);
let hoverTimer: ReturnType<typeof setTimeout> | null = null;

// 拖拽相关状态
const isDragOver = ref(false);
const dragCounter = ref(0);

// 文本内容（处理后的，不包含提及标签）
const textValue = ref('');

// 提及标签列表
const mentionTags = ref<Array<{
  id: string;
  type: MentionType;
  src?: string;
  label: string;
  subtitle?: string;
  alias?: string;
  category?: string;
}>>([]);

// 当前选中的预览标签ID
const selectedPreviewTagId = ref<string | null>(null);

// 提及弹窗相关
const mentionTriggerPos = ref<{ start: number; end: number } | null>(null);
const mentionQuery = ref('');

// 获取标签图标
const getTagIcon = (type: MentionType) => {
  switch (type) {
    case MentionTypeEnum.CHARACTER:
      return 'fy-user';
    case MentionTypeEnum.SCENE:
      return 'fy-scene';
    default:
      return 'fy-image';
  }
};

// 解析 modelValue，分离文本和提及标签
const parseModelValue = (value: string) => {
  const tags: typeof mentionTags.value = [];

  // 先尝试解析 HTML 格式的提及标签（向后兼容）
  const htmlMentionRegex = /<span[^>]*data-type="(reference|character|scene)"[^>]*data-id="([^"]*)"[^>]*>(?:<span[^>]*>.*?<\/span>)?<\/span>/gi;

  let match;
  while ((match = htmlMentionRegex.exec(value)) !== null) {
    const type = match[1] as MentionType;
    const id = match[2];

    // 提取其他属性
    const srcMatch = match[0].match(/data-src="([^"]*)"/);
    const labelMatch = match[0].match(/data-label="([^"]*)"/);
    const aliasMatch = match[0].match(/data-alias="([^"]*)"/);
    const categoryMatch = match[0].match(/data-category="([^"]*)"/);

    tags.push({
      id,
      type,
      src: srcMatch?.[1] || undefined,
      label: labelMatch?.[1] || '',
      alias: aliasMatch?.[1],
      category: categoryMatch?.[1]
    });
  }

  // 使用 DOMParser 解析内联提及格式（更可靠的方法）
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${value}</div>`, 'text/html');
  const mentionElements = doc.querySelectorAll('.inline-mention');

  mentionElements.forEach((el, index) => {
    const img = el.querySelector('img');
    const src = img?.getAttribute('src');
    const label = el.getAttribute('data-label');
    const type = el.getAttribute('data-type') as MentionType;
    const id = el.getAttribute('data-id') || `mention-${Date.now()}-${index}`;

    if (src && label) {
      tags.push({
        id,
        type: type || MentionTypeEnum.REFERENCE,
        src,
        label
      });
    }
  });

  // 兼容旧的独立 img 格式
  const imgRegex = /<img[^>]*class="inline-image"[^>]*>/gi;
  while ((match = imgRegex.exec(value)) !== null) {
    const srcMatch = match[0].match(/src="([^"]*)"/);
    const labelMatch = match[0].match(/data-label="([^"]*)"/);
    const typeMatch = match[0].match(/data-type="([^"]*)"/);

    if (srcMatch && labelMatch) {
      tags.push({
        id: `img-${Date.now()}-${Math.random()}`,
        type: (typeMatch?.[1] || MentionTypeEnum.REFERENCE) as MentionType,
        src: srcMatch[1],
        label: labelMatch[1]
      });
    }
  }

  mentionTags.value = tags;
  textValue.value = value; // 保留原始 HTML

  // 设置编辑器内容
  nextTick(() => {
    if (editorRef.value && editorRef.value.innerHTML !== value) {
      editorRef.value.innerHTML = value;
    }
  });
};

// 构建包含提及标签的文本
const buildHtmlWithMentions = (text: string, tags: typeof mentionTags.value) => {
  let result = text;

  // 为每个提及标签创建文本格式
  const tagsText = tags.map(tag => {
    // 根据类型添加前缀（不包含 @）
    const prefix = tag.type === MentionTypeEnum.CHARACTER ? '角色:' :
                   tag.type === MentionTypeEnum.SCENE ? '场景:' : '';
    return prefix + tag.label;
  }).join(' ');

  return result + (tagsText ? ' ' + tagsText : '');
};

// 监听 modelValue 变化
watch(() => props.modelValue, (newValue) => {
  parseModelValue(newValue);
}, { immediate: true });

// 处理输入
const handleInput = (e: Event) => {
  const target = e.target as HTMLDivElement;

  // 检查是否触发提及（@ 符号）
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const startRange = document.createRange();
    startRange.selectNodeContents(target);
    startRange.setEnd(range.startContainer, range.startOffset);
    const beforeCursor = startRange.toString();
    const atMatch = beforeCursor.match(/@(\w*)$/);

    if (atMatch) {
      // 更新查询内容
      mentionQuery.value = atMatch[1];

      // 只在弹窗未打开时才触发（第一次输入 @ 时）
      if (!mentionTriggerPos.value) {
        mentionTriggerPos.value = {
          start: beforeCursor.length - atMatch[0].length,
          end: beforeCursor.length
        };
        showMentionPopup();
      }
    } else {
      // 不再匹配 @ 模式，关闭弹窗
      mentionPopupRef.value?.hide();
      mentionTriggerPos.value = null;
    }
  }

  // 输出 HTML 内容
  emit('update:modelValue', target.innerHTML);
};

// 处理键盘事件
const handleKeydown = (e: KeyboardEvent) => {
  // 如果提及弹窗打开，让弹窗处理键盘事件
  if (mentionTriggerPos.value) {
    const keys = ['ArrowUp', 'ArrowDown', 'Enter', 'Escape', 'Tab'];
    if (keys.includes(e.key)) {
      e.preventDefault();
    }
    return;
  }

  // 处理删除键：检查选中的是否是提及元素
  if (e.key === 'Delete' || e.key === 'Backspace') {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);

      // 检查选中内容是否是单个提及元素内的文本
      if (range.startContainer === range.endContainer &&
          range.startContainer.nodeType === Node.TEXT_NODE &&
          range.startContainer.parentElement?.classList.contains('inline-mention')) {
        const mention = range.startContainer.parentElement;
        if (mention.classList.contains('inline-mention')) {
          e.preventDefault();
          mention.remove();
          if (editorRef.value) {
            emit('update:modelValue', editorRef.value.innerHTML);
          }
          ElMessage.success('已删除图片');
          return;
        }
      }

      // 检查光标是否在提及元素旁边，尝试删除
      const { startContainer, startOffset } = range;
      if (startContainer.nodeType === Node.TEXT_NODE) {
        const textNode = startContainer as Text;

        // 如果光标在文本节点开头，检查前一个兄弟节点
        if (e.key === 'Backspace' && startOffset === 0) {
          const prevSibling = textNode.previousSibling;
          if (prevSibling && (prevSibling as HTMLElement).classList?.contains('inline-mention')) {
            e.preventDefault();
            prevSibling.remove();
            if (editorRef.value) {
              emit('update:modelValue', editorRef.value.innerHTML);
            }
            ElMessage.success('已删除图片');
            return;
          }
        }

        // 如果光标在文本节点末尾，检查后一个兄弟节点
        if (e.key === 'Delete' && startOffset === textNode.length) {
          const nextSibling = textNode.nextSibling;
          if (nextSibling && (nextSibling as HTMLElement).classList?.contains('inline-mention')) {
            e.preventDefault();
            nextSibling.remove();
            if (editorRef.value) {
              emit('update:modelValue', editorRef.value.innerHTML);
            }
            ElMessage.success('已删除图片');
            return;
          }
        }
      }
    }
  }
};

// 处理失焦
const handleBlur = () => {
  // 延迟关闭，以便点击弹窗
  setTimeout(() => {
    isFocused.value = false;
  }, 200);
};

// 显示提及弹窗
const showMentionPopup = () => {
  if (!editorRef.value) return;

  const rect = editorRef.value.getBoundingClientRect();

  // 计算光标位置（简化版，使用编辑器底部）
  const popupX = rect.left;
  const popupY = rect.bottom + 5;

  mentionPopupRef.value?.show(popupX, popupY);
};

// 创建内联提及元素（包含图片、@符号和名字）
const createInlineImage = (src: string, label: string, type: MentionType) => {
  // 创建容器元素
  const container = document.createElement('span');
  const uniqueId = `mention-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  container.className = 'inline-mention';
  container.contentEditable = 'false';
  container.draggable = true;
  container.dataset.type = type;
  container.dataset.label = label;
  container.dataset.id = uniqueId;
  container.title = '选中后按删除键删除';

  // 创建图片元素
  const img = document.createElement('img');
  img.src = src;
  img.className = 'inline-image';
  img.draggable = false; // 禁用图片的拖拽，使用容器的拖拽

  // 创建文本节点（@符号和名字）
  const textSpan = document.createElement('span');
  textSpan.className = 'inline-mention-text';
  textSpan.textContent = `@${label}`;

  // 组装
  container.appendChild(img);
  container.appendChild(textSpan);

  // 添加拖拽事件
  container.addEventListener('dragstart', handleInlineImageDragStart);
  container.addEventListener('dragend', handleInlineImageDragEnd);

  // 添加点击事件：点击时切换选中状态
  container.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const selection = window.getSelection();

    // 检查是否已经选中了这个元素
    const isSelected = selection.rangeCount > 0 &&
                       selection.containsNode(container, true);

    if (isSelected) {
      // 如果已选中，取消选中
      selection.removeAllRanges();
    } else {
      // 如果未选中，选中整个提及元素
      const range = document.createRange();
      range.selectNodeContents(container);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  });

  return container;
};

// 处理提及选择
const handleMentionSelect = (option: MentionOption) => {
  if (!mentionTriggerPos.value || !editorRef.value) return;

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);

  // 删除 @ 符号
  const { start } = mentionTriggerPos.value;
  // 找到 @ 的位置并删除
  const editorRange = document.createRange();
  const walker = document.createTreeWalker(
    editorRef.value,
    NodeFilter.SHOW_TEXT,
    null
  );

  let charCount = 0;
  let targetNode: Node | null = null;
  let targetOffset = 0;

  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (charCount + node.length >= start) {
      targetNode = node;
      targetOffset = start - charCount;
      break;
    }
    charCount += node.length;
  }

  if (targetNode) {
    editorRange.setStart(targetNode, targetOffset);
    editorRange.setEnd(targetNode, targetOffset + 1);
    editorRange.deleteContents();

    // 插入图片
    const img = createInlineImage(option.src || '', option.label, option.type);
    editorRange.insertNode(img);

    // 移动光标到图片后面
    editorRange.setStartAfter(img);
    editorRange.setEndAfter(img);
    selection.removeAllRanges();
    selection.addRange(editorRange);
  }

  // 更新输出
  emit('update:modelValue', editorRef.value.innerHTML);

  // 关闭弹窗
  mentionTriggerPos.value = null;
  mentionQuery.value = '';

  // 聚焦回编辑器
  nextTick(() => {
    editorRef.value?.focus();
  });

  const typeLabel = option.type === MentionTypeEnum.REFERENCE ? '参考图' : option.type === MentionTypeEnum.CHARACTER ? '角色' : '场景';
  ElMessage.success(`已插入${typeLabel}: ${option.label}`);
};

// 处理提及弹窗关闭
const handleMentionClose = () => {
  mentionTriggerPos.value = null;
  mentionQuery.value = '';
};

// 插入图片（点击参考图）
const handleInsertMentionTag = (image: ReferenceImage) => {
  if (!editorRef.value) return;

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);

  // 插入图片
  const img = createInlineImage(image.src, image.label, MentionTypeEnum.REFERENCE);
  range.deleteContents();
  range.insertNode(img);

  // 移动光标到图片后面
  range.setStartAfter(img);
  range.setEndAfter(img);
  selection.removeAllRanges();
  selection.addRange(range);

  // 更新输出
  emit('update:modelValue', editorRef.value.innerHTML);

  ElMessage.success(`已插入${image.label}`);
};

// 点击预览标签切换选中状态
const handlePreviewTagClick = (tag: typeof mentionTags.value[0]) => {
  if (selectedPreviewTagId.value === tag.id) {
    // 如果已选中，取消选中
    selectedPreviewTagId.value = null;
  } else {
    // 如果未选中，选中该标签
    selectedPreviewTagId.value = tag.id;
  }
};

// 点击标签插入到编辑器（改为双击触发）
const handleInsertTagToEditor = (tag: typeof mentionTags.value[0]) => {
  if (!editorRef.value || !tag.src) return;

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);

  // 插入内联提及元素
  const mention = createInlineImage(tag.src, tag.label, tag.type);
  range.deleteContents();
  range.insertNode(mention);

  // 移动光标到提及元素后面
  range.setStartAfter(mention);
  range.setEndAfter(mention);
  selection.removeAllRanges();
  selection.addRange(range);

  // 更新输出
  emit('update:modelValue', editorRef.value.innerHTML);

  // 聚焦编辑器
  nextTick(() => {
    editorRef.value?.focus();
  });
};

// 删除提及标签
const handleRemoveMentionTag = (e: Event | string, id?: string) => {
  // 支持两种调用方式：(event, id) 或
  let actualId: string;
  if (typeof e === 'string') {
    actualId = e;
  } else {
    e.preventDefault();
    e.stopPropagation();
    actualId = id as string;
  }

  // 找到对应的 tag 获取其 label
  const tagToRemove = mentionTags.value.find(tag => tag.id === actualId);
  if (!tagToRemove) {
    mentionTags.value = mentionTags.value.filter(tag => tag.id !== actualId);
    return;
  }

  // 从 mentionTags 数组中删除
  mentionTags.value = mentionTags.value.filter(tag => tag.id !== actualId);

  // 同时从编辑器中删除对应的内联提及元素（通过 label 匹配）
  if (editorRef.value) {
    const mentionElements = editorRef.value.querySelectorAll('.inline-mention');
    mentionElements.forEach(el => {
      const element = el as HTMLElement;
      if (element.dataset.label === tagToRemove.label && element.dataset.type === tagToRemove.type) {
        element.remove();
      }
    });
    emit('update:modelValue', editorRef.value.innerHTML);
  }
};

// 处理参考图拖拽开始
const handleReferenceDragStart = (e: DragEvent, image: ReferenceImage) => {
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'copy';
    const dragData: DragData = {
      type: MentionTypeEnum.REFERENCE,
      id: image.id,
      src: image.src,
      label: image.label
    };
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
  }
};

// ==================== 内联图片拖拽排序 ====================
let draggedInlineImage: HTMLElement | null = null;

// 内联图片拖拽开始
const handleInlineImageDragStart = (e: DragEvent) => {
  const target = e.target as HTMLElement;
  if (target.classList.contains('inline-mention')) {
    draggedInlineImage = target;
    target.classList.add('dragging');
    e.dataTransfer!.effectAllowed = 'move';
  }
};

// 内联图片拖拽结束
const handleInlineImageDragEnd = (e: DragEvent) => {
  const target = e.target as HTMLElement;
  if (target.classList.contains('inline-mention')) {
    target.classList.remove('dragging');
    clearDropIndicators();
    draggedInlineImage = null;
  }
};

// 清除放置指示器
const clearDropIndicators = () => {
  if (!editorRef.value) return;
  const mentions = editorRef.value.querySelectorAll('.inline-mention');
  mentions.forEach(mention => {
    mention.classList.remove('drop-before', 'drop-after');
  });
};

// 内联图片拖拽经过
const handleInlineImageDragOver = (e: DragEvent) => {
  e.preventDefault();
  if (!draggedInlineImage || !editorRef.value) return;

  e.dataTransfer!.dropEffect = 'move';
  clearDropIndicators();

  const x = e.clientX;
  const y = e.clientY;
  const elementAtPoint = document.elementFromPoint(x, y);

  if (!elementAtPoint || !editorRef.value.contains(elementAtPoint)) {
    return;
  }

  // 查找最近的内联提及元素
  let targetMention = elementAtPoint?.closest('.inline-mention') as HTMLElement | null;

  if (targetMention && targetMention !== draggedInlineImage) {
    const rect = targetMention.getBoundingClientRect();
    const centerX = rect.x + rect.width / 2;

    if (x < centerX) {
      targetMention.classList.add('drop-before');
    } else {
      targetMention.classList.add('drop-after');
    }
  }
};

// 内联图片放置
const handleInlineImageDrop = (e: DragEvent) => {
  e.preventDefault();
  if (!draggedInlineImage || !editorRef.value) return;

  const x = e.clientX;
  const y = e.clientY;
  const elementAtPoint = document.elementFromPoint(x, y);

  if (!elementAtPoint) {
    clearDropIndicators();
    draggedInlineImage = null;
    return;
  }

  let targetMention = elementAtPoint?.closest('.inline-mention') as HTMLElement | null;

  if (targetMention && targetMention !== draggedInlineImage) {
    const rect = targetMention.getBoundingClientRect();
    const centerX = rect.x + rect.width / 2;
    const insertBefore = x < centerX;

    if (insertBefore) {
      targetMention.before(draggedInlineImage);
    } else {
      targetMention.after(draggedInlineImage);
    }

    // 更新输出
    emit('update:modelValue', editorRef.value.innerHTML);
  } else if (editorRef.value.contains(elementAtPoint)) {
    // 在文字区域放置
    const range = document.caretRangeFromPoint(x, y);
    if (range) {
      range.deleteContents();
      range.insertNode(draggedInlineImage);

      range.setStartAfter(draggedInlineImage);
      range.setEndAfter(draggedInlineImage);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }

      // 更新输出
      emit('update:modelValue', editorRef.value.innerHTML);
    }
  }

  clearDropIndicators();
  draggedInlineImage = null;
};

// 处理拖拽经过
const handleDragOver = (e: DragEvent) => {
  e.preventDefault();
  if (e.dataTransfer) {
    // 检查是否是内联图片拖拽
    if (draggedInlineImage) {
      handleInlineImageDragOver(e);
    } else {
      e.dataTransfer.dropEffect = 'copy';
    }
  }
};

// 处理放置（支持提及标签和文件上传）
const handleDrop = async (e: DragEvent) => {
  e.preventDefault();

  // 首先检查是否是内联图片拖拽排序
  if (draggedInlineImage) {
    handleInlineImageDrop(e);
    return;
  }

  // 首先检查是否有提及标签数据
  const data = e.dataTransfer?.getData('application/json');
  if (data) {
    try {
      const dragData: DragData = JSON.parse(data);

      // 在光标位置插入图片
      if (!editorRef.value) return;

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);

      // 插入图片
      const img = createInlineImage(dragData.src || '', dragData.label, dragData.type as MentionType);
      range.deleteContents();
      range.insertNode(img);

      // 移动光标到图片后面
      range.setStartAfter(img);
      range.setEndAfter(img);
      selection.removeAllRanges();
      selection.addRange(range);

      // 更新输出
      emit('update:modelValue', editorRef.value.innerHTML);

      const typeLabel = dragData.type === MentionTypeEnum.CHARACTER ? '角色' : dragData.type === MentionTypeEnum.SCENE ? '场景' : '参考图';
      ElMessage.success(`已插入${typeLabel}: ${dragData.label}`);
    } catch (error) {
      console.error('解析拖拽数据失败:', error);
    }
    return;
  }

  // 如果没有提及标签数据，检查是否有文件（用于参考图区域）
  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    // 过滤图片文件
    const imageFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      ElMessage.error('请拖拽图片文件');
      return;
    }

    // 验证所有图片文件
    const validFiles = imageFiles.filter(file => {
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        ElMessage.warning(`图片 "${file.name}" 超过 10MB，已跳过`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) {
      return;
    }

    // 批量上传
    let successCount = 0;
    let failCount = 0;

    for (const file of validFiles) {
      try {
        await referenceStore.addImage(file);
        successCount++;
      } catch (error) {
        console.error('上传失败:', error);
        failCount++;
      }
    }

    if (successCount > 0) {
      ElMessage.success(`成功上传 ${successCount} 张图片`);
    }
    if (failCount > 0) {
      ElMessage.error(`${failCount} 张图片上传失败`);
    }
  }
};

// 删除参考图
const handleRemoveReference = (e: Event, id: string) => {
  e.preventDefault();
  e.stopPropagation();
  referenceStore.removeImage(id);
  // 同时删除提及标签
  handleRemoveMentionTag(id);
};

// 上传前验证
const handleBeforeUpload = (file: File) => {
  const isImage = file.type.startsWith('image/');
  const isLt10M = file.size / 1024 / 1024 < 10;

  if (!isImage) {
    ElMessage.warning('只能上传图片文件！');
    return false;
  }
  if (!isLt10M) {
    ElMessage.warning('图片大小不能超过 10MB！');
    return false;
  }
  return true;
};

// 处理上传
const handleUpload = async (options: any) => {
  const file = options.file;
  try {
    await referenceStore.addImage(file);
    // 单个文件上传成功时不显示消息，避免多文件上传时消息过多
  } catch (error) {
    console.error('上传失败:', error);
    ElMessage.error(`图片 "${file.name}" 上传失败`);
  }
};

// ==================== 堆叠样式计算 ====================

// 获取堆叠图片样式
const getImageStackStyle = (index: number, isExpanded: boolean) => {
  const rotations = [0, -10.567, -19.954];
  const stackOrder = index + 1;

  if (isExpanded) {
    // 展开状态：横向紧密排列
    const expandedOffsets = [
      { left: '0px', top: '0px' },
      { left: '60px', top: '0px' },
      { left: '120px', top: '0px' }
    ];
    const expandedRotations = [-10, 3, 20];

    return {
      transform: `rotate(${expandedRotations[index]}deg)`,
      transformOrigin: 'center center',
      zIndex: 10 + index,
      position: 'absolute' as const,
      ...expandedOffsets[index],
      transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
    };
  } else {
    // 收起状态：堆叠
    const collapsedOffsets = [
      { left: '0px', top: '0px' },
      { left: '5.49px', top: '2.55px' },
      { left: '12.32px', top: '7.38px' }
    ];

    let transformOrigin = 'center center';
    if (index > 0) {
      const offset = collapsedOffsets[index];
      const offsetX = -parseFloat(offset.left);
      const offsetY = -parseFloat(offset.top);
      transformOrigin = `calc(50% + ${offsetX}px) calc(50% + ${offsetY}px)`;
    }

    return {
      transform: `rotate(${rotations[index]}deg)`,
      transformOrigin,
      zIndex: stackOrder,
      position: 'absolute' as const,
      ...collapsedOffsets[index],
      transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
    };
  }
};

// 获取添加按钮位置样式
const getAddButtonStyle = (currentCount: number, isExpanded: boolean) => {
  if (currentCount === 0) {
    return {
      position: 'relative' as const,
      width: '100%',
      height: '100%',
      left: '0px',
      top: '0px',
      zIndex: 1,
      transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
    };
  }

  const collapsedPositions = [
    { right: '-8px', bottom: '-8px' },
    { right: '-8px', bottom: '-8px' }
  ];

  const expandedOffsets = [
    { left: '60px', top: '0px' },
    { left: '120px', top: '0px' }
  ];

  if (isExpanded) {
    return {
      position: 'absolute' as const,
      ...expandedOffsets[currentCount - 1],
      zIndex: 20 + currentCount,
      transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
    };
  } else {
    return {
      position: 'absolute' as const,
      ...collapsedPositions[currentCount - 1],
      zIndex: 5,
      transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
    };
  }
};

// 处理图片区域hover进入
const handleImagesMouseEnter = () => {
  if (hoverTimer) {
    clearTimeout(hoverTimer);
  }
  isHoveringImages.value = true;
};

// 处理图片区域hover离开
const handleImagesMouseLeave = () => {
  if (hoverTimer) {
    clearTimeout(hoverTimer);
  }
  hoverTimer = setTimeout(() => {
    isHoveringImages.value = false;
    hoverTimer = null;
  }, 150);
};

// ==================== 拖拽相关 ====================

// 拖拽进入（用于参考图区域）
const handleDragEnter = (event: DragEvent) => {
  event.preventDefault();
  event.stopPropagation();
  dragCounter.value++;
  isDragOver.value = true;
};

// 拖拽经过（用于参考图区域）
const handleDragOverSection = (event: DragEvent) => {
  event.preventDefault();
  event.stopPropagation();
};

// 拖拽离开（用于参考图区域）
const handleDragLeave = (event: DragEvent) => {
  event.preventDefault();
  event.stopPropagation();
  dragCounter.value--;
  if (dragCounter.value === 0) {
    isDragOver.value = false;
  }
};
</script>

<style scoped lang="scss">
.seedance-prompt-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

// ==================== 参考图堆叠区域 ====================
.reference-images-section {
  flex-shrink: 0;
  width: 60px;
  height: 80px;
  position: relative;
  transition: width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);

  // 拖拽悬停状态
  &.drag-over {
    &::after {
      content: '释放以上传图片';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 100;
      padding: 8px 16px;
      border-radius: 8px;
      background: rgba(82, 82, 255, 0.95);
      color: #fff;
      font-size: 12px;
      white-space: nowrap;
      pointer-events: none;
      box-shadow: 0 4px 12px rgba(82, 82, 255, 0.3);
    }
  }

  .reference-images-stack {
    position: relative;
    width: 100%;
    height: 100%;
    cursor: pointer;

    .reference-image-item {
      width: 60px;
      height: 80px;
      border: 2px solid white;
      border-radius: 4px;
      overflow: visible;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      cursor: pointer;
      transition: transform 0.3s ease;
      position: relative;

      &:hover {
        transform: scale(1.133);
      }

      .reference-thumbnail {
        width: 100%;
        height: 100%;
        border-radius: 2px;
        overflow: hidden;

        :deep(img) {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }

      // 删除按钮
      .delete-button {
        position: absolute;
        top: -8px;
        right: -8px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: #ff4d4f;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: white;
        box-shadow: 0 2px 8px rgba(255, 77, 79, 0.4);
        transition: all 0.2s;
        z-index: 3;
        pointer-events: auto;

        &:hover {
          background: #ff7875;
          transform: scale(1.15);
        }

        &:active {
          transform: scale(0.95);
        }
      }

      // 添加按钮
      &.add-more-button {
        border-radius: 4px;
        background: #f7f8fa;
        transform: rotate(-5deg);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);

        .add-more-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          gap: 6px;
          color: #5252ff;
          transition: all 0.3s;
        }

        &:hover {
          background: #f3f3ff;
          transform: scale(1.133);

          .add-more-content {
            transform: rotate(90deg) scale(1.1);
          }
        }

        &:active {
          transform: rotate(-5deg) scale(0.95);
        }

        &.is-hovered {
          box-shadow: 0 4px 16px rgba(82, 82, 255, 0.15);
        }

        &.is-empty {
          .add-more-content {
            color: #86909c;
          }

          &:hover {
            transform: scale(1.133);

            .add-more-content {
              color: #5252ff;
            }
          }
        }
      }

      .add-more-upload {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;

        :deep(.el-upload) {
          display: block;
          width: 100%;
          height: 100%;
        }
      }
    }
  }
}

// ==================== 输入框区域 ====================
.input-wrapper {
  display: flex;
  align-items: stretch;
  gap: 8px;
}

.input-wrapper-alone {
  width: 100%;
}

.prompt-editor {
  flex: 1;
  min-height: 60px;
  padding: 8px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  outline: none;
  font-size: 14px;
  line-height: 1.8;
  transition: border-color 0.2s;
  word-break: break-word;

  &:empty:before {
    content: attr(data-placeholder);
    color: #999;
    pointer-events: none;
  }

  &:focus {
    border-color: #5252ff;
  }

  // 内联提及样式（包含图片和文字）
  :deep(.inline-mention) {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    vertical-align: middle;
    margin: 0 2px;
    padding: 0 4px;
    background: rgba(82, 82, 255, 0.08);
    border: 1px solid rgba(82, 82, 255, 0.2);
    border-radius: 4px;
    cursor: grab;
    transition: all 0.2s;
    position: relative;
    user-select: none;

    &:hover {
      background: rgba(82, 82, 255, 0.12);
      border-color: rgba(82, 82, 255, 0.3);
    }

    // 选中状态
    &::selection {
      background: rgba(82, 82, 255, 0.3);
    }

    &.dragging {
      opacity: 0.5;
      cursor: grabbing;
    }

    &:active {
      cursor: grabbing;
    }

    // 放置指示器 - 在提及元素前插入
    &.drop-before::before {
      content: '';
      position: absolute;
      left: -4px;
      top: -2px;
      bottom: -2px;
      width: 3px;
      background-color: #5252ff;
      border-radius: 2px;
      box-shadow: 0 0 6px #5252ff;
      animation: pulse 0.8s infinite;
    }

    // 放置指示器 - 在提及元素后插入
    &.drop-after::after {
      content: '';
      position: absolute;
      right: -4px;
      top: -2px;
      bottom: -2px;
      width: 3px;
      background-color: #5252ff;
      border-radius: 2px;
      box-shadow: 0 0 6px #5252ff;
      animation: pulse 0.8s infinite;
    }

    // 内联图片样式
    .inline-image {
      height: 1em;
      width: auto;
      max-width: 1em;
      vertical-align: middle;
      object-fit: contain;
      pointer-events: none;
    }

    // 文本样式
    .inline-mention-text {
      font-size: 0.9em;
      color: #5252ff;
      white-space: nowrap;
      pointer-events: none;
    }
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
      transform: scaleY(1);
    }
    50% {
      opacity: 0.7;
      transform: scaleY(1.2);
    }
  }
}

.input-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;

  .circular-upload-button-wrapper {
    position: relative;
    width: 32px;
    height: 32px;

    .circular-upload {
      :deep(.el-upload) {
        display: block;
        width: 100%;
        height: 100%;
      }
    }

    .circular-upload-button {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #f7f8fa;
      box-shadow: 0 4px 6px rgba(224, 231, 255, 0.25), 0 10px 15px rgba(224, 231, 255, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
      color: #5252ff;

      &:hover {
        background: #f3f3ff;
        transform: rotate(90deg);
      }

      &:active {
        transform: scale(0.95) rotate(90deg);
      }
    }
  }
}

// ==================== 提及标签预览 ====================
.mention-tags-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.mention-tag-item {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.05);
  border: 1px solid #e4e7ed;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(0, 0, 0, 0.08);

    .mention-tag-delete {
      opacity: 1;
    }
  }

  // 选中状态
  &.is-selected {
    border-color: #5252ff;
    background: rgba(82, 82, 255, 0.15);
    box-shadow: 0 0 0 2px rgba(82, 82, 255, 0.2);
  }

  &.mention-tag-reference {
    border-color: #409eff;
    background: rgba(64, 158, 255, 0.05);
  }

  &.mention-tag-character {
    border-color: #67c23a;
    background: rgba(103, 194, 58, 0.05);
  }

  &.mention-tag-scene {
    border-color: #e6a23c;
    background: rgba(230, 162, 60, 0.05);
  }
}

.mention-tag-thumb {
  width: 16px;
  height: 16px;
  border-radius: 2px;
  object-fit: cover;
}

.mention-tag-icon {
  width: 16px;
  height: 16px;
  color: #909399;
}

.mention-tag-label {
  color: rgb(83, 100, 113);
  font-size: 13px;
}

.mention-tag-subtitle {
  font-size: 11px;
  color: #909399;
  margin-left: 2px;
}

.mention-tag-delete {
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 4px;
  border-radius: 50%;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: auto;

  &:hover {
    background: rgba(255, 0, 0, 0.1);
  }
}

// ==================== 提及标签内联样式 ====================
:deep(.mention-tag-inline) {
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
  user-select: none;
  cursor: pointer;

  &:hover {
    background: rgba(0, 0, 0, 0.08);
  }

  .mention-thumb {
    width: 16px;
    height: 16px;
    border-radius: 2px;
    object-fit: cover;
  }
}

// ==================== 过渡动画 ====================
// 堆叠滑动过渡
.stack-slide-enter-active {
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.stack-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.6, 1);
}

.stack-slide-enter-from {
  opacity: 0;
  transform: scale(0.3) rotate(-15deg) translateY(-20px);
}

.stack-slide-leave-to {
  opacity: 0;
  transform: scale(0.5) rotate(10deg) translateY(10px);
}

.stack-slide-move {
  transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

// 删除按钮淡入淡出过渡
.delete-fade-enter-active,
.delete-fade-leave-active {
  transition: all 0.2s ease;
}

.delete-fade-enter-from,
.delete-fade-leave-to {
  opacity: 0;
  transform: scale(0);
}
</style>
