<template>
  <teleport to="body">
    <transition name="fade">
      <div
        v-if="state.visible"
        ref="popupRef"
        class="mention-popup"
        :style="{ left: state.position.x + 'px', top: state.position.y + 'px' }"
      >
        <!-- 分类标签 -->
        <div class="mention-tabs">
          <div
            v-for="tab in tabs"
            :key="tab.key"
            :class="['mention-tab', { active: state.activeTab === tab.key }]"
            @click="handleTabClick(tab.key)"
          >
            <svg-icon v-if="tab.icon" :icon-class="tab.icon" style="width: 14px; height: 14px" />
            <span>{{ tab.label }}</span>
            <span v-if="getFilteredOptions(tab.key).length > 0" class="mention-tab-count">
              {{ getFilteredOptions(tab.key).length }}
            </span>
          </div>
        </div>

        <!-- 选项列表 -->
        <div class="mention-options">
          <div
            v-for="(option, index) in filteredOptions"
            :key="option.id"
            :class="['mention-option', { active: index === state.activeIndex }]"
            @click="handleSelect(option)"
            @mouseenter="state.activeIndex = index"
          >
            <img v-if="option.src" :src="option.src" class="mention-option-thumb" />
            <div v-else class="mention-option-icon">
              <svg-icon
                :icon-class="state.activeTab === MentionType.CHARACTER ? 'fy-user' : 'fy-scene'"
                style="width: 20px; height: 20px; color: #909399"
              />
            </div>
            <div class="mention-option-content">
              <div class="mention-option-label">{{ option.label }}</div>
              <div v-if="option.subtitle" class="mention-option-subtitle">{{ option.subtitle }}</div>
            </div>
          </div>

          <!-- 无结果提示 -->
          <div v-if="filteredOptions.length === 0" class="mention-empty">
            <svg-icon icon-class="fy-empty" style="width: 48px; height: 48px; color: #c0c4cc" />
            <p>暂无{{ state.activeTab === MentionType.REFERENCE ? '参考图' : state.activeTab === MentionType.CHARACTER ? '角色' : '场景' }}</p>
          </div>
        </div>

        <!-- 键盘提示 -->
        <div class="mention-footer">
          <span class="mention-hint">
            <kbd>↑</kbd> <kbd>↓</kbd> 导航
            <kbd>Enter</kbd> 选择
            <kbd>Esc</kbd> 关闭
          </span>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useReferenceStore } from '@/store/modules/reference';
import { useProjectStore } from '@/store/modules/project';
import { MentionType, type MentionOption, type MentionPopupState } from '@/types/mention';

interface Props {
  /** 查询关键词 */
  query: string;
  /** 选择回调 */
  onSelect: (option: MentionOption) => void;
  /** 关闭回调 */
  onClose: () => void;
}

const props = defineProps<Props>();

// Store
const referenceStore = useReferenceStore();
const projectStore = useProjectStore();

// Refs
const popupRef = ref<HTMLElement>();

// 数据加载状态
const loadingStates = ref({
  character: false,
  scene: false
});

// State
const state = reactive<MentionPopupState>({
  visible: false,
  position: { x: 0, y: 0 },
  query: '',
  activeIndex: 0,
  activeTab: MentionType.REFERENCE
});

// Tabs
const tabs = [
  { key: MentionType.REFERENCE, label: '参考图', icon: 'fy-image' },
  { key: MentionType.CHARACTER, label: '角色', icon: 'fy-user' },
  { key: MentionType.SCENE, label: '场景', icon: 'fy-scene' }
];

// 计算过滤后的选项
const filteredOptions = computed(() => {
  return getFilteredOptions(state.activeTab);
});

// 根据类型获取过滤后的选项
const getFilteredOptions = (type: MentionType): MentionOption[] => {
  const query = state.query.toLowerCase();
  let options: MentionOption[] = [];

  switch (type) {
    case MentionType.REFERENCE:
      options = referenceStore.images
        .filter(img => img.label.toLowerCase().includes(query))
        .map(img => ({
          id: img.id,
          type: MentionType.REFERENCE,
          src: img.src,
          label: img.label,
          subtitle: '参考图'
        }));
      break;

    case MentionType.CHARACTER:
      // 从 projectStore 获取角色数据
      if (projectStore.characters && projectStore.characters.length > 0) {
        options = projectStore.characters
          .filter(char => {
            const name = (char.alias || char.name || '').toLowerCase();
            return name.includes(query) || (char.name && char.name.toLowerCase().includes(query));
          })
          .flatMap(char => {
            const result: MentionOption[] = [];
            // 为每个角色的每张图片创建一个选项
            if (char.images && char.images.length > 0) {
              char.images.forEach((imgUrl, idx) => {
                result.push({
                  id: `${char.id}-${idx}`,
                  type: MentionType.CHARACTER,
                  src: imgUrl,
                  label: char.alias || char.name,
                  subtitle: char.name,
                  alias: char.alias
                });
              });
            } else {
              // 没有图片也创建一个选项
              result.push({
                id: String(char.id),
                type: MentionType.CHARACTER,
                label: char.alias || char.name,
                subtitle: char.name,
                alias: char.alias
              });
            }
            return result;
          });
      }
      break;

    case MentionType.SCENE:
      // 从 projectStore 获取场景数据
      if (projectStore.scenes && projectStore.scenes.length > 0) {
        options = projectStore.scenes
          .filter(scene => scene.category && scene.category.toLowerCase().includes(query))
          .flatMap(scene => {
            const result: MentionOption[] = [];
            // 为每个场景的每张图片创建一个选项
            if (scene.images && scene.images.length > 0) {
              scene.images.forEach((imgUrl, idx) => {
                result.push({
                  id: `${scene.id}-${idx}`,
                  type: MentionType.SCENE,
                  src: imgUrl,
                  label: scene.category,
                  subtitle: `场景 ${idx + 1}`,
                  category: scene.category
                });
              });
            } else {
              // 没有图片也创建一个选项
              result.push({
                id: String(scene.id),
                type: MentionType.SCENE,
                label: scene.category,
                category: scene.category
              });
            }
            return result;
          });
      }
      break;
  }

  return options;
};

