<template>
  <div class="app">
    <header class="app-header">
      <h1>Leafer-Flow Vue3 测试页面</h1>
      <p>用于验证和展示工作流编辑器的各项功能</p>
    </header>

    <main class="app-main">
      <div class="editor-container">
        <FlowEditorContainer
          :background="editorBackground"
          :show-grid="showGrid"
          @editor-ready="onEditorReady"
          @editor-error="onEditorError"
          @editor-destroyed="onEditorDestroyed"
        />
      </div>

      <aside class="control-panel">
        <div class="panel">
          <div class="panel-header">控制面板</div>
          <div class="panel-body">
            <p>控制按钮将在此处添加</p>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">状态信息</div>
          <div class="panel-body">
            <div v-if="editorInstance">
              <p><strong>编辑器状态:</strong> {{ editorStatus }}</p>
              <p><strong>节点数量:</strong> {{ nodeCount }}</p>
              <p><strong>连接数量:</strong> {{ edgeCount }}</p>
            </div>
            <p v-else>等待编辑器初始化...</p>
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
      </aside>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import FlowEditorContainer from './components/FlowEditorContainer.vue'
// import type { FlowEditor } from '../../dist'

// 应用状态
const editorInstance = ref<any>(null)
const nodeCount = ref(0)
const edgeCount = ref(0)
const editorBackground = ref('#ffffff')
const showGrid = ref(true)

// 计算属性
const editorStatus = computed(() => {
  if (!editorInstance.value) return '未初始化'
  return '已就绪'
})

// 编辑器事件处理
const onEditorReady = (editor: any) => {
  editorInstance.value = editor
  updateCounts()

  // 监听编辑器事件以更新状态
  editor.on('node:created', updateCounts)
  editor.on('node:deleted', updateCounts)
  editor.on('edge:created', updateCounts)
  editor.on('edge:deleted', updateCounts)

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
}
</style>
