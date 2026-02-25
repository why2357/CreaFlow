# Prettier 代码格式化指南

## 一、Prettier 是什么？

**Prettier** 是一个"有主见"的代码格式化工具（Opinionated Code Formatter）。它会自动分析你的代码，并按照统一的规则重新格
式化，让所有人的代码风格保持一致。

### 1.1 核心特点

| 特点         | 说明                                            |
| ------------ | ----------------------------------------------- |
| 零配置       | 开箱即用，默认配置已足够好                      |
| 支持多语言   | JavaScript、TypeScript、Vue、CSS、HTML、JSON 等 |
| 与编辑器集成 | VSCode、WebStorm 等主流编辑器都支持             |
| 团队协作     | 消除关于代码风格的争论                          |

### 1.2 代码格式化的作用

```
┌─────────────────────────────────────────────────────────────┐
│  代码格式化解决的问题                                        │
├─────────────────────────────────────────────────────────────┤
│  ✓ 统一代码风格 - 所有开发者代码看起来一致                    │
│  ✓ 自动修复格式问题 - 无需手动调整缩进、引号等                │
│  ✓ 减少代码审查负担 - PR 中不会出现格式相关的讨论             │
│  ✓ 提高代码可读性 - 一致的格式让代码更易理解                 │
│  ✓ 节省时间 - 保存时自动格式化，不需要手动调整                │
└─────────────────────────────────────────────────────────────┘
```

---

## 二、项目中的 Prettier 配置

### 2.1 命令脚本

在 [package.json](../package.json) 中定义的脚本：

```bash
npm run prettier
```

这个命令等同于：

```bash
prettier --write .
```

**参数说明**：

- `--write`：直接修改文件（而不是只输出到控制台）
- `.`：对当前目录下的所有文件进行格式化

### 2.2 配置文件

配置文件位置：[.prettierrc.cjs](../.prettierrc.cjs)

```javascript
/**
 * 代码格式化配置
 */
module.exports = {
  // 一行最多多少个字符
  printWidth: 120,

  // 指定每个缩进级别的空格数
  tabWidth: 2,

  // 使用制表符而不是空格缩进行
  useTabs: false,

  // 在语句末尾是否需要分号
  semi: true,

  // 是否使用单引号
  singleQuote: true,

  // 更改引用对象属性的时间 可选值"<as-needed|consistent|preserve>"
  quoteProps: 'as-needed',

  // 在JSX中使用单引号而不是双引号
  jsxSingleQuote: false,

  // 多行时尽可能打印尾随逗号。可选值"<none|es5|all>"，默认none
  trailingComma: 'none',

  // 在对象文字中的括号之间打印空格
  bracketSpacing: true,

  // 在单独的箭头函数参数周围包括括号 always：(x) => x \ avoid：x => x
  arrowParens: 'always',

  // 使用默认的折行标准 always\never\preserve
  proseWrap: 'always',

  // 指定HTML文件的全局空格敏感度 css\strict\ignore
  htmlWhitespaceSensitivity: 'css',

  // Vue文件脚本和样式标签缩进
  vueIndentScriptAndStyle: true,

  // 换行符使用 lf 结尾 可选值"<auto|lf|crlf|cr>"
  // auto意为保持现有的行尾
  endOfLine: 'auto'
};
```

### 2.3 配置项详解

| 配置项                      | 值     | 说明               | 效果示例                         |
| --------------------------- | ------ | ------------------ | -------------------------------- |
| **printWidth**              | 120    | 单行最大字符数     | 超过 120 字符会自动换行          |
| **tabWidth**                | 2      | 缩进空格数         | 使用 2 个空格缩进                |
| **useTabs**                 | false  | 使用空格而非 Tab   | 不使用制表符                     |
| **semi**                    | true   | 语句末尾加分号     | `const a = 1;`                   |
| **singleQuote**             | true   | 使用单引号         | `const str = 'hello'`            |
| **jsxSingleQuote**          | false  | JSX 中使用双引号   | `<div className="container">`    |
| **trailingComma**           | none   | 不使用尾随逗号     | `[1, 2, 3]` 而非 `[1, 2, 3,]`    |
| **bracketSpacing**          | true   | 对象括号内加空格   | `{ a: 1 }` 而非 `{a: 1}`         |
| **arrowParens**             | always | 箭头函数参数加括号 | `(x) => x` 而非 `x => x`         |
| **vueIndentScriptAndStyle** | true   | Vue 标签内容缩进   | `<script>` 和 `<style>` 内容缩进 |
| **endOfLine**               | auto   | 自动保持原有换行符 | Windows 保持 CRLF，Unix 保持 LF  |

### 2.4 忽略文件配置

忽略文件位置：[.prettierignore](../.prettierignore)

```
/dist/*
.local
.output.js
/node_modules/**

**/*.svg
**/*.sh

/public/*
```

**说明**：这些文件/目录不会被格式化

| 忽略项             | 原因                               |
| ------------------ | ---------------------------------- |
| `/dist/*`          | 打包输出目录，不需要格式化         |
| `/node_modules/**` | 第三方依赖，不需要修改             |
| `**/*.svg`         | SVG 文件是二进制格式，不应该格式化 |
| `**/*.sh`          | Shell 脚本，有自己格式化标准       |
| `/public/*`        | 静态资源目录                       |

