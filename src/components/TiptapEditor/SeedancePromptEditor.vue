<template>
  <div class="seedance-prompt-container" ref="containerRef">
    <!-- 参考图区域 -->
    <div v-if="showReferenceBar && referenceStore.images.length > 0" class="reference-bar">
      <div
        v-for="image in referenceStore.images"
        :key="image.id"
        class="reference-item"
        draggable="true"
        @dragstart="handleReferenceDragStart($event, image)"
        @click="handleInsertMentionTag(image)"
      >
        <img :src="image.src" class="reference-image" />
        <div class="reference-label">{{ image.label }}</div>
        <div class="reference-delete" @click.stop="handleRemoveReference(image.id)">
          <svg-icon icon-class="fy-del" style="width: 12px; height: 12px" />
        </div>
      </div>
      <!-- 上传按钮 -->
      <el-upload
        class="reference-upload"
        :show-file-list="false"
        :before-upload="handleBeforeUpload"
        :http-request="handleUpload"
      >
        <div class="upload-trigger">
          <svg-icon icon-class="fy-upload" style="width: 16px; height: 16px" />
          <span class="upload-text">上传</span>
        </div>
      </el-upload>
    </div>

    <!-- 输入框区域 -->
    <div class="input-wrapper">
      <textarea
        ref="textareaRef"
        :value="textValue"
        @input="handleInput"
        @keydown="handleKeydown"
        @focus="isFocused = true"
        @blur="handleBlur"
        @drop="handleDrop"
        @dragover="handleDragOver"
        class="prompt-textarea"
        rows="3"
        :placeholder="placeholder"
      />
      <!-- 上传按钮（当没有参考图时显示） -->
      <div v-if="!showReferenceBar || referenceStore.images.length === 0" class="input-actions">
        <el-upload
          :show-file-list="false"
          :before-upload="handleBeforeUpload"
          :http-request="handleUpload"
        >
          <el-button size="small" type="primary" link>
            <svg-icon icon-class="fy-upload" style="width: 14px; height: 14px; margin-right: 4px" />
            上传参考图
          </el-button>
        </el-upload>
      </div>
    </div>

    <!-- 提及标签预览 -->
    <div v-if="mentionTags.length > 0" class="mention-tags-preview">
      <div
        v-for="tag in mentionTags"
        :key="tag.id"
        class="mention-tag-item"
        :class="`mention-tag-${tag.type}`"
      >
        <img v-if="tag.src" :src="tag.src" class="mention-tag-thumb" />
        <svg-icon v-else :icon-class="getTagIcon(tag.type)" class="mention-tag-icon" />
        <span class="mention-tag-label">{{ tag.label }}</span>
        <span v-if="tag.subtitle" class="mention-tag-subtitle">{{ tag.subtitle }}</span>
        <div class="mention-tag-delete" @click="handleRemoveMentionTag(tag.id)">
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
const textareaRef = ref<HTMLTextAreaElement>();
const mentionPopupRef = ref<InstanceType<typeof MentionPopup>>();

// 是否聚焦
const isFocused = ref(false);

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
  let text = value;

  // 正则匹配所有类型的提及标签
  // 匹配格式: <span data-type="reference|character|scene" data-id="xxx" data-src="xxx?" data-label="xxx" ...></span>
  const mentionRegex = /<span[^>]*data-type="(reference|character|scene)"[^>]*data-id="([^"]*)"[^>]*>(?:<span[^>]*>.*?<\/span>)?<\/span>/gi;

  let match;
  while ((match = mentionRegex.exec(value)) !== null) {
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

  // 移除提及标签，获取纯文本
  text = text.replace(mentionRegex, '');

  mentionTags.value = tags;
  textValue.value = text;
};

