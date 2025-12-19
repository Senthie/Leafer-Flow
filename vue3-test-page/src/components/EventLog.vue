<template>
  <div class="event-log">
    <div class="panel">
      <div class="panel-header">
        <span class="header-title">事件日志</span>
        <div class="header-actions">
          <span class="event-count"
            >{{ events.length }} / {{ maxEntries }}</span
          >
          <button
            class="clear-btn"
            :disabled="events.length === 0"
            @click="handleClearLog"
            title="清空日志"
          >
            🗑️ 清空
          </button>
        </div>
      </div>
      <div class="panel-body">
        <!-- 空状态 -->
        <div v-if="events.length === 0" class="empty-state">
          <span class="empty-icon">📋</span>
          <p>暂无事件记录</p>
          <p class="empty-hint">编辑器操作将在此处显示</p>
        </div>

        <!-- 事件列表 -->
        <div v-else class="event-list" ref="eventListRef">
          <div
            v-for="event in displayedEvents"
            :key="event.id"
            class="event-item"
            :class="getEventTypeClass(event.type)"
          >
            <div class="event-header">
              <span
                class="event-type-badge"
                :class="getEventTypeClass(event.type)"
              >
                {{ getEventTypeIcon(event.type) }}
                {{ formatEventType(event.type) }}
              </span>
              <span class="event-timestamp">{{
                formatTimestamp(event.timestamp)
              }}</span>
            </div>
            <div class="event-message">{{ event.message }}</div>
            <div v-if="event.data && showEventData" class="event-data">
              <details>
                <summary>详细数据</summary>
                <pre>{{ formatEventData(event.data) }}</pre>
              </details>
            </div>
          </div>
        </div>

        <!-- 显示更多提示 -->
        <div v-if="events.length > maxDisplayed" class="more-events">
          <span>还有 {{ events.length - maxDisplayed }} 条更早的事件</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'

// 事件日志条目接口
export interface EventLogEntry {
  id: string
  timestamp: Date
  type: string
  data: any
  message: string
}

// Props 接口
interface Props {
  events: EventLogEntry[]
  maxEntries?: number
  maxDisplayed?: number
  showEventData?: boolean
  autoScroll?: boolean
}

// Emits 接口
interface Emits {
  (e: 'clear-log'): void
}

// Props 定义
const props = withDefaults(defineProps<Props>(), {
  events: () => [],
  maxEntries: 100,
  maxDisplayed: 50,
  showEventData: true,
  autoScroll: true,
})

// Emits 定义
const emit = defineEmits<Emits>()

// Refs
const eventListRef = ref<HTMLElement | null>(null)

// 计算属性：显示的事件（限制数量）
const displayedEvents = computed(() => {
  return props.events.slice(0, props.maxDisplayed)
})

// 清空日志处理
const handleClearLog = () => {
  emit('clear-log')
}

// 格式化时间戳
const formatTimestamp = (timestamp: Date): string => {
  if (!(timestamp instanceof Date) || isNaN(timestamp.getTime())) {
    return '--:--:--'
  }

  const hours = timestamp.getHours().toString().padStart(2, '0')
  const minutes = timestamp.getMinutes().toString().padStart(2, '0')
  const seconds = timestamp.getSeconds().toString().padStart(2, '0')
  const milliseconds = timestamp.getMilliseconds().toString().padStart(3, '0')

  return `${hours}:${minutes}:${seconds}.${milliseconds}`
}

// 格式化事件类型显示
const formatEventType = (type: string): string => {
  const typeMap: Record<string, string> = {
    'node:created': '节点创建',
    'node:deleted': '节点删除',
    'node:selected': '节点选中',
    'node:deselected': '节点取消选中',
    'edge:created': '连接创建',
    'edge:deleted': '连接删除',
    'drag:start': '拖拽开始',
    'drag:move': '拖拽移动',
    'drag:end': '拖拽结束',
    'viewport:changed': '视图变化',
    'selection:cleared': '选择清空',
    'connection:start': '连接开始',
    'connection:end': '连接结束',
    'canvas:cleared': '画布清空',
    'data:exported': '数据导出',
    'data:imported': '数据导入',
    error: '错误',
    info: '信息',
    warning: '警告',
  }

  return typeMap[type] || type
}

// 获取事件类型图标
const getEventTypeIcon = (type: string): string => {
  const iconMap: Record<string, string> = {
    'node:created': '➕',
    'node:deleted': '➖',
    'node:selected': '✅',
    'node:deselected': '⬜',
    'edge:created': '🔗',
    'edge:deleted': '🔓',
    'drag:start': '🖱️',
    'drag:move': '↔️',
    'drag:end': '🎯',
    'viewport:changed': '🔍',
    'selection:cleared': '❌',
    'connection:start': '🔌',
    'connection:end': '⚡',
    'canvas:cleared': '🗑️',
    'data:exported': '📤',
    'data:imported': '📥',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️',
  }

  return iconMap[type] || '📝'
}

