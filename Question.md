# 问题与解决记录

## 2026-02-13: 开发环境登录后显示404页面

### 问题描述
开发环境登录成功后显示404页面，而生产环境正常工作。

### 原因分析
查看后端返回数据发现：
- 开发环境和生产环境返回的数据结构相同
- 都有 `roles: ["SUPER-ADMIN"]` 但 `permissions: []` 为空

问题出在前端路由注册逻辑上。在 `src/store/modules/permission.ts` 的 `generateRoutes` 函数中：
- 静态菜单 `staticMenus` 只被合并到 `allRoutes` 并存储到 store 中
- 但只有后端返回的 `rewriteRoutes` 被通过 `router.addRoute()` 注册到 Vue Router
- **静态菜单从未被注册到路由器中**

在开发环境中，如果后端 `/hivision/getRouters` 返回空数组，加上静态菜单没有注册，导致没有任何可用路由，最终匹配到404 catch-all路由。

### 解决方案
修改 `src/store/modules/permission.ts:72-79`，将合并后的 `allRoutes`（包含静态菜单和动态路由）注册到 Vue Router：

```typescript
// 合并静态菜单和动态路由
const allRoutes = [...staticMenus.value, ...rewriteRoutes];

// 将合并后的路由添加到 router（包含静态菜单和动态路由）
allRoutes.forEach((route) => {
  router.addRoute(route);
});

setRoutes(allRoutes);
```

### 相关文件
- `src/store/modules/permission.ts` - 权限路由管理模块

---

## 2026-02-13: 创建部署脚本

### 问题描述
编写一个脚本，用于将打包好的 `dist` 目录中的文件上传到内网服务器的 `/opt/1panel/www/sites/creaflow/index`，并在部署前自动备份服务器上的现有文件。

### 服务器配置
- IP: 172.28.104.54
- 用户名: ahui
- 密码: ln2718281828
- 部署路径: /opt/1panel/www/sites/creaflow/index

### 解决方案
创建了三个部署脚本以支持不同平台：

1. **bin/deploy.js** - Node.js 跨平台脚本（推荐）
2. **bin/deploy.bat** - Windows 批处理脚本
3. **bin/deploy.sh** - Linux/Mac Shell 脚本

同时在 `package.json` 中添加了便捷命令：
```json
"deploy": "node bin/deploy.js",
"deploy:prod": "npm run build:prod && npm run deploy"
```

### 功能特性
- 自动备份：每次部署前使用时间戳备份现有文件（格式：`index_backup_YYYYMMDDHHMMSS`）
- 自动权限设置：上传后自动设置文件权限为 755
- 跨平台支持：Windows/Linux/Mac 均可使用
- 一键部署：支持打包+部署一键完成

### 使用方法
```bash
# 仅部署（需要先手动打包）
npm run deploy

# 打包并部署（一键完成）
npm run deploy:prod
```

### 相关文件
- `bin/deploy.js` - Node.js 部署脚本
- `bin/deploy.bat` - Windows 批处理脚本
- `bin/deploy.sh` - Linux/Mac Shell 脚本
- `bin/DEPLOY.md` - 部署说明文档
- `package.json` - 添加了 deploy 和 deploy:prod 命令

---

## 2026-02-13: 修复 Windows 部署脚本 bash 错误

### 问题描述
运行部署脚本时报错：`'bash' 不是内部或外部命令`

### 原因分析
Windows 系统默认没有安装 bash，脚本尝试使用 bash 执行命令导致失败。

### 解决方案
修改 `bin/deploy.js`，在 Windows 环境下直接使用内置的 SSH 客户端：
- 添加 `-o UserKnownHostsFile=NUL` 参数（Windows 使用 NUL 而非 /dev/null）
- 移除对 bash 的依赖，直接执行 ssh 和 scp 命令
- 分步骤执行：备份 → 上传 → 设置权限

### 相关文件
- `bin/deploy.js` - 更新 Windows 兼容性

---

## 2026-02-13: 修复部署脚本密码认证问题

### 问题描述
运行部署脚本时，每次都需要手动输入密码，而且输入后总是显示 "Permission denied"。

### 原因分析
Windows 命令行的 SSH 交互式密码输入可能存在兼容性问题，导致密码无法正确传递。

### 解决方案
改用 `node-ssh` Node.js 库来实现 SSH 连接和文件上传：
1. 安装依赖：`npm install node-ssh --save-dev`
2. 脚本使用 `node-ssh` 的 `putDirectory` 方法上传文件
3. 密码直接在配置中指定，无需手动输入

