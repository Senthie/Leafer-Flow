<template>
  <div
    ref="containerRef"
    class="flow-editor-container"
    :class="{
      dragging: interactionState.isDragging,
      connecting: interactionState.isConnecting,
      panning: interactionState.isPanning,
      'has-selection': interactionState.selectedCount > 0,
    }"
    :style="containerStyle"
  >
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>正在初始化编辑器...</p>
    </div>
    <div v-if="error" class="error-overlay">
      <div class="error-content">
        <h3>编辑器初始化失败</h3>
        <p>{{ error.message }}</p>
        <button class="btn btn-primary" @click="retryInitialization">
          重试
        </button>
      </div>
    </div>
    <div
      v-show="!isLoading && !error"
      ref="editorRef"
      class="editor-canvas"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { FlowEditor } from '../../../dist'

// Props interface
interface Props {
  width?: number
  height?: number
  background?: string
  showGrid?: boolean
  options?: any
}

// Emits interface
interface Emits {
  (e: 'editor-ready', editor: any): void
  (e: 'editor-error', error: Error): void
  (e: 'editor-destroyed'): void
  // Node events
  (e: 'node-created', event: any): void
  (e: 'node-deleted', event: any): void
  (e: 'node-selected', event: any): void
  (e: 'node-deselected', event: any): void
  // Edge events
  (e: 'edge-created', event: any): void
  (e: 'edge-deleted', event: any): void
  // Interaction events
  (e: 'drag-start', event: any): void
  (e: 'drag-move', event: any): void
  (e: 'drag-end', event: any): void
  (e: 'selection-cleared', event: any): void
  (e: 'connection-start', event: any): void
  (e: 'connection-end', event: any): void
  // Viewport events
  (e: 'viewport-changed', event: any): void
}

// Props with defaults
const props = withDefaults(defineProps<Props>(), {
  width: undefined,
  height: undefined,
  background: '#ffffff',
  showGrid: true,
  options: () => ({}),
})

// Emits
const emit = defineEmits<Emits>()

// Reactive references
const containerRef = ref<HTMLElement>()
const editorRef = ref<HTMLElement>()
const editorInstance = ref<any>(null)
const isLoading = ref(false)
const error = ref<Error | null>(null)
const containerSize = ref({ width: 0, height: 0 })

// Computed properties
const containerStyle = computed(() => ({
  width: props.width ? `${props.width}px` : '100%',
  height: props.height ? `${props.height}px` : '100%',
  backgroundColor: props.background,
}))

// Resize observer for responsive size handling
let resizeObserver: ResizeObserver | null = null

// Define custom node types for the workflow editor
const CUSTOM_NODE_TYPES = {
  start: {
    render: (node: any) => node,
    defaultData: {
      label: '开始',
      description: '工作流开始节点',
    },
    ports: [
      {
        id: 'output',
        type: 'output' as const,
        position: 'right' as const,
        dataType: 'any',
      },
    ],
    validate: (data: any) => data && typeof data === 'object',
  },
  process: {
    render: (node: any) => node,
    defaultData: {
      label: '处理',
      description: '数据处理节点',
    },
    ports: [
      {
        id: 'input',
        type: 'input' as const,
        position: 'left' as const,
        dataType: 'any',
      },
      {
        id: 'output',
        type: 'output' as const,
        position: 'right' as const,
        dataType: 'processed',
      },
    ],
    validate: (data: any) => data && typeof data === 'object',
  },
  end: {
    render: (node: any) => node,
    defaultData: {
      label: '结束',
      description: '工作流结束节点',
    },
    ports: [
      {
        id: 'input',
        type: 'input' as const,
        position: 'left' as const,
        dataType: 'processed',
      },
    ],
    validate: (data: any) => data && typeof data === 'object',
  },
}

