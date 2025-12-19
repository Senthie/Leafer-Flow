<template>
  <div class="app">
    <header class="app-header">
      <h1>Leafer-Flow Vue3 测试页面</h1>
      <p>用于验证和展示工作流编辑器的各项功能</p>
    </header>

    <main class="app-main">
      <div class="editor-container">
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

        <div class="panel">
          <div class="panel-header">状态信息</div>
          <div class="panel-body">
            <div v-if="editorInstance">
              <p><strong>编辑器状态:</strong> {{ editorStatus }}</p>
              <p><strong>节点数量:</strong> {{ nodeCount }}</p>
              <p><strong>连接数量:</strong> {{ edgeCount }}</p>
              <p><strong>选中节点:</strong> {{ selectedNodeCount }}</p>
              <p><strong>选中连接:</strong> {{ selectedEdgeCount }}</p>
              <p>
                <strong>拖拽状态:</strong> {{ isDragging ? '拖拽中' : '空闲' }}
              </p>
              <p>
                <strong>连接状态:</strong>
                {{ isConnecting ? '连接中' : '空闲' }}
              </p>
              <div v-if="currentViewport">
                <p>
                  <strong>视图位置:</strong> ({{
                    Math.round(currentViewport.x)
                  }}, {{ Math.round(currentViewport.y) }})
                </p>
                <p>
                  <strong>缩放级别:</strong>
                  {{ Math.round(currentViewport.zoom * 100) }}%
                </p>
              </div>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import FlowEditorContainer from './components/FlowEditorContainer.vue'
import ControlPanel from './components/ControlPanel.vue'
// import type { FlowEditor } from '../../dist'

// 应用状态
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

// 计算属性
const editorStatus = computed(() => {
  if (!editorInstance.value) return '未初始化'
  return '已就绪'
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

  console.log('编辑器已就绪:', editor)
}

const onEditorError = (error: Error) => {
  console.error('编辑器错误:', error)
  editorInstance.value = null
  nodeCount.value = 0
  edgeCount.value = 0
}

const onEditorDestroyed = () => {
  console.log('编辑器已销毁')
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
  updateCounts()
}

const onEdgeCreate = (edge: any) => {
  console.log('连接创建事件:', edge)
  updateCounts()
}

const onClearCanvas = () => {
  console.log('画布清空事件')
  updateCounts()
  exportedJSON.value = '' // 清空导出的JSON显示
}

const onExportJSON = (jsonData: string) => {
  console.log('JSON导出事件:', jsonData)
  exportedJSON.value = jsonData
  serializationStatus.value = 'exported'
  serializationMessage.value = '数据导出成功'
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
  } else {
    serializationMessage.value = '数据导入成功'
  }
}

const onSerializationError = (error: Error) => {
  console.error('序列化错误:', error)
  serializationStatus.value = 'error'
  serializationMessage.value = `错误: ${error.message}`
}

// 交互事件处理
const onNodeSelected = (event: any) => {
  console.log('节点选中事件:', event)
  updateSelectionCounts()
}

const onNodeDeselected = (event: any) => {
  console.log('节点取消选中事件:', event)
  updateSelectionCounts()
}

const onSelectionCleared = (event: any) => {
  console.log('选择清空事件:', event)
  selectedNodeCount.value = 0
  selectedEdgeCount.value = 0
}

const onDragStart = (event: any) => {
  console.log('拖拽开始事件:', event)
  isDragging.value = true
  lastInteractionTime.value = Date.now()

  // 提供触觉反馈（如果支持）
  if (navigator.vibrate) {
    navigator.vibrate(50)
  }
}

const onDragMove = (event: any) => {
  console.log('拖拽移动事件:', event)
  // 实时更新拖拽反馈
  lastInteractionTime.value = Date.now()
}

const onDragEnd = (event: any) => {
  console.log('拖拽结束事件:', event)
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

  // 临时显示缩放状态
  isZooming.value = true
  setTimeout(() => {
    isZooming.value = false
  }, 500)
}

const onConnectionStart = (event: any) => {
  console.log('连接开始事件:', event)
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
    updateCounts() // 如果创建了连接，更新计数
    // 提供成功反馈
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100])
    }
  } else {
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

// 初始化日志
console.log('Vue3测试页面已加载')
</script>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--bg-color-page);
}

.app-header {
  background-color: var(--bg-color);
  border-bottom: 1px solid var(--border-color-light);
  padding: 20px;
  text-align: center;
  box-shadow: var(--box-shadow);
}

.app-header h1 {
  color: var(--text-color-primary);
  margin-bottom: 8px;
  font-size: 24px;
  font-weight: 600;
}

.app-header p {
  color: var(--text-color-secondary);
  font-size: 14px;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .app-main {
    flex-direction: column;
  }

  .control-panel {
    width: 100%;
    max-height: 300px;
  }

  .app-header {
    padding: 16px;
  }

  .app-header h1 {
    font-size: 20px;
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
}
</style>
