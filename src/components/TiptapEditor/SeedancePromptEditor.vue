<template>
  <div class="seedance-prompt-container" ref="containerRef">
    <!-- 参考图区域（堆叠样式） -->
    <div
      v-if="showReferenceBar && localImages.length > 0"
      class="reference-images-section"
      :class="{ 'drag-over': isDragOver, 'has-images': localImages.length > 0 }"
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
            v-for="(image, index) in localImages"
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
              <div
                v-if="isHoveringImages"
                class="delete-button"
                @click.stop.prevent="handleRemoveReference($event, image.id)"
              >
                <svg-icon icon-class="fy-del" style="width: 12px; height: 12px" />
              </div>
            </Transition>
          </div>

          <!-- 添加按钮 -->
          <div
            v-if="localImages.length < maxImages"
            :key="'add-button'"
            class="reference-image-item add-more-button"
            :class="{ 'is-hovered': isHoveringImages, 'is-empty': localImages.length === 0 }"
            :style="getAddButtonStyle(localImages.length, isHoveringImages)"
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
    <div v-if="!showReferenceBar || localImages.length === 0" class="input-wrapper">
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
      <!-- 参考图上传按钮（堆叠样式） -->
      <div class="input-actions">
        <div class="reference-images-section" :class="{ 'has-images': localImages.length > 0 }">
          <div
            class="reference-images-stack"
            :class="{ 'is-expanded': isHoveringImages }"
            @mouseenter="handleImagesMouseEnter"
            @mouseleave="handleImagesMouseLeave"
          >
            <TransitionGroup name="stack-slide">
              <!-- 已上传的参考图 -->
              <div
                v-for="(image, index) in localImages"
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
                  <div
                    v-if="isHoveringImages"
                    class="delete-button"
                    @click.stop.prevent="handleRemoveReference($event, image.id)"
                  >
                    <svg-icon icon-class="fy-del" style="width: 12px; height: 12px" />
                  </div>
                </Transition>
              </div>

              <!-- 添加按钮 -->
              <div
                v-if="localImages.length < maxImages"
                :key="'add-button'"
                class="reference-image-item add-more-button"
                :class="{ 'is-hovered': isHoveringImages, 'is-empty': localImages.length === 0 }"
                :style="getAddButtonStyle(localImages.length, isHoveringImages)"
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
      </div>
    </div>

    <!-- 只在有参考图时显示输入框（独立于上传区域） -->
    <div v-if="showReferenceBar && localImages.length > 0" class="input-wrapper-alone">
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


    <!-- 提及弹窗 -->
    <MentionPopup
      ref="mentionPopupRef"
      :query="mentionQuery"
      :on-select="handleMentionSelect"
      :on-close="handleMentionClose"
      :on-open-library="handleOpenLibrary"
      :reference-images="localImages"
    />

    <!-- 场景库对话框 -->
    <SceneLibraryDialog
      v-model="sceneLibraryVisible"
      :project-id="projectId"
      :episodes="episodes"
      @confirm="handleSceneSelect"
    />

    <!-- 角色库对话框 -->
    <CharacterLibraryDialog
      v-model="characterLibraryVisible"
      :project-id="projectId"
      :episodes="episodes"
      @confirm="handleCharacterSelect"
    />
  </div>
</template>