// Initialize editor
const initializeEditor = async (): Promise<void> => {
  if (!editorRef.value) {
    throw new Error('编辑器容器元素未找到')
  }

  isLoading.value = true
  error.value = null

  try {
    // Wait for next tick to ensure DOM is ready
    await nextTick()

    // Update container size
    updateContainerSize()

    // Prepare editor options with custom node types
    const editorOptions: any = {
      container: editorRef.value,
      width: props.width || containerSize.value.width,
      height: props.height || containerSize.value.height,
      background: props.background,
      grid: props.showGrid,
      nodeTypes: CUSTOM_NODE_TYPES,
      ...props.options,
    }

    // Create FlowEditor instance
    editorInstance.value = new FlowEditor(editorRef.value, editorOptions)

    // Setup event listeners for editor events
    setupEditorEventListeners()

    // Emit editor ready event
    emit('editor-ready', editorInstance.value)

    console.log('FlowEditor 初始化成功', {
      width: editorOptions.width,
      height: editorOptions.height,
      background: editorOptions.background,
      grid: editorOptions.grid,
      nodeTypes: Object.keys(CUSTOM_NODE_TYPES),
    })
  } catch (err) {
    const initError = err instanceof Error ? err : new Error('未知的初始化错误')
    error.value = initError
    emit('editor-error', initError)
    console.error('FlowEditor 初始化失败:', initError)
  } finally {
    isLoading.value = false
  }
}

// Setup editor event listeners with enhanced interaction tracking
const setupEditorEventListeners = (): void => {
  if (!editorInstance.value) return

  // Listen to various editor events for debugging and monitoring
  editorInstance.value.on('node:created', (event: any) => {
    console.log('节点已创建:', event)
    updateInteractionState()
    emit('node-created', event)
  })

  editorInstance.value.on('node:deleted', (event: any) => {
    console.log('节点已删除:', event)
    updateInteractionState()
    emit('node-deleted', event)
  })

  editorInstance.value.on('edge:created', (event: any) => {
    console.log('连接已创建:', event)
    updateInteractionState()
    emit('edge-created', event)
  })

  editorInstance.value.on('edge:deleted', (event: any) => {
    console.log('连接已删除:', event)
    updateInteractionState()
    emit('edge-deleted', event)
  })

  editorInstance.value.on('viewport:changed', (event: any) => {
    console.log('视图已变化:', event)
    interactionState.value.lastInteraction = 'viewport'
    emit('viewport-changed', event)
  })

  // Interactive events with enhanced state tracking
  editorInstance.value.on('drag:start', (event: any) => {
    console.log('拖拽开始:', event)
    interactionState.value.isDragging = true
    interactionState.value.lastInteraction = 'drag'
    updateInteractionState()
    emit('drag-start', event)
  })

  editorInstance.value.on('drag:move', (event: any) => {
    console.log('拖拽移动:', event)
    // Throttle drag move events for performance
    if (Date.now() % 3 === 0) {
      // Only emit every 3rd event
      emit('drag-move', event)
    }
  })

  editorInstance.value.on('drag:end', (event: any) => {
    console.log('拖拽结束:', event)
    interactionState.value.isDragging = false
    interactionState.value.lastInteraction = 'drag-end'
    updateInteractionState()
    emit('drag-end', event)
  })

  editorInstance.value.on('node:selected', (event: any) => {
    console.log('节点已选中:', event)
    interactionState.value.lastInteraction = 'select'
    updateInteractionState()
    emit('node-selected', event)
  })

  editorInstance.value.on('node:deselected', (event: any) => {
    console.log('节点已取消选中:', event)
    interactionState.value.lastInteraction = 'deselect'
    updateInteractionState()
    emit('node-deselected', event)
  })

  editorInstance.value.on('selection:cleared', (event: any) => {
    console.log('选择已清空:', event)
    interactionState.value.lastInteraction = 'clear-selection'
    interactionState.value.selectedCount = 0
    updateInteractionState()
    emit('selection-cleared', event)
  })

  editorInstance.value.on('connection:start', (event: any) => {
    console.log('连接创建开始:', event)
    interactionState.value.isConnecting = true
    interactionState.value.lastInteraction = 'connect'
    updateInteractionState()
    emit('connection-start', event)
  })

  editorInstance.value.on('connection:end', (event: any) => {
    console.log('连接创建结束:', event)
    interactionState.value.isConnecting = false
    interactionState.value.lastInteraction = 'connect-end'
    updateInteractionState()
    emit('connection-end', event)
  })
}

// Update container size
const updateContainerSize = (): void => {
  if (containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect()
    containerSize.value = {
      width: rect.width,
      height: rect.height,
    }
  }
}

