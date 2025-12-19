<template>
  <div class="app" :class="{ 'has-error': hasGlobalError }">
    <!-- 全局错误边界 -->
    <div v-if="hasGlobalError" class="global-error-boundary">
      <div class="error-content">
        <span class="error-icon">⚠️</span>
        <h2>应用发生错误</h2>
        <p class="error-message">{{ globalErrorMessage }}</p>
        <div class="error-actions">
          <button class="btn btn-primary" @click="recoverFromError">
            🔄 尝试恢复
          </button>
          <button class="btn btn-secondary" @click="reloadPage">
            🔃 刷新页面
          </button>
        </div>
      </div>
    </div>

    <!-- 主应用内容 -->
    <template v-else>
      <header class="app-header">
        <div class="header-content">
          <h1>Leafer-Flow Vue3 测试页面</h1>
          <p class="header-description">用于验证和展示工作流编辑器的各项功能</p>
        </div>
        <div class="header-status">
          <span class="status-indicator" :class="editorStatusClass">
            {{ editorStatusText }}
          </span>
        </div>
      </header>

      <main class="app-main">
        <div
          class="editor-container"
          :class="{
            'has-selection': selectedNodeCount > 0 || selectedEdgeCount > 0,
          }"
        >
          <FlowEditorContainer
            ref="editorContainerRef"
            :background="editorBackground"
            :show-grid="showGrid"
            @editor-ready="onEditorReady"
            @editor-error="onEditorError"
            @editor-destroyed="onEditorDestroyed"
            @node-selected="onNodeSelected"
            @node-deselected="onNodeDeselected"
            @selection-cleared="onSelectionCleared"
            @drag-start="onDragStart"
            @drag-move="onDragMove"
            @drag-end="onDragEnd"
            @viewport-changed="onViewportChanged"
            @connection-start="onConnectionStart"
            @connection-end="onConnectionEnd"
          />

          <!-- Interactive feedback overlay -->
          <div v-if="showInteractionFeedback" class="interaction-feedback">
            <div class="feedback-item" v-if="isDragging">
              <span class="feedback-icon">🖱️</span>
              <span>拖拽中...</span>
            </div>
            <div class="feedback-item" v-if="isConnecting">
              <span class="feedback-icon">🔗</span>
              <span>连接中...</span>
            </div>
            <div class="feedback-item" v-if="isZooming">
              <span class="feedback-icon">🔍</span>
              <span>缩放中...</span>
            </div>
          </div>
        </div>

        <aside class="control-panel">
          <!-- 控制面板组件 -->
          <ControlPanel
            :editor="editorInstance"
            :is-dragging="isDragging"
            :is-connecting="isConnecting"
            :selected-node-count="selectedNodeCount"
            :selected-edge-count="selectedEdgeCount"
            @node-create="onNodeCreate"
            @edge-create="onEdgeCreate"
            @clear-canvas="onClearCanvas"
            @export-json="onExportJSON"
            @import-json="onImportJSON"
            @serialization-error="onSerializationError"
          />

          <!-- 状态面板组件 -->
          <StatusPanel
            :node-count="nodeCount"
            :edge-count="edgeCount"
            :viewport="currentViewport"
            :is-connected="!!editorInstance"
          />

          <!-- 事件日志组件 -->
          <EventLog
            :events="eventLog"
            :max-entries="maxEventLogEntries"
            :max-displayed="50"
            :show-event-data="true"
            :auto-scroll="true"
            @clear-log="clearEventLog"
          />

          <!-- 交互状态面板 -->
          <div class="panel">
            <div class="panel-header">交互状态</div>
            <div class="panel-body">
              <div v-if="editorInstance">
                <p><strong>选中节点:</strong> {{ selectedNodeCount }}</p>
                <p><strong>选中连接:</strong> {{ selectedEdgeCount }}</p>
                <p>
                  <strong>拖拽状态:</strong>
                  {{ isDragging ? '拖拽中' : '空闲' }}
                </p>
                <p>
                  <strong>连接状态:</strong>
                  {{ isConnecting ? '连接中' : '空闲' }}
                </p>
              </div>
              <p v-else>等待编辑器初始化...</p>
            </div>
          </div>

          <div class="panel">
            <div class="panel-header">视图控制</div>
            <div class="panel-body">
              <div class="button-group">
                <button
                  class="btn btn-secondary"
                  :disabled="!editorInstance"
                  @click="zoomIn"
                  title="放大视图"
                >
                  🔍+ 放大
                </button>
                <button
                  class="btn btn-secondary"
                  :disabled="!editorInstance"
                  @click="zoomOut"
                  title="缩小视图"
                >
                  🔍- 缩小
                </button>
                <button
                  class="btn btn-secondary"
                  :disabled="!editorInstance"
                  @click="resetZoom"
                  title="重置缩放"
                >
                  🎯 重置缩放
                </button>
                <button
                  class="btn btn-secondary"
                  :disabled="!editorInstance"
                  @click="centerView"
                  title="居中视图"
                >
                  🏠 居中视图
                </button>
                <button
                  class="btn btn-secondary"
                  :disabled="!editorInstance"
                  @click="fitView"
                  title="适应视图"
                >
                  📐 适应视图
                </button>
              </div>
            </div>
          </div>

          <div class="panel">
            <div class="panel-header">选择控制</div>
            <div class="panel-body">
              <div class="button-group">
                <button
                  class="btn btn-warning"
                  :disabled="
                    !editorInstance ||
                    (selectedNodeCount === 0 && selectedEdgeCount === 0)
                  "
                  @click="clearSelection"
                  title="清空选择"
                >
                  ❌ 清空选择
                </button>
              </div>
              <p class="help-text">
                提示：点击节点选择，Ctrl+点击多选，点击空白区域取消选择，拖拽移动节点
              </p>
            </div>
          </div>

          <div class="panel">
            <div class="panel-header">编辑器配置</div>
            <div class="panel-body">
              <div class="form-group">
                <label class="form-label">
                  <input
                    type="checkbox"
                    v-model="showGrid"
                    style="margin-right: 8px"
                  />
                  显示网格
                </label>
              </div>
              <div class="form-group">
                <label class="form-label">背景颜色:</label>
                <input
                  type="color"
                  v-model="editorBackground"
                  class="form-input"
                  style="height: 32px"
                />
              </div>
            </div>
          </div>

          <!-- 序列化状态显示 -->
          <div v-if="serializationStatus !== 'idle'" class="panel">
            <div class="panel-header">
              序列化状态
              <span
                class="status-badge"
                :class="{
                  'status-success':
                    serializationStatus === 'exported' ||
                    serializationStatus === 'imported',
                  'status-error': serializationStatus === 'error',
                }"
              >
                {{
                  serializationStatus === 'exported'
                    ? '已导出'
                    : serializationStatus === 'imported'
                    ? '已导入'
                    : '错误'
                }}
              </span>
            </div>
            <div class="panel-body">
              <p class="serialization-message">{{ serializationMessage }}</p>
            </div>
          </div>

          <!-- JSON 数据显示区域 -->
          <div v-if="exportedJSON" class="panel">
            <div class="panel-header">
              导出的JSON数据
              <button class="copy-btn" @click="copyJSON" title="复制到剪贴板">
                📋
              </button>
            </div>
            <div class="panel-body">
              <textarea
                v-model="exportedJSON"
                readonly
                class="json-display"
                rows="10"
              ></textarea>
              <div class="json-stats">
                <span v-if="jsonStats">
                  {{ jsonStats.nodeCount }} 个节点 |
                  {{ jsonStats.edgeCount }} 条连接
                </span>
              </div>
            </div>
          </div>
        </aside>
      </main>

      <!-- 全局加载指示器 -->
      <div v-if="isGlobalLoading" class="global-loading-overlay">
        <div class="loading-spinner"></div>
        <p>{{ globalLoadingMessage }}</p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, onErrorCaptured } from 'vue'
