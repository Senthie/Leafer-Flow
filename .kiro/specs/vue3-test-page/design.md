# 设计文档

## 概述

本设计文档描述了为Leafer-Flow项目创建Vue3测试页面的技术方案。该页面将作为一个独立的Vue3单页面应用，集成Leafer-Flow库，提供完整的测试界面来验证工作流编辑器的各项功能。

设计目标：

- 创建直观易用的测试界面
- 提供完整的功能测试覆盖
- 实现良好的用户体验和响应式设计
- 支持实时状态监控和事件日志
- 确保与现有Leafer-Flow API的完美集成

## 架构

### 整体架构

```
Vue3测试页面
├── Vue3应用框架
│   ├── 组合式API (Composition API)
│   ├── TypeScript支持
│   └── 响应式状态管理
├── Leafer-Flow集成层
│   ├── FlowEditor实例管理
│   ├── 事件监听和处理
│   └── 数据序列化/反序列化
├── UI组件层
│   ├── 编辑器容器组件
│   ├── 控制面板组件
│   ├── 状态显示组件
│   └── 事件日志组件
└── 工具和配置
    ├── Vite构建工具
    ├── TypeScript配置
    └── CSS样式系统
```

### 技术栈选择

- **前端框架**: Vue 3 (Composition API)
- **构建工具**: Vite (快速开发和热重载)
- **类型系统**: TypeScript (与主项目保持一致)
- **样式方案**: CSS Modules + 原生CSS变量
- **包管理器**: pnpm (与主项目保持一致)

## 组件和接口

### 核心组件设计

#### 1. App.vue (主应用组件)

```typescript
interface AppState {
  editorInstance: FlowEditor | null
  isInitialized: boolean
  nodeCount: number
  edgeCount: number
  eventLog: EventLogEntry[]
  isLoading: boolean
}

interface EventLogEntry {
  id: string
  timestamp: Date
  type: string
  data: any
  message: string
}
```

#### 2. FlowEditorContainer.vue (编辑器容器组件)

```typescript
interface FlowEditorContainerProps {
  width?: number
  height?: number
  background?: string
  showGrid?: boolean
}

interface FlowEditorContainerEmits {
  'editor-ready': (editor: FlowEditor) => void
  'editor-error': (error: Error) => void
}
```

#### 3. ControlPanel.vue (控制面板组件)

```typescript
interface ControlPanelProps {
  editor: FlowEditor | null
  disabled?: boolean
}

interface ControlPanelEmits {
  'node-create': (type: string) => void
  'edge-create': () => void
  'clear-canvas': () => void
  'export-json': () => void
  'import-json': () => void
}
```

#### 4. StatusPanel.vue (状态面板组件)

```typescript
interface StatusPanelProps {
  nodeCount: number
  edgeCount: number
  viewport?: ViewportState
  isConnected: boolean
}

interface ViewportState {
  x: number
  y: number
  scale: number
}
```

#### 5. EventLog.vue (事件日志组件)

```typescript
interface EventLogProps {
  events: EventLogEntry[]
  maxEntries?: number
}

interface EventLogEmits {
  'clear-log': () => void
}
```

### 数据模型

#### 测试节点模板

```typescript
interface TestNodeTemplate {
  id: string
  type: string
  label: string
  description: string
  ports: PortTemplate[]
  defaultPosition: { x: number; y: number }
  style?: NodeStyle
}

interface PortTemplate {
  id: string
  type: 'input' | 'output'
  position: 'left' | 'right' | 'top' | 'bottom'
  dataType: string
  label?: string
}
```

#### 预定义测试数据

```typescript
interface TestScenario {
  id: string
  name: string
  description: string
  nodes: NodeData[]
  edges: EdgeData[]
  viewport?: ViewportState
}
```

## 数据模型

### 应用状态管理

使用Vue3的响应式系统管理应用状态：

```typescript
// 使用组合式API管理状态
const useFlowEditorState = () => {
  const editorInstance = ref<FlowEditor | null>(null)
  const isInitialized = ref(false)
  const nodeCount = ref(0)
  const edgeCount = ref(0)
  const eventLog = ref<EventLogEntry[]>([])
  const isLoading = ref(false)
  
  // 状态更新方法
  const updateCounts = () => {
    if (editorInstance.value) {
      nodeCount.value = editorInstance.value.getAllNodes().length
      edgeCount.value = editorInstance.value.getAllEdges().length
    }
  }
  
  const addEventLog = (entry: EventLogEntry) => {
    eventLog.value.unshift(entry)
    if (eventLog.value.length > 100) {
      eventLog.value = eventLog.value.slice(0, 100)
    }
  }
  
  return {
    editorInstance,
    isInitialized,
    nodeCount,
    edgeCount,
    eventLog,
    isLoading,
    updateCounts,
    addEventLog
  }
}
```

