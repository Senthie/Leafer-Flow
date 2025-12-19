<template>
  <div ref="containerRef" class="flow-editor-container" :style="containerStyle">
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

    // Prepare editor options
    const editorOptions: any = {
      container: editorRef.value,
      width: props.width || containerSize.value.width,
      height: props.height || containerSize.value.height,
      background: props.background,
      grid: props.showGrid,
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

// Setup editor event listeners
const setupEditorEventListeners = (): void => {
  if (!editorInstance.value) return

  // Listen to various editor events for debugging and monitoring
  editorInstance.value.on('node:created', (event: any) => {
    console.log('节点已创建:', event)
  })

  editorInstance.value.on('node:deleted', (event: any) => {
    console.log('节点已删除:', event)
  })

  editorInstance.value.on('edge:created', (event: any) => {
    console.log('连接已创建:', event)
  })

  editorInstance.value.on('edge:deleted', (event: any) => {
    console.log('连接已删除:', event)
  })

  editorInstance.value.on('viewport:changed', (event: any) => {
    console.log('视图已变化:', event)
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

// Expose editor instance and methods for parent component access
defineExpose({
  editorInstance: computed(() => editorInstance.value),
  isLoading: computed(() => isLoading.value),
  error: computed(() => error.value),
  retryInitialization,
  destroyEditor,
})
</script>

<style scoped>
.flow-editor-container {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
  background-color: #fafafa;
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
