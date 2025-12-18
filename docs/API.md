# Leafer-Flow API 文档

## 概述

Leafer-Flow 是一个基于 LeaferJS 构建的高性能工作流可视化工具库。本文档详细介绍了所有可用的 API 接口。

## 包管理器要求

**重要**: 本项目使用 [pnpm](https://pnpm.io/) 作为包管理器。请确保在开发和使用过程中使用 pnpm：

```bash
# 安装 pnpm (如果尚未安装)
npm install -g pnpm

# 安装项目依赖
pnpm install

# 运行项目脚本
pnpm run build
pnpm run test
pnpm run dev
```

## 核心类

### FlowEditor

主要的编辑器类，提供完整的工作流编辑功能。

#### 构造函数

```typescript
constructor(container: HTMLElement, options?: FlowOptions)
```

**参数:**

- `container`: HTMLElement - 承载编辑器的 DOM 容器
- `options`: FlowOptions (可选) - 编辑器配置选项

**示例:**

```typescript
const container = document.getElementById('flow-container')
const editor = new FlowEditor(container, {
  width: 800,
  height: 600,
  background: '#f5f5f5',
  grid: true,
  controls: true
})
```

#### 节点操作方法

##### addNode(nodeData: NodeData): FlowNode

添加新节点到编辑器。

**参数:**

- `nodeData`: NodeData - 节点数据配置

**返回值:**

- `FlowNode` - 创建的节点实例

**示例:**

```typescript
const node = editor.addNode({
  id: 'node-1',
  type: 'default',
  position: { x: 100, y: 100 },
  data: { label: '处理节点' },
  ports: [
    { id: 'input', type: 'input', position: 'left' },
    { id: 'output', type: 'output', position: 'right' }
  ]
})
```

##### removeNode(nodeId: string): boolean

删除指定的节点。

**参数:**

- `nodeId`: string - 要删除的节点 ID

**返回值:**

- `boolean` - 删除是否成功

**示例:**

```typescript
const success = editor.removeNode('node-1')
```

##### getNode(nodeId: string): FlowNode | null

获取指定的节点实例。

**参数:**

- `nodeId`: string - 节点 ID

**返回值:**

- `FlowNode | null` - 节点实例或 null

##### getAllNodes(): FlowNode[]

获取所有节点实例。

**返回值:**

- `FlowNode[]` - 所有节点的数组

#### 连接操作方法

##### addEdge(edgeData: EdgeData): FlowEdge

添加新的连接线。

**参数:**

- `edgeData`: EdgeData - 连接线数据配置

**返回值:**

- `FlowEdge` - 创建的连接线实例

**示例:**

```typescript
const edge = editor.addEdge({
  id: 'edge-1',
  source: 'node-1',
  sourcePort: 'output',
  target: 'node-2',
  targetPort: 'input'
})
```

##### removeEdge(edgeId: string): boolean

删除指定的连接线。

**参数:**

- `edgeId`: string - 要删除的连接线 ID

**返回值:**

- `boolean` - 删除是否成功

##### getEdge(edgeId: string): FlowEdge | null

获取指定的连接线实例。

**参数:**

- `edgeId`: string - 连接线 ID

**返回值:**

- `FlowEdge | null` - 连接线实例或 null

##### getAllEdges(): FlowEdge[]

获取所有连接线实例。

**返回值:**

- `FlowEdge[]` - 所有连接线的数组

#### 视图控制方法

##### zoomTo(scale: number): void

设置画布缩放级别。

**参数:**

- `scale`: number - 缩放比例 (0.1 - 3.0)

**示例:**

```typescript
editor.zoomTo(1.5) // 放大到 150%
```

##### panTo(x: number, y: number): void

平移画布到指定位置。

**参数:**

- `x`: number - X 坐标
- `y`: number - Y 坐标

##### fitView(): void

自动调整视图以适应所有内容。

#### 事件系统方法

##### on(event: string, callback: Function): void

注册事件监听器。

**参数:**

- `event`: string - 事件名称
- `callback`: Function - 回调函数

**支持的事件:**

- `node:created` - 节点创建
- `node:deleted` - 节点删除
- `node:selected` - 节点选中
- `node:moved` - 节点移动
- `edge:created` - 连接线创建
- `edge:deleted` - 连接线删除
- `edge:selected` - 连接线选中
- `viewport:changed` - 视图变化

**示例:**

```typescript
editor.on('node:created', (event) => {
  console.log('节点已创建:', event.data.nodeId)
})
```

##### off(event: string, callback: Function): void

移除事件监听器。

**参数:**

- `event`: string - 事件名称
- `callback`: Function - 要移除的回调函数

#### 序列化方法

##### toJSON(): FlowData

将当前工作流导出为 JSON 数据。

**返回值:**

- `FlowData` - 包含所有节点、连接线和视图状态的数据

**示例:**

```typescript
const flowData = editor.toJSON()
localStorage.setItem('my-flow', JSON.stringify(flowData))
```

##### fromJSON(data: FlowData): void

从 JSON 数据加载工作流。

**参数:**

- `data`: FlowData - 要加载的工作流数据

**示例:**

```typescript
const savedData = JSON.parse(localStorage.getItem('my-flow'))
editor.fromJSON(savedData)
```

##### destroy(): void

销毁编辑器实例，清理所有资源。

**示例:**

```typescript
editor.destroy()
```

## 数据类型

### FlowOptions

编辑器配置选项。

```typescript
interface FlowOptions {
  width?: number              // 画布宽度
  height?: number             // 画布高度
  background?: string         // 背景颜色
  grid?: boolean             // 是否显示网格
  minimap?: boolean          // 是否显示小地图
  controls?: boolean         // 是否显示控制按钮
  nodeTypes?: Record<string, NodeTypeDefinition>  // 自定义节点类型
  edgeTypes?: Record<string, EdgeTypeDefinition>  // 自定义连接线类型
}
```

### NodeData

节点数据结构。

```typescript
interface NodeData {
  id: string                 // 唯一标识符
  type: string              // 节点类型
  position: { x: number, y: number }  // 位置坐标
  data: any                 // 自定义数据
  ports?: PortData[]        // 端口配置
}
```

### PortData

端口数据结构。

```typescript
interface PortData {
  id: string                           // 端口 ID
  type: 'input' | 'output'            // 端口类型
  dataType?: string                   // 数据类型
  multiple?: boolean                  // 是否支持多连接
  position: 'top' | 'right' | 'bottom' | 'left'  // 端口位置
}
```

### EdgeData

连接线数据结构。

```typescript
interface EdgeData {
  id: string        // 唯一标识符
  source: string    // 源节点 ID
  sourcePort: string // 源端口 ID
  target: string    // 目标节点 ID
  targetPort: string // 目标端口 ID
  data?: any        // 自定义数据
}
```

### FlowData

完整的工作流数据结构。

```typescript
interface FlowData {
  nodes: NodeData[]     // 所有节点数据
  edges: EdgeData[]     // 所有连接线数据
  viewport: {           // 视图状态
    x: number
    y: number
    zoom: number
  }
  metadata?: {          // 元数据
    version: string
    created: string
    modified: string
  }
}
```

## 高级功能

### 自定义节点类型

可以注册自定义的节点类型来扩展功能。

```typescript
interface NodeTypeDefinition {
  render: (node: FlowNode) => LeaferJS.UI  // 自定义渲染函数
  ports?: PortData[]                       // 默认端口配置
  defaultData?: any                        // 默认数据
  validate?: (data: any) => boolean        // 数据验证函数
}

// 注册自定义节点类型
editor.registerNodeType('custom-process', {
  render: (node) => {
    // 返回自定义的 LeaferJS UI 元素
  },
  ports: [
    { id: 'input', type: 'input', position: 'left' },
    { id: 'output', type: 'output', position: 'right' }
  ],
  defaultData: { label: '自定义处理节点' }
})
```

### 自定义连接线类型

可以注册自定义的连接线样式。

```typescript
interface EdgeTypeDefinition {
  render: (edge: FlowEdge) => LeaferJS.Path  // 自定义渲染函数
  pathType?: 'straight' | 'bezier' | 'orthogonal'  // 路径类型
  animated?: boolean                         // 是否动画
  style?: EdgeStyle                         // 样式配置
}

// 注册自定义连接线类型
editor.registerEdgeType('data-flow', {
  pathType: 'bezier',
  animated: true,
  style: {
    stroke: '#2196F3',
    strokeWidth: 3
  }
})
```

### 批量操作

对于大量节点的操作，建议使用批量操作来提高性能。

```typescript
// 批量添加节点
const nodes = [/* 大量节点数据 */]
await editor.batchOperation(
  nodes,
  (nodeData) => editor.addNode(nodeData),
  (completed, total) => {
    console.log(`进度: ${completed}/${total}`)
  }
)
```

### 性能优化

编辑器提供了多种性能优化选项：

```typescript
const editor = new FlowEditor(container, {
  // 启用性能优化
  enablePerformanceOptimization: true,
  
  // 设置可见元素的最大数量
  maxVisibleNodes: 500,
  maxVisibleEdges: 1000,
  
  // 启用细节层次渲染
  enableLevelOfDetail: true,
  lodThreshold: 0.3  // 缩放阈值
})

// 获取性能统计信息
const stats = editor.getPerformanceStats()
console.log('渲染统计:', stats)
```

## 错误处理

所有 API 方法都会抛出适当的错误，建议使用 try-catch 进行处理：

```typescript
try {
  const node = editor.addNode(nodeData)
} catch (error) {
  if (error instanceof FlowError) {
    console.error('Flow 错误:', error.type, error.message)
  } else {
    console.error('未知错误:', error)
  }
}
```

### 错误类型

```typescript
enum FlowErrorType {
  INVALID_NODE_DATA = 'INVALID_NODE_DATA',
  INVALID_EDGE_DATA = 'INVALID_EDGE_DATA',
  CONNECTION_VALIDATION_FAILED = 'CONNECTION_VALIDATION_FAILED',
  SERIALIZATION_ERROR = 'SERIALIZATION_ERROR',
  DESERIALIZATION_ERROR = 'DESERIALIZATION_ERROR',
  RENDER_ERROR = 'RENDER_ERROR'
}
```

## 最佳实践

### 1. 使用 pnpm 进行包管理

```bash
# 正确的方式
pnpm install leafer-flow
pnpm run build

# 避免使用 npm 或 yarn
# npm install leafer-flow  ❌
# yarn add leafer-flow     ❌
```

### 2. 节点 ID 管理

确保节点 ID 的唯一性：

```typescript
// 推荐使用 UUID 或时间戳
import { v4 as uuidv4 } from 'uuid'

const nodeId = uuidv4()
const node = editor.addNode({
  id: nodeId,
  // ... 其他配置
})
```

### 3. 事件监听器管理

及时清理事件监听器以避免内存泄漏：

```typescript
const handleNodeCreated = (event) => {
  console.log('节点创建:', event.data.nodeId)
}

// 注册监听器
editor.on('node:created', handleNodeCreated)

// 在组件销毁时移除监听器
editor.off('node:created', handleNodeCreated)
```

### 4. 数据验证

在添加节点和连接线之前进行数据验证：

```typescript
function validateNodeData(nodeData: NodeData): boolean {
  return !!(nodeData.id && nodeData.type && nodeData.position)
}

if (validateNodeData(nodeData)) {
  editor.addNode(nodeData)
} else {
  console.error('无效的节点数据')
}
```

### 5. 性能优化

对于大型工作流，启用性能优化功能：

```typescript
const editor = new FlowEditor(container, {
  enablePerformanceOptimization: true,
  maxVisibleNodes: 200,
  enableLevelOfDetail: true
})
```

## 示例项目

查看 `examples/` 目录中的完整示例：

- `basic-usage.ts` - 基础使用示例
- `common-scenarios.ts` - 常见场景示例
- `advanced-features-demo.ts` - 高级功能演示

## 支持和反馈

如果您在使用过程中遇到问题或有改进建议，请通过以下方式联系我们：

- GitHub Issues
- 邮件支持
- 社区论坛

记住：始终使用 pnpm 作为包管理器以获得最佳的开发体验！
