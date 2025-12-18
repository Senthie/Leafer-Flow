# 设计文档

## 概述

Leafer-Flow是一个基于LeaferJS构建的高性能工作流可视化工具库。该库提供了完整的节点编辑器功能，包括节点创建、拖拽、连接等核心特性。设计采用模块化架构，确保高性能渲染和良好的扩展性。

## 架构

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Leafer-Flow API Layer                    │
├─────────────────────────────────────────────────────────────┤
│  FlowEditor  │  NodeManager  │  EdgeManager  │  EventSystem │
├─────────────────────────────────────────────────────────────┤
│           Core Components & Interaction Layer               │
├─────────────────────────────────────────────────────────────┤
│                      LeaferJS Engine                        │
└─────────────────────────────────────────────────────────────┘
```

### 核心模块

1. **FlowEditor**: 主要的编辑器类，协调所有子系统
2. **NodeManager**: 负责节点的创建、管理和渲染
3. **EdgeManager**: 负责连接线的创建、管理和渲染
4. **InteractionSystem**: 处理用户交互（拖拽、选择、连接）
5. **EventSystem**: 事件管理和分发系统
6. **ViewportManager**: 视图控制（缩放、平移）
7. **SerializationManager**: 数据序列化和反序列化

## 组件和接口

### FlowEditor 主类

```typescript
class FlowEditor {
  // 初始化编辑器
  constructor(container: HTMLElement, options?: FlowOptions)
  
  // 节点操作
  addNode(nodeData: NodeData): FlowNode
  removeNode(nodeId: string): boolean
  getNode(nodeId: string): FlowNode | null
  getAllNodes(): FlowNode[]
  
  // 连接操作
  addEdge(edgeData: EdgeData): FlowEdge
  removeEdge(edgeId: string): boolean
  getEdge(edgeId: string): FlowEdge | null
  getAllEdges(): FlowEdge[]
  
  // 视图控制
  zoomTo(scale: number): void
  panTo(x: number, y: number): void
  fitView(): void
  
  // 事件系统
  on(event: string, callback: Function): void
  off(event: string, callback: Function): void
  
  // 序列化
  toJSON(): FlowData
  fromJSON(data: FlowData): void
}
```

### 节点系统

```typescript
interface NodeData {
  id: string
  type: string
  position: { x: number, y: number }
  data: any
  ports?: PortData[]
}

interface PortData {
  id: string
  type: 'input' | 'output'
  dataType?: string
  multiple?: boolean
  position: 'top' | 'right' | 'bottom' | 'left'
}

class FlowNode extends LeaferJS.Group {
  id: string
  type: string
  data: any
  ports: Map<string, FlowPort>
  
  addPort(portData: PortData): FlowPort
  removePort(portId: string): boolean
  getPort(portId: string): FlowPort | null
}
```

### 连接系统

```typescript
interface EdgeData {
  id: string
  source: string
  sourcePort: string
  target: string
  targetPort: string
  data?: any
}

class FlowEdge extends LeaferJS.Path {
  id: string
  source: FlowNode
  sourcePort: FlowPort
  target: FlowNode
  targetPort: FlowPort
  
  updatePath(): void
  setStyle(style: EdgeStyle): void
}
```

## 数据模型

### 核心数据结构

```typescript
interface FlowData {
  nodes: NodeData[]
  edges: EdgeData[]
  viewport: {
    x: number
    y: number
    zoom: number
  }
  metadata?: {
    version: string
    created: string
    modified: string
  }
}

