# Project Instructions

This file provides context for AI assistants working on this project.

## Project Type: uniapp (eat2what)

基于 [unibest](https://unibest.tech) 模板创建的 uniapp 项目，使用 Vue 3 + TypeScript + Vite 7 技术栈。
与用户对话应当始终保持中文。

### 技术栈

- **框架**: uniapp 3.0 (Vue 3.5 + Vite 7.3)
- **语言**: TypeScript 5.8
- **包管理器**: pnpm >=9 (强制，preinstall 脚本会阻止 npm/yarn)
- **UI 库**: uview-pro
- **CSS 方案**: UnoCSS 66 (原子化 CSS) + SCSS
- **状态管理**: Pinia 2.0 + pinia-plugin-persistedstate (持久化到 uni.storage)
- **HTTP 请求**: 双系统 — ① uni.request 封装 (`src/http/http.ts`) ② alova 3.x (`src/http/alova.ts`)
- **路由**: 约定式路由 (`@uni-helper/vite-plugin-uni-pages`)，基于文件系统自动生成 pages.json
- **布局**: 约定式布局 (`@uni-helper/vite-plugin-uni-layouts`)
- **图表**: lime-echart (基于 ECharts 5.4)
- **多语言**: vue-i18n 9.x (当前项目未启用 i18n)
- **图标**: Lucide-ICON
- **代码规范**: ESLint 9 (`@uni-helper/eslint-config`) + husky + commitlint

### Commands

包管理器使用 pnpm，不是 npm。

| 命令 | 说明 |
|------|------|
| `pnpm i` | 安装依赖 |
| `pnpm dev` | 运行 H5 开发 (默认) |
| `pnpm dev:mp` | 运行微信小程序开发 |
| `pnpm dev:app` | 运行 App 开发 |
| `pnpm build:h5` | 构建 H5 生产版本 |
| `pnpm build:mp` | 构建微信小程序生产版本 |
| `pnpm build:app` | 构建 App 生产版本 |
| `pnpm type-check` | TypeScript 类型检查 (`vue-tsc --noEmit`) |
| `pnpm lint` | ESLint 检查 |
| `pnpm lint:fix` | ESLint 自动修复 |
| `pnpm openapi` | 生成 OpenAPI 类型和服务文件 |

### 平台支持

configured platforms: 微信小程序 (mp-weixin)、字节小程序 (mp-toutiao)

支持平台: H5、微信小程序、字节小程序，其他平台无需兼容

## 项目架构

### 目录结构

```
eat2what/
├── src/
│   ├── api/              # API 接口定义 (login, foo, foo-alova)
│   ├── components/       # 公共组件 (目前为空)
│   ├── hooks/            # 自定义 hooks (useRequest, useScroll, useUpload)
│   ├── http/             # HTTP 请求封装
│   │   ├── http.ts       # uni.request 封装 (含无感刷新 token)
│   │   ├── alova.ts      # alova 请求实例
│   │   ├── interceptor.ts # 请求拦截器 (拼接 baseUrl, 注入 token)
│   │   ├── types.ts      # 请求类型定义
│   │   └── tools/        # 枚举和工具函数
│   ├── layouts/          # 布局组件 (default.vue)
│   ├── pages/            # 主包页面 (约定式路由)
│   │   ├── index/        # 首页
│   │   ├── about/        # 关于页
│   │   ├── me/           # 个人中心
│   │   └── auth/         # 登录/注册
│   ├── pages-demo/       # 分包演示页面
│   ├── router/           # 路由拦截 (登录拦截, 黑白名单)
│   ├── service/          # OpenAPI 自动生成的服务文件
│   ├── static/           # 静态资源 (图片, SVG 图标, tabbar 图标)
│   ├── store/            # Pinia 状态管理
│   │   ├── token.ts      # token 状态 (登录/登出/刷新, 双token支持)
│   │   └── user.ts       # 用户信息状态
│   ├── style/            # 全局样式
│   ├── tabbar/           # TabBar 配置和组件 (自定义 tabbar)
│   ├── types/            # 自动生成的类型声明文件
│   ├── utils/            # 工具函数
│   ├── App.vue           # 应用入口组件
│   ├── App.ku.vue        # 酷应用入口 (备用)
│   └── main.ts           # 应用入口 (创建 Pinia, 注册拦截器)
├── env/                  # 环境变量 (.env, .env.development, .env.production, .env.test)
├── scripts/              # 工具脚本 (创建基础文件, 上传微信, 版本升级等)
├── vite-plugins/         # 自定义 Vite 插件 (原生资源复制, manifest 同步)
├── vite.config.ts        # Vite 配置 (插件链, 代理, 构建配置)
├── manifest.config.ts    # uniapp manifest 配置
├── pages.config.ts       # 页面约定配置 (easycom, tabbar, 全局样式)
├── uno.config.ts         # UnoCSS 配置 (preset, shortcuts, rules, theme)
├── tsconfig.json         # TypeScript 配置
├── eslint.config.mjs     # ESLint 配置
└── openapi-ts-request.config.ts  # OpenAPI 代码生成配置
```

### 核心架构设计

#### 1. 约定式路由

页面路由由文件系统自动生成，无需手动配置 pages.json。`vite-plugin-uni-pages` 扫描 `src/pages/` 和 `src/pages-demo/` 目录，自动生成 `src/pages.json`。

- 主包页面: `src/pages/` 下的 .vue 文件
- 分包页面: `src/pages-demo/` 下的 .vue 文件
- 页面可通过 `<route>` 块配置元数据 (`type: "home"`, `layout`, `excludeLoginPath`)

#### 2. 请求体系

项目有 **两套 HTTP 请求系统**:

**系统一: uni.request 封装 (`src/http/http.ts`, `src/api/login.ts`)**
- 基于 uni.request 的 Promise 封装
- 支持 GET/POST/PUT/DELETE，链式调用 (`http.get()`, `http.post()`)
- 401 响应自动触发无感刷新 token (双 token 模式)
- 请求拦截器 (`src/http/interceptor.ts`): 自动拼接 baseUrl、注入 Authorization header

**系统二: alova (`src/http/alova.ts`, `src/api/foo-alova.ts`)**
- 基于 alova 3.x + `@alova/adapter-uniapp`
- 支持 useHook/useWatcher 等响应式请求模式
- 自带 token 认证和刷新 (serverTokenAuthentication)
- 支持动态域名 (`VITE_SERVER_BASEURL_SECONDARY`)

#### 3. 登录认证

- 支持单 token 和双 token (access + refresh) 两种模式，通过 `VITE_AUTH_MODE` 环境变量控制
- 路由拦截器 (`src/router/interceptor.ts`): 拦截 navigateTo/reLaunch/redirectTo/switchTab
- 支持黑白名单两种策略:
  - 黑名单策略 (默认): 除指定页面外均可直接访问
  - 白名单策略: 除指定页面外均需登录
- 页面可通过 `definePage` 的 `excludeLoginPath` 属性标记为免登录
- Token 持久化: Pinia persistedstate 存储到 uni.storage

#### 4. TabBar

- 支持三种策略: 无 tabbar / 原生 tabbar / 自定义 tabbar
- 当前项目使用自定义 tabbar (`CUSTOM_TABBAR`)
- TabBar 配置统一在 `src/tabbar/config.ts`，通过 `pages.config.ts` 引入
- 自定义 tabbar 组件: `src/tabbar/index.vue`

#### 5. 组件自动导入

- `unplugin-auto-import`: 自动导入 Vue API (`ref`, `computed` 等) 和 uni-app API
- `@uni-helper/vite-plugin-uni-components`: 自动导入 components 目录下的组件
- easycom 规则: `fg-*` 组件自动映射、`u-*` 映射 uview-pro、`z-paging*` 映射 z-paging

#### 6. 环境变量

环境变量文件位于 `env/` 目录 (而非默认的根目录):
- `.env` — 基础配置 (所有环境共享)
- `.env.development` — 开发环境
- `.env.production` — 生产环境
- `.env.test` — 测试环境

关键环境变量:
- `VITE_SERVER_BASEURL` — 后端 API 地址 (默认 `https://ukw0y1.laf.run`)
- `VITE_APP_PROXY_ENABLE` — H5 端是否启用代理
- `VITE_AUTH_MODE` — 认证模式 (`single` | `double`)
- `VITE_APP_TITLE` — 应用名称
- `VITE_WX_APPID` — 微信小程序 AppID

### 开发约定

- **包管理器**: 强制使用 pnpm，preinstall 脚本会阻止其他包管理器
- **Node 版本**: >=20
- **缩进**: 2 空格 (见 `.editorconfig`)
- **引号**: 单引号 (js/ts)
- **分号**: 禁止分号
- **Vue 组件名**: kebab-case (模板中)
- **Vue SFC 顺序**: script → template → style
- **Git 提交**: 使用 commitlint (conventional commits)
- **类型检查**: `pnpm type-check` (vue-tsc)，CI 建议加上
- **大小单位**: 所有样式单位应当使用明确的单位如 `text-[24rpx]`，而非 `text-2xl` 这类语义化类名
- **禁止 emoji**: 所有图标应当使用 svg、图标库，禁止使用 emoji
- **保持记录习惯**: 保持记录的习惯——让你记住更多，将重要的修改记录到 `AGENTS.md` 文档中
- **注释**: 保持良好的注释习惯，优先使用中文注释

### 重要文件说明

- `vite.config.ts` — Vite 插件链是关键，UniXXX 系列插件必须在 Uni 之前引入，顺序不能错
- `pages.config.ts` — 通过 `defineUniPages` 配置全局样式、easycom、tabbar
- `manifest.config.ts` — 通过 `defineManifestConfig` 配置各平台 manifest
- `openapi-ts-request.config.ts` — 如有后端 Swagger/OpenAPI 文档，可自动生成 service 文件
- `src/router/config.ts` — 路由拦截配置入口，含登录策略和黑白名单
- `src/store/token.ts` — Token 管理核心，含 token 过期判断和刷新逻辑
- `src/http/http.ts` — 请求核心封装，含 401 响应拦截和无感刷新 token 队列

## Guidelines

- 遵循项目已有的代码风格 (ESLint + EditorConfig)
- 使用 Composition API + `<script setup lang="ts">` 编写 Vue 组件
- 新增页面放在 `src/pages/` 下，分包页面放在 `src/pages-demo/` 下
- API 接口定义放在 `src/api/`，使用 `http` (uni.request 封装) 或 `alova` 发起请求
- 全局状态使用 Pinia store，放在 `src/store/`
- 自定义 hooks 放在 `src/hooks/`，通过 AutoImport 自动导入
- 环境变量以 `VITE_` 为前缀，定义在 `env/` 目录下的文件中
- 修改 vite.config.ts 后无需重启，ViteRestart 插件会自动重载
- pages.json 和 manifest.json 是自动生成的，不要手动编辑

## Important Notes

- 基于 unibest 4.4.0 模板创建，CLI 版本 4.0.16
- 平台配置: 微信小程序 + 字节小程序 (见 package.json `unibest.platforms`)
- i18n 未启用，chart 配置了 lime-echart
- 当前项目名称为 `eat2what`
- 作者: 菲鸽 (feige996)，原仓库 codercup/unibest 已不可用
- 文档地址: https://unibest.tech
- Demo 地址: https://unibest-tech.github.io/hello-unibest

## UI 设计改动记录

### 设计系统（2026-05 重构）

#### 配色方案：小清新森系（Warm Forest）

| 用途 | 色值 | 说明 |
|------|------|------|
| 页底色 | `#F2EEE8` | 暖灰绿 |
| 主色 | `#5D6D5A` | 鼠尾草绿 |
| 浅绿底 | `#E2ECD8` | 问候区/CTA 背景 |
| 装饰线 | `#8CB896` | 左侧 4rpx 竖线 |
| 文字深色 | `#4A5D42` | 可可绿 |
| 文字浅色 | `#6B8A6E` | 灰绿 |
| 标签色 | `#B8C0A0` | 英文副标题色 |
| 白卡片 | `#FFFFFF` | 内容区底色 |
| 边框色 | `#D8D8C8` | 1rpx 细边框 |

#### 形状规范
- **无圆角**：所有元素 `border-radius: 0`，使用锐利边角
- **边框装饰**：`1rpx solid` 细边框替代阴影/圆角
- **装饰线**：4rpx 宽竖线在卡片左侧（绿或白）
- **标题样式**：英文大写 + 小圆点包裹 · CATEGORIES · / · TODAY'S PICK · / · TIPS ·

#### 样式技术选型
- 使用 UnoCSS 原子类写法，全部用明确 rpx 值（如 `text-[40rpx]`、`tracking-[6rpx]`），不用 `text-sm`/`text-lg`/`text-2xl` 等语义化类名
- 极少动态 `:style` 保留给运行时计算值（如 `:style="{ paddingTop: topBarHeight + 'px' }"`、条件背景色）

### 页面改动

#### 首页 `src/pages/index/index.vue`
- 完全重写，森系风格
- 问候区改为浅绿底 + 左侧 4rpx 装饰线
- 分类改为白底细边框卡片 + 圆形图标底色
- 精选菜品改为序号 + 名称 + `#tag` 标签
- 底部 CTA 改为浅绿块 + 白色按钮
- 标题改为 "今天吃什么" + 英文副标题 `eat2what`
- 区块标题改为 `· CATEGORIES ·` / `· TODAY'S PICK ·`

#### 决策页 `src/pages/decision/index.vue`
- 页面名改为 "帮我选" + `HELP ME CHOOSE`
- 移除轮盘组件（`DecisionWheel.vue` 已删除）
- 改为卡片式名字滚动抽取（老虎机效果）
- 三种状态：idle（等待点击）/ picking（滚动中）/ done（显示结果）
- 餐次选择改为方框 + 细边框
- 结果卡片加左侧 4rpx 绿线装饰
- 底部三操作按钮（再来一次 / 查看详情 / 加入购物车）

#### 购物车页 `src/pages/cart/index.vue`
- 页面名改为 "帮我买" + `BUY FOR ME`
- 改为菜单式布局：4 大类纵向排列，每类 2 列商品网格
- 大类标题：`· NAICHA ·` / `· TIANPIN ·`（取自 preset-products.json）
- 购物车改为可展开/收起的摘要条 + 详情面板
- 点击商品直接加购（无 toast）
- 底部简洁提交条

#### 我的页面 `src/pages/me/me.vue`
- 添加 `· MY PROFILE ·` 英文副标题
- 用户卡片绿色底 + 左侧 4rpx 白装饰线
- 菜单项白底 1rpx 边框，项间有分隔线
- 退出按钮方框 1rpx 边框

#### 菜品详情页 `src/pages/dish-detail/index.vue`
- 顶图改为 `#E2ECD8` 绿色底 + 厨师帽图标
- 各区卡片统一：白底 + 1rpx 边框 + 左侧 4rpx 绿线
- 分区标题：`· 简介 ·` / `· 食材 ·` / `· 做法 ·` / `· TIPS ·`
- 步骤用 01 02 03 绿色序号
- TIPS 改为浅绿底 + 暗绿装饰线
- 底部两按钮：帮我选（白底绿框）+ 加入购物车（绿底白字）
- 移除 emoji 💡

### 全局改动

#### 安全边距修复（所有自定义导航栏页面）
- 用 `uni.getMenuButtonBoundingClientRect()` 获取胶囊按钮位置
- `paddingTop = menuRect.bottom + 12px`（微信小程序）
- `paddingTop = statusBarHeight + 44px`（非小程序降级）
- 修复页面：首页、决策页、购物车页

#### 价格系统移除
- 所有页面移除 `¥{{ price }}` 显示
- `DishCard` 组件移除 `price` prop
- 加购时传 `price: 0`
- Store 中的 `totalAmount` 计算保留（传 0 后结果为 0，不影响）

#### Tabbar 配色统一
- `selectedColor`: `#FF6B35` → `#5D6D5A`（鼠尾草绿）
- `inactiveColor`: `#B2BEC3` → `#B0B8A0`（灰绿）
- 边框色: `#F0EDEC` → `#D8D8C8`

### 依赖变更

#### 新增
- `pinyin-pro`：替换手写拼音映射表，用于菜品拼音首字母提取

#### 移除
- `src/components/DecisionWheel.vue`：轮盘组件（改为卡片式抽取）