import FlowEditorContainer from './components/FlowEditorContainer.vue'
import ControlPanel from './components/ControlPanel.vue'
import StatusPanel from './components/StatusPanel.vue'
import EventLog from './components/EventLog.vue'
import type { EventLogEntry } from './components/EventLog.vue'
// import type { FlowEditor } from '../../dist'

// ==================== 全局错误处理状态 ====================
const hasGlobalError = ref(false)
const globalErrorMessage = ref('')
const isGlobalLoading = ref(false)
const globalLoadingMessage = ref('')

// 全局错误处理函数
const handleGlobalError = (error: Error, source: string = '未知来源') => {
  console.error(`[全局错误] ${source}:`, error)
  hasGlobalError.value = true
  globalErrorMessage.value = `${source}: ${error.message}`
  addEventLog('error', `全局错误: ${error.message}`, {
    source,
    error: error.message,
  })
}

// 从错误中恢复
const recoverFromError = () => {
  hasGlobalError.value = false
  globalErrorMessage.value = ''
  // 尝试重新初始化编辑器
  if (editorContainerRef.value) {
    editorContainerRef.value.retryInitialization()
  }
  addEventLog('info', '尝试从错误中恢复')
}

// 刷新页面
const reloadPage = () => {
  window.location.reload()
}

