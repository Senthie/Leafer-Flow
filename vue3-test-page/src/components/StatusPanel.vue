<template>
  <div class="status-panel">
    <div class="panel">
      <div class="panel-header">
        <span class="header-title">状态信息</span>
        <span class="connection-indicator" :class="connectionStatusClass">
          {{ connectionStatusText }}
        </span>
      </div>
      <div class="panel-body">
        <!-- 编辑器连接状态 -->
        <div class="status-section">
          <div class="status-row">
            <span class="status-label">编辑器状态:</span>
            <span class="status-value" :class="{ connected: isConnected }">
              {{ editorStatusText }}
            </span>
          </div>
        </div>

        <!-- 节点和连接数量 -->
        <div class="status-section">
          <div class="status-row">
            <span class="status-label">节点数量:</span>
            <span class="status-value count">{{ nodeCount }}</span>
          </div>
          <div class="status-row">
            <span class="status-label">连接数量:</span>
            <span class="status-value count">{{ edgeCount }}</span>
          </div>
        </div>

        <!-- 视图状态信息 -->
        <div v-if="viewport" class="status-section viewport-section">
          <div class="section-title">视图状态</div>
          <div class="status-row">
            <span class="status-label">位置:</span>
            <span class="status-value coordinates">
              ({{ formatNumber(viewport.x) }}, {{ formatNumber(viewport.y) }})
            </span>
          </div>
          <div class="status-row">
            <span class="status-label">缩放:</span>
            <span class="status-value zoom">
              {{ formatZoom(viewport.zoom || viewport.scale) }}
            </span>
          </div>
        </div>

        <!-- 无视图状态时的占位 -->
        <div v-else class="status-section viewport-section">
          <div class="section-title">视图状态</div>
          <div class="status-placeholder">
            {{ isConnected ? '等待视图数据...' : '编辑器未连接' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// 视图状态接口
interface ViewportState {
  x: number
  y: number
  zoom?: number
  scale?: number
}

// Props 接口
interface Props {
  nodeCount: number
  edgeCount: number
  viewport?: ViewportState | null
  isConnected: boolean
}

// Props 定义
const props = withDefaults(defineProps<Props>(), {
  nodeCount: 0,
  edgeCount: 0,
  viewport: null,
  isConnected: false,
})

// 计算属性：编辑器状态文本
const editorStatusText = computed(() => {
  return props.isConnected ? '已就绪' : '未初始化'
})

// 计算属性：连接状态样式类
const connectionStatusClass = computed(() => {
  return {
    connected: props.isConnected,
    disconnected: !props.isConnected,
  }
})

// 计算属性：连接状态文本
const connectionStatusText = computed(() => {
  return props.isConnected ? '● 已连接' : '○ 未连接'
})

// 格式化数字（保留整数）
const formatNumber = (value: number): string => {
  if (typeof value !== 'number' || !isFinite(value)) {
    return '0'
  }
  return Math.round(value).toString()
}

// 格式化缩放比例（百分比）
const formatZoom = (value: number | undefined): string => {
  if (typeof value !== 'number' || !isFinite(value)) {
    return '100%'
  }
  return `${Math.round(value * 100)}%`
}
</script>

<style scoped>
.status-panel {
  width: 100%;
}

.panel {
  background-color: var(--bg-color);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: var(--bg-color-secondary);
  border-bottom: 1px solid var(--border-color-light);
}

.header-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-color-primary);
}

.connection-indicator {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.connection-indicator.connected {
  background-color: var(--success-bg);
  color: var(--success-color);
}

.connection-indicator.disconnected {
  background-color: var(--danger-bg);
  color: var(--danger-color);
}

.panel-body {
  padding: 16px;
}

.status-section {
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color-lighter);
}

.status-section:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-color-secondary);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0;
}

.status-label {
  font-size: 13px;
  color: var(--text-color-secondary);
}

.status-value {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-color-primary);
}

.status-value.connected {
  color: var(--success-color);
}

.status-value.count {
  font-family: 'Courier New', monospace;
  background-color: var(--bg-color-secondary);
  padding: 2px 8px;
  border-radius: var(--border-radius-small);
  min-width: 40px;
  text-align: center;
}

.status-value.coordinates {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  background-color: var(--bg-color-secondary);
  padding: 2px 8px;
  border-radius: var(--border-radius-small);
}

.status-value.zoom {
  font-family: 'Courier New', monospace;
  background-color: var(--info-bg);
  color: var(--info-color);
  padding: 2px 8px;
  border-radius: var(--border-radius-small);
}

.viewport-section {
  margin-top: 8px;
}

.status-placeholder {
  font-size: 12px;
  color: var(--text-color-placeholder);
  font-style: italic;
  text-align: center;
  padding: 8px 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .panel-header {
    padding: 10px 12px;
  }

  .header-title {
    font-size: 13px;
  }

  .connection-indicator {
    font-size: 11px;
    padding: 2px 6px;
  }

  .panel-body {
    padding: 12px;
  }

  .status-label,
  .status-value {
    font-size: 12px;
  }

  .status-value.coordinates {
    font-size: 11px;
  }
}
</style>
