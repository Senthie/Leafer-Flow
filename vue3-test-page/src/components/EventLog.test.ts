import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EventLog from './EventLog.vue'
import type { EventLogEntry } from './EventLog.vue'

// 创建测试用的事件日志条目
const createTestEvent = (
  type: string,
  message: string,
  data?: any
): EventLogEntry => ({
  id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  timestamp: new Date(),
  type,
  data: data || null,
  message,
})

describe('EventLog', () => {
  describe('渲染测试', () => {
    it('应该正确渲染空状态', () => {
      const wrapper = mount(EventLog, {
        props: {
          events: [],
        },
      })

      expect(wrapper.find('.empty-state').exists()).toBe(true)
      expect(wrapper.text()).toContain('暂无事件记录')
    })

    it('应该正确渲染事件列表', () => {
      const events: EventLogEntry[] = [
        createTestEvent('node:created', '创建了开始节点'),
        createTestEvent('edge:created', '创建了连接'),
      ]

      const wrapper = mount(EventLog, {
        props: {
          events,
        },
      })

      expect(wrapper.find('.empty-state').exists()).toBe(false)
      expect(wrapper.findAll('.event-item')).toHaveLength(2)
    })

    it('应该显示正确的事件计数', () => {
      const events: EventLogEntry[] = [
        createTestEvent('node:created', '创建了开始节点'),
        createTestEvent('edge:created', '创建了连接'),
        createTestEvent('drag:start', '开始拖拽'),
      ]

      const wrapper = mount(EventLog, {
        props: {
          events,
          maxEntries: 100,
        },
      })

      expect(wrapper.find('.event-count').text()).toBe('3 / 100')
    })

    it('应该正确格式化时间戳', () => {
      const testDate = new Date('2024-01-15T10:30:45.123')
      const events: EventLogEntry[] = [
        {
          id: 'test-1',
          timestamp: testDate,
          type: 'node:created',
          data: null,
          message: '测试消息',
        },
      ]

      const wrapper = mount(EventLog, {
        props: {
          events,
        },
      })

      expect(wrapper.find('.event-timestamp').text()).toBe('10:30:45.123')
    })

    it('应该正确显示事件类型图标和标签', () => {
      const events: EventLogEntry[] = [
        createTestEvent('node:created', '创建了节点'),
      ]

      const wrapper = mount(EventLog, {
        props: {
          events,
        },
      })

      const badge = wrapper.find('.event-type-badge')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toContain('➕')
      expect(badge.text()).toContain('节点创建')
    })
  })

  describe('事件类型样式', () => {
    it('应该为成功事件应用正确的样式类', () => {
      const events: EventLogEntry[] = [
        createTestEvent('node:created', '创建了节点'),
      ]

      const wrapper = mount(EventLog, {
        props: {
          events,
        },
      })

      expect(wrapper.find('.event-type-badge.event-success').exists()).toBe(
        true
      )
    })

    it('应该为删除事件应用正确的样式类', () => {
      const events: EventLogEntry[] = [
        createTestEvent('node:deleted', '删除了节点'),
      ]

      const wrapper = mount(EventLog, {
        props: {
          events,
        },
      })

      expect(wrapper.find('.event-type-badge.event-danger').exists()).toBe(true)
    })

    it('应该为错误事件应用正确的样式类', () => {
      const events: EventLogEntry[] = [createTestEvent('error', '发生错误')]

      const wrapper = mount(EventLog, {
        props: {
          events,
        },
      })

      expect(wrapper.find('.event-type-badge.event-error').exists()).toBe(true)
    })
  })

  describe('日志数量限制', () => {
    it('应该限制显示的事件数量', () => {
      const events: EventLogEntry[] = Array.from({ length: 60 }, (_, i) =>
        createTestEvent('node:created', `事件 ${i + 1}`)
      )

      const wrapper = mount(EventLog, {
        props: {
          events,
          maxDisplayed: 50,
        },
      })

      expect(wrapper.findAll('.event-item')).toHaveLength(50)
      expect(wrapper.find('.more-events').exists()).toBe(true)
      expect(wrapper.find('.more-events').text()).toContain(
        '还有 10 条更早的事件'
      )
    })

    it('当事件数量未超过限制时不应显示更多提示', () => {
      const events: EventLogEntry[] = Array.from({ length: 30 }, (_, i) =>
        createTestEvent('node:created', `事件 ${i + 1}`)
      )

      const wrapper = mount(EventLog, {
        props: {
          events,
          maxDisplayed: 50,
        },
      })

      expect(wrapper.find('.more-events').exists()).toBe(false)
    })
  })

  describe('清空日志功能', () => {
    it('应该在点击清空按钮时触发clear-log事件', async () => {
      const events: EventLogEntry[] = [
        createTestEvent('node:created', '创建了节点'),
      ]

      const wrapper = mount(EventLog, {
        props: {
          events,
        },
      })

      await wrapper.find('.clear-btn').trigger('click')

      expect(wrapper.emitted('clear-log')).toBeTruthy()
      expect(wrapper.emitted('clear-log')).toHaveLength(1)
    })

    it('当没有事件时清空按钮应该被禁用', () => {
      const wrapper = mount(EventLog, {
        props: {
          events: [],
        },
      })

      const clearBtn = wrapper.find('.clear-btn')
      expect(clearBtn.attributes('disabled')).toBeDefined()
    })

    it('当有事件时清空按钮应该可用', () => {
      const events: EventLogEntry[] = [
        createTestEvent('node:created', '创建了节点'),
      ]

      const wrapper = mount(EventLog, {
        props: {
          events,
        },
      })

      const clearBtn = wrapper.find('.clear-btn')
      expect(clearBtn.attributes('disabled')).toBeUndefined()
    })
  })

  describe('事件数据显示', () => {
    it('当showEventData为true时应该显示事件数据', () => {
      const events: EventLogEntry[] = [
        createTestEvent('node:created', '创建了节点', { nodeId: 'test-123' }),
      ]

      const wrapper = mount(EventLog, {
        props: {
          events,
          showEventData: true,
        },
      })

      expect(wrapper.find('.event-data').exists()).toBe(true)
      expect(wrapper.find('.event-data details').exists()).toBe(true)
    })

    it('当showEventData为false时不应该显示事件数据', () => {
      const events: EventLogEntry[] = [
        createTestEvent('node:created', '创建了节点', { nodeId: 'test-123' }),
      ]

      const wrapper = mount(EventLog, {
        props: {
          events,
          showEventData: false,
        },
      })

      expect(wrapper.find('.event-data').exists()).toBe(false)
    })

    it('应该正确格式化事件数据为JSON', () => {
      const testData = { nodeId: 'test-123', type: 'start' }
      const events: EventLogEntry[] = [
        createTestEvent('node:created', '创建了节点', testData),
      ]

      const wrapper = mount(EventLog, {
        props: {
          events,
          showEventData: true,
        },
      })

      const preElement = wrapper.find('.event-data pre')
      expect(preElement.exists()).toBe(true)
      expect(preElement.text()).toContain('"nodeId": "test-123"')
      expect(preElement.text()).toContain('"type": "start"')
    })
  })

  describe('默认属性', () => {
    it('应该使用默认的maxEntries值', () => {
      const wrapper = mount(EventLog, {
        props: {
          events: [],
        },
      })

      expect(wrapper.find('.event-count').text()).toBe('0 / 100')
    })
  })
})