// 设置全局加载状态
const setGlobalLoading = (loading: boolean, message: string = '') => {
  isGlobalLoading.value = loading
  globalLoadingMessage.value = message
}

// Vue错误边界 - 捕获子组件错误
onErrorCaptured((error: Error, _instance, info) => {
  console.error('[Vue错误边界] 捕获到错误:', error, info)
  handleGlobalError(error, `组件错误 (${info})`)
  // 返回false阻止错误继续传播
  return false
})

// 全局未捕获错误处理
const globalErrorHandler = (event: ErrorEvent) => {
  console.error('[全局错误处理器] 未捕获错误:', event.error)
  handleGlobalError(
    event.error || new Error(event.message),
    '未捕获的JavaScript错误'
  )
  event.preventDefault()
}

// 全局Promise拒绝处理
const globalRejectionHandler = (event: PromiseRejectionEvent) => {
  console.error('[全局错误处理器] 未处理的Promise拒绝:', event.reason)
  const error =
    event.reason instanceof Error
      ? event.reason
      : new Error(String(event.reason))
  handleGlobalError(error, '未处理的Promise拒绝')
  event.preventDefault()
}

// 注册全局错误处理器
onMounted(() => {
  window.addEventListener('error', globalErrorHandler)
  window.addEventListener('unhandledrejection', globalRejectionHandler)
  console.log('Vue3测试页面已加载，全局错误处理器已注册')
  addEventLog('info', '应用初始化完成')
})

// 清理全局错误处理器
onUnmounted(() => {
  window.removeEventListener('error', globalErrorHandler)
  window.removeEventListener('unhandledrejection', globalRejectionHandler)
})

// ==================== 应用状态 ====================
const editorInstance = ref<any>(null)
const editorContainerRef = ref<any>(null)
const nodeCount = ref(0)
const edgeCount = ref(0)
const editorBackground = ref('#ffffff')
const showGrid = ref(true)
const exportedJSON = ref('')

// 序列化状态
const serializationStatus = ref<'idle' | 'exported' | 'imported' | 'error'>(
  'idle'
)
const serializationMessage = ref('')

// 事件日志状态
const eventLog = ref<EventLogEntry[]>([])
const maxEventLogEntries = 100

// 交互状态
const selectedNodeCount = ref(0)
const selectedEdgeCount = ref(0)
const isDragging = ref(false)
const isConnecting = ref(false)
const isZooming = ref(false)
const isPanning = ref(false)
const currentViewport = ref<any>(null)
const showInteractionFeedback = ref(true)
const lastInteractionTime = ref(Date.now())

// ==================== 编辑器状态计算属性 ====================
const editorStatusClass = computed(() => ({
  'status-ready': !!editorInstance.value,
  'status-loading': !editorInstance.value && !hasGlobalError.value,
  'status-error': hasGlobalError.value,
}))

const editorStatusText = computed(() => {
  if (hasGlobalError.value) return '❌ 错误'
  if (editorInstance.value) return '✅ 已就绪'
  return '⏳ 初始化中...'
})