### 测试数据配置

```typescript
// 预定义的节点模板
const NODE_TEMPLATES: TestNodeTemplate[] = [
  {
    id: 'start-template',
    type: 'start',
    label: '开始节点',
    description: '工作流开始节点',
    ports: [
      { id: 'output', type: 'output', position: 'right', dataType: 'any' }
    ],
    defaultPosition: { x: 100, y: 150 }
  },
  {
    id: 'process-template',
    type: 'process',
    label: '处理节点',
    description: '数据处理节点',
    ports: [
      { id: 'input', type: 'input', position: 'left', dataType: 'any' },
      { id: 'output', type: 'output', position: 'right', dataType: 'processed' }
    ],
    defaultPosition: { x: 300, y: 150 }
  },
  {
    id: 'end-template',
    type: 'end',
    label: '结束节点',
    description: '工作流结束节点',
    ports: [
      { id: 'input', type: 'input', position: 'left', dataType: 'processed' }
    ],
    defaultPosition: { x: 500, y: 150 }
  }
]

// 预定义的测试场景
const TEST_SCENARIOS: TestScenario[] = [
  {
    id: 'basic-flow',
    name: '基础工作流',
    description: '包含开始、处理、结束节点的基础工作流',
    nodes: [/* 预定义节点数据 */],
    edges: [/* 预定义连接数据 */],
    viewport: { x: 0, y: 0, scale: 1 }
  }
]
```

## 正确性属性

*属性是应该在系统的所有有效执行中保持为真的特征或行为——本质上是关于系统应该做什么的正式声明。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。*

基于需求分析，以下是Vue3测试页面应该满足的正确性属性：

### 编辑器初始化属性

**属性 1: 编辑器初始化完整性**
*对于任何* 有效的配置参数，初始化FlowEditor实例应该成功创建编辑器并应用所有配置选项
**验证: 需求 1.2, 1.3**

### 节点创建属性

**属性 2: 节点创建一致性**
*对于任何* 节点类型按钮的点击操作，系统应该创建对应类型的节点并增加节点计数
**验证: 需求 2.1, 2.2, 2.3**

**属性 3: 节点ID唯一性**
*对于任何* 节点创建操作序列，每个创建的节点都应该具有唯一的标识符
**验证: 需求 2.5**

**属性 4: 节点创建反馈**
*对于任何* 成功的节点创建操作，系统应该在界面上显示成功反馈信息
**验证: 需求 2.4**

### 连接创建属性

**属性 5: 有效连接创建**
*对于任何* 兼容的源节点和目标节点，连接创建操作应该成功建立连接并增加连接计数
**验证: 需求 3.1, 3.4**

**属性 6: 无效连接阻止**
*对于任何* 不兼容的节点对，连接创建操作应该被拒绝并显示错误信息
**验证: 需求 3.3**

**属性 7: 多连接支持**
*对于任何* 包含多个兼容节点的画布，系统应该能够创建多条独立的连接线
**验证: 需求 3.5**

**属性 8: 连接创建反馈**
*对于任何* 成功的连接创建操作，系统应该在界面上显示成功反馈信息
**验证: 需求 3.2**

### 交互行为属性

**属性 9: 拖拽位置更新**
*对于任何* 节点的拖拽操作，节点位置应该实时更新且相关连接线应该重新绘制
**验证: 需求 4.1**

**属性 10: 选择状态管理**
*对于任何* 节点的点击操作，该节点应该被选中并显示视觉反馈，点击空白区域应该取消所有选择
**验证: 需求 4.2, 4.5**

**属性 11: 视图操作响应**
*对于任何* 缩放或平移操作，画布视图应该相应地更新并保持操作的连续性
**验证: 需求 4.3, 4.4**

### 序列化属性

**属性 12: 序列化往返一致性**
*对于任何* 工作流状态，序列化后再反序列化应该产生等价的工作流状态
**验证: 需求 5.1, 5.2, 5.3, 5.4**

**属性 13: 序列化错误处理**
*对于任何* 序列化或反序列化失败的情况，系统应该显示错误信息并保持当前状态不变
**验证: 需求 5.5**

### 清空操作属性

**属性 14: 清空操作完整性**
*对于任何* 清空画布操作，所有节点和连接线应该被删除，视图状态应该重置，且编辑器应该保持可用
**验证: 需求 6.1, 6.2, 6.4**

**属性 15: 清空操作反馈**
*对于任何* 清空操作，系统应该显示成功反馈信息并触发相应的事件
**验证: 需求 6.3, 6.5**