// Setup resize observer for responsive handling
const setupResizeObserver = (): void => {
  if (!containerRef.value) return

  resizeObserver = new ResizeObserver(entries => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect
      containerSize.value = { width, height }

      // Update editor size if editor is initialized and no explicit size is set
      if (editorInstance.value && !props.width && !props.height) {
        // Note: FlowEditor size update would be implemented here
        // For now, we'll just log the size change
        console.log('容器尺寸已变化:', { width, height })
      }
    }
  })

  resizeObserver.observe(containerRef.value)
}

// Retry initialization
const retryInitialization = (): void => {
  error.value = null
  initializeEditor()
}

// Destroy editor
const destroyEditor = (): void => {
  if (editorInstance.value) {
    editorInstance.value.destroy()
    editorInstance.value = null
    emit('editor-destroyed')
    console.log('FlowEditor 已销毁')
  }
}

// Cleanup resize observer
const cleanupResizeObserver = (): void => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
}

// Watch for prop changes that require re-initialization
watch(
  () => [props.background, props.showGrid],
  () => {
    if (editorInstance.value) {
      // For now, we'll re-initialize the editor when these props change
      // In a more advanced implementation, we could update the editor options directly
      destroyEditor()
      nextTick(() => {
        initializeEditor()
      })
    }
  }
)

// Lifecycle hooks
onMounted(async () => {
  setupResizeObserver()
  await initializeEditor()
})

onUnmounted(() => {
  destroyEditor()
  cleanupResizeObserver()
})

// Interactive methods with enhanced feedback
const zoomIn = (factor?: number, center?: { x: number; y: number }): void => {
  if (editorInstance.value) {
    editorInstance.value.zoomIn(factor, center)
    // Emit zoom change event for UI feedback
    const viewport = editorInstance.value.getViewport()
    emit('viewport-changed', { data: { viewport } })
  }
}

const zoomOut = (factor?: number, center?: { x: number; y: number }): void => {
  if (editorInstance.value) {
    editorInstance.value.zoomOut(factor, center)
    // Emit zoom change event for UI feedback
    const viewport = editorInstance.value.getViewport()
    emit('viewport-changed', { data: { viewport } })
  }
}

const zoomTo = (scale: number, center?: { x: number; y: number }): void => {
  if (editorInstance.value) {
    editorInstance.value.zoomTo(scale, center)
    // Emit zoom change event for UI feedback
    const viewport = editorInstance.value.getViewport()
    emit('viewport-changed', { data: { viewport } })
  }
}

const resetZoom = (): void => {
  if (editorInstance.value) {
    editorInstance.value.resetZoom()
    // Emit zoom reset event for UI feedback
    const viewport = editorInstance.value.getViewport()
    emit('viewport-changed', { data: { viewport } })
  }
}

const panTo = (x: number, y: number): void => {
  if (editorInstance.value) {
    editorInstance.value.panTo(x, y)
    // Emit pan change event for UI feedback
    const viewport = editorInstance.value.getViewport()
    emit('viewport-changed', { data: { viewport } })
  }
}

const panBy = (deltaX: number, deltaY: number): void => {
  if (editorInstance.value) {
    editorInstance.value.panBy(deltaX, deltaY)
    // Emit pan change event for UI feedback
    const viewport = editorInstance.value.getViewport()
    emit('viewport-changed', { data: { viewport } })
  }
}

const centerView = (): void => {
  if (editorInstance.value) {
    editorInstance.value.centerView()
    // Emit center view event for UI feedback
    const viewport = editorInstance.value.getViewport()
    emit('viewport-changed', { data: { viewport } })
  }
}

const fitView = (): void => {
  if (editorInstance.value) {
    editorInstance.value.fitView()
    // Emit fit view event for UI feedback
    const viewport = editorInstance.value.getViewport()
    emit('viewport-changed', { data: { viewport } })
  }
}

const clearSelection = (): void => {
  if (editorInstance.value) {
    editorInstance.value.clearSelection()
    // Emit selection cleared event for UI feedback
    emit('selection-cleared', { data: { cleared: true } })
  }
}

const getSelectedNodes = (): any[] => {
  if (editorInstance.value) {
    return editorInstance.value.getSelectedNodes()
  }
  return []
}