interface FlowOptions {
  container: HTMLElement
  width?: number
  height?: number
  background?: string
  grid?: boolean
  minimap?: boolean
  controls?: boolean
  nodeTypes?: Record<string, NodeTypeDefinition>
  edgeTypes?: Record<string, EdgeTypeDefinition>
}
```

### 节点类型定义

```typescript
interface NodeTypeDefinition {
  render: (node: FlowNode) => LeaferJS.UI
  ports?: PortData[]
  defaultData?: any
  validate?: (data: any) => boolean
}
```

## 正确性属性

*属性是一个特征或行为，应该在系统的所有有效执行中保持为真——本质上是关于系统应该做什么的正式声明。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。*

### 属性 1: 节点创建完整性

*对于任何*有效的节点数据，创建节点应该在指定位置生成具有唯一ID的节点，包含正确的端点配置，并触发创建事件
**验证: 需求 1.1, 1.2, 1.3, 1.4, 1.5**

### 属性 2: 拖拽行为一致性

*对于任何*节点，拖拽操作应该实时更新节点位置，同步更新相关连接线，并在释放时触发位置变更事件
**验证: 需求 2.1, 2.2, 2.3, 2.4**

### 属性 3: 批量拖拽保持关系

*对于任何*选中的多个节点，批量拖拽应该保持节点之间的相对位置关系不变
**验证: 需求 2.5**

### 属性 4: 连接创建流程

*对于任何*有效的源端点和目标端点，连接创建流程应该包括临时连接线跟随、视觉反馈、永久连接创建和事件触发
**验证: 需求 3.1, 3.2, 3.3, 3.4**

### 属性 5: 无效连接阻止

*对于任何*无效的连接尝试，系统应该阻止连接创建并提供错误提示
**验证: 需求 3.5**

### 属性 6: 端点配置一致性

*对于任何*端点配置，系统应该根据配置正确创建连接点并设置相应的连接规则
**验证: 需求 4.1, 4.2**

### 属性 7: 多连接端点行为

*对于任何*支持多连接的端点，应该允许连接多条线而不移除现有连接
**验证: 需求 4.3**

### 属性 8: 单连接端点替换

*对于任何*仅支持单连接的端点，新连接创建时应该移除旧连接
**验证: 需求 4.4**

### 属性 9: 数据类型兼容性验证

*对于任何*具有数据类型限制的端点，连接时应该验证类型兼容性
**验证: 需求 4.5**

### 属性 10: 选择状态一致性

*对于任何*可选择的元素（节点或连接线），点击应该正确设置选中状态并提供视觉反馈
**验证: 需求 5.1, 5.2**

### 属性 11: 删除操作完整性

*对于任何*选中的元素，删除操作应该移除元素、清理相关连接、触发事件并更新画布状态
**验证: 需求 5.3, 5.4, 5.5**

### 属性 12: 事件系统完整性

*对于任何*状态变化或用户交互，事件系统应该触发相应事件、提供完整数据并正确调用注册的回调函数
**验证: 需求 6.1, 6.2, 6.3, 6.4, 6.5**

### 属性 13: 序列化往返一致性

*对于任何*有效的工作流状态，序列化然后反序列化应该产生等价的状态
**验证: 需求 7.1, 7.2, 7.3**

### 属性 14: 数据验证错误处理

*对于任何*无效的序列化数据，反序列化应该验证格式并抛出明确的错误信息
**验证: 需求 7.4, 7.5**

### 属性 15: 缩放中心保持

*对于任何*鼠标位置，滚轮缩放应该以该位置为中心进行缩放
**验证: 需求 8.1**

### 属性 16: 画布平移响应

*对于任何*空白区域的拖拽，应该正确平移整个画布视图
**验证: 需求 8.2**

### 属性 17: 缩放不变性

*对于任何*缩放操作，所有元素的相对位置关系应该保持不变
**验证: 需求 8.3**

### 属性 18: 缩放边界限制

*对于任何*超出限制范围的缩放尝试，应该被限制在最小和最大缩放级别之间
**验证: 需求 8.5**

### 属性 19: pnpm包管理器配置

项目应该正确配置pnpm作为包管理器，包含相应的配置文件、脚本命令和文档说明
**验证: 需求 9.1, 9.2, 9.3, 9.4, 9.5**

## 错误处理

### 错误类型定义

```typescript
enum FlowErrorType {
  INVALID_NODE_DATA = 'INVALID_NODE_DATA',
  INVALID_EDGE_DATA = 'INVALID_EDGE_DATA',
  CONNECTION_VALIDATION_FAILED = 'CONNECTION_VALIDATION_FAILED',
  SERIALIZATION_ERROR = 'SERIALIZATION_ERROR',
  DESERIALIZATION_ERROR = 'DESERIALIZATION_ERROR',
  RENDER_ERROR = 'RENDER_ERROR'
}

class FlowError extends Error {
  type: FlowErrorType
  details: any
  
  constructor(type: FlowErrorType, message: string, details?: any) {
    super(message)
    this.type = type
    this.details = details
  }
}
```

### 错误处理策略

1. **输入验证错误**: 在数据输入时进行验证，抛出具体的错误信息
2. **连接验证错误**: 在连接创建时验证兼容性，提供用户友好的错误提示
3. **序列化错误**: 在数据转换过程中捕获错误，提供详细的错误位置信息
4. **渲染错误**: 在渲染过程中捕获错误，确保不影响其他元素的正常显示
5. **事件处理错误**: 在事件回调中捕获错误，防止影响系统稳定性

## 测试策略

### 双重测试方法

本项目采用单元测试和基于属性的测试相结合的方法：

- **单元测试**：验证特定示例、边界情况和错误条件
- **基于属性的测试**：验证应该在所有输入中保持的通用属性
- 两者结合提供全面覆盖：单元测试捕获具体错误，属性测试验证通用正确性

### 单元测试要求

单元测试通常涵盖：

- 演示正确行为的特定示例
- 组件之间的集成点
- 边界条件和错误处理
- 用户交互的具体场景

### 基于属性的测试要求

- 使用 **fast-check** 作为JavaScript/TypeScript的属性测试库
- 每个属性测试配置为运行最少100次迭代，因为属性测试过程是随机的
- 每个基于属性的测试必须用注释明确引用设计文档中的正确性属性
- 使用以下确切格式标记每个基于属性的测试：'**Feature: leafer-flow, Property {number}: {property_text}**'
- 每个正确性属性必须由单个基于属性的测试实现

### 包管理和构建要求

- 使用 **pnpm** 作为包管理器，提供更快的安装速度和更好的磁盘空间利用率
- 项目应包含 `pnpm-workspace.yaml` 配置文件（如果是monorepo结构）
- 所有脚本命令应通过 `pnpm` 执行
- 依赖安装使用 `pnpm install` 命令
- 项目文档应明确说明pnpm的使用要求

### 测试覆盖范围

1. **节点管理测试**
   - 节点创建、删除、更新
   - 端口管理和连接规则
   - 节点类型验证

2. **连接管理测试**
   - 连接创建和删除
   - 连接验证和类型检查
   - 连接路径计算

3. **交互系统测试**
   - 拖拽行为测试
   - 选择和多选测试
   - 视图控制测试

4. **事件系统测试**
   - 事件触发和传播
   - 事件数据完整性
   - 回调函数执行

5. **序列化测试**
   - 数据序列化和反序列化
   - 格式验证和错误处理
   - 往返一致性测试

### 性能测试

- 大量节点渲染性能测试
- 复杂连接网络性能测试
- 内存使用和泄漏检测
- 交互响应时间测试

### 集成测试

- 与LeaferJS引擎的集成测试
- 浏览器兼容性测试
- 移动设备触摸交互测试
- 不同屏幕尺寸适配测试
