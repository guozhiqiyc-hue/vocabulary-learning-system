# 英语语块学习系统 v6.0

English Phrase Learning System with Spaced Repetition (SM-2 Algorithm)

## 项目简介

这是一个基于 SM-2 间隔重复算法的英语语块学习系统，帮助用户高效记忆和掌握英语短语和句型。

### 核心特性

- ✅ **智能复习算法**: 基于 SuperMemo 2 (SM-2) 间隔重复算法
- ✅ **多用户支持**: 支持多个用户独立学习
- ✅ **数据存储**: 使用 IndexedDB 存储大量学习数据
- ✅ **离线使用**: 纯前端实现，无需服务器
- ✅ **数据导入导出**: 支持 JSON/CSV 格式批量处理
- ✅ **版本控制**: 支持学习数据快照和回滚
- ✅ **响应式设计**: 支持桌面和移动设备

## 快速开始

### 1. 打开应用

直接在浏览器中打开 `index.html` 文件即可使用。

### 2. 首次使用

- 系统会自动加载默认的语块库
- 创建用户账号开始学习
- 在"今日计划"中查看每天的学习任务

### 3. 开始学习

- 点击"开始今日学习"按钮
- 系统会根据您的学习进度智能安排内容
- 学习完成后进行评分，系统会自动安排下次复习时间

## 系统架构

### 技术栈

- **前端**: 纯原生 JavaScript (ES6+)
- **存储**: IndexedDB + localStorage (混合策略)
- **算法**: SuperMemo 2 间隔重复算法
- **样式**: CSS3 (Grid + Flexbox)

### 目录结构

```
vocabulary-learning-system-v6/
├── index.html              # 主页面
├── css/
│   ├── main.css           # 主样式
│   ├── learning.css       # 学习模块样式
│   ├── dashboard.css      # 仪表盘样式
│   └── editor.css         # 编辑器样式
├── js/
│   ├── app.js             # 应用入口
│   ├── core/              # 核心模块
│   │   ├── Storage.js     # 存储抽象层
│   │   ├── EventHub.js    # 事件总线
│   │   └── Utils.js       # 工具函数
│   ├── data/              # 数据层
│   │   └── PhraseStore.js # 语块数据管理
│   ├── algorithms/        # 算法层
│   │   └── SuperMemo2.js  # SM-2算法实现
│   └── features/          # 功能模块
│       └── DataMigration.js # 数据迁移
├── data/
│   └── default-phrases.json # 默认语块数据
└── README.md              # 项目说明
```

## 核心功能

### 1. 每日学习计划

系统根据以下因素智能安排每日学习内容：

- 到期需要复习的语块
- 每日新学习数量限制
- 预计学习时间
- 学习优先级排序

### 2. 智能复习系统

基于 SM-2 算法的复习安排：

- **评分 5** (完美): 下次复习时间大幅延长
- **评分 4** (良好): 下次复习时间适当延长
- **评分 3** (勉强): 保持当前复习间隔
- **评分 2** (困难): 重新学习，缩短间隔
- **评分 1** (忘记): 完全重新学习

### 3. 语块编辑器

- 添加新语块
- 编辑现有语块
- 批量导入/导出
- 搜索和筛选

### 4. 数据管理

- 创建数据备份
- 恢复历史版本
- 导出学习数据
- 多用户数据隔离

## 数据格式

### 语块数据格式

```json
{
  "id": 1,
  "phrase": "be good at doing",
  "meaning": "擅长做某事",
  "example": "He is **good at** **playing** basketball.",
  "keywords": ["good", "play"],
  "level": "核心词汇",
  "frequency": "高频",
  "topic": "能力描述"
}
```

### 学习进度数据格式

```json
{
  "phraseId": 1,
  "userId": "default",
  "status": "learning",
  "repetitions": 3,
  "easeFactor": 2.5,
  "interval": 6,
  "lastReview": 1704067200000,
  "nextReview": 1704672000000,
  "qualityHistory": [
    { "quality": 4, "date": 1704067200000 },
    { "quality": 5, "date": 1704153600000 }
  ]
}
```

## 浏览器兼容性

- Chrome/Edge: ✅ 完全支持
- Firefox: ✅ 完全支持
- Safari: ✅ 完全支持
- Opera: ✅ 完全支持

## 从 v5.0 迁移

系统会自动检测 v5.0 数据并提示迁移：

1. 打开 v6.0 系统时自动检测
2. 确认后开始迁移
3. 迁移完成后可继续使用

## 开发说明

### 添加新功能

1. 在 `js/features/` 创建新模块
2. 在 `js/app.js` 中导入和初始化
3. 在对应 CSS 文件中添加样式
4. 在 `index.html` 中添加 UI 元素

### 修改算法

SM-2 算法位于 `js/algorithms/SuperMemo2.js`，可根据需要调整参数：

```javascript
static DEFAULTS = {
    easeFactor: 2.5,        // 默认易度因子
    interval: 0,            // 默认间隔(天)
    repetitions: 0,         // 默认复习次数
    minEaseFactor: 1.3      // 最小易度因子
};
```

## 常见问题

### Q: 数据存储在哪里？

A: 数据存储在浏览器的 IndexedDB 中，无需联网，完全离线使用。

### Q: 如何备份学习数据？

A: 点击顶部工具栏的"备份"按钮，会下载 JSON 格式的备份文件。

### Q: 可以在其他设备使用吗？

A: 目前每个设备的数据是独立的，可以通过导出/导入功能在设备间转移数据。

### Q: 如何重置学习进度？

A: 在设置中可以选择重置当前用户的学习数据。

## 版本历史

### v6.0 (当前版本)

- ✅ 模块化架构重构
- ✅ IndexedDB 数据存储
- ✅ 多用户支持
- ✅ 数据导入/导出
- ✅ 版本控制功能
- ✅ 数据迁移工具

### v5.0

- 单文件实现
- localStorage 存储
- 基础学习功能

## 贡献指南

欢迎提交问题和改进建议！

## 许可证

MIT License

---

**Happy Learning! 📚**
