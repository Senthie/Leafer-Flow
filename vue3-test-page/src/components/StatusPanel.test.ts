import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StatusPanel from './StatusPanel.vue'

describe('StatusPanel', () => {
  it('should render with default props', () => {
    const wrapper = mount(StatusPanel, {
      props: {
        nodeCount: 0,
        edgeCount: 0,
        isConnected: false,
      },
    })

    expect(wrapper.find('.status-panel').exists()).toBe(true)
    expect(wrapper.find('.panel-header').exists()).toBe(true)
    expect(wrapper.find('.panel-body').exists()).toBe(true)
  })

  it('should display node and edge counts correctly', () => {
    const wrapper = mount(StatusPanel, {
      props: {
        nodeCount: 5,
        edgeCount: 3,
        isConnected: true,
      },
    })

    const statusValues = wrapper.findAll('.status-value.count')
    expect(statusValues.length).toBe(2)
    expect(statusValues[0].text()).toBe('5')
    expect(statusValues[1].text()).toBe('3')
  })

  it('should show connected status when isConnected is true', () => {
    const wrapper = mount(StatusPanel, {
      props: {
        nodeCount: 0,
        edgeCount: 0,
        isConnected: true,
      },
    })

    const indicator = wrapper.find('.connection-indicator')
    expect(indicator.classes()).toContain('connected')
    expect(indicator.text()).toBe('● 已连接')

    const editorStatus = wrapper.find('.status-value.connected')
    expect(editorStatus.exists()).toBe(true)
    expect(editorStatus.text()).toBe('已就绪')
  })

  it('should show disconnected status when isConnected is false', () => {
    const wrapper = mount(StatusPanel, {
      props: {
        nodeCount: 0,
        edgeCount: 0,
        isConnected: false,
      },
    })

    const indicator = wrapper.find('.connection-indicator')
    expect(indicator.classes()).toContain('disconnected')
    expect(indicator.text()).toBe('○ 未连接')
  })

  it('should display viewport information when provided', () => {
    const wrapper = mount(StatusPanel, {
      props: {
        nodeCount: 0,
        edgeCount: 0,
        isConnected: true,
        viewport: {
          x: 100,
          y: 200,
          zoom: 1.5,
        },
      },
    })

    const coordinates = wrapper.find('.status-value.coordinates')
    expect(coordinates.exists()).toBe(true)
    expect(coordinates.text()).toBe('(100, 200)')

    const zoom = wrapper.find('.status-value.zoom')
    expect(zoom.exists()).toBe(true)
    expect(zoom.text()).toBe('150%')
  })

  it('should display viewport with scale property', () => {
    const wrapper = mount(StatusPanel, {
      props: {
        nodeCount: 0,
        edgeCount: 0,
        isConnected: true,
        viewport: {
          x: 50,
          y: 75,
          scale: 0.8,
        },
      },
    })

    const zoom = wrapper.find('.status-value.zoom')
    expect(zoom.exists()).toBe(true)
    expect(zoom.text()).toBe('80%')
  })

  it('should show placeholder when viewport is not provided', () => {
    const wrapper = mount(StatusPanel, {
      props: {
        nodeCount: 0,
        edgeCount: 0,
        isConnected: true,
        viewport: null,
      },
    })

    const placeholder = wrapper.find('.status-placeholder')
    expect(placeholder.exists()).toBe(true)
    expect(placeholder.text()).toBe('等待视图数据...')
  })

  it('should show different placeholder when disconnected', () => {
    const wrapper = mount(StatusPanel, {
      props: {
        nodeCount: 0,
        edgeCount: 0,
        isConnected: false,
        viewport: null,
      },
    })

    const placeholder = wrapper.find('.status-placeholder')
    expect(placeholder.exists()).toBe(true)
    expect(placeholder.text()).toBe('编辑器未连接')
  })

  it('should format decimal viewport coordinates correctly', () => {
    const wrapper = mount(StatusPanel, {
      props: {
        nodeCount: 0,
        edgeCount: 0,
        isConnected: true,
        viewport: {
          x: 123.456,
          y: 789.123,
          zoom: 1.234,
        },
      },
    })

    const coordinates = wrapper.find('.status-value.coordinates')
    expect(coordinates.text()).toBe('(123, 789)')

    const zoom = wrapper.find('.status-value.zoom')
    expect(zoom.text()).toBe('123%')
  })

  it('should update when props change', async () => {
    const wrapper = mount(StatusPanel, {
      props: {
        nodeCount: 0,
        edgeCount: 0,
        isConnected: false,
      },
    })

    // Initial state
    expect(wrapper.find('.connection-indicator').classes()).toContain(
      'disconnected'
    )

    // Update props
    await wrapper.setProps({
      nodeCount: 10,
      edgeCount: 5,
      isConnected: true,
    })

    // Verify updated state
    expect(wrapper.find('.connection-indicator').classes()).toContain(
      'connected'
    )
    const statusValues = wrapper.findAll('.status-value.count')
    expect(statusValues[0].text()).toBe('10')
    expect(statusValues[1].text()).toBe('5')
  })
})
