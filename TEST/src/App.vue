<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'

interface ImageItem {
  id: string
  file: File
  preview: string
  category: string
}

const categories = ref(['风景', '人物', '动物', '其他'])
const images = ref<ImageItem[]>([])
const editorRef = ref<HTMLDivElement | null>(null)
const showMentionMenu = ref(false)

// 上传多个图片
const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (files) {
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          images.value.push({
            id: Date.now().toString() + Math.random(),
            file,
            preview: e.target?.result as string,
            category: '其他'
          })
        }
        reader.readAsDataURL(file)
      }
    })
  }
  target.value = ''
}

// 修改图片分类
const updateCategory = (id: string, category: string) => {
  const img = images.value.find(img => img.id === id)
  if (img) {
    img.category = category
  }
}

// 删除图片
const removeImage = (id: string) => {
  images.value = images.value.filter(img => img.id !== id)
}

// 按分类分组图片
const imagesByCategory = computed(() => {
  const grouped: Record<string, ImageItem[]> = {}
  images.value.forEach(img => {
    if (!grouped[img.category]) {
      grouped[img.category] = []
    }
    grouped[img.category].push(img)
  })
  return grouped
})

// 输入框按键事件
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === '@') {
    showMentionMenu.value = true
  }
}

// 拖拽相关
let draggedElement: HTMLElement | null = null
let dropTargetElement: HTMLElement | null = null

// 开始拖拽
const handleDragStart = (event: DragEvent) => {
  const target = event.target as HTMLElement
  if (target.classList.contains('inline-image')) {
    draggedElement = target
    target.classList.add('dragging')
    event.dataTransfer!.effectAllowed = 'move'
  }
}

// 拖拽结束
const handleDragEnd = (event: DragEvent) => {
  const target = event.target as HTMLElement
  if (target.classList.contains('inline-image')) {
    target.classList.remove('dragging')
  }
  // 清除所有高亮
  clearDropIndicators()
  draggedElement = null
  dropTargetElement = null
}

// 清除放置指示器
const clearDropIndicators = () => {
  if (!editorRef.value) return
  const images = editorRef.value.querySelectorAll('.inline-image')
  images.forEach(img => {
    img.classList.remove('drop-before', 'drop-after')
  })
}

// 拖拽经过
const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  if (!draggedElement || !editorRef.value) return

  event.dataTransfer!.dropEffect = 'move'

  // 清除之前的高亮
  clearDropIndicators()

  // 获取鼠标位置的元素
  const x = event.clientX
  const y = event.clientY
  const elementAtPoint = document.elementFromPoint(x, y)

  if (!elementAtPoint || !editorRef.value.contains(elementAtPoint)) {
    return
  }

  // 查找最近的图片
  let targetImage = elementAtPoint?.closest('.inline-image') as HTMLElement | null

  if (targetImage && targetImage !== draggedElement) {
    dropTargetElement = targetImage
    // 根据鼠标在图片左侧还是右侧来决定高亮位置
    const rect = targetImage.getBoundingClientRect()
    const centerX = rect.x + rect.width / 2

    if (x < centerX) {
      targetImage.classList.add('drop-before')
    } else {
      targetImage.classList.add('drop-after')
    }
  } else {
    // 在文字区域，显示插入光标位置
    dropTargetElement = elementAtPoint as HTMLElement
  }
}

// 放置
const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  if (!draggedElement || !editorRef.value) return

  // 获取鼠标位置的元素
  const x = event.clientX
  const y = event.clientY
  const elementAtPoint = document.elementFromPoint(x, y)

  if (!elementAtPoint) {
    clearDropIndicators()
    draggedElement = null
    dropTargetElement = null
    return
  }

  // 查找最近的图片
  let targetImage = elementAtPoint?.closest('.inline-image') as HTMLElement | null

  if (targetImage && targetImage !== draggedElement) {
    // 在图片上放置
    const rect = targetImage.getBoundingClientRect()
    const centerX = rect.x + rect.width / 2
    const insertBefore = x < centerX

    if (insertBefore) {
      targetImage.before(draggedElement)
    } else {
      targetImage.after(draggedElement)
    }
  } else if (editorRef.value.contains(elementAtPoint)) {
    // 在文字区域放置，找到插入位置
    const range = document.caretRangeFromPoint(x, y)
    if (range) {
      range.deleteContents()
      range.insertNode(draggedElement)

      // 移动光标到图片后面
      range.setStartAfter(draggedElement)
      range.setEndAfter(draggedElement)
      const selection = window.getSelection()
      if (selection) {
        selection.removeAllRanges()
        selection.addRange(range)
      }
    }
  }

  clearDropIndicators()
  draggedElement = null
  dropTargetElement = null
}