---

## 三、使用方式

### 3.1 命令行使用

```bash
# 格式化所有文件
npm run prettier

# 或者直接使用 prettier 命令
npx prettier --write .

# 只格式化特定文件
npx prettier --write src/**/*.vue

# 检查哪些文件需要格式化（不实际修改）
npx prettier --check .

# 只格式化单个文件
npx prettier --write src/views/home/index.vue
```

### 3.2 编辑器集成（推荐）

**VSCode 配置步骤**：

1. 安装 Prettier 扩展：`Prettier - Code formatter`

2. 在设置中启用"保存时自动格式化"：

   ```json
   {
     "editor.formatOnSave": true,
     "editor.defaultFormatter": "esbenp.prettier-vscode"
   }
   ```

3. 或者配置工作区设置（在项目根目录创建 `.vscode/settings.json`）：
   ```json
   {
     "editor.formatOnSave": true,
     "editor.defaultFormatter": "esbenp.prettier-vscode",
     "[vue]": {
       "editor.defaultFormatter": "esbenp.prettier-vscode"
     },
     "[typescript]": {
       "editor.defaultFormatter": "esbenp.prettier-vscode"
     }
   }
   ```

### 3.3 Git Hooks（可选）

项目使用了 **Husky** 进行 Git hooks 管理，可以在提交前自动格式化代码。

相关依赖（在 package.json 中）：

- `husky: 7.0.4` - Git hooks 管理
- `prepare: husky install` - 安装 husky hooks

---

## 四、与 ESLint 的配合

### 4.1 为什么要配合 ESLint？

| 工具         | 主要作用                                     |
| ------------ | -------------------------------------------- |
| **Prettier** | 格式化代码（风格、空格、引号等）             |
| **ESLint**   | 检查代码质量（语法错误、最佳实践、潜在 bug） |

两者配合使用：**Prettier 负责格式，ESLint 负责质量**

### 4.2 项目中的 ESLint + Prettier 配置

在 package.json 中的相关依赖：

```json
{
  "devDependencies": {
    "eslint": "8.36.0",
    "eslint-config-prettier": "8.8.0", // 禁用与 Prettier 冲突的 ESLint 规则
    "eslint-plugin-prettier": "4.2.1", // 将 Prettier 作为 ESLint 规则运行
    "@typescript-eslint/eslint-plugin": "5.56.0",
    "@typescript-eslint/parser": "5.56.0",
    "eslint-plugin-vue": "9.9.0"
  }
}
```

**工作流程**：

```
代码保存
   ↓
Prettier 格式化（调整格式）
   ↓
ESLint 检查（发现质量问题）
   ↓
显示错误和警告
```

### 4.3 使用建议

```bash
# 先运行 Prettier 格式化
npm run prettier

# 再运行 ESLint 检查和修复
npm run lint
```

---

## 五、格式化示例对比

### 5.1 格式化前

```typescript
const user = { name: '张三', age: 25, roles: ['admin', 'user'] };
function getData() {
  return fetch('/api/user').then((res) => res.json());
}
const arr = [1, 2, 3];
const obj = { a: 1, b: 2 };
```

### 5.2 格式化后

```typescript
const user = { name: '张三', age: 25, roles: ['admin', 'user'] };
function getData() {
  return fetch('/api/user').then((res) => res.json());
}
const arr = [1, 2, 3];
const obj = { a: 1, b: 2 };
```

**主要变化**：

- ✓ 对象属性周围加了空格
- ✓ 双引号变为单引号
- ✓ 箭头函数参数加了括号
- ✓ 去掉了尾随逗号
- ✓ 代码进行了适当的缩进

---

## 六、常见问题

### Q1: 格式化后代码还是不符合规范？

**原因**：可能是编辑器的格式化工具不是 Prettier

**解决**：检查 VSCode 设置，确保 `editor.defaultFormatter` 设置为 `esbenp.prettier-vscode`

### Q2: 某些文件不想被格式化怎么办？

**方案一**：添加到 [.prettierignore](../.prettierignore) 文件 **方案二**：在文件顶部添加注释：

```javascript
// @prettier-ignore
const badlyFormatted = () => {};
```

### Q3: Prettier 和 ESLint 冲突怎么办？

**原因**：ESLint 可能配置了与 Prettier 冲突的格式规则

**解决**：确保 ESLint 配置中使用了 `eslint-config-prettier`，它会在 ESLint 中禁用所有与 Prettier 冲突的规则

### Q4: 为什么团队代码风格还是不一致？

**可能原因**：

1. 不是所有人都安装了 Prettier 插件
2. 保存时没有自动格式化
3. 没有在 pre-commit hook 中运行格式化

**建议**：

- 强制团队使用 VSCode + Prettier 插件
- 配置 `.vscode/settings.json` 到项目中
- 使用 Git hooks 在提交前自动格式化

---

## 七、参考资源

- [Prettier 官方文档](https://prettier.io/docs/en/)
- [Prettier 在线体验](https://prettier.io/playground/)
- [VSCode Prettier 扩展](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

---

## 更新日志

- 2026-02-25: 创建 Prettier 代码格式化指南文档
