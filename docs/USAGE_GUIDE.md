# Leafer-Flow 使用指南

## 目录

1. [快速开始](#快速开始)
2. [包管理器设置](#包管理器设置)
3. [基础概念](#基础概念)
4. [创建第一个工作流](#创建第一个工作流)
5. [节点管理](#节点管理)
6. [连接管理](#连接管理)
7. [交互功能](#交互功能)
8. [事件处理](#事件处理)
9. [数据持久化](#数据持久化)
10. [自定义扩展](#自定义扩展)
11. [性能优化](#性能优化)
12. [故障排除](#故障排除)

## 快速开始

### 包管理器设置

**重要**: Leafer-Flow 项目使用 [pnpm](https://pnpm.io/) 作为包管理器。这是一个硬性要求，使用其他包管理器可能导致依赖问题。

#### 安装 pnpm

如果您还没有安装 pnpm，请先安装：

```bash
# 使用 npm 安装 pnpm
npm install -g pnpm

# 或使用 curl (Linux/macOS)
curl -fsSL https://get.pnpm.io/install.sh | sh -

# 或使用 PowerShell (Windows)
iwr https://get.pnpm.io/install.ps1 -useb | iex
```

#### 验证安装

```bash
pnpm --version
# 应该显示版本号，如: 8.10.0
```

### 项目安装

```bash
# 创建新项目
mkdir my-flow-app
cd my-flow-app

# 初始化项目 (使用 pnpm)
pnpm init

# 安装 Leafer-Flow
pnpm add leafer-flow

# 安装开发依赖 (如果需要)
pnpm add -D typescript @types/node
```

### 基本 HTML 设置

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>我的工作流应用</title>
    <style>
        #flow-container {
            width: 100vw;
            height: 100vh;
            border: 1px solid #ddd;
        }
    </style>
</head>
<body>
    <div id="flow-container"></div>
    <script type="module" src="./main.js"></script>
</body>
</html>
```

### 基本 JavaScript 设置

```javascript
// main.js
import { FlowEditor } from 'leafer-flow'

// 获取容器元素
const container = document.getElementById('flow-container')

// 创建编辑器实例
const editor = new FlowEditor(container, {
    background: '#f8f9fa',
    grid: true,
    controls: true
})

// 添加一个简单的节点
const node = editor.addNode({
    id: 'start-node',
    type: 'default',
    position: { x: 100, y: 100 },
    data: { label: '开始节点' },
    ports: [
        { id: 'output', type: 'output', position: 'right' }
    ]
})

console.log('工作流编辑器已创建！')
```

## 基础概念

### 核心组件

1. **FlowEditor**: 主编辑器类，管理整个工作流
2. **FlowNode**: 节点类，代表工作流中的处理单元
3. **FlowEdge**: 连接线类，连接不同节点
4. **FlowPort**: 端口类，节点的输入输出接口

### 坐标系统

Leafer-Flow 使用标准的 2D 坐标系统：

- 原点 (0,0) 在左上角
- X 轴向右为正
- Y 轴向下为正

### 数据流向

数据通过连接线从输出端口流向输入端口：

```
[节点A] --输出端口--> 连接线 --输入端口--> [节点B]
```

## 创建第一个工作流

让我们创建一个简单的数据处理工作流：

```javascript
import { FlowEditor } from 'leafer-flow'

// 1. 创建编辑器
const container = document.getElementById('flow-container')
const editor = new FlowEditor(container, {
    width: 800,
    height: 600,
    background: '#f5f5f5',
    grid: true
})

// 2. 创建输入节点
const inputNode = editor.addNode({
    id: 'input-1',
    type: 'default',
    position: { x: 50, y: 200 },
    data: { 
        label: '数据输入',
        description: '从数据库读取数据'
    },
    ports: [
        { 
            id: 'output', 
            type: 'output', 
            position: 'right',
            dataType: 'raw-data'
        }
    ]
})

// 3. 创建处理节点
const processNode = editor.addNode({
    id: 'process-1',
    type: 'default',
    position: { x: 250, y: 200 },
    data: { 
        label: '数据处理',
        description: '清洗和转换数据'
    },
    ports: [
        { 
            id: 'input', 
            type: 'input', 
            position: 'left',
            dataType: 'raw-data'
        },
        { 
            id: 'output', 
            type: 'output', 
            position: 'right',
            dataType: 'processed-data'
        }
    ]
})

// 4. 创建输出节点
const outputNode = editor.addNode({
    id: 'output-1',
    type: 'default',
    position: { x: 450, y: 200 },
    data: { 
        label: '数据输出',
        description: '保存处理后的数据'
    },
    ports: [
        { 
            id: 'input', 
            type: 'input', 
            position: 'left',
            dataType: 'processed-data'
        }
    ]
})

// 5. 创建连接
const connection1 = editor.addEdge({
    id: 'edge-1',
    source: 'input-1',
    sourcePort: 'output',
    target: 'process-1',
    targetPort: 'input'
})

const connection2 = editor.addEdge({
    id: 'edge-2',
    source: 'process-1',
    sourcePort: 'output',
    target: 'output-1',
    targetPort: 'input'
})

console.log('工作流创建完成！')
```

## 节点管理

### 创建节点

```javascript
// 基本节点
const basicNode = editor.addNode({
    id: 'basic-node',
    type: 'default',
    position: { x: 100, y: 100 },
    data: { label: '基本节点' }
})

// 带端口的节点
const nodeWithPorts = editor.addNode({
    id: 'node-with-ports',
    type: 'default',
    position: { x: 300, y: 100 },
    data: { label: '多端口节点' },
    ports: [
        { id: 'input1', type: 'input', position: 'left' },
        { id: 'input2', type: 'input', position: 'top' },
        { id: 'output1', type: 'output', position: 'right' },
        { id: 'output2', type: 'output', position: 'bottom' }
    ]
})

// 自定义数据节点
const customDataNode = editor.addNode({
    id: 'custom-node',
    type: 'default',
    position: { x: 500, y: 100 },
    data: {
        label: '自定义节点',
        config: {
            timeout: 5000,
            retries: 3,
            enabled: true
        },
        metadata: {
            created: new Date().toISOString(),
            author: 'user123'
        }
    }
})
```

### 查找和操作节点

```javascript
// 查找节点
const node = editor.getNode('basic-node')
if (node) {
    console.log('找到节点:', node.id)
    
    // 更新节点数据
    node.data.label = '更新后的标签'
    node.data.lastModified = new Date().toISOString()
    
    // 获取节点位置
    console.log('节点位置:', node.position)
    
    // 移动节点
    node.position = { x: 200, y: 150 }
}

// 获取所有节点
const allNodes = editor.getAllNodes()
console.log('总节点数:', allNodes.length)

// 按类型筛选节点
const defaultNodes = allNodes.filter(node => node.type === 'default')

// 按数据筛选节点
const enabledNodes = allNodes.filter(node => node.data.config?.enabled)
```

### 删除节点

```javascript
// 删除单个节点
const success = editor.removeNode('basic-node')
if (success) {
    console.log('节点删除成功')
}

// 批量删除节点
const nodesToDelete = ['node1', 'node2', 'node3']
nodesToDelete.forEach(nodeId => {
    editor.removeNode(nodeId)
})
```

## 连接管理

### 创建连接

```javascript
// 基本连接
const edge = editor.addEdge({
    id: 'connection-1',
    source: 'node-a',
    sourcePort: 'output',
    target: 'node-b',
    targetPort: 'input'
})

// 带自定义数据的连接
const customEdge = editor.addEdge({
    id: 'custom-connection',
    source: 'node-a',
    sourcePort: 'output',
    target: 'node-b',
    targetPort: 'input',
    data: {
        label: '数据流',
        bandwidth: '1Gbps',
        protocol: 'HTTP',
        encrypted: true
    }
})
```

### 连接验证

```javascript
// 自定义连接验证
editor.setConnectionValidator((sourceNode, sourcePort, targetNode, targetPort) => {
    // 检查数据类型兼容性
    if (sourcePort.dataType && targetPort.dataType) {
        if (sourcePort.dataType !== targetPort.dataType) {
            return {
                valid: false,
                message: `数据类型不匹配: ${sourcePort.dataType} -> ${targetPort.dataType}`
            }
        }
    }
    
    // 检查循环连接
    if (sourceNode.id === targetNode.id) {
        return {
            valid: false,
            message: '不能连接到自身'
        }
    }
    
    // 检查重复连接
    const existingEdge = editor.getAllEdges().find(edge => 
        edge.source === sourceNode.id && 
        edge.sourcePort === sourcePort.id &&
        edge.target === targetNode.id && 
        edge.targetPort === targetPort.id
    )
    
    if (existingEdge) {
        return {
            valid: false,
            message: '连接已存在'
        }
    }
    
    return { valid: true }
})
```

### 查找和操作连接

```javascript
// 查找连接
const edge = editor.getEdge('connection-1')
if (edge) {
    console.log('连接信息:', {
        source: edge.source,
        target: edge.target,
        data: edge.data
    })
}

// 获取节点的所有连接
const nodeConnections = editor.getAllEdges().filter(edge => 
    edge.source === 'node-a' || edge.target === 'node-a'
)

// 获取输入连接
const inputConnections = editor.getAllEdges().filter(edge => 
    edge.target === 'node-a'
)

// 获取输出连接
const outputConnections = editor.getAllEdges().filter(edge => 
    edge.source === 'node-a'
)
```

## 交互功能

### 拖拽操作

```javascript
// 监听拖拽事件
editor.on('node:drag:start', (event) => {
    console.log('开始拖拽节点:', event.data.nodeId)
})

editor.on('node:drag:move', (event) => {
    console.log('拖拽中:', event.data.nodeId, event.data.position)
})

editor.on('node:drag:end', (event) => {
    console.log('拖拽结束:', event.data.nodeId, event.data.finalPosition)
})

// 启用/禁用拖拽
editor.setDragEnabled(true)  // 启用拖拽
editor.setDragEnabled(false) // 禁用拖拽

// 设置拖拽约束
editor.setDragConstraints({
    minX: 0,
    minY: 0,
    maxX: 1000,
    maxY: 800
})
```

### 选择操作

```javascript
// 监听选择事件
editor.on('selection:changed', (event) => {
    console.log('选择变化:', {
        selectedNodes: event.data.selectedNodes,
        selectedEdges: event.data.selectedEdges
    })
})

// 程序化选择
editor.selectNode('node-1')
editor.selectEdge('edge-1')
editor.selectMultiple(['node-1', 'node-2'])

// 清除选择
editor.clearSelection()

// 获取当前选择
const selection = editor.getSelection()
console.log('当前选择:', selection)
```

### 视图控制

```javascript
// 缩放控制
editor.zoomIn()     // 放大
editor.zoomOut()    // 缩小
editor.zoomTo(1.5)  // 缩放到指定级别
editor.zoomToFit()  // 适应所有内容

// 平移控制
editor.panTo(100, 100)        // 平移到指定位置
editor.panBy(50, 50)          // 相对平移
editor.centerOn('node-1')     // 居中到指定节点

// 获取视图状态
const viewport = editor.getViewport()
console.log('当前视图:', viewport)

// 监听视图变化
editor.on('viewport:changed', (event) => {
    console.log('视图变化:', event.data.viewport)
})
```

## 事件处理

### 基本事件监听

```javascript
// 节点事件
editor.on('node:created', (event) => {
    console.log('节点创建:', event.data.nodeId)
})

editor.on('node:deleted', (event) => {
    console.log('节点删除:', event.data.nodeId)
})

editor.on('node:selected', (event) => {
    console.log('节点选中:', event.data.nodeId)
})

editor.on('node:moved', (event) => {
    console.log('节点移动:', event.data.nodeId, event.data.position)
})

// 连接事件
editor.on('edge:created', (event) => {
    console.log('连接创建:', event.data.edgeId)
})

editor.on('edge:deleted', (event) => {
    console.log('连接删除:', event.data.edgeId)
})

// 交互事件
editor.on('canvas:click', (event) => {
    console.log('画布点击:', event.data.position)
})

editor.on('canvas:double-click', (event) => {
    console.log('画布双击:', event.data.position)
})
```

### 自定义事件处理

```javascript
// 创建自定义事件处理器
class WorkflowEventHandler {
    constructor(editor) {
        this.editor = editor
        this.setupEventListeners()
    }
    
    setupEventListeners() {
        // 节点创建时自动保存
        this.editor.on('node:created', this.handleNodeCreated.bind(this))
        
        // 连接创建时验证工作流
        this.editor.on('edge:created', this.handleEdgeCreated.bind(this))
        
        // 选择变化时更新属性面板
        this.editor.on('selection:changed', this.handleSelectionChanged.bind(this))
    }
    
    handleNodeCreated(event) {
        console.log('新节点创建，自动保存工作流')
        this.autoSave()
    }
    
    handleEdgeCreated(event) {
        console.log('新连接创建，验证工作流完整性')
        this.validateWorkflow()
    }
    
    handleSelectionChanged(event) {
        console.log('选择变化，更新属性面板')
        this.updatePropertyPanel(event.data)
    }
    
    autoSave() {
        const data = this.editor.toJSON()
        localStorage.setItem('workflow-autosave', JSON.stringify(data))
    }
    
    validateWorkflow() {
        const nodes = this.editor.getAllNodes()
        const edges = this.editor.getAllEdges()
        
        // 检查是否有孤立节点
        const connectedNodes = new Set()
        edges.forEach(edge => {
            connectedNodes.add(edge.source)
            connectedNodes.add(edge.target)
        })
        
        const isolatedNodes = nodes.filter(node => !connectedNodes.has(node.id))
        if (isolatedNodes.length > 0) {
            console.warn('发现孤立节点:', isolatedNodes.map(n => n.id))
        }
    }
    
    updatePropertyPanel(selectionData) {
        // 更新属性面板的逻辑
        if (selectionData.selectedNodes.length === 1) {
            const node = this.editor.getNode(selectionData.selectedNodes[0])
            this.showNodeProperties(node)
        } else if (selectionData.selectedEdges.length === 1) {
            const edge = this.editor.getEdge(selectionData.selectedEdges[0])
            this.showEdgeProperties(edge)
        } else {
            this.hidePropertyPanel()
        }
    }
    
    showNodeProperties(node) {
        console.log('显示节点属性:', node.data)
    }
    
    showEdgeProperties(edge) {
        console.log('显示连接属性:', edge.data)
    }
    
    hidePropertyPanel() {
        console.log('隐藏属性面板')
    }
}

// 使用自定义事件处理器
const eventHandler = new WorkflowEventHandler(editor)
```

## 数据持久化

### 保存和加载

```javascript
// 保存到本地存储
function saveWorkflow(name) {
    const data = editor.toJSON()
    const saveData = {
        ...data,
        metadata: {
            name: name,
            version: '1.0.0',
            created: new Date().toISOString(),
            modified: new Date().toISOString()
        }
    }
    localStorage.setItem(`workflow-${name}`, JSON.stringify(saveData))
    console.log('工作流已保存:', name)
}

// 从本地存储加载
function loadWorkflow(name) {
    const savedData = localStorage.getItem(`workflow-${name}`)
    if (savedData) {
        try {
            const data = JSON.parse(savedData)
            editor.fromJSON(data)
            console.log('工作流已加载:', name)
            return true
        } catch (error) {
            console.error('加载工作流失败:', error)
            return false
        }
    }
    return false
}

// 导出为文件
function exportWorkflow(name) {
    const data = editor.toJSON()
    const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${name}.json`
    a.click()
    
    URL.revokeObjectURL(url)
}

// 从文件导入
function importWorkflow(file) {
    const reader = new FileReader()
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result)
            editor.fromJSON(data)
            console.log('工作流导入成功')
        } catch (error) {
            console.error('导入失败:', error)
        }
    }
    reader.readAsText(file)
}
```

### 自动保存

```javascript
// 实现自动保存功能
class AutoSave {
    constructor(editor, interval = 30000) { // 30秒间隔
        this.editor = editor
        this.interval = interval
        this.lastSave = null
        this.isDirty = false
        
        this.setupAutoSave()
    }
    
    setupAutoSave() {
        // 监听变化事件
        const events = [
            'node:created', 'node:deleted', 'node:moved',
            'edge:created', 'edge:deleted'
        ]
        
        events.forEach(event => {
            this.editor.on(event, () => {
                this.isDirty = true
            })
        })
        
        // 启动自动保存定时器
        this.startAutoSave()
    }
    
    startAutoSave() {
        setInterval(() => {
            if (this.isDirty) {
                this.save()
            }
        }, this.interval)
    }
    
    save() {
        const data = this.editor.toJSON()
        const saveData = {
            ...data,
            metadata: {
                autoSaved: true,
                timestamp: new Date().toISOString()
            }
        }
        
        localStorage.setItem('workflow-autosave', JSON.stringify(saveData))
        this.lastSave = new Date()
        this.isDirty = false
        
        console.log('自动保存完成:', this.lastSave.toLocaleTimeString())
    }
    
    restore() {
        const savedData = localStorage.getItem('workflow-autosave')
        if (savedData) {
            try {
                const data = JSON.parse(savedData)
                this.editor.fromJSON(data)
                console.log('自动保存数据已恢复')
                return true
            } catch (error) {
                console.error('恢复自动保存失败:', error)
            }
        }
        return false
    }
}

// 启用自动保存
const autoSave = new AutoSave(editor, 10000) // 10秒间隔

// 页面加载时尝试恢复
window.addEventListener('load', () => {
    if (confirm('发现自动保存的数据，是否恢复？')) {
        autoSave.restore()
    }
})
```

## 自定义扩展

### 自定义节点类型

```javascript
// 定义自定义节点类型
const customNodeTypes = {
    'http-request': {
        render: (node) => {
            // 自定义渲染逻辑
            return node // 简化示例
        },
        defaultData: {
            label: 'HTTP 请求',
            method: 'GET',
            url: '',
            headers: {},
            timeout: 5000
        },
        ports: [
            { id: 'trigger', type: 'input', position: 'left' },
            { id: 'success', type: 'output', position: 'right' },
            { id: 'error', type: 'output', position: 'bottom' }
        ],
        validate: (data) => {
            return !!(data.url && data.method)
        }
    },
    
    'database-query': {
        render: (node) => {
            return node // 简化示例
        },
        defaultData: {
            label: '数据库查询',
            connection: '',
            query: '',
            parameters: {}
        },
        ports: [
            { id: 'execute', type: 'input', position: 'left' },
            { id: 'result', type: 'output', position: 'right' },
            { id: 'error', type: 'output', position: 'bottom' }
        ]
    }
}

// 注册自定义节点类型
Object.entries(customNodeTypes).forEach(([type, definition]) => {
    editor.registerNodeType(type, definition)
})

// 使用自定义节点类型
const httpNode = editor.addNode({
    id: 'http-1',
    type: 'http-request',
    position: { x: 100, y: 100 },
    data: {
        url: 'https://api.example.com/data',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    }
})
```

### 自定义连接线样式

```javascript
// 定义自定义连接线类型
const customEdgeTypes = {
    'data-flow': {
        pathType: 'bezier',
        animated: true,
        style: {
            stroke: '#2196F3',
            strokeWidth: 3,
            strokeDasharray: '0'
        }
    },
    
    'error-flow': {
        pathType: 'straight',
        style: {
            stroke: '#f44336',
            strokeWidth: 2,
            strokeDasharray: '5,5'
        }
    },
    
    'control-flow': {
        pathType: 'orthogonal',
        style: {
            stroke: '#9c27b0',
            strokeWidth: 2
        }
    }
}

// 注册自定义连接线类型
Object.entries(customEdgeTypes).forEach(([type, definition]) => {
    editor.registerEdgeType(type, definition)
})

// 使用自定义连接线
const dataConnection = editor.addEdge({
    id: 'data-edge-1',
    source: 'node-1',
    sourcePort: 'output',
    target: 'node-2',
    targetPort: 'input',
    data: { type: 'data-flow' }
})
```

## 性能优化

### 大量节点处理

```javascript
// 创建大量节点时使用批量操作
async function createManyNodes(count) {
    const nodes = []
    
    // 准备节点数据
    for (let i = 0; i < count; i++) {
        nodes.push({
            id: `node-${i}`,
            type: 'default',
            position: {
                x: (i % 10) * 150,
                y: Math.floor(i / 10) * 100
            },
            data: { label: `节点 ${i}` }
        })
    }
    
    // 批量创建
    await editor.batchOperation(
        nodes,
        (nodeData) => editor.addNode(nodeData),
        (completed, total) => {
            console.log(`创建进度: ${completed}/${total}`)
        }
    )
    
    console.log(`成功创建 ${count} 个节点`)
}

// 使用示例
createManyNodes(1000)
```

### 视图优化

```javascript
// 启用性能优化选项
const optimizedEditor = new FlowEditor(container, {
    // 基本配置
    background: '#f5f5f5',
    grid: true,
    
    // 性能优化配置
    enablePerformanceOptimization: true,
    maxVisibleNodes: 200,           // 最大可见节点数
    maxVisibleEdges: 500,           // 最大可见连接数
    enableLevelOfDetail: true,      // 启用细节层次
    lodThreshold: 0.5,              // LOD 阈值
    enableVirtualization: true,     // 启用虚拟化
    
    // 渲染优化
    renderBatchSize: 50,            // 渲染批次大小
    renderThrottleMs: 16,           // 渲染节流时间
})

// 监控性能
setInterval(() => {
    const stats = optimizedEditor.getPerformanceStats()
    console.log('性能统计:', {
        fps: stats.fps,
        renderTime: stats.renderTime,
        visibleNodes: stats.visibleNodes,
        visibleEdges: stats.visibleEdges
    })
}, 5000)
```

### 内存管理

```javascript
// 正确的资源清理
function cleanupEditor() {
    // 移除所有事件监听器
    editor.removeAllListeners()
    
    // 清理节点和连接
    editor.clear()
    
    // 销毁编辑器实例
    editor.destroy()
    
    console.log('编辑器资源已清理')
}

// 页面卸载时清理
window.addEventListener('beforeunload', cleanupEditor)

// 组件卸载时清理 (React 示例)
useEffect(() => {
    return () => {
        cleanupEditor()
    }
}, [])
```

## 故障排除

### 常见问题

#### 1. pnpm 相关问题

```bash
# 问题：使用 npm 或 yarn 安装依赖导致的问题
# 解决：清理并使用 pnpm 重新安装

rm -rf node_modules package-lock.json yarn.lock
pnpm install
```

#### 2. 节点不显示

```javascript
// 检查容器是否正确设置
const container = document.getElementById('flow-container')
if (!container) {
    console.error('容器元素未找到')
}

// 检查容器尺寸
console.log('容器尺寸:', {
    width: container.offsetWidth,
    height: container.offsetHeight
})

// 确保容器有明确的尺寸
container.style.width = '800px'
container.style.height = '600px'
```

#### 3. 连接创建失败

```javascript
// 检查端口是否存在
const sourceNode = editor.getNode('source-node')
const targetNode = editor.getNode('target-node')

if (!sourceNode) {
    console.error('源节点不存在')
}

if (!targetNode) {
    console.error('目标节点不存在')
}

// 检查端口配置
const sourcePort = sourceNode.getPort('output')
const targetPort = targetNode.getPort('input')

if (!sourcePort) {
    console.error('源端口不存在')
}

if (!targetPort) {
    console.error('目标端口不存在')
}
```

#### 4. 性能问题

```javascript
// 检查节点数量
const nodeCount = editor.getAllNodes().length
const edgeCount = editor.getAllEdges().length

console.log('当前元素数量:', { nodes: nodeCount, edges: edgeCount })

if (nodeCount > 500) {
    console.warn('节点数量过多，建议启用性能优化')
    
    // 启用性能优化
    editor.enablePerformanceOptimization({
        maxVisibleNodes: 200,
        enableLevelOfDetail: true
    })
}
```

### 调试工具

```javascript
// 启用调试模式
editor.setDebugMode(true)

// 获取调试信息
const debugInfo = editor.getDebugInfo()
console.log('调试信息:', debugInfo)

// 性能分析
editor.startPerformanceProfile()
// ... 执行操作
const profile = editor.endPerformanceProfile()
console.log('性能分析:', profile)
```

### 错误处理

```javascript
// 全局错误处理
editor.on('error', (event) => {
    console.error('编辑器错误:', event.data.error)
    
    // 根据错误类型处理
    switch (event.data.error.type) {
        case 'INVALID_NODE_DATA':
            console.error('无效的节点数据:', event.data.error.details)
            break
        case 'CONNECTION_VALIDATION_FAILED':
            console.error('连接验证失败:', event.data.error.message)
            break
        case 'SERIALIZATION_ERROR':
            console.error('序列化错误:', event.data.error.details)
            break
        default:
            console.error('未知错误:', event.data.error)
    }
})

// 操作错误处理
try {
    const node = editor.addNode(nodeData)
} catch (error) {
    if (error.type === 'INVALID_NODE_DATA') {
        console.error('节点数据无效:', error.message)
        // 显示用户友好的错误消息
        showErrorMessage('节点创建失败：数据格式不正确')
    } else {
        console.error('未知错误:', error)
        showErrorMessage('操作失败，请重试')
    }
}
```

## 总结

本指南涵盖了 Leafer-Flow 的主要使用方法和最佳实践。记住以下要点：

1. **始终使用 pnpm** 作为包管理器
2. **正确设置容器尺寸** 以确保编辑器正常显示
3. **使用事件系统** 来响应用户操作和状态变化
4. **实现数据持久化** 来保存用户的工作
5. **启用性能优化** 来处理大型工作流
6. **正确清理资源** 以避免内存泄漏

如需更多帮助，请参考 [API 文档](./API.md) 或查看 `examples/` 目录中的示例代码。