### 状态监控属性

**属性 16: 状态同步一致性**
*对于任何* 编辑器操作，状态面板应该实时反映当前的节点和连接线数量
**验证: 需求 7.1, 7.5**

**属性 17: 事件日志完整性**
*对于任何* 编辑器事件，系统应该在事件日志中记录事件类型、时间戳和相关数据
**验证: 需求 7.2**

**属性 18: 日志管理功能**
*对于任何* 日志管理操作，系统应该正确限制日志条目数量并支持清空功能
**验证: 需求 7.3, 7.4**

### 响应式设计属性

**属性 19: 响应式布局适应**
*对于任何* 屏幕尺寸变化，系统应该自适应调整布局和编辑器容器尺寸
**验证: 需求 8.1**

**属性 20: UI交互反馈**
*对于任何* 用户交互操作，系统应该提供适当的视觉反馈和加载状态指示
**验证: 需求 8.2, 8.3, 8.4**

## 错误处理

### 错误类型定义

```typescript
enum TestPageErrorType {
  EDITOR_INIT_FAILED = 'EDITOR_INIT_FAILED',
  NODE_CREATION_FAILED = 'NODE_CREATION_FAILED',
  EDGE_CREATION_FAILED = 'EDGE_CREATION_FAILED',
  SERIALIZATION_FAILED = 'SERIALIZATION_FAILED',
  DESERIALIZATION_FAILED = 'DESERIALIZATION_FAILED',
  INTERACTION_FAILED = 'INTERACTION_FAILED',
  UI_RENDER_FAILED = 'UI_RENDER_FAILED'
}

class TestPageError extends Error {
  constructor(
    public type: TestPageErrorType,
    message: string,
    public originalError?: Error
  ) {
    super(message)
    this.name = 'TestPageError'
  }
}
```

### 错误处理策略

1. **编辑器初始化错误**
   - 显示友好的错误消息
   - 提供重试机制
   - 记录详细的错误信息到控制台

2. **操作执行错误**
   - 显示具体的错误提示
   - 保持应用状态稳定
   - 允许用户继续其他操作

3. **数据序列化错误**
   - 验证数据格式
   - 提供数据修复建议
   - 保护现有数据不丢失

4. **UI渲染错误**
   - 使用错误边界捕获组件错误
   - 显示降级UI
   - 记录错误信息用于调试

## 测试策略

### 双重测试方法

本项目将采用单元测试和基于属性的测试相结合的方法：

- **单元测试**: 验证特定示例、边界情况和错误条件
- **基于属性的测试**: 验证应该在所有输入中保持的通用属性
- 两者结合提供全面覆盖：单元测试捕获具体错误，属性测试验证通用正确性

### 单元测试要求

单元测试通常涵盖：

- 演示正确行为的特定示例
- 组件之间的集成点
- 单元测试很有用，但避免写太多。属性测试的工作是处理大量输入的覆盖。

### 基于属性的测试要求

- 必须为目标语言选择基于属性的测试库并在设计文档中指定。不得从头实现基于属性的测试。
- 应该配置每个基于属性的测试运行至少100次迭代，因为属性测试过程是随机的。
- 必须为每个基于属性的测试添加注释，明确引用设计文档中该基于属性的测试实现的正确性属性。
- 必须使用以下确切格式标记每个基于属性的测试：'**Feature: vue3-test-page, Property {number}: {property_text}**'
- 每个正确性属性必须由单个基于属性的测试实现。

### 测试技术栈

- **测试框架**: Vitest (与Vue3生态系统兼容)
- **属性测试库**: fast-check (JavaScript/TypeScript的属性测试库)
- **Vue测试工具**: @vue/test-utils (Vue组件测试)
- **DOM测试**: jsdom (模拟浏览器环境)
- **覆盖率工具**: c8 (代码覆盖率报告)

### 测试配置

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'c8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'dist/']
    }
  }
})
```

### 属性测试示例

```typescript
import fc from 'fast-check'

// **Feature: vue3-test-page, Property 3: 节点ID唯一性**
test('节点ID唯一性属性', () => {
  fc.assert(fc.property(
    fc.array(fc.constantFrom('start', 'process', 'end'), { minLength: 1, maxLength: 10 }),
    (nodeTypes) => {
      const editor = createTestEditor()
      const createdIds = new Set<string>()
      
      for (const nodeType of nodeTypes) {
        const node = editor.addNode(createNodeTemplate(nodeType))
        expect(createdIds.has(node.id)).toBe(false)
        createdIds.add(node.id)
      }
      
      expect(createdIds.size).toBe(nodeTypes.length)
    }
  ), { numRuns: 100 })
})
```
