# Leafer-Flow 性能优化指南

## 概述

本文档提供了优化 Leafer-Flow 性能的详细指南，包括最佳实践、配置选项和故障排除方法。

## 包管理器性能

### 使用 pnpm 的性能优势

**重要**: Leafer-Flow 强制使用 [pnpm](https://pnpm.io/) 作为包管理器，这不仅是技术要求，也是性能优化的重要组成部分。

#### pnpm 的性能优势

1. **更快的安装速度**

   ```bash
   # pnpm 通过硬链接和符号链接大幅提升安装速度
   pnpm install  # 通常比 npm 快 2-3 倍
   ```

2. **节省磁盘空间**

   ```bash
   # pnpm 使用内容寻址存储，避免重复包
   # 可节省高达 50% 的磁盘空间
   pnpm store status  # 查看存储统计
   ```

3. **更严格的依赖管理**

   ```bash
   # pnpm 创建非扁平的 node_modules，避免幽灵依赖
   # 提高应用运行时性能和稳定性
   ```

#### 性能配置

```bash
# .npmrc 配置优化
shamefully-hoist=false
strict-peer-dependencies=true
auto-install-peers=true
prefer-frozen-lockfile=true

# 启用并行安装
child-concurrency=4
network-concurrency=16
```

## 渲染性能优化

### 基础配置

```javascript
// 创建高性能编辑器实例
const editor = new FlowEditor(container, {
  // 基础配置
  background: '#f5f5f5',
  grid: true,
  
  // 性能优化配置
  enablePerformanceOptimization: true,
  
  // 可见性控制
  maxVisibleNodes: 200,        // 限制同时可见的节点数量
  maxVisibleEdges: 500,        // 限制同时可见的连接数量
  
  // 细节层次 (Level of Detail)
  enableLevelOfDetail: true,   // 启用 LOD
  lodThreshold: 0.5,           // 缩放阈值，低于此值简化渲染
  
  // 虚拟化
  enableVirtualization: true,  // 启用视口虚拟化
  virtualPadding: 100,         // 虚拟化边距
  
  // 渲染优化
  renderBatchSize: 50,         // 批量渲染大小
  renderThrottleMs: 16,        // 渲染节流时间 (60fps)
  enableGPUAcceleration: true, // 启用 GPU 加速
  
  // 交互优化
  interactionThrottleMs: 10,   // 交互事件节流
  enableSmartRedraw: true,     // 智能重绘
})
```

### 大量节点处理

#### 批量操作

```javascript
// 高效的批量节点创建
async function createNodesEfficiently(nodeDataArray) {
  // 1. 禁用实时渲染
  editor.setRenderingEnabled(false)
  
  try {
    // 2. 批量创建节点
    const nodes = await editor.batchOperation(
      nodeDataArray,
      (nodeData) => editor.addNode(nodeData),
      (completed, total) => {
        // 显示进度
        console.log(`创建进度: ${completed}/${total} (${Math.round(completed/total*100)}%)`)
      },
      {
        batchSize: 100,        // 每批处理 100 个
        delayBetweenBatches: 1 // 批次间延迟 1ms
      }
    )
    
    console.log(`成功创建 ${nodes.length} 个节点`)
    
  } finally {
    // 3. 重新启用渲染
    editor.setRenderingEnabled(true)
    
    // 4. 触发一次完整重绘
    editor.forceRedraw()
  }
}

// 使用示例
const largeNodeSet = Array.from({ length: 1000 }, (_, i) => ({
  id: `node-${i}`,
  type: 'default',
  position: {
    x: (i % 20) * 150,
    y: Math.floor(i / 20) * 100
  },
  data: { label: `节点 ${i}` }
}))

createNodesEfficiently(largeNodeSet)
```

#### 虚拟化渲染

```javascript
// 启用视口虚拟化
class ViewportVirtualization {
  constructor(editor) {
    this.editor = editor
    this.visibleNodes = new Set()
    this.visibleEdges = new Set()
    this.updateThrottled = this.throttle(this.updateVisibility.bind(this), 100)
    
    this.setupViewportTracking()
  }
  
  setupViewportTracking() {
    // 监听视图变化
    this.editor.on('viewport:changed', this.updateThrottled)
    
    // 初始更新
    this.updateVisibility()
  }
  
  updateVisibility() {
    const viewport = this.editor.getViewport()
    const viewBounds = this.calculateViewBounds(viewport)
    
    // 更新节点可见性
    this.updateNodeVisibility(viewBounds)
    
    // 更新连接可见性
    this.updateEdgeVisibility(viewBounds)
    
    // 应用变化
    this.applyVisibilityChanges()
  }
  
  calculateViewBounds(viewport) {
    const padding = 200 // 额外的边距
    return {
      left: viewport.x - padding,
      top: viewport.y - padding,
      right: viewport.x + viewport.width + padding,
      bottom: viewport.y + viewport.height + padding
    }
  }
  
  updateNodeVisibility(viewBounds) {
    const allNodes = this.editor.getAllNodes()
    const newVisibleNodes = new Set()
    
    allNodes.forEach(node => {
      const nodePos = node.position
      const nodeSize = node.getSize()
      
      // 检查节点是否在视口内
      if (this.isInBounds(nodePos, nodeSize, viewBounds)) {
        newVisibleNodes.add(node.id)
        
        // 如果之前不可见，现在显示
        if (!this.visibleNodes.has(node.id)) {
          node.setVisible(true)
        }
      } else {
        // 如果之前可见，现在隐藏
        if (this.visibleNodes.has(node.id)) {
          node.setVisible(false)
        }
      }
    })
    
    this.visibleNodes = newVisibleNodes
  }
  
  updateEdgeVisibility(viewBounds) {
    const allEdges = this.editor.getAllEdges()
    const newVisibleEdges = new Set()
    
    allEdges.forEach(edge => {
      const sourceNode = this.editor.getNode(edge.source)
      const targetNode = this.editor.getNode(edge.target)
      
      // 如果源节点或目标节点可见，则连接可见
      if (this.visibleNodes.has(edge.source) || this.visibleNodes.has(edge.target)) {
        newVisibleEdges.add(edge.id)
        
        if (!this.visibleEdges.has(edge.id)) {
          edge.setVisible(true)
        }
      } else {
        if (this.visibleEdges.has(edge.id)) {
          edge.setVisible(false)
        }
      }
    })
    
    this.visibleEdges = newVisibleEdges
  }
  
  isInBounds(position, size, bounds) {
    return !(
      position.x + size.width < bounds.left ||
      position.x > bounds.right ||
      position.y + size.height < bounds.top ||
      position.y > bounds.bottom
    )
  }
  
  applyVisibilityChanges() {
    // 触发重绘
    this.editor.requestRedraw()
  }
  
  throttle(func, limit) {
    let inThrottle
    return function() {
      const args = arguments
      const context = this
      if (!inThrottle) {
        func.apply(context, args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  }
}

// 启用虚拟化
const virtualization = new ViewportVirtualization(editor)
```

### 细节层次 (LOD) 优化

```javascript
// 实现智能 LOD 系统
class LevelOfDetailManager {
  constructor(editor) {
    this.editor = editor
    this.lodLevels = {
      high: 1.0,    // 100% 缩放以上 - 完整细节
      medium: 0.5,  // 50% 缩放以上 - 中等细节
      low: 0.25     // 25% 缩放以上 - 低细节
    }
    
    this.setupLOD()
  }
  
  setupLOD() {
    this.editor.on('viewport:changed', (event) => {
      const zoom = event.data.viewport.zoom
      this.updateLOD(zoom)
    })
  }
  
  updateLOD(zoomLevel) {
    let lodLevel
    
    if (zoomLevel >= this.lodLevels.high) {
      lodLevel = 'high'
    } else if (zoomLevel >= this.lodLevels.medium) {
      lodLevel = 'medium'
    } else {
      lodLevel = 'low'
    }
    
    this.applyLOD(lodLevel)
  }
  
  applyLOD(level) {
    const nodes = this.editor.getAllNodes()
    const edges = this.editor.getAllEdges()
    
    switch (level) {
      case 'high':
        this.applyHighDetailLOD(nodes, edges)
        break
      case 'medium':
        this.applyMediumDetailLOD(nodes, edges)
        break
      case 'low':
        this.applyLowDetailLOD(nodes, edges)
        break
    }
  }
  
  applyHighDetailLOD(nodes, edges) {
    // 显示所有细节
    nodes.forEach(node => {
      node.showLabels(true)
      node.showPorts(true)
      node.showIcons(true)
      node.setRenderQuality('high')
    })
    
    edges.forEach(edge => {
      edge.showLabels(true)
      edge.showArrows(true)
      edge.setRenderQuality('high')
    })
  }
  
  applyMediumDetailLOD(nodes, edges) {
    // 隐藏部分细节
    nodes.forEach(node => {
      node.showLabels(true)
      node.showPorts(false)  // 隐藏端口
      node.showIcons(true)
      node.setRenderQuality('medium')
    })
    
    edges.forEach(edge => {
      edge.showLabels(false)  // 隐藏标签
      edge.showArrows(true)
      edge.setRenderQuality('medium')
    })
  }
  
  applyLowDetailLOD(nodes, edges) {
    // 最小化细节
    nodes.forEach(node => {
      node.showLabels(false)  // 隐藏标签
      node.showPorts(false)   // 隐藏端口
      node.showIcons(false)   // 隐藏图标
      node.setRenderQuality('low')
    })
    
    edges.forEach(edge => {
      edge.showLabels(false)
      edge.showArrows(false)  // 隐藏箭头
      edge.setRenderQuality('low')
    })
  }
}

// 启用 LOD 管理
const lodManager = new LevelOfDetailManager(editor)
```

## 内存优化

### 对象池化

```javascript
// 实现对象池来减少 GC 压力
class ObjectPool {
  constructor(createFn, resetFn, initialSize = 10) {
    this.createFn = createFn
    this.resetFn = resetFn
    this.pool = []
    
    // 预创建对象
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn())
    }
  }
  
  acquire() {
    if (this.pool.length > 0) {
      return this.pool.pop()
    }
    return this.createFn()
  }
  
  release(obj) {
    this.resetFn(obj)
    this.pool.push(obj)
  }
  
  clear() {
    this.pool.length = 0
  }
}

// 创建节点对象池
const nodePool = new ObjectPool(
  () => ({
    id: '',
    type: '',
    position: { x: 0, y: 0 },
    data: {},
    ports: []
  }),
  (node) => {
    node.id = ''
    node.type = ''
    node.position.x = 0
    node.position.y = 0
    node.data = {}
    node.ports.length = 0
  },
  50
)

// 使用对象池创建节点
function createNodeFromPool(nodeData) {
  const node = nodePool.acquire()
  Object.assign(node, nodeData)
  return node
}

// 释放节点到对象池
function releaseNodeToPool(node) {
  nodePool.release(node)
}
```

### 内存监控

```javascript
// 内存使用监控
class MemoryMonitor {
  constructor(editor) {
    this.editor = editor
    this.startTime = Date.now()
    this.samples = []
    this.maxSamples = 100
    
    this.startMonitoring()
  }
  
  startMonitoring() {
    setInterval(() => {
      this.collectSample()
    }, 5000) // 每 5 秒采样一次
  }
  
  collectSample() {
    const sample = {
      timestamp: Date.now(),
      nodeCount: this.editor.getAllNodes().length,
      edgeCount: this.editor.getAllEdges().length,
      memory: this.getMemoryUsage()
    }
    
    this.samples.push(sample)
    
    // 保持样本数量限制
    if (this.samples.length > this.maxSamples) {
      this.samples.shift()
    }
    
    // 检查内存泄漏
    this.checkMemoryLeak()
  }
  
  getMemoryUsage() {
    if (performance.memory) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      }
    }
    return null
  }
  
  checkMemoryLeak() {
    if (this.samples.length < 10) return
    
    const recent = this.samples.slice(-10)
    const memoryGrowth = recent.map(sample => sample.memory?.used || 0)
    
    // 检查内存是否持续增长
    let growthCount = 0
    for (let i = 1; i < memoryGrowth.length; i++) {
      if (memoryGrowth[i] > memoryGrowth[i - 1]) {
        growthCount++
      }
    }
    
    if (growthCount >= 8) { // 80% 的样本显示增长
      console.warn('检测到可能的内存泄漏')
      this.suggestCleanup()
    }
  }
  
  suggestCleanup() {
    console.log('建议执行内存清理:')
    console.log('1. 清理未使用的事件监听器')
    console.log('2. 删除不需要的节点和连接')
    console.log('3. 调用 editor.cleanup()')
  }
  
  getReport() {
    const latest = this.samples[this.samples.length - 1]
    const oldest = this.samples[0]
    
    return {
      runtime: Date.now() - this.startTime,
      currentNodes: latest?.nodeCount || 0,
      currentEdges: latest?.edgeCount || 0,
      memoryUsage: latest?.memory,
      memoryGrowth: latest?.memory && oldest?.memory 
        ? latest.memory.used - oldest.memory.used 
        : 0
    }
  }
}

// 启用内存监控
const memoryMonitor = new MemoryMonitor(editor)

// 定期查看内存报告
setInterval(() => {
  const report = memoryMonitor.getReport()
  console.log('内存报告:', report)
}, 30000) // 每 30 秒
```

## 交互性能优化

### 事件节流和防抖

```javascript
// 高性能事件处理
class PerformantEventHandler {
  constructor(editor) {
    this.editor = editor
    this.setupOptimizedEvents()
  }
  
  setupOptimizedEvents() {
    // 节流拖拽事件
    const throttledDrag = this.throttle((event) => {
      this.handleNodeDrag(event)
    }, 16) // 60fps
    
    this.editor.on('node:drag:move', throttledDrag)
    
    // 防抖视图变化事件
    const debouncedViewportChange = this.debounce((event) => {
      this.handleViewportChange(event)
    }, 100)
    
    this.editor.on('viewport:changed', debouncedViewportChange)
    
    // 批量处理选择变化
    this.selectionQueue = []
    this.selectionProcessor = this.debounce(() => {
      this.processSelectionQueue()
    }, 50)
    
    this.editor.on('selection:changed', (event) => {
      this.selectionQueue.push(event)
      this.selectionProcessor()
    })
  }
  
  handleNodeDrag(event) {
    // 优化的拖拽处理
    const node = this.editor.getNode(event.data.nodeId)
    if (node) {
      // 只更新必要的视觉元素
      node.updatePosition(event.data.position)
      
      // 延迟更新连接线
      this.scheduleEdgeUpdate(node.id)
    }
  }
  
  scheduleEdgeUpdate(nodeId) {
    if (!this.edgeUpdateQueue) {
      this.edgeUpdateQueue = new Set()
    }
    
    this.edgeUpdateQueue.add(nodeId)
    
    if (!this.edgeUpdateScheduled) {
      this.edgeUpdateScheduled = true
      requestAnimationFrame(() => {
        this.processEdgeUpdates()
        this.edgeUpdateScheduled = false
      })
    }
  }
  
  processEdgeUpdates() {
    if (!this.edgeUpdateQueue) return
    
    this.edgeUpdateQueue.forEach(nodeId => {
      const edges = this.editor.getNodeEdges(nodeId)
      edges.forEach(edge => edge.updatePath())
    })
    
    this.edgeUpdateQueue.clear()
  }
  
  handleViewportChange(event) {
    // 优化的视图变化处理
    const viewport = event.data.viewport
    
    // 更新可见性
    this.updateElementVisibility(viewport)
    
    // 应用 LOD
    this.applyLevelOfDetail(viewport.zoom)
  }
  
  processSelectionQueue() {
    if (this.selectionQueue.length === 0) return
    
    // 只处理最后一个选择事件
    const latestSelection = this.selectionQueue[this.selectionQueue.length - 1]
    this.handleSelectionChange(latestSelection)
    
    this.selectionQueue.length = 0
  }
  
  handleSelectionChange(event) {
    // 优化的选择处理
    console.log('处理选择变化:', event.data)
  }
  
  throttle(func, limit) {
    let inThrottle
    return function() {
      const args = arguments
      const context = this
      if (!inThrottle) {
        func.apply(context, args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  }
  
  debounce(func, wait) {
    let timeout
    return function() {
      const context = this
      const args = arguments
      clearTimeout(timeout)
      timeout = setTimeout(() => func.apply(context, args), wait)
    }
  }
}

// 启用优化的事件处理
const eventHandler = new PerformantEventHandler(editor)
```

### 智能重绘

```javascript
// 智能重绘系统
class SmartRedrawManager {
  constructor(editor) {
    this.editor = editor
    this.dirtyRegions = []
    this.redrawScheduled = false
    this.fullRedrawNeeded = false
    
    this.setupSmartRedraw()
  }
  
  setupSmartRedraw() {
    // 拦截重绘请求
    this.originalRequestRedraw = this.editor.requestRedraw
    this.editor.requestRedraw = this.requestSmartRedraw.bind(this)
    
    // 监听元素变化
    this.editor.on('node:moved', (event) => {
      this.markRegionDirty(this.getNodeBounds(event.data.nodeId))
    })
    
    this.editor.on('edge:updated', (event) => {
      this.markRegionDirty(this.getEdgeBounds(event.data.edgeId))
    })
  }
  
  requestSmartRedraw(region = null) {
    if (region) {
      this.markRegionDirty(region)
    } else {
      this.fullRedrawNeeded = true
    }
    
    if (!this.redrawScheduled) {
      this.redrawScheduled = true
      requestAnimationFrame(() => {
        this.performSmartRedraw()
        this.redrawScheduled = false
      })
    }
  }
  
  markRegionDirty(bounds) {
    this.dirtyRegions.push(bounds)
    
    // 合并重叠区域
    this.mergeDirtyRegions()
  }
  
  mergeDirtyRegions() {
    if (this.dirtyRegions.length < 2) return
    
    const merged = []
    const sorted = this.dirtyRegions.sort((a, b) => a.x - b.x)
    
    let current = sorted[0]
    
    for (let i = 1; i < sorted.length; i++) {
      const next = sorted[i]
      
      if (this.regionsOverlap(current, next)) {
        current = this.mergeRegions(current, next)
      } else {
        merged.push(current)
        current = next
      }
    }
    
    merged.push(current)
    this.dirtyRegions = merged
  }
  
  regionsOverlap(a, b) {
    return !(
      a.x + a.width < b.x ||
      b.x + b.width < a.x ||
      a.y + a.height < b.y ||
      b.y + b.height < a.y
    )
  }
  
  mergeRegions(a, b) {
    const x = Math.min(a.x, b.x)
    const y = Math.min(a.y, b.y)
    const width = Math.max(a.x + a.width, b.x + b.width) - x
    const height = Math.max(a.y + a.height, b.y + b.height) - y
    
    return { x, y, width, height }
  }
  
  performSmartRedraw() {
    if (this.fullRedrawNeeded) {
      // 执行完整重绘
      this.originalRequestRedraw.call(this.editor)
      this.fullRedrawNeeded = false
    } else if (this.dirtyRegions.length > 0) {
      // 执行区域重绘
      this.dirtyRegions.forEach(region => {
        this.redrawRegion(region)
      })
    }
    
    this.dirtyRegions.length = 0
  }
  
  redrawRegion(region) {
    // 重绘指定区域
    const elementsInRegion = this.getElementsInRegion(region)
    elementsInRegion.forEach(element => {
      element.redraw()
    })
  }
  
  getElementsInRegion(region) {
    const elements = []
    
    // 查找区域内的节点
    this.editor.getAllNodes().forEach(node => {
      if (this.elementInRegion(node, region)) {
        elements.push(node)
      }
    })
    
    // 查找区域内的连接
    this.editor.getAllEdges().forEach(edge => {
      if (this.elementInRegion(edge, region)) {
        elements.push(edge)
      }
    })
    
    return elements
  }
  
  elementInRegion(element, region) {
    const bounds = element.getBounds()
    return this.regionsOverlap(bounds, region)
  }
  
  getNodeBounds(nodeId) {
    const node = this.editor.getNode(nodeId)
    return node ? node.getBounds() : null
  }
  
  getEdgeBounds(edgeId) {
    const edge = this.editor.getEdge(edgeId)
    return edge ? edge.getBounds() : null
  }
}

// 启用智能重绘
const smartRedraw = new SmartRedrawManager(editor)
```

## 性能监控和分析

### 性能指标收集

```javascript
// 性能指标收集器
class PerformanceCollector {
  constructor(editor) {
    this.editor = editor
    this.metrics = {
      renderTime: [],
      interactionLatency: [],
      memoryUsage: [],
      fps: []
    }
    
    this.startCollection()
  }
  
  startCollection() {
    // 监控渲染性能
    this.monitorRenderPerformance()
    
    // 监控交互延迟
    this.monitorInteractionLatency()
    
    // 监控内存使用
    this.monitorMemoryUsage()
    
    // 监控帧率
    this.monitorFrameRate()
  }
  
  monitorRenderPerformance() {
    const originalRender = this.editor.render
    this.editor.render = (...args) => {
      const start = performance.now()
      const result = originalRender.apply(this.editor, args)
      const end = performance.now()
      
      this.recordMetric('renderTime', end - start)
      return result
    }
  }
  
  monitorInteractionLatency() {
    const events = ['node:drag:start', 'node:click', 'edge:click']
    
    events.forEach(eventName => {
      this.editor.on(eventName, () => {
        const start = performance.now()
        
        // 测量到下一帧的延迟
        requestAnimationFrame(() => {
          const end = performance.now()
          this.recordMetric('interactionLatency', end - start)
        })
      })
    })
  }
  
  monitorMemoryUsage() {
    setInterval(() => {
      if (performance.memory) {
        this.recordMetric('memoryUsage', performance.memory.usedJSHeapSize)
      }
    }, 5000)
  }
  
  monitorFrameRate() {
    let lastTime = performance.now()
    let frameCount = 0
    
    const measureFPS = () => {
      const currentTime = performance.now()
      frameCount++
      
      if (currentTime - lastTime >= 1000) {
        const fps = frameCount * 1000 / (currentTime - lastTime)
        this.recordMetric('fps', fps)
        
        frameCount = 0
        lastTime = currentTime
      }
      
      requestAnimationFrame(measureFPS)
    }
    
    requestAnimationFrame(measureFPS)
  }
  
  recordMetric(type, value) {
    const metrics = this.metrics[type]
    metrics.push({
      timestamp: Date.now(),
      value: value
    })
    
    // 保持最近 100 个样本
    if (metrics.length > 100) {
      metrics.shift()
    }
  }
  
  getMetrics() {
    const result = {}
    
    Object.keys(this.metrics).forEach(type => {
      const values = this.metrics[type].map(m => m.value)
      
      if (values.length > 0) {
        result[type] = {
          current: values[values.length - 1],
          average: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          samples: values.length
        }
      }
    })
    
    return result
  }
  
  getPerformanceReport() {
    const metrics = this.getMetrics()
    
    return {
      timestamp: new Date().toISOString(),
      nodeCount: this.editor.getAllNodes().length,
      edgeCount: this.editor.getAllEdges().length,
      metrics: metrics,
      recommendations: this.generateRecommendations(metrics)
    }
  }
  
  generateRecommendations(metrics) {
    const recommendations = []
    
    // 渲染性能建议
    if (metrics.renderTime && metrics.renderTime.average > 16) {
      recommendations.push('渲染时间过长，建议启用 LOD 或减少可见元素')
    }
    
    // 帧率建议
    if (metrics.fps && metrics.fps.average < 30) {
      recommendations.push('帧率过低，建议启用性能优化选项')
    }
    
    // 内存建议
    if (metrics.memoryUsage && metrics.memoryUsage.current > 100 * 1024 * 1024) {
      recommendations.push('内存使用过高，建议清理不需要的元素')
    }
    
    // 交互延迟建议
    if (metrics.interactionLatency && metrics.interactionLatency.average > 100) {
      recommendations.push('交互延迟过高，建议启用事件节流')
    }
    
    return recommendations
  }
}

// 启用性能收集
const performanceCollector = new PerformanceCollector(editor)

// 定期生成性能报告
setInterval(() => {
  const report = performanceCollector.getPerformanceReport()
  console.log('性能报告:', report)
  
  // 如果有建议，显示警告
  if (report.recommendations.length > 0) {
    console.warn('性能建议:', report.recommendations)
  }
}, 60000) // 每分钟
```

## 最佳实践总结

### 1. 包管理器优化

```bash
# 始终使用 pnpm
pnpm install
pnpm run build
pnpm run test

# 配置 .npmrc 优化
echo "shamefully-hoist=false" >> .npmrc
echo "strict-peer-dependencies=true" >> .npmrc
echo "auto-install-peers=true" >> .npmrc
```

### 2. 编辑器配置优化

```javascript
const optimizedEditor = new FlowEditor(container, {
  // 启用所有性能优化
  enablePerformanceOptimization: true,
  maxVisibleNodes: 200,
  maxVisibleEdges: 500,
  enableLevelOfDetail: true,
  lodThreshold: 0.5,
  enableVirtualization: true,
  renderBatchSize: 50,
  renderThrottleMs: 16,
  enableGPUAcceleration: true,
  interactionThrottleMs: 10,
  enableSmartRedraw: true
})
```

### 3. 大量数据处理

```javascript
// 使用批量操作
await editor.batchOperation(largeDataSet, processFunction)

// 启用虚拟化
const virtualization = new ViewportVirtualization(editor)

// 使用对象池
const nodePool = new ObjectPool(createNode, resetNode)
```

### 4. 内存管理

```javascript
// 定期清理
setInterval(() => {
  editor.cleanup()
  if (window.gc) window.gc() // 开发环境
}, 300000) // 5分钟

// 监控内存
const memoryMonitor = new MemoryMonitor(editor)
```

### 5. 事件优化

```javascript
// 使用节流和防抖
const throttledHandler = throttle(handler, 16)
const debouncedHandler = debounce(handler, 100)

// 及时清理事件监听器
editor.removeAllListeners()
```

## 性能基准测试

### 测试场景

1. **小型工作流** (< 50 节点)
   - 目标 FPS: 60
   - 渲染时间: < 16ms
   - 内存使用: < 50MB

2. **中型工作流** (50-200 节点)
   - 目标 FPS: 45
   - 渲染时间: < 22ms
   - 内存使用: < 100MB

3. **大型工作流** (200-1000 节点)
   - 目标 FPS: 30
   - 渲染时间: < 33ms
   - 内存使用: < 200MB

### 性能测试代码

```javascript
// 性能基准测试
async function runPerformanceBenchmark() {
  const scenarios = [
    { name: '小型工作流', nodeCount: 25, edgeCount: 30 },
    { name: '中型工作流', nodeCount: 100, edgeCount: 150 },
    { name: '大型工作流', nodeCount: 500, edgeCount: 750 }
  ]
  
  for (const scenario of scenarios) {
    console.log(`\n=== ${scenario.name} 性能测试 ===`)
    
    // 创建测试数据
    const testData = generateTestData(scenario.nodeCount, scenario.edgeCount)
    
    // 测试创建性能
    const createStart = performance.now()
    await createWorkflow(testData)
    const createTime = performance.now() - createStart
    
    // 测试渲染性能
    const renderMetrics = await measureRenderPerformance(5000) // 5秒测试
    
    // 测试交互性能
    const interactionMetrics = await measureInteractionPerformance(100) // 100次交互
    
    console.log('结果:', {
      创建时间: `${createTime.toFixed(2)}ms`,
      平均FPS: renderMetrics.averageFPS.toFixed(1),
      平均渲染时间: `${renderMetrics.averageRenderTime.toFixed(2)}ms`,
      交互延迟: `${interactionMetrics.averageLatency.toFixed(2)}ms`,
      内存使用: `${(performance.memory?.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB`
    })
    
    // 清理
    editor.clear()
  }
}

// 运行基准测试
runPerformanceBenchmark()
```

通过遵循这些性能优化指南，您可以确保 Leafer-Flow 在各种规模的工作流中都能提供流畅的用户体验。记住，性能优化是一个持续的过程，需要根据具体的使用场景进行调整和优化。
