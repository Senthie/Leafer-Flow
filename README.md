# Leafer-Flow

一个基于LeaferJS构建的高性能工作流可视化工具库。

## 特性

- 🚀 基于LeaferJS的高性能渲染
- 📦 TypeScript支持，完整的类型定义
- 🎯 模块化架构，易于扩展
- 🔧 完整的节点和连接管理
- 🎨 可自定义的节点和连接样式
- 📱 支持拖拽、缩放、平移等交互
- 💾 数据序列化和反序列化
- 🧪 基于属性的测试保证代码质量

## 前置要求

本项目使用 [pnpm](https://pnpm.io/) 作为包管理器。请确保已安装 pnpm：

```bash
npm install -g pnpm
```

## 安装

```bash
pnpm install leafer-flow
```

## 快速开始

```typescript
import { FlowEditor } from 'leafer-flow';

// 创建编辑器实例
const container = document.getElementById('flow-container');
const editor = new FlowEditor(container, {
  width: 800,
  height: 600,
  background: '#f5f5f5',
  grid: true
});

// 添加节点
const node = editor.addNode({
  id: 'node-1',
  type: 'default',
  position: { x: 100, y: 100 },
  data: { label: '开始节点' },
  ports: [
    { id: 'output', type: 'output', position: 'right' }
  ]
});

// 添加连接
const edge = editor.addEdge({
  id: 'edge-1',
  source: 'node-1',
  sourcePort: 'output',
  target: 'node-2',
  targetPort: 'input'
});
```

## 开发

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 运行测试
pnpm test

# 构建
pnpm build

# 代码检查
pnpm lint

# 测试覆盖率
pnpm test:coverage
```

## 架构

Leafer-Flow采用模块化架构设计：

- **FlowEditor**: 主编辑器类，协调所有子系统
- **NodeManager**: 节点管理器
- **EdgeManager**: 连接管理器
- **InteractionSystem**: 交互系统
- **EventSystem**: 事件系统
- **ViewportManager**: 视图管理器
- **SerializationManager**: 序列化管理器

## 许可证

MIT License
