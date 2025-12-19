<template>
  <div class="app">
    <header class="app-header">
      <h1>Leafer-Flow Vue3 测试页面</h1>
      <p>用于验证和展示工作流编辑器的各项功能</p>
    </header>

    <main class="app-main">
      <div class="editor-container">
        <div class="editor-placeholder">
          <p>编辑器容器将在此处初始化</p>
          <p>项目结构搭建完成，等待后续组件实现</p>
        </div>
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
            <p>状态信息将在此处显示</p>
          </div>
        </div>
      </aside>
    </main>
  </div>
</template>

<script setup lang="ts">
// 基础应用组件，后续将添加完整功能
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
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fafafa;
  border-right: 1px solid var(--border-color-light);
}

.editor-placeholder {
  text-align: center;
  color: var(--text-color-secondary);
  padding: 40px;
  border: 2px dashed var(--border-color);
  border-radius: var(--border-radius);
  background-color: var(--bg-color);
}

.editor-placeholder p {
  margin-bottom: 8px;
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