// 构建包含提及标签的 HTML
const buildHtmlWithMentions = (text: string, tags: typeof mentionTags.value) => {
  let result = text;

  // 为每个提及标签创建 HTML
  const tagsHtml = tags.map(tag => {
    const attrs = [
      `data-type="${tag.type}"`,
      `data-id="${tag.id}"`,
      tag.src ? `data-src="${tag.src}"` : '',
      `data-label="${tag.label}"`,
      tag.alias ? `data-alias="${tag.alias}"` : '',
      tag.category ? `data-category="${tag.category}"` : '',
      'contenteditable="false"',
      'class="mention-tag-inline"'
    ].filter(Boolean).join(' ');

    const icon = tag.src
      ? `<img src="${tag.src}" class="mention-thumb" style="width: 16px; height: 16px; border-radius: 2px; object-fit: cover; vertical-align: middle;" />`
      : `<span class="mention-icon">${getTagIcon(tag.type) === 'fy-user' ? '👤' : '🏞️'}</span>`;

    return `<span ${attrs}>${icon} ${tag.label}</span>`;
  }).join('');

  return result + tagsHtml;
};

// 监听 modelValue 变化
watch(() => props.modelValue, (newValue) => {
  parseModelValue(newValue);
}, { immediate: true });

// 处理输入
const handleInput = (e: Event) => {
  const target = e.target as HTMLTextAreaElement;
  const value = target.value;
  const cursorPos = target.selectionStart;

  textValue.value = value;

  // 检查是否触发提及（@ 符号）
  const beforeCursor = value.slice(0, cursorPos);
  const atMatch = beforeCursor.match(/@(\w*)$/);

  if (atMatch) {
    // 触发提及弹窗
    mentionQuery.value = atMatch[1];
    mentionTriggerPos.value = {
      start: cursorPos - atMatch[0].length,
      end: cursorPos
    };

    showMentionPopup();
  } else {
    // 关闭提及弹窗
    mentionPopupRef.value?.hide();
    mentionTriggerPos.value = null;
  }

  // 发送包含提及标签的完整 HTML
  emit('update:modelValue', buildHtmlWithMentions(value, mentionTags.value));
};