// JSON统计信息
const jsonStats = computed(() => {
  if (!exportedJSON.value) return null
  try {
    const data = JSON.parse(exportedJSON.value)
    return {
      nodeCount: data.nodes?.length || 0,
      edgeCount: data.edges?.length || 0,
    }
  } catch {
    return null
  }
})

// 复制JSON到剪贴板
const copyJSON = async () => {
  if (!exportedJSON.value) return
  try {
    await navigator.clipboard.writeText(exportedJSON.value)
    serializationMessage.value = 'JSON已复制到剪贴板'
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 编辑器事件处理
const onEditorReady = (editor: any) => {
  editorInstance.value = editor
  updateCounts()

  // 监听编辑器事件以更新状态（检查editor是否存在且有on方法）
  if (editor && typeof editor.on === 'function') {
    editor.on('node:created', updateCounts)
    editor.on('node:deleted', updateCounts)
    editor.on('edge:created', updateCounts)
    editor.on('edge:deleted', updateCounts)
  }

  addEventLog('info', '编辑器初始化成功', { editorId: editor?.id })
  console.log('编辑器已就绪:', editor)
}

const onEditorError = (error: Error) => {
  console.error('编辑器错误:', error)
  addEventLog('error', `编辑器错误: ${error.message}`, { error: error.message })
  editorInstance.value = null
  nodeCount.value = 0
  edgeCount.value = 0
}

const onEditorDestroyed = () => {
  console.log('编辑器已销毁')
  addEventLog('info', '编辑器已销毁')
  editorInstance.value = null
  nodeCount.value = 0
  edgeCount.value = 0
}

// 更新计数
const updateCounts = () => {
  if (editorInstance.value) {
    nodeCount.value = editorInstance.value.getAllNodes().length
    edgeCount.value = editorInstance.value.getAllEdges().length
  }
}

// 控制面板事件处理
const onNodeCreate = (type: string, node: any) => {
  console.log(`节点创建事件: ${type}`, node)
  addEventLog('node:created', `创建了 ${type} 类型的节点`, {
    type,
    nodeId: node?.id,
  })
  updateCounts()
}

const onEdgeCreate = (edge: any) => {
  console.log('连接创建事件:', edge)
  addEventLog('edge:created', `创建了连接: ${edge?.source} → ${edge?.target}`, {
    edgeId: edge?.id,
    source: edge?.source,
    target: edge?.target,
  })
  updateCounts()
}

const onClearCanvas = () => {
  console.log('画布清空事件')
  addEventLog('canvas:cleared', '画布已清空')
  updateCounts()
  exportedJSON.value = '' // 清空导出的JSON显示
}

const onExportJSON = (jsonData: string) => {
  console.log('JSON导出事件:', jsonData)
  exportedJSON.value = jsonData
  serializationStatus.value = 'exported'
  serializationMessage.value = '数据导出成功'
  try {
    const data = JSON.parse(jsonData)
    addEventLog(
      'data:exported',
      `导出了 ${data.nodes?.length || 0} 个节点和 ${
        data.edges?.length || 0
      } 条连接`,
      { nodeCount: data.nodes?.length, edgeCount: data.edges?.length }
    )
  } catch {
    addEventLog('data:exported', '数据导出成功')
  }
}

const onImportJSON = (data?: any) => {
  console.log('JSON导入事件:', data)
  updateCounts()
  exportedJSON.value = '' // 清空之前的导出数据显示
  serializationStatus.value = 'imported'
  if (data) {
    serializationMessage.value = `导入成功: ${
      data.nodes?.length || 0
    } 个节点, ${data.edges?.length || 0} 条连接`
    addEventLog(
      'data:imported',
      `导入了 ${data.nodes?.length || 0} 个节点和 ${
        data.edges?.length || 0
      } 条连接`,
      { nodeCount: data.nodes?.length, edgeCount: data.edges?.length }
    )
  } else {
    serializationMessage.value = '数据导入成功'
    addEventLog('data:imported', '数据导入成功')
  }
}

const onSerializationError = (error: Error) => {
  console.error('序列化错误:', error)
  serializationStatus.value = 'error'
  serializationMessage.value = `错误: ${error.message}`
  addEventLog('error', `序列化错误: ${error.message}`, { error: error.message })
}

// 交互事件处理
const onNodeSelected = (event: any) => {
  console.log('节点选中事件:', event)
  addEventLog('node:selected', `选中了节点`, { nodeId: event?.data?.nodeId })
  updateSelectionCounts()
}

const onNodeDeselected = (event: any) => {
  console.log('节点取消选中事件:', event)
  addEventLog('node:deselected', `取消选中节点`, {
    nodeId: event?.data?.nodeId,
  })
  updateSelectionCounts()
}

const onSelectionCleared = (event: any) => {
  console.log('选择清空事件:', event)
  addEventLog('selection:cleared', '清空了所有选择')
  selectedNodeCount.value = 0
  selectedEdgeCount.value = 0
}

const onDragStart = (event: any) => {
  console.log('拖拽开始事件:', event)
  addEventLog('drag:start', '开始拖拽', { nodeId: event?.data?.nodeId })
  isDragging.value = true
  lastInteractionTime.value = Date.now()

  // 提供触觉反馈（如果支持）
  if (navigator.vibrate) {
    navigator.vibrate(50)
  }
}

const onDragMove = (event: any) => {
  console.log('拖拽移动事件:', event)
  // 实时更新拖拽反馈（不记录日志，避免过多条目）
  lastInteractionTime.value = Date.now()
}

const onDragEnd = (event: any) => {
  console.log('拖拽结束事件:', event)
  addEventLog('drag:end', '拖拽结束', {
    nodeId: event?.data?.nodeId,
    position: event?.data?.position,
  })
  isDragging.value = false
  lastInteractionTime.value = Date.now()
  updateCounts() // 更新位置可能影响的计数

  // 提供完成反馈
  if (navigator.vibrate) {
    navigator.vibrate([50, 50, 50])
  }
}

const onViewportChanged = (event: any) => {
  console.log('视图变化事件:', event)
  currentViewport.value = event.data?.viewport || null
  lastInteractionTime.value = Date.now()
  // 视图变化事件不记录日志，避免过多条目

  // 临时显示缩放状态
  isZooming.value = true
  setTimeout(() => {
    isZooming.value = false
  }, 500)
}

const onConnectionStart = (event: any) => {
  console.log('连接开始事件:', event)
  addEventLog('connection:start', '开始创建连接', {
    sourceNode: event?.data?.sourceNode,
    sourcePort: event?.data?.sourcePort,
  })
  isConnecting.value = true
  lastInteractionTime.value = Date.now()

  // 提供连接开始反馈
  if (navigator.vibrate) {
    navigator.vibrate(100)
  }
}

const onConnectionEnd = (event: any) => {
  console.log('连接结束事件:', event)
  isConnecting.value = false
  lastInteractionTime.value = Date.now()

  if (event.data?.connectionCreated) {
    addEventLog('connection:end', '连接创建成功', { connectionCreated: true })
    updateCounts() // 如果创建了连接，更新计数
    // 提供成功反馈
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100])
    }
  } else {
    addEventLog('connection:end', '连接创建取消', { connectionCreated: false })
    // 提供失败反馈
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200])
    }
  }
}