// 插入图片到编辑器
const insertImage = (imageUrl: string) => {
  if (editorRef.value) {
    const img = document.createElement('img')
    img.src = imageUrl
    img.className = 'inline-image draggable'
    img.contentEditable = 'false'
    img.draggable = true

    // 添加拖拽事件
    img.addEventListener('dragstart', handleDragStart)
    img.addEventListener('dragend', handleDragEnd)

    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      range.deleteContents()
      range.insertNode(img)
      // 移动光标到图片后面
      range.setStartAfter(img)
      range.setEndAfter(img)
      selection.removeAllRanges()
      selection.addRange(range)
    } else {
      editorRef.value.appendChild(img)
    }
    showMentionMenu.value = false
    editorRef.value.focus()
  }
}

// 提及图片
const mentionImage = (imageId: string) => {
  const img = images.value.find(i => i.id === imageId)
  if (img && img.preview) {
    // 替换 @ 符号为图片
    if (editorRef.value) {
      const content = editorRef.value.textContent || ''
      const lastAtIndex = content.lastIndexOf('@')
      if (lastAtIndex !== -1) {
        // 找到 @ 符号的位置并删除
        const selection = window.getSelection()
        if (selection && editorRef.value.childNodes.length > 0) {
          const range = document.createRange()
          const walker = document.createTreeWalker(
            editorRef.value,
            NodeFilter.SHOW_TEXT,
            null
          )
          let charCount = 0
          let targetNode: Text | null = null
          let targetOffset = 0

          while (walker.nextNode()) {
            const node = walker.currentNode as Text
            if (charCount + node.length >= lastAtIndex) {
              targetNode = node
              targetOffset = lastAtIndex - charCount
              break
            }
            charCount += node.length
          }

          if (targetNode) {
            range.setStart(targetNode, targetOffset)
            range.setEnd(targetNode, targetOffset + 1)
            range.deleteContents()
            // 插入图片
            const imgElement = document.createElement('img')
            imgElement.src = img.preview
            imgElement.className = 'inline-image draggable'
            imgElement.contentEditable = 'false'
            imgElement.draggable = true
            imgElement.addEventListener('dragstart', handleDragStart)
            imgElement.addEventListener('dragend', handleDragEnd)
            range.insertNode(imgElement)

            // 移动光标
            range.setStartAfter(imgElement)
            range.setEndAfter(imgElement)
            selection.removeAllRanges()
            selection.addRange(range)
          }
        }
      } else {
        insertImage(img.preview)
      }
    } else {
      insertImage(img.preview)
    }
    showMentionMenu.value = false
  }
}

// 获取编辑器内容
const getEditorContent = () => {
  return editorRef.value?.innerHTML || ''
}
</script>

<template>
  <div class="container">
    <h1>图片管理系统</h1>

    <!-- 上传区域 -->
    <div class="upload-section">
      <label for="file-input" class="upload-btn">
        <span>+ 上传图片</span>
        <input
          id="file-input"
          type="file"
          accept="image/*"
          multiple
          @change="handleFileChange"
        />
      </label>
      <span class="hint">支持多选</span>
    </div>

    <!-- 图片分类展示 -->
    <div v-if="images.length > 0" class="images-section">
      <div v-for="(imgs, category) in imagesByCategory" :key="category" class="category-group">
        <h3>{{ category }} ({{ imgs.length }})</h3>
        <div class="images-grid">
          <div v-for="img in imgs" :key="img.id" class="image-card">
            <img :src="img.preview" :alt="img.file.name" />
            <div class="image-info">
              <select :value="img.category" @change="updateCategory(img.id, ($event.target as HTMLSelectElement).value)">
                <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
              </select>
              <button class="mention-btn" @click="mentionImage(img.id)" title="插入此图片">@</button>
              <button class="delete-btn" @click="removeImage(img.id)">×</button>
            </div>
            <p class="image-name">{{ img.file.name }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 输入框区域 -->
    <div class="input-section">
      <h3>输入框（输入 @ 可快速插入图片）</h3>
      <div
        ref="editorRef"
        class="text-editor"
        contenteditable="true"
        placeholder="输入内容，输入 @ 或点击图片 @ 按钮可插入图片..."
        @keydown="handleKeyDown"
        @click="showMentionMenu = false"
        @dragover="handleDragOver"
        @drop="handleDrop"
      ></div>

      <!-- 提及菜单 -->
      <div v-if="showMentionMenu && images.length > 0" class="mention-menu">
        <div class="mention-header">选择要插入的图片：</div>
        <div
          v-for="img in images"
          :key="img.id"
          class="mention-item"
          @click="mentionImage(img.id)"
        >
          <img :src="img.preview" class="mention-thumb" />
          <span>{{ img.file.name }}</span>
        </div>
      </div>

      <div class="output-area">
        <h4>内容预览：</h4>
        <div class="output-html" v-html="getEditorContent()"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 900px;
  margin: 30px auto;
  padding: 20px;
}