### 使用方法
```bash
# 先安装依赖
npm install node-ssh --save-dev

# 然后运行部署
npm run deploy
```

### 相关文件
- `bin/deploy.js` - 使用 node-ssh 库重写
- `package.json` - 添加 node-ssh 依赖

---

## 2026-02-13: 修复 node-ssh putDirectory Windows 兼容性问题

### 问题描述
使用 `node-ssh` 的 `putDirectory` 方法在 Windows 上上传文件时，所有文件都上传失败。

### 原因分析
`node-ssh` 的 `putDirectory` 方法在处理 Windows 路径（反斜杠）时存在兼容性问题。

### 解决方案
改用逐个文件上传的方式：
1. 使用 `getAllFiles` 递归获取所有文件
2. 使用 `putFile` 逐个上传文件
3. 路径转换：将 Windows 路径转换为 Unix 风格
4. 添加上传进度显示

### 相关文件
- `bin/deploy.js` - 改用逐个文件上传方式

---

## 2026-02-25: 修复 Mention 功能在文本中间输入 @ 无法触发的问题

### 问题描述
在分镜头和提示词模块的 Mention 功能中，在输入文本中间输入 `@` 无法触发 Mention 下拉框。

### 原因分析
在 `src/components/PromptInput/PromptInput.vue` 的 `handleInput` 方法中，对 `@` 符号的有效性进行了过度限制：

```javascript
const isValidMention = lastAtIndex === 0 || /\s/.test(charBeforeAt) || charBeforeAt === '(';
```

这个条件只允许以下情况触发 Mention：
1. `@` 在行首
2. `@` 前面是空格
3. `@` 前面是左括号 `(`

因此在文本中间输入 `abc@` 时，`@` 前面是字母 `c`，不满足上述条件，导致 Mention 无法触发。

### 解决方案
移除对 `@` 前面字符的限制，只保留对已完成标签语法的检查（`@` 后面紧跟 `[` 的情况）：

```javascript
if (lastAtIndex !== -1) {
  const charAfterAt = textBeforeCursor[lastAtIndex + 1];
  const isCompletedTag = charAfterAt === '[';

  if (!isCompletedTag) {
    const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
    const firstSpaceAfterAt = textAfterAt.indexOf(' ');
    const searchQuery = firstSpaceAfterAt === -1 ? textAfterAt : textAfterAt.substring(0, firstSpaceAfterAt);

    if (!searchQuery.includes(']')) {
      mentionState.value.triggerPosition = lastAtIndex;
      mentionState.value.searchQuery = searchQuery;
      mentionState.value.filteredGroups = filterGroups(searchQuery);
      showMentionDropdown();
      return;
    }
  }
}
```

### 相关文件
- `src/components/PromptInput/PromptInput.vue` - 修复 Mention 触发逻辑
- `src/components/PromptInput/MentionDropdown.vue` - 移除自动聚焦搜索框

---

## 2026-02-25: 修复 Mention 自动搜索导致的输入混乱问题

### 问题描述
在 `@` 后继续输入字符时，这些字符会自动被当作搜索关键词，同时 MentionDropdown 的搜索框会自动聚焦，导致用户无法正常在 textarea 中输入。

### 原因分析
1. `handleInput` 方法会提取 `@` 后的内容作为 `searchQuery`，并实时过滤分组
2. MentionDropdown 显示时会自动聚焦搜索框
3. 用户输入被同时发送到 textarea 和搜索框，导致行为混乱

### 解决方案
1. **只在 `@` 后面没有内容时才触发下拉框**：
   ```javascript
   if (!isCompletedTag && lastAtIndex === cursorPosition - 1) {
     // 只在光标紧贴 @ 后面时触发
     mentionState.value.searchQuery = '';
     mentionState.value.filteredGroups = filterGroups('');
     showMentionDropdown();
   }
   ```

2. **移除自动聚焦搜索框行为**：
   ```javascript
   // 不自动聚焦搜索框，让用户在 textarea 中正常输入
   // 用户点击搜索框时会自动聚焦
   ```

3. **下拉框显示后不再自动更新搜索关键词**，用户需要点击搜索框后才开始搜索

### 相关文件
- `src/components/PromptInput/PromptInput.vue` - 修改触发条件和移除自动搜索
- `src/components/PromptInput/MentionDropdown.vue` - 移除自动聚焦

---

## 2026-02-25: 修复 Mention 下拉框位置和保持显示问题

### 问题描述
1. Mention 下拉框位置应该出现在 `@` 符号下方而不是光标位置
2. 在 `@` 后继续输入字符时，下拉框会被意外关闭

