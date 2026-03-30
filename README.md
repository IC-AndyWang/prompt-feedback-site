# Prompt 结构说明书 + 共创工作台

一个面向业务用户的中文前端原型，用来把结构化 Prompt 规则文件转换成更易读、可评论、可共创、可留痕的网页工作台。

## 项目定位

这个项目不是 Prompt 代码编辑器，而是：

- `Prompt 结构说明书`
- `业务友好阅读器`
- `轻量共创工作台`

它重点解决以下问题：

- 让医学部和业务同事看懂 Prompt 的结构与作用
- 把 XML / Markdown / 变量占位符拆解成清晰模块
- 同时查看“可读版”和“原始版”
- 围绕 Prompt 做评论、建议、副本编辑和修改留痕

## 已实现能力

- 读取并解析 `.docx` 文件
- 默认加载示例文件 `public/sample/msl_prompt.docx`
- 支持用户上传新的 `.docx` 文件替换内容
- 自动按 XML / 类 XML 标签拆分模块
- 为模块映射中文名和“模块作用”说明
- 提供 `可读版 / 原始版 / 对照版` 三种视图
- 左侧模块导航，支持高亮、跳转、评论数展示
- 中间模块卡片化阅读，Markdown 自动排版
- 变量占位符与原始标签保留展示
- 右侧辅助区支持：
  - 模块说明
  - 原始文本
  - 评论
  - 历史记录
  - diff 对照
- mock 用户切换：`userA`、`userB`、`admin`
- 评论功能：
  - 全文评论
  - 模块评论
  - 片段评论（可先选中文字再评论）
  - open / resolved 状态切换
- 个人副本功能：
  - 创建我的副本
  - 打开已有副本
  - 在副本中编辑模块内容
- 修改留痕：
  - 记录谁改了哪个模块
  - 记录修改时间
  - 保留修改前后文本
  - 支持 diff 查看
- 本地数据存储：
  - 使用 `localStorage` 保存评论、副本、改动记录

## 技术栈

- React
- TypeScript
- Tailwind CSS
- Vite
- `mammoth` 用于浏览器端读取 `.docx`
- `react-markdown` + `remark-gfm` 用于 Markdown 可读化渲染
- `diff` 用于文本差异展示

## 启动方式

```bash
npm install
npm run dev
```

默认开发地址：

- [http://localhost:5173](http://localhost:5173)

生产构建：

```bash
npm run build
```

## 默认文档来源

项目会默认加载这个示例文件：

- `/Users/andywang/Downloads/AI MSL/msl_prompt.docx`

在项目中已复制为：

- `public/sample/msl_prompt.docx`

如果后续这个原始路径失效，不影响原型运行；也可以通过页面顶部“上传新的 docx”直接替换输入文件。

## 页面结构

### 顶部 Header

- 页面标题与副标题
- 视图切换：可读版 / 原始版 / 对照版
- 全文搜索
- mock 用户切换
- 创建我的副本
- 上传新的 docx
- 当前版本 / 当前副本状态

### 左侧 Sidebar

- 模块目录导航
- 中文模块名 + 原标签名
- 当前模块高亮
- 每个模块评论数

### 中间主内容区

- 模块卡片化展示
- 中文标题、原标签、模块作用说明
- Markdown 可读化排版
- 原始版对照展示
- 副本模式下可直接编辑模块正文

### 右侧辅助区

- 模块说明
- 原始文本
- 评论区
- 历史记录
- diff 对照

## 关键组件

- `src/App.tsx`
  - 应用入口，负责文档加载、用户切换、评论、副本、历史、搜索和主布局
- `src/components/Header.tsx`
  - 顶部控制区
- `src/components/Sidebar.tsx`
  - 模块导航
- `src/components/ModuleCard.tsx`
  - 模块阅读卡片，可读版 / 原始版 / 对照版核心展示
- `src/components/CommentsPanel.tsx`
  - 评论面板，支持全文、模块、片段评论
- `src/components/HistoryPanel.tsx`
  - 副本列表与最近修改记录
- `src/components/DiffPanel.tsx`
  - 模块修改前后 diff
- `src/components/OverviewPanel.tsx`
  - 当前模块业务解释
- `src/components/RawPanel.tsx`
  - 原始内容查看器

## 数据结构

定义位于：

- [`src/types.ts`](/Users/andywang/Documents/Prompt Training/src/types.ts)

核心实体包括：

- `PromptDocument`
- `PromptModule`
- `CommentItem`
- `PromptCopy`
- `ChangeRecord`
- `User`

本地持久化位于：

- [`src/utils/storage.ts`](/Users/andywang/Documents/Prompt Training/src/utils/storage.ts)

## 解析逻辑说明

解析入口位于：

- [`src/utils/docxParser.ts`](/Users/andywang/Documents/Prompt Training/src/utils/docxParser.ts)

当前解析策略：

1. 使用 `mammoth.extractRawText()` 从 `.docx` 中提取纯文本
2. 使用正则识别 `<tag> ... </tag>` 形式的模块边界
3. 按标签名映射中文模块标题和模块作用说明
4. 为每个模块保留：
   - `rawContent`
   - `readableContent`
5. 如果未识别到标准模块，则回退为“完整 Prompt 内容”单模块展示

## 中文模块映射

映射位于：

- [`src/utils/moduleMetadata.ts`](/Users/andywang/Documents/Prompt Training/src/utils/moduleMetadata.ts)

已覆盖以下常见标签：

- `profile`
- `specification`
- `domain_vocabulary`
- `indication`
- `reference_level`
- `common_business_rules`
- `specific_rules`
- `response_architecture`
- `example`
- `related_documents`
- `query`
- `source_scope`

未识别标签会自动显示为：

- `其他模块（<标签名>）`

## 本地协作数据

当前原型使用 `localStorage` 保存：

- 评论
- 副本
- 改动历史

这意味着：

- 刷新页面后数据仍会保留
- 不同浏览器或不同设备之间不会自动同步
- 后续很容易替换为真实后端接口

## 当前实现假设

- `.docx` 中的 Prompt 主体以文本为主，而不是复杂表格结构
- 主要模块采用 `<tag>...</tag>` 或类 XML 结构表达
- “可读版”优化只做展示增强，不改写原始语义
- 当前副本合并逻辑暂未实现自动 merge，只保留查看与留痕
- 回复线程的数据结构已预留，但 UI 目前以轻量评论为主

## 后续可增强方向

- 接入真实后端与登录体系
- 支持评论回复线程与 @ 提及
- 支持副本提交审核 / 人工合并主版本
- 支持更细粒度段落锚点与片段定位
- 支持模块级权限控制
- 支持导出评论与修改报告
- 对大文档做分块懒加载和更细的代码拆分

## 构建验证

已完成本地构建验证：

```bash
npm run build
```

说明：

- 当前构建通过
- 由于 `mammoth` 等依赖较大，Vite 会提示产物 chunk 偏大，这是原型阶段可接受的
