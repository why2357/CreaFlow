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
              <div v-if="isHoveringImages" class="delete-button" @click.stop="handleRemoveReference(image.id)">
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

// 处理放置（支持提及标签和文件上传）
const handleDrop = async (e: DragEvent) => {
  e.preventDefault();

  // 首先检查是否有提及标签数据
  const data = e.dataTransfer?.getData('application/json');
  if (data) {
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

.prompt-textarea {
  flex: 1;
  min-height: 60px;
  padding: 8px;
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
