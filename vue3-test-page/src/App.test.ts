import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import App from './App.vue'

describe('App.vue', () => {
  it('renders properly', () => {
    const wrapper = mount(App)
    expect(wrapper.find('h1').text()).toBe('Leafer-Flow Vue3 测试页面')
    expect(wrapper.find('.app-header p').text()).toBe(
      '用于验证和展示工作流编辑器的各项功能'
    )
  })

  it('has correct structure', () => {
    const wrapper = mount(App)
    expect(wrapper.find('.app').exists()).toBe(true)
    expect(wrapper.find('.app-header').exists()).toBe(true)
    expect(wrapper.find('.app-main').exists()).toBe(true)
    expect(wrapper.find('.editor-container').exists()).toBe(true)
    expect(wrapper.find('.control-panel').exists()).toBe(true)
  })

  it('displays placeholder content', () => {
    const wrapper = mount(App)
    expect(wrapper.find('.editor-placeholder').exists()).toBe(true)
    expect(wrapper.find('.editor-placeholder p').text()).toContain(
      '编辑器容器将在此处初始化'
    )
  })
})