h1 {
  color: #42b883;
  text-align: center;
  margin-bottom: 30px;
}

/* 上传区域 */
.upload-section {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 30px;
  padding: 20px;
  border: 2px dashed #ddd;
  border-radius: 8px;
}

.upload-btn {
  padding: 12px 24px;
  background-color: #42b883;
  color: white;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.3s;
}

.upload-btn:hover {
  background-color: #35a372;
}

.upload-btn input {
  display: none;
}

.hint {
  color: #888;
  font-size: 14px;
}

/* 图片分类展示 */
.images-section {
  margin-bottom: 30px;
}

.category-group {
  margin-bottom: 25px;
}

.category-group h3 {
  color: #333;
  border-bottom: 2px solid #42b883;
  padding-bottom: 8px;
  margin-bottom: 15px;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 15px;
}

.image-card {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 10px;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  transition: transform 0.2s, box-shadow 0.2s;
}

.image-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.image-card img {
  width: 100%;
  height: 140px;
  object-fit: cover;
  border-radius: 6px;
}

.image-info {
  display: flex;
  gap: 5px;
  margin-top: 10px;
}

.image-info select {
  flex: 1;
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
}

.mention-btn {
  width: 28px;
  height: 28px;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.mention-btn:hover {
  background-color: #2563eb;
}

.delete-btn {
  width: 28px;
  height: 28px;
  background-color: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
}

.delete-btn:hover {
  background-color: #dc2626;
}

.image-name {
  margin: 8px 0 0 0;
  font-size: 12px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 输入框区域 */
.input-section {
  position: relative;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 8px;
}

.input-section h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
}

.text-editor {
  min-height: 120px;
  padding: 12px;
  font-size: 16px;
  line-height: 1.5;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  font-family: inherit;
  overflow-y: auto;
  word-break: break-word;
}

.text-editor:empty:before {
  content: attr(placeholder);
  color: #999;
  pointer-events: none;
}

.text-editor:focus {
  outline: none;
  border-color: #42b883;
}

/* 内联图片样式 */
.text-editor :deep(.inline-image) {
  height: 1.2em;
  vertical-align: middle;
  display: inline-block;
  margin: 0 2px;
  object-fit: contain;
  cursor: grab;
  transition: opacity 0.2s, transform 0.2s;
  position: relative;
}

.text-editor :deep(.inline-image:hover) {
  opacity: 0.8;
}

.text-editor :deep(.inline-image.dragging) {
  opacity: 0.5;
  cursor: grabbing;
}

.text-editor :deep(.inline-image:active) {
  cursor: grabbing;
}

/* 放置指示器 - 在图片前插入 */
.text-editor :deep(.inline-image.drop-before::before) {
  content: '';
  position: absolute;
  left: -4px;
  top: -2px;
  bottom: -2px;
  width: 3px;
  background-color: #42b883;
  border-radius: 2px;
  box-shadow: 0 0 6px #42b883;
  animation: pulse 0.8s infinite;
}

/* 放置指示器 - 在图片后插入 */
.text-editor :deep(.inline-image.drop-after::after) {
  content: '';
  position: absolute;
  right: -4px;
  top: -2px;
  bottom: -2px;
  width: 3px;
  background-color: #42b883;
  border-radius: 2px;
  box-shadow: 0 0 6px #42b883;
  animation: pulse 0.8s infinite;
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

/* 提及菜单 */
.mention-menu {
  position: absolute;
  top: 100%;
  left: 20px;
  right: 20px;
  margin-top: 5px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  max-height: 250px;
  overflow-y: auto;
  z-index: 100;
}

.mention-header {
  padding: 10px 15px;
  background: #f5f5f5;
  border-bottom: 1px solid #eee;
  font-weight: bold;
  font-size: 14px;
}

.mention-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 15px;
  cursor: pointer;
  transition: background 0.2s;
}

.mention-item:hover {
  background: #f0f0f0;
}

.mention-thumb {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
}

/* 输出预览 */
.output-area {
  margin-top: 15px;
}

.output-area h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #666;
}

.output-html {
  padding: 10px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-height: 50px;
  word-break: break-word;
}

.output-html :deep(.inline-image) {
  height: 1.2em;
  vertical-align: middle;
  display: inline-block;
  margin: 0 2px;
  object-fit: contain;
  cursor: grab;
}

.output-html :deep(.inline-image:hover) {
  opacity: 0.8;
}
</style>
