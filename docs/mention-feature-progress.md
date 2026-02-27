# 剪映式提及功能实现进度

## 第一阶段：基础准备 ✅ 已完成

### 已完成的工作

#### 1. 安装依赖包 ✅

```bash
npm install @tiptap/vue-3 @tiptap/starter-kit @tiptap/extension-mention
```

已安装的包：

- `@tiptap/vue-3` - Vue 3 版本的 Tiptap 编辑器
- `@tiptap/starter-kit` - Tiptap 基础扩展包
- `@tiptap/extension-mention` - 提及功能扩展

项目已有的依赖（无需安装）：

- `@vueuse/core` (9.5.0) - Vue 组合式 API 工具集
- `pinia` (2.0.22) - 状态管理
- `element-plus` (2.2.27) - UI 组件库

#### 2. 创建类型定义 ✅

文件：`src/types/mention.d.ts`

定义的接口：

- `ReferenceImage` - 参考图片数据
- `MentionType` - 提及类型枚举 (reference/character/scene)
- `MentionNodeAttrs` - 提及节点属性（扩展支持角色和场景）
- `MentionOption` - 提及选项（用于弹窗选择）
- `MentionPopupState` - 提及弹窗状态
- `DragData` - 拖拽数据格式

#### 3. 创建状态管理 ✅

文件：`src/store/modules/reference.ts`

Store：`useReferenceStore`

状态 (state)：

- `images: ReferenceImage[]` - 参考图列表
- `maxIndex: number` - 当前最大索引

getters：

- `imageCount` - 参考图数量
- `uploadedImages` - 已上传成功的图片
- `hasImages` - 是否有参考图

操作 (actions)：

- `addImage(file)` - 添加参考图
- `removeImage(id)` - 删除参考图
- `getImage(id)` - 获取参考图
- `clearAll()` - 清空所有参考图
- `updateUploadStatus(id, status, progress)` - 更新上传状态
- `updateServerId(id, serverId)` - 更新服务器 ID
- `updateImageUrl(id, url)` - 更新图片 URL

#### 4. 扩展项目存储 ✅

文件：`src/store/modules/project.ts`

新增操作 (actions)：

- `loadCharacters(episodeId?)` - 加载角色数据
- `loadScenes(episodeId?)` - 加载场景数据

---

## 第二阶段：富文本编辑器集成 ✅ 已完成

### 已完成的工作

#### Step 1: 创建 Tiptap 编辑器基础组件 ✅

- 文件：`src/components/TiptapEditor/SeedancePromptEditor.vue`
- 功能：
  - 集成 Tiptap 编辑器
  - 支持双向绑定 v-model
  - 参考图区域显示
  - 拖拽插入提及标签
  - 占位符显示

#### Step 2: 创建自定义提及扩展 ✅

- 文件：`src/components/TiptapEditor/extensions/imageMention.ts`
- 功能：
  - 定义 imageMention 节点类型
  - 支持 draggable 属性
  - 添加 insertImageMention 命令
  - 自定义 HTML 属性渲染

#### Step 3: 创建提及标签组件 ✅

- 文件：`src/components/TiptapEditor/extensions/ImageMentionView.vue`
- 功能：
  - 显示图片缩略图和标签
  - 支持拖拽
  - 点击预览功能（待实现）

#### 集成到现有页面 ✅

- 修改文件：`src/views/workbench/project-creation/steps/StepShotList/components/StoryboardTable.vue`
- 替换原有的 textarea 为 SeedancePromptEditor 组件
- 删除未使用的上传相关代码

---

## 第三阶段：提及弹窗功能 ✅ 已完成

### 已完成的工作

#### Step 4: 创建提及弹窗组件 ✅

- 文件：`src/components/TiptapEditor/MentionPopup.vue`
- 功能：
  - 支持 @ 符号触发弹窗
  - 三个分类标签：参考图、角色、场景
  - 键盘导航支持 (↑↓ Enter Esc Tab)
  - 搜索过滤功能
  - 自动加载角色和场景数据
  - 响应式定位（防止超出视口）

#### Step 5: 扩展提及类型支持 ✅

- 支持三种提及类型：
  - `reference` - 参考图（已上传的图片）
  - `character` - 角色（从资源库加载）
  - `scene` - 场景（从资源库加载）

#### Step 6: 更新编辑器组件 ✅

- 文件：`src/components/TiptapEditor/SeedancePromptEditor.vue`
- 新增功能：
  - @ 符号检测和弹窗触发
  - 多类型提及标签显示
  - 不同类型的标签样式区分
  - 角色和场景数据集成

---

## 第四阶段：动画和样式 ✅ 已完成

### 已完成的工作

#### Step 7: CSS 动画 ✅

- 弹窗进入动画（fade + scale）
- 参考图悬浮动画
- 提及标签悬浮效果
- 过渡动画

#### Step 8: 提及标签样式 ✅

- 不同类型标签的边框颜色区分
- 参考图：蓝色边框
- 角色：绿色边框
- 场景：橙色边框
- 图标和缩略图显示

---

## 第五阶段：整合和测试 ✅ 已完成

### 已完成的工作

#### Step 9: 主输入组件 ✅

- SeedancePromptEditor 完整功能实现
- 支持所有三种提及类型
- 拖拽上传和点击上传
- 提及标签预览和管理

#### Step 10: 集成到现有页面 ✅

- 已集成到分镜头表格的 Seedance 2.0 提示词列
- 支持角色和场景数据的自动加载

#### Step 11: 导出配置 ✅

- 文件：`src/components/TiptapEditor/index.ts`
- 导出：SeedancePromptEditor, MentionPopup, ImageMention, ImageMentionView

---

## 功能特性总结

### 提及功能

1. **@ 符号触发**：在输入框中输入 @ 即可触发提及弹窗
2. **三种分类**：
   - 参考图：已上传的参考图片
   - 角色：从项目资源库加载的角色数据
   - 场景：从项目资源库加载的场景数据
3. **键盘导航**：↑↓ 选择，Enter 确认，Esc 关闭，Tab 切换分类
4. **搜索过滤**：输入关键词过滤可选项
5. **拖拽插入**：可以拖拽参考图到输入框

### 提及标签

1. **类型区分**：不同类型的提及标签有不同的边框颜色
2. **缩略图显示**：有图片的显示缩略图，无图片显示图标
3. **删除功能**：点击 × 删除提及标签
4. **预览区域**：输入框下方显示已插入的提及标签

### 数据格式

输出 HTML 格式：

```html
<span data-type="reference" data-id="xxx" data-src="xxx" data-label="图片1">🖼️ 图片1</span>
<span data-type="character" data-id="xxx" data-src="xxx" data-label="角色A">👤 角色A</span>
<span data-type="scene" data-id="xxx" data-src="xxx" data-label="室内">🏞️ 室内</span>
```

---

## 使用示例

### 在组件中使用提及功能

```vue
<script setup lang="ts">
  import { SeedancePromptEditor } from '@/components/TiptapEditor';
  import { ref } from 'vue';

  const promptContent = ref('');
</script>

<template>
  <SeedancePromptEditor
    v-model="promptContent"
    placeholder="请输入提示词，输入@可提及图片、角色或场景"
    :show-reference-bar="true"
  />
</template>
```

### 手动加载角色和场景数据

```vue
<script setup lang="ts">
  import { useProjectStore } from '@/store/modules/project';

  const projectStore = useProjectStore();

  // 加载角色数据
  await projectStore.loadCharacters();

  // 加载场景数据
  await projectStore.loadScenes();
</script>
```