### 原因分析
1. `getCursorCoordinates` 使用光标位置而不是 `@` 符号位置
2. `handleInput` 中条件 `lastAtIndex === cursorPosition - 1` 过于严格，用户输入后不再满足

### 解决方案
1. **修改下拉框位置计算**：
   ```javascript
   // 使用 @ 符号的位置（triggerPosition）而不是光标位置
   const atPosition = mentionState.value.triggerPosition;
   const textBeforeAt = textarea.value.substring(0, atPosition + 1);
   // 计算 @ 符号右下方的位置
   let y = spanRect.bottom + 4;
   ```

2. **移除输入限制，保持下拉框显示**：
   ```javascript
   if (!isCompletedTag && !textAfterAt.includes(']')) {
     // 显示或保持下拉框显示
     if (!mentionState.value.visible) {
       showMentionDropdown();
     }
     return;
   }
   ```

### 相关文件
- `src/components/PromptInput/PromptInput.vue` - 修改位置计算和保持显示逻辑

---

## 2026-02-25: 修复 Mention 标签删除和位置重置问题

### 问题描述
1. 删除已选中的图片标签后，标签仍然显示或无法删除
2. 关闭下拉框后 `triggerPosition` 没有被重置，可能导致位置计算错误

### 原因分析
1. `updateDisplayValue` 使用 `inputValue.value` 而不是 `textareaValue.value`，可能获取到旧值
2. `hideMentionDropdown` 没有重置 `triggerPosition`

### 解决方案
1. **修复 `updateDisplayValue`**：
   ```javascript
   const updateDisplayValue = () => {
     // 移除 textarea 中当前的 @ 语法，保留纯文本
     const regex = /@\[([^\]]+)\](?:\(权重:(\d+(?:\.\d+)?)\))?\s*/g;
     const cleanText = textareaValue.value.replace(regex, '').trim();
     textareaValue.value = cleanText;
   };
   ```

2. **重置 `triggerPosition`**：
   ```javascript
   const hideMentionDropdown = () => {
     mentionState.value.visible = false;
     mentionState.value.searchQuery = '';
     mentionState.value.triggerPosition = -1; // 重置触发位置
   };
   ```

### 相关文件
- `src/components/PromptInput/PromptInput.vue` - 修复标签删除和位置重置逻辑

---

## 2026-02-25: 完善 Mention 功能 - 参考剪映实现

### 问题描述
1. 在文本中间输入 `@` 无法触发 Mention
2. 弹出的图片选择框应该出现在输入光标下方
3. 选择图片后应该直接替换 `@` 符号，而不是出现在所有文字上方

### 参考实现
研究剪映 (jimeng.jianying.com) 的 Mention 功能实现方式：
- 输入 `@` 即可在任何位置触发
- 下拉框跟随 `@` 符号位置显示
- 选择后直接在文本中插入 `@[图片名]` 语法

### 解决方案

**1. 改进 `@` 符号检测逻辑** - 从后往前遍历查找最近的未完成标签中的 `@`：
```javascript
// 从后往前遍历，找到最近的未完成标签中的@
for (let i = textBeforeCursor.length - 1; i >= 0; i--) {
  if (textBeforeCursor[i] === '@') {
    lastAtIndex = i;
    break;
  }
  // 如果遇到]，说明@可能在已完成的标签之前
  if (textBeforeCursor[i] === ']') {
    isInCompletedTag = true;
    break;
  }
}
```

**2. 改进弹出框位置计算** - 正确处理 textarea 在表格内部的情况：
```javascript
// 将镜像元素添加到textarea的父元素中，确保相同的滚动上下文
const parent = textarea.offsetParent || document.body;
parent.appendChild(mirror);

// 计算相对位置，考虑滚动偏移
const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
x += scrollLeft;
y += scrollTop;
```

**3. 选择图片后直接在文本中替换 `@` 符号**：
```javascript
// 构建插入的文本 @[图片名]
const insertText = `@[${image.name}]`;

// 替换@符号及其后的文本
const newValue =
  currentValue.substring(0, triggerPos) + insertText + currentValue.substring(cursorPosition);

// 设置光标位置到插入文本之后
const newCursorPosition = triggerPos + insertText.length;
```

### 相关文件
- `src/components/PromptInput/PromptInput.vue` - 完整的 Mention 功能重构

---

## 2026-02-25: 修复点击输入框导致文字被覆盖的问题

### 问题描述
点击输入框时，之前输入的文字会被覆盖。

