# Leafer-Flow 包管理指南

## 概述

本文档详细说明了 Leafer-Flow 项目的包管理要求、配置和最佳实践。

## 强制要求：使用 pnpm

**⚠️ 重要**: Leafer-Flow 项目强制使用 [pnpm](https://pnpm.io/) 作为包管理器。这不是建议，而是硬性要求。

### 为什么强制使用 pnpm？

#### 1. 性能优势

```bash
# 安装速度对比 (相同项目)
npm install     # ~45 秒
yarn install    # ~30 秒  
pnpm install    # ~15 秒  ✅ 最快
```

#### 2. 磁盘空间节省

```bash
# 磁盘使用对比
npm (node_modules)     # ~200MB
yarn (node_modules)    # ~180MB
pnpm (node_modules)    # ~80MB   ✅ 节省 60%
```

#### 3. 依赖管理严格性

```javascript
// pnpm 防止幽灵依赖
// 如果 package.json 中没有声明依赖，pnpm 会报错
import somePackage from 'undeclared-package' // ❌ pnpm 会报错
```

#### 4. 项目配置优化

本项目的所有配置都针对 pnpm 进行了优化：

- `.npmrc` 配置
- `package.json` 脚本
- CI/CD 流水线
- 开发工具配置

## 安装 pnpm

### 方式 1: 使用 npm (推荐)

```bash
npm install -g pnpm
```

### 方式 2: 使用官方安装脚本

```bash
# Linux/macOS
curl -fsSL https://get.pnpm.io/install.sh | sh -

# Windows PowerShell
iwr https://get.pnpm.io/install.ps1 -useb | iex
```

### 方式 3: 使用包管理器

```bash
# macOS (Homebrew)
brew install pnpm

# Windows (Chocolatey)
choco install pnpm

# Windows (Scoop)
scoop install pnpm
```

### 验证安装

```bash
pnpm --version
# 应该显示版本号，如: 8.10.0

pnpm config get registry
# 应该显示: https://registry.npmjs.org/
```

## 项目配置文件

### .npmrc 配置

项目根目录的 `.npmrc` 文件包含了优化配置：

```ini
# 性能优化
shamefully-hoist=false
strict-peer-dependencies=true
auto-install-peers=true
prefer-frozen-lockfile=true

# 并发控制
child-concurrency=4
network-concurrency=16

# 存储配置
store-dir=~/.pnpm-store
cache-dir=~/.pnpm-cache

# 日志级别
loglevel=warn

# 注册表配置
registry=https://registry.npmjs.org/
```

### package.json 脚本

所有脚本都使用 `pnpm exec` 前缀：

```json
{
  "scripts": {
    "build": "pnpm exec tsc",
    "dev": "pnpm exec tsc --watch",
    "test": "pnpm exec jest",
    "test:watch": "pnpm exec jest --watch",
    "test:coverage": "pnpm exec jest --coverage",
    "lint": "pnpm exec eslint src/**/*.ts",
    "clean": "pnpm exec rimraf dist"
  },
  "preinstall": "npx only-allow pnpm"
}
```

### pnpm-workspace.yaml (如果是 monorepo)

```yaml
packages:
  - 'packages/*'
  - 'examples/*'
  - 'docs'

# 排除模式
exclude:
  - '**/test/**'
  - '**/dist/**'
```

## 常用命令

### 依赖管理

```bash
# 安装所有依赖
pnpm install

# 安装生产依赖
pnpm add <package>

# 安装开发依赖
pnpm add -D <package>

# 安装全局包
pnpm add -g <package>

# 更新依赖
pnpm update

# 更新特定包
pnpm update <package>

# 移除依赖
pnpm remove <package>
```

### 脚本执行

```bash
# 运行 package.json 中的脚本
pnpm run build
pnpm run test
pnpm run dev

# 简写形式 (对于常用命令)
pnpm build
pnpm test
pnpm dev

# 执行二进制文件
pnpm exec tsc
pnpm exec jest
pnpm exec eslint
```

### 信息查询

```bash
# 查看依赖树
pnpm list

# 查看过期的包
pnpm outdated

# 查看包信息
pnpm info <package>

# 查看存储状态
pnpm store status

# 清理存储
pnpm store prune
```

## 开发工作流

### 1. 项目初始化

```bash
# 克隆项目
git clone <repository-url>
cd leafer-flow

# 安装依赖
pnpm install

# 验证安装
pnpm run build
pnpm run test
```

### 2. 日常开发

```bash
# 启动开发模式
pnpm dev

# 在另一个终端运行测试
pnpm test:watch

# 检查代码质量
pnpm lint
```

### 3. 构建和发布

```bash
# 清理旧文件
pnpm clean

# 构建项目
pnpm build

# 运行完整测试
pnpm test

# 检查代码覆盖率
pnpm test:coverage
```

## 故障排除

### 常见问题

#### 1. 使用了错误的包管理器

```bash
# 错误：使用 npm 或 yarn
npm install  # ❌
yarn install # ❌

# 正确：使用 pnpm
pnpm install # ✅
```

**解决方案**:

```bash
# 清理错误的 node_modules
rm -rf node_modules package-lock.json yarn.lock

# 使用 pnpm 重新安装
pnpm install
```

#### 2. pnpm 版本过旧

```bash
# 检查版本
pnpm --version

# 如果版本 < 8.0.0，需要更新
npm install -g pnpm@latest
```

#### 3. 依赖安装失败

```bash
# 清理缓存
pnpm store prune

# 删除 node_modules
rm -rf node_modules

# 重新安装
pnpm install
```

#### 4. 权限问题

```bash
# Linux/macOS 权限问题
sudo chown -R $(whoami) ~/.pnpm-store

# Windows 权限问题 (以管理员身份运行)
pnpm config set store-dir "C:\pnpm-store"
```

### 调试技巧

#### 1. 启用详细日志

```bash
pnpm install --loglevel=debug
```

#### 2. 检查配置

```bash
# 查看所有配置
pnpm config list

# 查看特定配置
pnpm config get store-dir
pnpm config get registry
```

#### 3. 验证依赖

```bash
# 检查依赖完整性
pnpm audit

# 修复安全问题
pnpm audit --fix
```

## 性能优化

### 1. 配置优化

```bash
# 设置更快的注册表 (如果在中国)
pnpm config set registry https://registry.npmmirror.com/

# 增加并发数 (根据 CPU 核心数调整)
pnpm config set network-concurrency 16
pnpm config set child-concurrency 4
```

### 2. 存储优化

```bash
# 定期清理存储
pnpm store prune

# 查看存储使用情况
pnpm store status

# 设置自定义存储位置 (SSD 驱动器)
pnpm config set store-dir "/path/to/fast/storage"
```

### 3. 缓存优化

```bash
# 清理缓存
pnpm store prune

# 预热缓存 (安装常用包)
pnpm add -g typescript jest eslint
```

## CI/CD 配置

### GitHub Actions

```yaml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Run tests
        run: pnpm test
        
      - name: Build
        run: pnpm build
```

### Docker

```dockerfile
FROM node:18-alpine

# 安装 pnpm
RUN npm install -g pnpm

WORKDIR /app

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建项目
RUN pnpm build

EXPOSE 3000
CMD ["pnpm", "start"]
```

## 最佳实践

### 1. 依赖管理

```bash
# ✅ 好的做法
pnpm add lodash              # 添加生产依赖
pnpm add -D @types/lodash    # 添加类型定义
pnpm add -E react@18.2.0     # 精确版本安装

# ❌ 避免的做法
npm install lodash           # 使用错误的包管理器
pnpm add lodash --save-dev   # 错误的依赖类型
```

### 2. 脚本编写

```json
{
  "scripts": {
    "build": "pnpm exec tsc",
    "test": "pnpm exec jest",
    "dev": "pnpm exec tsc --watch"
  }
}
```

### 3. 版本锁定

```bash
# 使用 pnpm-lock.yaml 锁定版本
git add pnpm-lock.yaml
git commit -m "Lock dependencies"

# 在 CI 中使用 frozen-lockfile
pnpm install --frozen-lockfile
```

### 4. 工作空间管理

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
  
# 安装工作空间依赖
pnpm add lodash --filter @myorg/package-a
```

## 总结

使用 pnpm 作为 Leafer-Flow 的包管理器不仅是技术要求，更是性能和稳定性的保证。通过遵循本指南的最佳实践，您可以：

- 获得最快的安装速度
- 节省磁盘空间
- 避免依赖问题
- 提高开发效率

记住：**始终使用 pnpm，这是 Leafer-Flow 项目的基本要求！**