// 更新选择计数
const updateSelectionCounts = () => {
  if (editorContainerRef.value) {
    selectedNodeCount.value = editorContainerRef.value.getSelectedNodes().length
    selectedEdgeCount.value = editorContainerRef.value.getSelectedEdges().length
  }
}

// 视图控制方法（带反馈）
const zoomIn = () => {
  if (editorContainerRef.value) {
    editorContainerRef.value.zoomIn()
    // 提供视觉反馈
    isZooming.value = true
    setTimeout(() => {
      isZooming.value = false
    }, 300)
  }
}

const zoomOut = () => {
  if (editorContainerRef.value) {
    editorContainerRef.value.zoomOut()
    // 提供视觉反馈
    isZooming.value = true
    setTimeout(() => {
      isZooming.value = false
    }, 300)
  }
}

const resetZoom = () => {
  if (editorContainerRef.value) {
    editorContainerRef.value.resetZoom()
    // 提供重置反馈
    isZooming.value = true
    setTimeout(() => {
      isZooming.value = false
    }, 500)
  }
}

const centerView = () => {
  if (editorContainerRef.value) {
    editorContainerRef.value.centerView()
    // 提供居中反馈
    isPanning.value = true
    setTimeout(() => {
      isPanning.value = false
    }, 400)
  }
}

