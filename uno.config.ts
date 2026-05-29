import type { Preset } from 'unocss'
import { FileSystemIconLoader } from '@iconify/utils/lib/loader/node-loaders'

import { presetUni } from '@uni-helper/unocss-preset-uni'
import { presetLegacyCompat } from '@unocss/preset-legacy-compat'
import {
  defineConfig,
  presetIcons,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

export default defineConfig({
  presets: [
    presetUni({
      attributify: false,
    }),
    presetIcons({
      scale: 1.2,
      warn: true,
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
      },
      collections: {
        'my-icons': FileSystemIconLoader(
          './src/static/my-icons',
          (svg) => {
            let svgStr = svg
            svgStr = svgStr.includes('fill="')
              ? svgStr
              : svgStr.replace(/^<svg /, '<svg fill="currentColor" ')
            svgStr = svgStr
              .replace(/(<svg.*?width=)"(.*?)"/, '$1"1em"')
              .replace(/(<svg.*?height=)"(.*?)"/, '$1"1em"')
            return svgStr
          },
        ),
      },
    }),
    presetLegacyCompat({
      commaStyleColorFunction: true,
      legacyColorSpace: true,
    }) as Preset,
  ],
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
  ],
  shortcuts: [
    { center: 'flex justify-center items-center' },
    { 'card-shadow': 'shadow-[0_4rpx_16rpx_rgba(255,107,53,0.08)]' },
    { 'fab-shadow': 'shadow-[0_8rpx_24rpx_rgba(255,107,53,0.2)]' },
  ],
  safelist: [
    // lucide 图标 —— 全项目统一使用
    // TabBar
    'i-lucide-home',
    'i-lucide-shuffle',
    'i-lucide-shopping-cart',
    'i-lucide-user',
    // 导航/通用
    'i-lucide-search',
    'i-lucide-menu',
    'i-lucide-chevron-right',
    'i-lucide-chevron-down',
    'i-lucide-x',
    'i-lucide-check',
    'i-lucide-arrow-left',
    'i-lucide-plus',
    'i-lucide-minus',
    'i-lucide-settings',
    'i-lucide-list',
    'i-lucide-filter',
    'i-lucide-edit',
    'i-lucide-trash-2',
    'i-lucide-rotate-cw',
    'i-lucide-refresh-cw',
    'i-lucide-info',
    'i-lucide-loader-2',
    // 分类专属
    'i-lucide-utensils-crossed',
    'i-lucide-beef',
    'i-lucide-fish',
    'i-lucide-flame',
    'i-lucide-cake',
    'i-lucide-coffee',
    'i-lucide-popcorn',
    // 决策页
    'i-lucide-sunrise',
    'i-lucide-sun',
    'i-lucide-moon',
    'i-lucide-chef-hat',
    'i-lucide-layout-dashboard',
  ],
  rules: [
    [
      'p-safe',
      {
        padding:
          'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)',
      },
    ],
    ['pt-safe', { 'padding-top': 'env(safe-area-inset-top)' }],
    ['pb-safe', { 'padding-bottom': 'env(safe-area-inset-bottom)' }],
  ],
  theme: {
    colors: {
      // === 今天吃什么 · 暖食风格色彩系统 ===
      /** 主色：暖橙 - 主按钮、Tab 选中、强调文字 */
      'primary': '#FF6B35',
      'primary-dark': '#E55A2B',
      'primary-light': '#FFF0EB',
      /** 次要色：姜黄 - 轮盘装饰 */
      'secondary': '#FFB347',
      /** 强调色：青绿 - 成功状态、价格 */
      'accent': '#2EC4B6',
      /** 背景色 */
      'bg-page': '#FFF8F5',
      'bg-surface': '#FFFFFF',
      /** 文字色 */
      'text-primary': '#2D3436',
      'text-secondary': '#636E72',
      'text-hint': '#B2BEC3',
      /** 分割线 */
      'divider': '#F0EDEC',
      /** 功能色 */
      'success': '#2EC4B6',
      'warning': '#FFB347',
      'error': '#E17055',
      'info': '#74B9FF',
      /** 分类专属色 */
      'cat-chinese': '#E17055',
      'cat-western': '#D4A574',
      'cat-japanese': '#F8B4B8',
      'cat-korean': '#A29BFE',
      'cat-dessert': '#FDCB6E',
      'cat-bubble-tea': '#C8A883',
      'cat-snack': '#FF9F43',
      'cat-other': '#B2BEC3',
      /** 编辑风新增 */
      'ink': '#1A1A1A',
      'paper': '#F9F6F0',
      'ink-light': '#2D2D2D',
    },
    fontSize: {
      '2xs': ['20rpx', '28rpx'],
      '3xs': ['18rpx', '26rpx'],
    },
    borderRadius: {
      sm: '8rpx',
      md: '16rpx',
      lg: '24rpx',
      full: '999rpx',
    },
  },
})