### 原因分析
在 `src/components/PromptInput/PromptInput.vue` 中，`modelValue` 的 watch 监听器使用了 `immediate: true`，导致以下问题：

1. 组件初始化时，watch 立即执行，设置编辑器内容
2. 当用户点击输入框时，`handleFocus` 虽然设置了 `isFocused.value = true`，但存在时序问题
3. watch 可能在 `isFocused` 更新前执行，导致覆盖用户输入
4. 更严重的是，`emitChange` 触发的 `update:modelValue` 事件会导致 watch 再次执行，形成循环更新

### 解决方案
添加 `lastSetValue` 变量来跟踪最后一次设置的值，防止 watch 对自己触发的更新做出反应：

```javascript
// 用于防止初始化时的重复更新
let isInitialized = false;
let lastSetValue = '';

/** 监听 modelValue 变化，更新编辑器内容 */
watch(
  () => props.modelValue,
  (newValue) => {
    const currentValue = getEditorContent();

    // 只在以下情况更新内容：
    // 1. 编辑器未聚焦
    // 2. 新值与当前值真正不同
    // 3. 不是我们自己触发的事件（通过 emitChange 更新的）
    if (!isFocused.value && newValue !== currentValue && newValue !== lastSetValue) {
      setEditorContent(newValue || '');
      lastSetValue = newValue || '';
    }

    // 标记已初始化
    if (!isInitialized) {
      isInitialized = true;
      lastSetValue = newValue || '';
    }
  },
  { immediate: true }
);
```

同时在 `emitChange` 和 `handleBlur` 中设置 `lastSetValue`：

```javascript
/** 触发变更 */
const emitChange = () => {
  const value = getEditorContent();
  lastSetValue = value; // 标记这是我们设置的值，防止 watch 重复更新
  const tags = parseMentions(value);
  emit('update:modelValue', value);
  emit('change', value, tags);
};
```

### 相关文件
- `src/components/PromptInput/PromptInput.vue` - 修复 watch 循环更新问题

---

## 2026-02-25: Git 版本回退方法整理

### 问题描述
了解如何使用 Git 回退到指定的提交版本。

### 回退方法对比

| 方法 | 命令 | 效果 | 适用场景 |
|------|------|------|---------|
| **临时查看** | `git checkout <commit-hash>` | 只查看代码，不修改历史 | 想看看旧版本代码，不准备回退 |
| **软重置** | `git reset --soft <commit-hash>` | 回退但保留更改在暂存区 | 想重新组织提交 |
| **混合重置** | `git reset <commit-hash>` | 回退但保留更改在工作区 | 想重新修改后再提交 |
| **硬重置** | `git reset --hard <commit-hash>` | 完全丢弃之后的所有提交 | 确定要完全回到旧版本 |
| **反向提交** | `git revert <commit-hash>..HEAD` | 创建新提交撤销更改 | 已推送到远程，需保留历史 |

### 详细说明

#### 1. 临时查看（不修改历史）
```bash
# 进入分离头指针状态查看旧代码
git checkout e99aed6

# 查看完后返回最新状态
git checkout why_develop
```

#### 2. 真正回退（修改历史）

**软重置** - 保留更改在暂存区：
```bash
git reset --soft e99aed6
# 可以重新组织提交内容
git commit -m "重新组织的提交"
```

**混合重置（默认）** - 保留更改在工作区，未暂存：
```bash
git reset e99aed6

# 可以继续修改文件后重新提交
```

**硬重置** - 完全丢弃之后的所有提交和更改：
```bash
git reset --hard e99aed6
```
⚠️ 警告：之后的提交和更改将无法恢复！

#### 3. 已推送到远程的情况

如果已经推送到远程分支，使用 reset 后需要强制推送：
```bash
git reset --hard e99aed6
git push -f why_develop
```
⚠️ 警告：强制推送会覆盖远程，团队协作时慎用！

**推荐使用 revert（保留历史）**：
```bash
# 撤销 e99aed6 到 HEAD 的所有提交
git revert e99aed6..HEAD

# 这会创建新的提交来撤销更改，历史完整保留
```

### 常用场景选择

```
个人开发分支，确定要丢弃 → git reset --hard
想重新组织提交内容     → git reset --soft
已经推送远程，团队协作   → git revert
只是看看旧代码         → git checkout
```

### 相关命令
```bash
# 查看提交历史
git log --oneline

# 查看某次提交的详细内容
git show e99aed6

# 查看两次提交之间的差异
git diff e99aed6 HEAD
```