const fitView = () => {
  if (editorContainerRef.value) {
    editorContainerRef.value.fitView()
    // 提供适应视图反馈
    isZooming.value = true
    isPanning.value = true
    setTimeout(() => {
      isZooming.value = false
      isPanning.value = false
    }, 600)
  }
}

const clearSelection = () => {
  if (editorContainerRef.value) {
    editorContainerRef.value.clearSelection()
    // 立即更新选择计数
    selectedNodeCount.value = 0
    selectedEdgeCount.value = 0
  }
}

// 事件日志工具函数
const generateEventId = (): string => {
  return `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

const addEventLog = (type: string, message: string, data?: any) => {
  const entry: EventLogEntry = {
    id: generateEventId(),
    timestamp: new Date(),
    type,
    data: data || null,
    message,
  }

  // 添加到日志开头（最新的在前面）
  eventLog.value.unshift(entry)

  // 限制日志条目数量
  if (eventLog.value.length > maxEventLogEntries) {
    eventLog.value = eventLog.value.slice(0, maxEventLogEntries)
  }
}

const clearEventLog = () => {
  eventLog.value = []
  addEventLog('info', '事件日志已清空')
}
</script>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--bg-color-page);
  position: relative;
}

.app.has-error {
  overflow: hidden;
}

/* ==================== 全局错误边界样式 ==================== */
.global-error-boundary {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.98);
  z-index: 9999;
  animation: fadeIn 0.3s ease;
}

.global-error-boundary .error-content {
  text-align: center;
  padding: 48px;
  max-width: 500px;
  background-color: var(--bg-color);
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow-light);
  border: 1px solid var(--danger-color);
}

.global-error-boundary .error-icon {
  font-size: 64px;
  display: block;
  margin-bottom: 16px;
}

.global-error-boundary h2 {
  color: var(--danger-color);
  margin-bottom: 12px;
  font-size: 24px;
  font-weight: 600;
}

.global-error-boundary .error-message {
  color: var(--text-color-secondary);
  margin-bottom: 24px;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
}

.global-error-boundary .error-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

/* ==================== 全局加载指示器样式 ==================== */
.global-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.9);
  z-index: 9998;
  animation: fadeIn 0.2s ease;
}

.global-loading-overlay .loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--border-color-light);
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

.global-loading-overlay p {
  color: var(--text-color-secondary);
  font-size: 14px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* ==================== 头部样式 ==================== */
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: var(--bg-color);
  border-bottom: 1px solid var(--border-color-light);
  padding: 16px 24px;
  box-shadow: var(--box-shadow);
}

.header-content {
  flex: 1;
}

.app-header h1 {
  color: var(--text-color-primary);
  margin-bottom: 4px;
  font-size: 22px;
  font-weight: 600;
}

.header-description {
  color: var(--text-color-secondary);
  font-size: 13px;
  margin: 0;
}

.header-status {
  display: flex;
  align-items: center;
}

.status-indicator {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: var(--border-radius-round);
  font-size: 12px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.status-indicator.status-ready {
  background-color: var(--success-bg);
  color: var(--success-color);
}

.status-indicator.status-loading {
  background-color: var(--info-bg);
  color: var(--info-color);
}

.status-indicator.status-error {
  background-color: var(--danger-bg);
  color: var(--danger-color);
}

.app-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.editor-container {
  flex: 1;
  padding: 16px;
  background-color: #fafafa;
  border-right: 1px solid var(--border-color-light);
}

.control-panel {
  width: 300px;
  padding: 20px;
  background-color: var(--bg-color-page);
  overflow-y: auto;
}

.control-panel .panel {
  margin-bottom: 20px;
}

.control-panel .panel:last-child {
  margin-bottom: 0;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid transparent;
  border-radius: var(--border-radius);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  width: 100%;
  background-color: var(--bg-color);
  color: var(--text-color-primary);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: var(--bg-color-disabled, #f5f5f5);
  color: var(--text-color-disabled, #999);
}

.btn-secondary {
  background-color: var(--secondary-color);
  color: white;
  border-color: var(--secondary-color);
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--secondary-color-hover);
  border-color: var(--secondary-color-hover);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(108, 117, 125, 0.3);
}

.btn-warning {
  background-color: var(--warning-color);
  color: var(--text-color-primary);
  border-color: var(--warning-color);
}

.btn-warning:hover:not(:disabled) {
  background-color: var(--warning-color-hover);
  border-color: var(--warning-color-hover);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(230, 162, 60, 0.3);
}

.help-text {
  font-size: 11px;
  color: var(--text-color-secondary);
  margin: 8px 0 0 0;
  line-height: 1.4;
  font-style: italic;
}

.json-display {
  width: 100%;
  padding: 12px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  background-color: #f5f5f5;
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
  resize: vertical;
  line-height: 1.5;
}

.json-stats {
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-color-secondary);
}

.status-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  margin-left: 8px;
}

.status-success {
  background-color: var(--success-bg, #e8f5e9);
  color: var(--success-color, #67c23a);
}

.status-error {
  background-color: var(--danger-bg, #fef0f0);
  color: var(--danger-color, #f56c6c);
}

.serialization-message {
  font-size: 13px;
  color: var(--text-color-secondary);
  margin: 0;
}

.copy-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  padding: 2px 6px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.copy-btn:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* 交互反馈样式 */
.interaction-feedback {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 1000;
  pointer-events: none;
}

.feedback-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  border-radius: var(--border-radius);
  font-size: 12px;
  margin-bottom: 4px;
  animation: fadeInOut 0.3s ease-in-out;
}

.feedback-icon {
  font-size: 14px;
}

@keyframes fadeInOut {
  0% {
    opacity: 0;
    transform: translateX(-10px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 增强的按钮反馈 */
.btn {
  position: relative;
  overflow: hidden;
}

.btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.3s, height 0.3s;
}

.btn:active::before {
  width: 100px;
  height: 100px;
}

/* 选择状态指示器 */
.editor-container {
  position: relative;
}

.editor-container::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 2px solid transparent;
  border-radius: var(--border-radius);
  pointer-events: none;
  transition: border-color 0.2s ease;
}

.editor-container.has-selection::after {
  border-color: var(--primary-color);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    border-color: var(--primary-color);
    opacity: 1;
  }
  50% {
    border-color: var(--primary-color);
    opacity: 0.5;
  }
  100% {
    border-color: var(--primary-color);
    opacity: 1;
  }
}

/* ==================== 响应式设计 ==================== */
@media (max-width: 1024px) {
  .app-header {
    padding: 12px 16px;
  }

  .app-header h1 {
    font-size: 18px;
  }

  .header-description {
    font-size: 12px;
  }

  .control-panel {
    width: 280px;
  }
}

@media (max-width: 768px) {
  .app-main {
    flex-direction: column;
  }

  .app-header {
    flex-direction: column;
    text-align: center;
    gap: 12px;
    padding: 16px;
  }

  .header-content {
    text-align: center;
  }

  .app-header h1 {
    font-size: 18px;
  }

  .control-panel {
    width: 100%;
    max-height: 50vh;
    border-right: none;
    border-top: 1px solid var(--border-color-light);
  }

  .editor-container {
    min-height: 300px;
    flex: 1;
  }

  .json-display {
    font-size: 11px;
  }

  .interaction-feedback {
    top: 10px;
    left: 10px;
  }

  .feedback-item {
    padding: 6px 10px;
    font-size: 11px;
  }

  .global-error-boundary .error-content {
    padding: 24px;
    margin: 16px;
  }

  .global-error-boundary h2 {
    font-size: 20px;
  }

  .global-error-boundary .error-icon {
    font-size: 48px;
  }

  .global-error-boundary .error-actions {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .app-header h1 {
    font-size: 16px;
  }

  .header-description {
    font-size: 11px;
  }

  .status-indicator {
    font-size: 11px;
    padding: 4px 8px;
  }

  .editor-container {
    min-height: 250px;
    padding: 8px;
  }

  .control-panel {
    padding: 12px;
  }
}
</style>