// 显示弹窗
const show = async (x: number, y: number) => {
  state.visible = true;
  state.position = { x, y };
  state.activeIndex = 0;

  // 根据当前选中的标签加载数据
  await loadTabData(state.activeTab);

  // 调整位置防止超出视口
  nextTick(() => {
    if (popupRef.value) {
      const rect = popupRef.value.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      if (rect.right > viewportWidth) {
        state.position.x = viewportWidth - rect.width - 10;
      }
      if (rect.bottom > viewportHeight) {
        state.position.y = y - rect.height - 5;
      }
    }
  });
};

// 加载标签数据
const loadTabData = async (tab: MentionType) => {
  if (tab === MentionType.CHARACTER && projectStore.characters.length === 0 && !loadingStates.value.character) {
    loadingStates.value.character = true;
    try {
      await projectStore.loadCharacters();
    } finally {
      loadingStates.value.character = false;
    }
  } else if (tab === MentionType.SCENE && projectStore.scenes.length === 0 && !loadingStates.value.scene) {
    loadingStates.value.scene = true;
    try {
      await projectStore.loadScenes();
    } finally {
      loadingStates.value.scene = false;
    }
  }
};

// 处理标签点击
const handleTabClick = async (tab: MentionType) => {
  state.activeTab = tab;
  state.activeIndex = 0;
  await loadTabData(tab);
};

// 隐藏弹窗
const hide = () => {
  state.visible = false;
  state.query = '';
  state.activeIndex = 0;
};

// 选择选项
const handleSelect = (option: MentionOption) => {
  props.onSelect(option);
  hide();
};

// 键盘导航
const handleKeydown = (e: KeyboardEvent) => {
  if (!state.visible) return;

  const options = filteredOptions.value;

  switch (e.key) {
    case 'ArrowUp':
      e.preventDefault();
      state.activeIndex = (state.activeIndex - 1 + options.length) % options.length;
      break;
    case 'ArrowDown':
      e.preventDefault();
      state.activeIndex = (state.activeIndex + 1) % options.length;
      break;
    case 'Enter':
      e.preventDefault();
      if (options[state.activeIndex]) {
        handleSelect(options[state.activeIndex]);
      }
      break;
    case 'Escape':
      e.preventDefault();
      hide();
      props.onClose();
      break;
    case 'Tab':
      e.preventDefault();
      // 切换标签
      const currentIndex = tabs.findIndex(t => t.key === state.activeTab);
      const nextIndex = (currentIndex + 1) % tabs.length;
      handleTabClick(tabs[nextIndex].key);
      break;
  }
};

// 监听 query 变化
watch(() => props.query, (newQuery) => {
  state.query = newQuery;
  state.activeIndex = 0;
});

// 暴露方法
defineExpose({
  show,
  hide
});

// 生命周期
onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped lang="scss">
.mention-popup {
  position: fixed;
  z-index: 9999;
  width: 320px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  animation: mentionPopupIn 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes mentionPopupIn {
  from {
    opacity: 0;
    transform: translateY(-8px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.mention-tabs {
  display: flex;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}

.mention-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 10px 12px;
  font-size: 13px;
  color: #606266;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;

  &:hover {
    color: #5252ff;
    background: rgba(82, 82, 255, 0.05);
  }

  &.active {
    color: #5252ff;
    font-weight: 500;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 24px;
      height: 2px;
      background: #5252ff;
      border-radius: 1px;
    }
  }
}

.mention-tab-count {
  font-size: 11px;
  padding: 1px 5px;
  background: rgba(82, 82, 255, 0.1);
  border-radius: 8px;
  color: #5252ff;
}

.mention-options {
  max-height: 280px;
  overflow-y: auto;
  padding: 4px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: #dcdfe6;
    border-radius: 3px;

    &:hover {
      background: #c0c4cc;
    }
  }
}

.mention-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover,
  &.active {
    background: rgba(82, 82, 255, 0.08);
  }

  &.active {
    background: rgba(82, 82, 255, 0.12);
  }
}

.mention-option-thumb {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
  border: 1px solid #ebeef5;
}

.mention-option-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 6px;
  flex-shrink: 0;
}

.mention-option-content {
  flex: 1;
  min-width: 0;
}

.mention-option-label {
  font-size: 14px;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mention-option-subtitle {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mention-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  color: #909399;

  p {
    margin-top: 8px;
    font-size: 13px;
  }
}

.mention-footer {
  padding: 8px 12px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
}

.mention-hint {
  font-size: 11px;
  color: #909399;

  kbd {
    display: inline-block;
    padding: 2px 5px;
    margin: 0 2px;
    font-size: 11px;
    font-family: inherit;
    background: #fff;
    border: 1px solid #dcdfe6;
    border-radius: 3px;
    box-shadow: 0 1px 1px rgba(0, 0, 0, 0.05);
  }
}
</style>