// 获取事件类型样式类
const getEventTypeClass = (type: string): string => {
  if (type.includes('error')) return 'event-error'
  if (type.includes('warning')) return 'event-warning'
  if (type.includes('created') || type.includes('imported'))
    return 'event-success'
  if (type.includes('deleted') || type.includes('cleared'))
    return 'event-danger'
  if (type.includes('selected') || type.includes('start')) return 'event-info'
  return 'event-default'
}

// 格式化事件数据
const formatEventData = (data: any): string => {
  if (data === null || data === undefined) {
    return 'null'
  }

  try {
    return JSON.stringify(data, null, 2)
  } catch {
    return String(data)
  }
}

// 自动滚动到最新事件
const scrollToLatest = async () => {
  if (!props.autoScroll || !eventListRef.value) return

  await nextTick()
  eventListRef.value.scrollTop = 0
}

// 监听事件变化，自动滚动
watch(
  () => props.events.length,
  () => {
    scrollToLatest()
  }
)
</script>

<style scoped>
.event-log {
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.event-count {
  font-size: 12px;
  color: var(--text-color-secondary);
  background-color: var(--bg-color);
  padding: 2px 8px;
  border-radius: 10px;
}

.clear-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  font-size: 12px;
  background-color: var(--bg-color);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-small);
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--text-color-secondary);
}

.clear-btn:hover:not(:disabled) {
  background-color: var(--danger-bg);
  border-color: var(--danger-color);
  color: var(--danger-color);
}

.clear-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.panel-body {
  padding: 0;
  max-height: 300px;
  overflow-y: auto;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  color: var(--text-color-secondary);
}

.empty-icon {
  font-size: 32px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

.empty-hint {
  font-size: 12px !important;
  margin-top: 4px !important;
  opacity: 0.7;
}

/* 事件列表 */
.event-list {
  display: flex;
  flex-direction: column;
}

.event-item {
  padding: 10px 16px;
  border-bottom: 1px solid var(--border-color-lighter);
  transition: background-color 0.2s ease;
}

.event-item:last-child {
  border-bottom: none;
}

.event-item:hover {
  background-color: var(--bg-color-hover);
}

.event-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.event-type-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 10px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.event-type-badge.event-success {
  background-color: var(--success-bg);
  color: var(--success-color);
}

.event-type-badge.event-danger {
  background-color: var(--danger-bg);
  color: var(--danger-color);
}

.event-type-badge.event-info {
  background-color: var(--info-bg);
  color: var(--info-color);
}

.event-type-badge.event-warning {
  background-color: var(--warning-bg);
  color: var(--warning-color);
}

.event-type-badge.event-error {
  background-color: var(--danger-bg);
  color: var(--danger-color);
}

.event-type-badge.event-default {
  background-color: var(--bg-color-secondary);
  color: var(--text-color-secondary);
}

.event-timestamp {
  font-size: 11px;
  font-family: 'Courier New', monospace;
  color: var(--text-color-placeholder);
}

.event-message {
  font-size: 13px;
  color: var(--text-color-primary);
  line-height: 1.4;
}

.event-data {
  margin-top: 8px;
}

.event-data details {
  font-size: 12px;
}

.event-data summary {
  cursor: pointer;
  color: var(--text-color-secondary);
  font-size: 11px;
  padding: 4px 0;
}

.event-data summary:hover {
  color: var(--primary-color);
}

.event-data pre {
  margin: 8px 0 0 0;
  padding: 8px;
  background-color: var(--bg-color-secondary);
  border-radius: var(--border-radius-small);
  font-size: 11px;
  overflow-x: auto;
  max-height: 150px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

/* 更多事件提示 */
.more-events {
  padding: 8px 16px;
  text-align: center;
  font-size: 12px;
  color: var(--text-color-placeholder);
  background-color: var(--bg-color-secondary);
  border-top: 1px solid var(--border-color-lighter);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .panel-header {
    padding: 10px 12px;
  }

  .header-title {
    font-size: 13px;
  }

  .header-actions {
    gap: 8px;
  }

  .event-count {
    font-size: 11px;
    padding: 2px 6px;
  }

  .clear-btn {
    padding: 3px 8px;
    font-size: 11px;
  }

  .panel-body {
    max-height: 200px;
  }

  .event-item {
    padding: 8px 12px;
  }

  .event-type-badge {
    font-size: 10px;
    padding: 2px 6px;
  }

  .event-timestamp {
    font-size: 10px;
  }

  .event-message {
    font-size: 12px;
  }

  .empty-state {
    padding: 24px 12px;
  }

  .empty-icon {
    font-size: 28px;
  }
}
</style>