// 处理键盘事件
const handleKeydown = (e: KeyboardEvent) => {
  // 如果提及弹窗打开，让弹窗处理键盘事件
  if (mentionTriggerPos.value) {
    const keys = ['ArrowUp', 'ArrowDown', 'Enter', 'Escape', 'Tab'];
    if (keys.includes(e.key)) {
      e.preventDefault();
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
  if (!textareaRef.value) return;

  const rect = textareaRef.value.getBoundingClientRect();
  const scrollTop = textareaRef.value.scrollTop;

  // 计算光标位置（简化版，使用 textarea 底部）
  const popupX = rect.left;
  const popupY = rect.bottom + 5;

  mentionPopupRef.value?.show(popupX, popupY);
};

// 处理提及选择
const handleMentionSelect = (option: MentionOption) => {
  if (!mentionTriggerPos.value || !textareaRef.value) return;

  const { start, end } = mentionTriggerPos.value;
  const currentValue = textValue.value;

  // 构建新的文本值（移除@符号，保留选中的提及）
  const beforeMention = currentValue.slice(0, start);
  const afterMention = currentValue.slice(end);
  const newText = beforeMention + afterMention;

  // 添加提及标签
  const newTag = {
    id: option.id,
    type: option.type,
    src: option.src,
    label: option.label,
    subtitle: option.subtitle,
    alias: option.alias,
    category: option.category
  };

  mentionTags.value.push(newTag);
  textValue.value = newText;

  // 更新输出
  emit('update:modelValue', buildHtmlWithMentions(newText, mentionTags.value));

  // 关闭弹窗
  mentionTriggerPos.value = null;
  mentionQuery.value = '';

  // 聚焦回 textarea
  nextTick(() => {
    textareaRef.value?.focus();
  });

  const typeLabel = option.type === MentionTypeEnum.REFERENCE ? '参考图' : option.type === MentionTypeEnum.CHARACTER ? '角色' : '场景';
  ElMessage.success(`已插入${typeLabel}: ${option.label}`);
};

// 处理提及弹窗关闭
const handleMentionClose = () => {
  mentionTriggerPos.value = null;
  mentionQuery.value = '';
};

// 插入提及标签（点击参考图）
const handleInsertMentionTag = (image: ReferenceImage) => {
  // 检查是否已经存在
  const exists = mentionTags.value.some(tag => tag.id === image.id);
  if (exists) {
    ElMessage.warning(`${image.label} 已添加`);
    return;
  }

  mentionTags.value.push({
    id: image.id,
    type: MentionTypeEnum.REFERENCE,
    src: image.src,
    label: image.label
  });

  // 更新输出
  emit('update:modelValue', buildHtmlWithMentions(textValue.value, mentionTags.value));

  ElMessage.success(`已插入${image.label}`);
};

// 删除提及标签
const handleRemoveMentionTag = (id: string) => {
  mentionTags.value = mentionTags.value.filter(tag => tag.id !== id);
  emit('update:modelValue', buildHtmlWithMentions(textValue.value, mentionTags.value));
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

// 处理拖拽经过
const handleDragOver = (e: DragEvent) => {
  e.preventDefault();
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'copy';
  }
};

// 处理放置
const handleDrop = (e: DragEvent) => {
  e.preventDefault();
  const data = e.dataTransfer?.getData('application/json');
  if (!data) return;

  try {
    const dragData: DragData = JSON.parse(data);

    // 根据 type 创建不同的提及标签
    const newTag = {
      id: dragData.id,
      type: dragData.type as MentionType,
      src: dragData.src,
      label: dragData.label,
      alias: dragData.alias,
      category: dragData.category
    };

    // 检查是否已存在
    const exists = mentionTags.value.some(tag => tag.id === newTag.id);
    if (exists) {
      ElMessage.warning(`${newTag.label} 已添加`);
      return;
    }

    mentionTags.value.push(newTag);
    emit('update:modelValue', buildHtmlWithMentions(textValue.value, mentionTags.value));

    const typeLabel = newTag.type === MentionTypeEnum.CHARACTER ? '角色' : newTag.type === MentionTypeEnum.SCENE ? '场景' : '参考图';
    ElMessage.success(`已插入${typeLabel}: ${newTag.label}`);
  } catch (error) {
    console.error('解析拖拽数据失败:', error);
  }
};

// 删除参考图
const handleRemoveReference = (id: string) => {
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
    ElMessage.success('图片上传成功');
  } catch (error) {
    console.error('上传失败:', error);
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

.reference-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.reference-item {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);

    .reference-delete {
      opacity: 1;
    }
  }

  &:active {
    cursor: grabbing;
  }
}

.reference-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.reference-label {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 2px 4px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 10px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.reference-delete {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;

  &:hover {
    background: rgba(255, 0, 0, 0.8);
  }
}

.reference-upload {
  :deep(.el-upload) {
    display: block;
  }
}

.upload-trigger {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  gap: 4px;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #5252ff;
    color: #5252ff;
  }
}

.upload-text {
  font-size: 10px;
  color: #909399;
}

.input-wrapper {
  position: relative;
}

.prompt-textarea {
  width: 100%;
  min-height: 60px;
  padding: 8px;
  padding-right: 80px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  resize: none;
  outline: none;
  font-size: 14px;
  line-height: 1.8;
  transition: border-color 0.2s;

  &:focus {
    border-color: #5252ff;
  }
}

.input-actions {
  position: absolute;
  right: 8px;
  top: 8px;
}

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
  cursor: grab;
  transition: all 0.2s;

  &:hover {
    background: rgba(0, 0, 0, 0.08);

    .mention-tag-delete {
      opacity: 1;
    }
  }

  &:active {
    cursor: grabbing;
  }

  // 不同类型的提及标签有不同的边框颜色
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

  &:hover {
    background: rgba(255, 0, 0, 0.1);
  }
}

// 提及标签内联样式（用于在编辑器中显示）
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
</style>