const getSelectedEdges = (): any[] => {
  if (editorInstance.value) {
    return editorInstance.value.getSelectedEdges()
  }
  return []
}

const getViewport = (): any => {
  if (editorInstance.value) {
    return editorInstance.value.getViewport()
  }
  return null
}

const isDragging = (): boolean => {
  if (editorInstance.value) {
    return editorInstance.value.isDragging
  }
  return false
}

const isConnecting = (): boolean => {
  if (editorInstance.value) {
    return editorInstance.value.isConnecting
  }
  return false
}

// Enhanced interaction state tracking
const interactionState = ref({
  isDragging: false,
  isConnecting: false,
  isZooming: false,
  isPanning: false,
  selectedCount: 0,
  lastInteraction: null as string | null,
})

// Update interaction state based on events
const updateInteractionState = () => {
  if (editorInstance.value) {
    interactionState.value.isDragging = editorInstance.value.isDragging
    interactionState.value.isConnecting = editorInstance.value.isConnecting
    interactionState.value.selectedCount =
      editorInstance.value.getSelectedNodes().length +
      editorInstance.value.getSelectedEdges().length
  }
}

// Expose editor instance and methods for parent component access
defineExpose({
  editorInstance: computed(() => editorInstance.value),
  isLoading: computed(() => isLoading.value),
  error: computed(() => error.value),
  interactionState: computed(() => interactionState.value),
  retryInitialization,
  destroyEditor,
  updateInteractionState,
  // Interactive methods
  zoomIn,
  zoomOut,
  zoomTo,
  resetZoom,
  panTo,
  panBy,
  centerView,
  fitView,
  clearSelection,
  getSelectedNodes,
  getSelectedEdges,
  getViewport,
  isDragging,
  isConnecting,
})
</script>

<style scoped>
.flow-editor-container {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
  background-color: #fafafa;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.flow-editor-container:hover {
  border-color: var(--primary-color);
}

.flow-editor-container.dragging {
  cursor: grabbing;
  border-color: var(--success-color);
  box-shadow: 0 0 0 2px rgba(103, 194, 58, 0.2);
}

.flow-editor-container.connecting {
  cursor: crosshair;
  border-color: var(--info-color);
  box-shadow: 0 0 0 2px rgba(23, 162, 184, 0.2);
}

.flow-editor-container.panning {
  cursor: move;
  border-color: var(--warning-color);
  box-shadow: 0 0 0 2px rgba(230, 162, 60, 0.2);
}

.flow-editor-container.has-selection {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 1px rgba(64, 158, 255, 0.3);
}

/* 交互状态指示器 */
.flow-editor-container::before {
  content: '';
  position: absolute;
  top: 4px;
  right: 4px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--success-color);
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 10;
}

.flow-editor-container.dragging::before,
.flow-editor-container.connecting::before,
.flow-editor-container.panning::before {
  opacity: 1;
  animation: blink 1s infinite;
}

.flow-editor-container.dragging::before {
  background-color: var(--success-color);
}

.flow-editor-container.connecting::before {
  background-color: var(--info-color);
}

.flow-editor-container.panning::before {
  background-color: var(--warning-color);
}

@keyframes blink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0.3;
  }
}

.editor-canvas {
  width: 100%;
  height: 100%;
  position: relative;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-color-overlay);
  z-index: 1000;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-color-light);
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-overlay p {
  color: var(--text-color-secondary);
  font-size: 14px;
}

.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-color-overlay);
  z-index: 1000;
}

.error-content {
  text-align: center;
  padding: 32px;
  background-color: var(--bg-color);
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
  max-width: 400px;
}

.error-content h3 {
  color: var(--danger-color);
  margin-bottom: 12px;
  font-size: 18px;
}

.error-content p {
  color: var(--text-color-secondary);
  margin-bottom: 20px;
  font-size: 14px;
  line-height: 1.5;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .loading-spinner {
    width: 32px;
    height: 32px;
    border-width: 3px;
  }

  .error-content {
    padding: 24px;
    margin: 16px;
  }

  .error-content h3 {
    font-size: 16px;
  }

  .error-content p {
    font-size: 13px;
  }
}
</style>