<script setup lang="ts">
  import { useProjectStore } from '@/store/modules/project';
  import { uploadFile } from '@/utils/uploadFile';
  import { ElMessage } from 'element-plus';
  import type { ReferenceImage, DragData, MentionOption, MentionType } from '@/types/mention';
  import { MentionType as MentionTypeEnum } from '@/types/mention';
  import MentionPopup from './MentionPopup.vue';
  import SceneLibraryDialog from '@/views/workbench/project-creation/steps/StepShotList/components/SceneLibraryDialog.vue';
  import CharacterLibraryDialog from '@/views/workbench/project-creation/steps/StepShotList/components/CharacterLibraryDialog.vue';
  import { ref, watch, nextTick, computed } from 'vue';
  import { cloneDeep } from 'lodash-es';
  import type { LibrarySubInfo } from '@/api/workbench/project/types';
  import type { EpisodeInfo } from '@/api/workbench/project/types';

  interface Props {
    modelValue: string;
    placeholder?: string;
    showReferenceBar?: boolean;
    /** 分镜级别的参考图片列表 */
    images?: ReferenceImage[];
    /** 最大图片数量 */
    maxImages?: number;
  }

  interface Emits {
    (e: 'update:modelValue', value: string): void;
    (e: 'update:images', value: ReferenceImage[]): void;
  }

  const props = withDefaults(defineProps<Props>(), {
    placeholder: '请输入提示词，输入@可提及图片、角色或场景',
    showReferenceBar: true,
    images: () => [],
    maxImages: 5
  });

  const emit = defineEmits<Emits>();

  const projectStore = useProjectStore();

  // 本地图片列表（使用 prop 传入的图片）
  const localImages = computed({
    get: () => props.images || [],
    set: (value) => emit('update:images', value)
  });

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
  // 提及弹窗相关
  const mentionTriggerPos = ref<{ start: number; end: number } | null>(null);
  const mentionQuery = ref('');
  // 保存触发弹窗时的 range，用于后续插入图片
  let savedMentionRange: Range | null = null;

  // 图库对话框相关
  const sceneLibraryVisible = ref(false);
  const characterLibraryVisible = ref(false);

  // 获取当前项目ID和剧集
  const projectId = computed(() => Number(projectStore.currentProjectId) || 0);
  const episodes = computed(() => projectStore.episodes || []);

  // 监听 modelValue 变化，同步编辑器内容
  watch(
    () => props.modelValue,
    (newValue) => {
      nextTick(() => {
        if (editorRef.value && editorRef.value.innerHTML !== newValue) {
          editorRef.value.innerHTML = newValue;
        }
      });
    },
    { immediate: true }
  );

  // 处理输入
  const handleInput = (e: Event) => {
    const target = e.target as HTMLDivElement;

    // 检查是否触发提及（@ 符号）
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);

      // 检查光标前一个字符是否是 @
      let charBeforeCursor = '';
      let textNode: Node | null = range.startContainer;
      let offset = range.startOffset;

      // 如果在文本节点中
      if (textNode.nodeType === Node.TEXT_NODE) {
        const textContent = textNode.textContent || '';
        if (offset > 0) {
          // 光标在文本节点中间或末尾，直接取前一个字符
          // 但要跳过零宽空格
          let checkOffset = offset - 1;
          while (checkOffset >= 0) {
            const char = textContent[checkOffset];
            if (char === '\u200B' || char === '\uFEFF') {
              // 跳过零宽空格，继续向前查找
              checkOffset--;
            } else {
              charBeforeCursor = char;
              break;
            }
          }
        } else {
          // 光标在文本节点开头，检查前一个兄弟节点
          let prevSibling = (textNode as Text).previousSibling;
          while (prevSibling) {
            if (prevSibling.nodeType === Node.TEXT_NODE) {
              const text = prevSibling.textContent || '';
              if (text.length > 0) {
                // 从末尾向前查找，跳过零宽空格
                let checkIdx = text.length - 1;
                while (checkIdx >= 0) {
                  const char = text[checkIdx];
                  if (char === '\u200B' || char === '\uFEFF') {
                    checkIdx--;
                  } else {
                    charBeforeCursor = char;
                    break;
                  }
                }
                if (charBeforeCursor) break;
              }
            }
            prevSibling = prevSibling.previousSibling;
          }
        }
      } else {
        // 如果不在文本节点中（比如在元素后面），尝试检查前一个节点
        if (offset === 0 && textNode.childNodes.length > 0) {
          const lastChild = textNode.childNodes[textNode.childNodes.length - 1];
          if (lastChild.nodeType === Node.TEXT_NODE) {
            const lastText = lastChild.textContent || '';
            if (lastText.length > 0) {
              charBeforeCursor = lastText[lastText.length - 1];
            }
          }
        }
      }

      // 如果光标前是 @ 符号，触发提及
      if (charBeforeCursor === '@') {
        mentionQuery.value = '';
        mentionTriggerPos.value = {
          start: 0,
          end: 0
        };
        showMentionPopup();
      } else if (mentionTriggerPos.value) {
        // 如果弹窗已打开，检查是否还在有效的查询输入中
        // 向前查找 @ 符号
        let foundAt = false;
        let queryText = '';

        if (textNode.nodeType === Node.TEXT_NODE) {
          const textContent = textNode.textContent || '';
          // 从光标位置向前查找
          for (let i = offset - 1; i >= 0; i--) {
            const char = textContent[i];
            if (char === '@') {
              foundAt = true;
              break;
            }
            if (char === ' ' || char === '\n') {
              break;
            }
            queryText = char + queryText;
          }
        }

        if (foundAt) {
          // 仍在查询中，更新查询内容
          mentionQuery.value = queryText;
        } else {
          // 不再有效的提及查询，关闭弹窗
          mentionPopupRef.value?.hide();
          mentionTriggerPos.value = null;
        }
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
        if (
          range.startContainer === range.endContainer &&
          range.startContainer.nodeType === Node.TEXT_NODE &&
          range.startContainer.parentElement?.classList.contains('inline-mention')
        ) {
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

    // 保存当前的 selection range，用于后续插入图片
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      savedMentionRange = selection.getRangeAt(0).cloneRange();
    } else {
      savedMentionRange = null;
    }

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

      if (!selection) return;

      // 检查是否已经选中了这个元素
      const isSelected = selection.rangeCount > 0 && selection.containsNode(container, true);

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
    if (!editorRef.value) return;

    const selection = window.getSelection();
    if (!selection) return;

    let range: Range;

    // 优先使用保存的 range（因为弹窗打开时编辑器可能失去焦点）
    if (savedMentionRange && editorRef.value.contains(savedMentionRange.startContainer)) {
      range = savedMentionRange;
    } else if (selection.rangeCount > 0 && editorRef.value.contains(selection.anchorNode)) {
      range = selection.getRangeAt(0);
    } else {
      // 都不在编辑器内，将光标移动到编辑器末尾
      range = document.createRange();
      if (editorRef.value.lastChild) {
        range.setStartAfter(editorRef.value.lastChild);
        range.collapse(true);
      } else {
        range.setStart(editorRef.value, 0);
        range.collapse(true);
      }
    }

    // 恢复 selection 到编辑器
    selection.removeAllRanges();
    selection.addRange(range);

    // 找到并删除 @ 符号及其后的查询文本
    // 光标应该位于查询文本之后
    let textNode: Node | null = range.startContainer;
    let offset = range.startOffset;

    // 确保在文本节点中
    if (textNode.nodeType !== Node.TEXT_NODE) {
      // 尝试找到前面的文本节点
      const walker = document.createTreeWalker(editorRef.value, NodeFilter.SHOW_TEXT, null);

      let currentNode: Node | null = null;
      while (walker.nextNode()) {
        if (walker.currentNode === textNode || (textNode as any).contains?.(walker.currentNode)) {
          currentNode = walker.currentNode;
          break;
        }
        currentNode = walker.currentNode;
      }

      if (currentNode) {
        textNode = currentNode;
        offset = (currentNode as Text).length;
      } else {
        // 无法找到合适的文本节点，直接在当前位置插入
        textNode = range.startContainer;
        offset = range.startOffset;
      }
    }

    if (textNode && textNode.nodeType === Node.TEXT_NODE) {
      const textContent = (textNode as Text).textContent || '';

      // 从光标位置向前查找 @ 符号
      let atOffset = -1;
      for (let i = offset - 1; i >= 0; i--) {
        const char = textContent[i];
        if (char === '@') {
          atOffset = i;
          break;
        }
        if (char === ' ' || char === '\n') {
          break;
        }
      }

      if (atOffset >= 0) {
        // 删除从 @ 到光标的所有内容
        const deleteRange = document.createRange();
        deleteRange.setStart(textNode, atOffset);
        deleteRange.setEnd(textNode, offset);
        deleteRange.deleteContents();

        // 插入提及元素
        const img = createInlineImage(option.src || '', option.label, option.type);

        // 在删除位置插入
        const insertRange = document.createRange();
        insertRange.setStart(textNode, atOffset);
        insertRange.collapse(true);
        insertRange.insertNode(img);

        // 确保元素后面有零宽空格供用户继续输入
        let nextSibling = img.nextSibling;
        if (!nextSibling || nextSibling.nodeType !== Node.TEXT_NODE) {
          const textNodeToInsert = document.createTextNode('\u200B'); // 零宽空格
          img.parentNode?.insertBefore(textNodeToInsert, img.nextSibling);
          nextSibling = textNodeToInsert;
        }

        // 移动光标到图片后面的文本节点开头
        const newRange = document.createRange();
        if (nextSibling && nextSibling.nodeType === Node.TEXT_NODE) {
          // 将光标放在文本节点的开头，这样用户输入的 @ 就是第一个字符
          newRange.setStart(nextSibling, 0);
          newRange.setEnd(nextSibling, 0);
        } else {
          newRange.setStartAfter(img);
          newRange.setEndAfter(img);
        }
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    }

    // 清除保存的 range
    savedMentionRange = null;

    // 更新输出
    emit('update:modelValue', editorRef.value.innerHTML);

    // 关闭弹窗
    mentionTriggerPos.value = null;
    mentionQuery.value = '';

    // 聚焦回编辑器
    nextTick(() => {
      editorRef.value?.focus();
    });

    const typeLabel =
      option.type === MentionTypeEnum.REFERENCE
        ? '参考图'
        : option.type === MentionTypeEnum.CHARACTER
        ? '角色'
        : '场景';
    ElMessage.success(`已插入${typeLabel}: ${option.label}`);
  };

  // 处理提及弹窗关闭
  const handleMentionClose = () => {
    mentionTriggerPos.value = null;
    mentionQuery.value = '';
    savedMentionRange = null; // 清除保存的 range
  };

  // 打开图库
  const handleOpenLibrary = (type: 'character' | 'scene') => {
    if (type === 'character') {
      characterLibraryVisible.value = true;
    } else {
      sceneLibraryVisible.value = true;
    }
  };

  // 处理场景选择
  const handleSceneSelect = (scene: LibrarySubInfo) => {
    // 使用正确的字段路径：ossUrl 或 materialVo?.originOssUrl
    const sceneSrc = scene.ossUrl || scene.materialVo?.originOssUrl;
    if (!sceneSrc || !editorRef.value) return;

    // materialVo 没有 materialName，使用 detailName
    const label = scene.detailName || '场景';

    // 直接插入到编辑器，不依赖 mentionTriggerPos
    const selection = window.getSelection();
    if (!selection) return;

    let range: Range;

    // 检查当前选择是否在编辑器内
    if (selection.rangeCount === 0 || !editorRef.value.contains(selection.anchorNode)) {
      // 如果不在编辑器内，将光标移动到编辑器末尾
      range = document.createRange();
      if (editorRef.value.lastChild) {
        range.setStartAfter(editorRef.value.lastChild);
        range.collapse(true);
      } else {
        range.setStart(editorRef.value, 0);
        range.collapse(true);
      }
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      range = selection.getRangeAt(0);
    }

    // 创建内联图片元素
    const img = createInlineImage(sceneSrc, label, MentionTypeEnum.SCENE);
    range.deleteContents();
    range.insertNode(img);

    // 移动光标到图片后面
    range.setStartAfter(img);
    range.setEndAfter(img);
    selection.removeAllRanges();
    selection.addRange(range);

    // 更新输出
    emit('update:modelValue', editorRef.value.innerHTML);

    sceneLibraryVisible.value = false;
    ElMessage.success(`已插入场景: ${label}`);
  };

  // 处理角色选择
  const handleCharacterSelect = (character: LibrarySubInfo) => {
    // 使用正确的字段路径：ossUrl 或 materialVo?.originOssUrl
    const charSrc = character.ossUrl || character.materialVo?.originOssUrl;
    if (!charSrc || !editorRef.value) return;

    // materialVo 没有 materialName，使用 detailName
    const label = character.detailName || '角色';

    // 直接插入到编辑器，不依赖 mentionTriggerPos
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);

    // 创建内联图片元素
    const img = createInlineImage(charSrc, label, MentionTypeEnum.CHARACTER);
    range.deleteContents();
    range.insertNode(img);

    // 移动光标到图片后面
    range.setStartAfter(img);
    range.setEndAfter(img);
    selection.removeAllRanges();
    selection.addRange(range);

    // 更新输出
    emit('update:modelValue', editorRef.value.innerHTML);

    characterLibraryVisible.value = false;
    ElMessage.success(`已插入角色: ${label}`);
  };

  // 插入图片（点击参考图）
  const handleInsertMentionTag = (image: ReferenceImage) => {
    if (!editorRef.value) return;

    const selection = window.getSelection();
    if (!selection) return;

    let range: Range;

    // 检查当前选择是否在编辑器内
    if (selection.rangeCount === 0 || !editorRef.value.contains(selection.anchorNode)) {
      // 如果不在编辑器内，将光标移动到编辑器末尾
      range = document.createRange();
      // 找到编辑器的最后一个文本节点或直接在编辑器末尾
      if (editorRef.value.lastChild) {
        range.setStartAfter(editorRef.value.lastChild);
        range.collapse(true);
      } else {
        range.setStart(editorRef.value, 0);
        range.collapse(true);
      }
    } else {
      range = selection.getRangeAt(0);
    }

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
    mentions.forEach((mention) => {
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

        const typeLabel =
          dragData.type === MentionTypeEnum.CHARACTER
            ? '角色'
            : dragData.type === MentionTypeEnum.SCENE
            ? '场景'
            : '参考图';
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
      const validFiles = imageFiles.filter((file) => {
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
          const result = await addImageToList(file);
          if (result) {
            successCount++;
          } else {
            failCount++;
          }
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
    // 从本地图片列表中删除
    const newImages = localImages.value.filter((img) => img.id !== id);
    emit('update:images', newImages);
    // 同步删除编辑器里对应的内联提及元素（通过 data-id 精准匹配）
    if (editorRef.value) {
      const el = editorRef.value.querySelector(`.inline-mention[data-id="${id}"]`);
      if (el) {
        el.remove();
        emit('update:modelValue', editorRef.value.innerHTML);
      }
    }
  };

  // 添加图片到本地列表
  const addImageToList = async (file: File): Promise<ReferenceImage | null> => {
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      ElMessage.warning('请选择图片文件');
      return null;
    }

    // 验证文件大小 (限制 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      ElMessage.warning('图片大小不能超过 10MB');
      return null;
    }

    // 检查是否达到最大数量
    if (localImages.value.length >= props.maxImages) {
      ElMessage.warning(`最多只能上传 ${props.maxImages} 张图片`);
      return null;
    }

    // 创建本地预览 URL
    const localUrl = URL.createObjectURL(file);

    // 生成唯一 ID
    const id = `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 计算当前最大索引
    const currentMaxIndex = localImages.value.reduce((max, img) => {
      const match = img.label.match(/图片(\d+)/);
      if (match) {
        return Math.max(max, parseInt(match[1], 10));
      }
      return max;
    }, 0);

    // 生成标签
    const label = `图片${currentMaxIndex + 1}`;

    // 创建参考图对象（先用 blob URL 作为本地预览）
    const referenceImage: ReferenceImage = {
      id,
      src: localUrl,
      thumbnail: localUrl,
      label,
      file,
      uploadStatus: 'uploading',
      uploadProgress: 0
    };

    // 添加到列表，emit 后等一个 tick 让父组件更新 prop
    // 保证串行上传时下一次调用能读到最新的 localImages.value
    const newImages = [...localImages.value, referenceImage];
    emit('update:images', newImages);
    await nextTick();

    // 立即上传到 OSS，上传完成后更新图片状态
    uploadImageToOSS(referenceImage, file);

    return referenceImage;
  };

  /**
   * 将参考图异步上传到 OSS，上传完成后更新列表中对应图片的状态
   */
  const uploadImageToOSS = async (image: ReferenceImage, file: File) => {
    try {
      const fileSuffix = file.name.includes('.')
        ? file.name.substring(file.name.lastIndexOf('.'))
        : '.jpg';

      const uploadRes = await uploadFile({
        file,
        fileSuffix,
        originalFileName: file.name,
        fileType: 'image',
        resourceType: 2,
        needSync: 0
      });

      // 上传成功：用 OSS URL 替换 blob URL，写入 serverId
      const updated = localImages.value.map((img) =>
        img.id === image.id
          ? {
              ...img,
              src: uploadRes.url || img.src,
              thumbnail: uploadRes.url || img.thumbnail,
              serverId: String(uploadRes.ossId),
              uploadStatus: 'success' as const,
              uploadProgress: 100,
              file: undefined // 清除 File 引用，已不再需要
            }
          : img
      );
      emit('update:images', updated);
    } catch (err) {
      console.error('[SeedancePromptEditor] 参考图上传 OSS 失败:', image.id, err);
      const updated = localImages.value.map((img) =>
        img.id === image.id ? { ...img, uploadStatus: 'error' as const } : img
      );
      emit('update:images', updated);
    }
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

  // 串行上传队列：多文件并发时 el-upload 会同时触发多次 http-request，
  // 但 addImageToList 依赖 localImages.value（prop 驱动），并发时读到的是同一个旧值，
  // 导致后面的文件覆盖前面的。用队列把每次调用串行化解决此问题。
  let uploadQueue: Promise<void> = Promise.resolve();

  const handleUpload = (options: any): Promise<void> => {
    const file = options.file;
    uploadQueue = uploadQueue.then(async () => {
      try {
        await addImageToList(file);
      } catch (error) {
        console.error('上传失败:', error);
        ElMessage.error(`图片 "${file.name}" 上传失败`);
      }
    });
    return uploadQueue;
  };

  // ==================== 堆叠样式计算 ====================

  /**
   * 通用的堆叠位置计算，图片和添加按钮都用这个函数
   * index: 在所有卡片（图片 + 按钮）中的位置，0 = 最底层
   * total: 所有卡片总数（包含按钮）
   */
  const getStackStyle = (index: number, total: number, isExpanded: boolean) => {
    // 收起状态：卡片轻微错位叠放（模拟扑克牌）
    // 每张向右偏移 4px、向下偏移 2px，并有微小旋转
    const collapsedRotations = [0, -8, -15, 6, -4, -11];
    const COLLAPSED_OFFSET_X = 4; // px per card
    const COLLAPSED_OFFSET_Y = 2;

    // 展开状态：每张卡片横向展开，间距 68px（卡片宽60px + 8px间隔）
    const EXPANDED_STEP = 68;
    const expandedRotations = [-5, 3, -7, 8, -3, 5];

    if (isExpanded) {
      // 向左展开：index 越大的卡片越靠左，最后一张（按钮）在最左
      // 用 right 定位，index=0（第一张图）在最右（right: 0），依次向左排开
      return {
        position: 'absolute' as const,
        left: '',
        top: '0px',
        right: `${index * EXPANDED_STEP}px`,
        bottom: '',
        transform: `rotate(${expandedRotations[index] ?? 0}deg)`,
        transformOrigin: 'center center',
        zIndex: index + 1,
        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
      };
    } else {
      // 收起：所有卡片叠在右侧原点，向左微小偏移（与展开方向一致）
      const offsetX = index * COLLAPSED_OFFSET_X;
      const offsetY = index * COLLAPSED_OFFSET_Y;
      return {
        position: 'absolute' as const,
        left: '',
        top: `${offsetY}px`,
        right: `${offsetX}px`,
        bottom: '',
        transform: `rotate(${collapsedRotations[index] ?? 0}deg)`,
        transformOrigin: 'center center',
        // 最上层（最后一张）z-index 最高，视觉上在最顶部
        zIndex: total - index,
        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
      };
    }
  };

  // 获取堆叠图片样式（图片在按钮之前，index 就是图片在数组中的位置）
  const getImageStackStyle = (index: number, isExpanded: boolean) => {
    const total = localImages.value.length + (localImages.value.length < props.maxImages ? 1 : 0);
    return getStackStyle(index, total, isExpanded);
  };

  // 获取添加按钮位置样式（按钮始终排在所有图片之后）
  const getAddButtonStyle = (currentCount: number, isExpanded: boolean) => {
    const total = currentCount + 1; // 图片数 + 按钮自身
    return getStackStyle(currentCount, total, isExpanded);
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
    // 当父容器有明确高度时（如表格单元格），撑满父容器
    height: 100%;
  }

  // ==================== 参考图堆叠区域 ====================
  .reference-images-section {
    flex-shrink: 0;
    // 宽度始终固定为一张卡片的宽度，卡片通过 absolute 定位叠在一起
    // 展开时卡片溢出容器，靠 overflow: visible 显示
    width: 60px;
    height: 80px;
    position: relative;

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
      // 允许卡片溢出，展开时才能看到所有卡片
      overflow: visible;
      // 展开时用伪元素扩大鼠标响应区，防止鼠标移到展开的卡片上时触发 mouseleave
      // 向左展开，所以从右侧起向左延伸
      &.is-expanded::after {
        content: '';
        position: absolute;
        top: -8px;
        right: -8px;
        // 6张卡片 * 68px + 一些余量
        width: calc(6 * 68px + 24px);
        height: calc(100% + 16px);
        pointer-events: auto;
        z-index: 0;
      }

      .reference-image-item {
        width: 60px;
        height: 80px;
        border: 2px solid white;
        border-radius: 4px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        cursor: pointer;
        position: absolute;

        .reference-thumbnail {
          width: 100%;
          height: 100%;

          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
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
          z-index: 100;
          pointer-events: auto;
          overflow: visible;

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
          background: #f7f8fa;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          overflow: visible;

          .add-more-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            gap: 6px;
            color: #86909c;
            transition: color 0.3s;
          }

          &:hover {
            background: #f3f3ff;

            .add-more-content {
              color: #5252ff;
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
    // 当容器有明确高度时撑满，独立使用时由内容撑开
    flex: 1;
    min-height: 0;
  }

  .input-wrapper-alone {
    width: 100%;
    flex: 1;
    min-height: 0;
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
      0%,
      100% {
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
    // input-actions 内的堆叠区样式直接复用顶层 .reference-images-section 的规则
    // 此处只做容器对齐，不重复写堆叠逻辑
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
