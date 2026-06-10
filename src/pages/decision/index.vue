<script lang="ts" setup>
import type { Category } from '@/api/dish'
import type { MealType, ScopeType } from '@/store/decision'
import type { DishItem } from '@/types/dish'

import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { getAllDishes, getCategories } from '@/api/dish'
import { useSafeArea } from '@/hooks/useSafeArea'
import { useCartStore } from '@/store/cart'
import { useDecisionStore } from '@/store/decision'

defineOptions({ name: 'DecisionPage' })
definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '帮我选',
  },
})

const { topBarHeight } = useSafeArea()

const decisionStore = useDecisionStore()
const cartStore = useCartStore()

const allDishes = ref<DishItem[]>([])
const categories = ref<Category[]>([])
const loading = ref(true)

// ====== 餐次 / 范围 ======

const mealTypes: { key: MealType, label: string, icon: string }[] = [
  { key: 'breakfast', label: '早餐', icon: 'i-lucide-sunrise' },
  { key: 'lunch', label: '午餐', icon: 'i-lucide-sun' },
  { key: 'dinner', label: '晚餐', icon: 'i-lucide-moon' },
]
const currentMeal = ref<MealType>(decisionStore.mealType)

const showScopePicker = ref(false)
const scopeType = ref<ScopeType>(decisionStore.scope.type)
const scopeCategoryId = ref<string>(decisionStore.scope.id || '')
const scopeCategoryName = computed(() => {
  if (scopeType.value === 'category' && scopeCategoryId.value) {
    const cat = categories.value.find(c => c.id === scopeCategoryId.value)
    return cat?.name || '全部'
  }
  return '全部'
})
const scopeLabel = computed(() => {
  if (scopeType.value === 'all') return '全部菜品'
  if (scopeType.value === 'category') return scopeCategoryName.value
  return '全部菜品'
})

const candidateDishes = computed(() => {
  if (scopeType.value === 'category' && scopeCategoryId.value) {
    return allDishes.value.filter(d => d.subCategoryId.startsWith(scopeCategoryId.value))
  }
  return allDishes.value
})

const todayLabel = computed(() => {
  const d = new Date()
  const month = d.getMonth() + 1
  const day = d.getDate()
  const weeks = ['日', '一', '二', '三', '四', '五', '六']
  return `${month}月${day}日 · 周${weeks[d.getDay()]}`
})

// ====== 转盘核心 ======

type PickState = 'idle' | 'picking' | 'done'
const pickState = ref<PickState>('idle')
const resultDish = ref<DishItem | null>(null)

const MAX_SLICES = 8 // 8 等分,可读性最好

// Morandi 奶咖森系扇区配色 —— 低饱和、相邻不同色、整体柔和
// 6 色循环避免任何相邻同色;文字统一深绿,不再深底白字
const SEGMENT_COLORS = [
  '#F5F1EA', // 暖奶白
  '#DCE3D3', // 浅雾绿
  '#EDE7DA', // 浅奶米
  '#C9D3C0', // 灰抹茶
  '#E8DFD0', // 米杏
  '#D4DFC4', // 嫩绿
  '#F0EBE0', // 燕麦
  '#C2CFB6', // 深抹茶
]

const SEGMENT_TEXT = '#4A5D42' // 文字统一深绿,适配所有浅底
const DIVIDER_COLOR = 'rgba(74,93,66,0.18)' // 极淡分隔线
const RIM_COLOR = '#5D6D5A' // 圆边主描边
const HUB_FILL = '#FFFFFF' // 中心 CTA 背景
const HUB_BORDER = '#5D6D5A'
const POINTER_FILL = '#5D6D5A' // 顶部指针
const POINTER_HIGHLIGHT = '#FFFFFF' // 指针高光

const canvasRef = ref<HTMLCanvasElement | null>(null)
let wheelCtx: CanvasRenderingContext2D | null = null

// 像素尺寸（模板 :style 依赖）
const canvasW = ref(0)
const canvasH = ref(0)

let dpr = 1
let rpx2px = 1
// 几何缓存
let CX = 0
let CY = 0
let R_OUTER = 0 // 圆盘半径
let R_HUB = 0 // 中心 CTA 半径（位于画布底部,只露出上半）

const wheelDishes = ref<DishItem[]>([])
const currentRotation = ref(-Math.PI / 2) // 起始:第一片正对顶部

// 旋转动画句柄（RAF）
let spinRafId: ReturnType<typeof setTimeout> | null = null

function calcWheelSize() {
  const sys = uni.getSystemInfoSync()
  dpr = sys.pixelRatio || 2
  const sw = sys.windowWidth
  rpx2px = sw / 750

  const stagePad = 32 * rpx2px
  const stage = sw - stagePad * 2

  // 顶部指针占 60rpx,底部留白 16rpx
  const pointerH = 60 * rpx2px
  const bottomPad = 16 * rpx2px

  // 半圆形态:半径 = 画布宽的一半,略缩避免描边被裁
  const r = Math.floor(stage / 2 - 4 * rpx2px)
  const hub = Math.max(44 * rpx2px, r * 0.16)

  canvasW.value = stage
  // 半圆露上半 + 圆心下方再留 R_HUB 给 GO 圆的下半,使其完整位于几何圆心
  canvasH.value = Math.ceil(pointerH + r + hub + bottomPad)

  CX = stage / 2
  // 圆心:扇区半圆从 CY 向上展开;GO 圆完整以 CY 为心绘制
  CY = pointerH + r
  R_OUTER = r
  R_HUB = hub
}

function prepareWheelDishes() {
  const pool = candidateDishes.value
  if (pool.length === 0) {
    wheelDishes.value = []
    return
  }
  // 转盘永远 8 等分:菜品数少于 8 时循环填充,大于 8 时随机抽 8 道
  if (pool.length >= MAX_SLICES) {
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    wheelDishes.value = shuffled.slice(0, MAX_SLICES)
  }
  else {
    const filled: DishItem[] = []
    for (let i = 0; i < MAX_SLICES; i++) {
      filled.push(pool[i % pool.length])
    }
    wheelDishes.value = filled
  }
}

function initCanvas() {
  nextTick(() => {
    const query = uni.createSelectorQuery()
    query.select('#wheelCanvas')
      .fields({ node: true, size: true }, () => {})
      .exec((res: any[]) => {
        const node = res?.[0]?.node
        if (!node) return

        node.width = canvasW.value * dpr
        node.height = canvasH.value * dpr

        wheelCtx = node.getContext('2d')
        if (wheelCtx) wheelCtx.scale(dpr, dpr)

        prepareWheelDishes()
        drawWheel(currentRotation.value)
      })
  })
}

// ----- 绘制工具 -----

function fitName(name: string, maxLen = 5): string {
  if (name.length <= maxLen) return name
  return `${name.slice(0, maxLen - 1)}…`
}

function drawWheel(rotation: number) {
  const ctx = wheelCtx
  if (!ctx) return

  const n = MAX_SLICES
  const sliceAngle = (2 * Math.PI) / n

  ctx.clearRect(0, 0, canvasW.value, canvasH.value)

  // ---- 1. 圆盘投影（柔和阴影,仅上半） ----
  ctx.save()
  // 裁切到上半圆区域（y <= CY）—— 让所有"圆盘相关"绘制只显示上半
  ctx.beginPath()
  ctx.rect(0, 0, canvasW.value, CY)
  ctx.clip()

  // 投影
  ctx.beginPath()
  ctx.arc(CX, CY + 4 * rpx2px, R_OUTER + 2 * rpx2px, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(74,93,66,0.12)'
  ctx.fill()

  // ---- 2. 扇区（Morandi 多色循环） ----
  const dishes = wheelDishes.value
  for (let i = 0; i < n; i++) {
    const start = rotation + i * sliceAngle
    const end = rotation + (i + 1) * sliceAngle

    ctx.beginPath()
    ctx.moveTo(CX, CY)
    ctx.arc(CX, CY, R_OUTER, start, end)
    ctx.closePath()
    ctx.fillStyle = SEGMENT_COLORS[i % SEGMENT_COLORS.length]
    ctx.fill()

    // 极淡分隔线（仅一根细发丝感）
    ctx.strokeStyle = DIVIDER_COLOR
    ctx.lineWidth = 0.6
    ctx.stroke()

    // 文字
    const dish = dishes[i]
    if (!dish) continue

    const mid = start + sliceAngle / 2
    ctx.save()
    ctx.translate(CX, CY)
    ctx.rotate(mid)

    const fontSize = Math.max(12, Math.min(16, R_OUTER / 12))
    ctx.font = `500 ${fontSize}px sans-serif`
    ctx.fillStyle = SEGMENT_TEXT
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // 文字位置:半径 68% 处 —— 半圆视野里最显眼的位置
    ctx.fillText(fitName(dish.name, 5), R_OUTER * 0.68, 0)
    ctx.restore()
  }

  // ---- 3. 圆盘外描边（仅上半弧） ----
  ctx.beginPath()
  ctx.arc(CX, CY, R_OUTER, Math.PI, 2 * Math.PI)
  ctx.strokeStyle = RIM_COLOR
  ctx.lineWidth = 1.5
  ctx.stroke()

  // 半圆底部一条横切线（封口）
  ctx.beginPath()
  ctx.moveTo(CX - R_OUTER, CY)
  ctx.lineTo(CX + R_OUTER, CY)
  ctx.strokeStyle = RIM_COLOR
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.restore() // 解除上半裁切,后面的 GO 圆和指针正常完整绘制

  // ---- 4. 中心 CTA 圆（完整圆,坐落在半圆的几何圆心） ----
  // 阴影
  ctx.beginPath()
  ctx.arc(CX, CY + 3 * rpx2px, R_HUB + 1 * rpx2px, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(74,93,66,0.18)'
  ctx.fill()
  // 主体
  ctx.beginPath()
  ctx.arc(CX, CY, R_HUB, 0, Math.PI * 2)
  ctx.fillStyle = HUB_FILL
  ctx.fill()
  ctx.strokeStyle = HUB_BORDER
  ctx.lineWidth = 1.5
  ctx.stroke()
  // 内圈细描边
  ctx.beginPath()
  ctx.arc(CX, CY, R_HUB - 5 * rpx2px, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(93,109,90,0.35)'
  ctx.lineWidth = 1
  ctx.stroke()

  // 中心文字（圆心居中）
  ctx.fillStyle = HUB_BORDER
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  if (pickState.value === 'picking') {
    ctx.font = `600 ${R_HUB * 0.3}px sans-serif`
    ctx.fillText('抽取中', CX, CY)
  }
  else if (pickState.value === 'done') {
    ctx.font = `600 ${R_HUB * 0.5}px sans-serif`
    ctx.fillText('✓', CX, CY)
  }
  else {
    ctx.font = `600 ${R_HUB * 0.5}px sans-serif`
    ctx.fillText('GO', CX, CY)
  }

  // ---- 5. 顶部指针（水滴形朝下,完全浮于盘外） ----
  const pTipY = CY - R_OUTER - 1 * rpx2px // 尖端咬住盘边
  const pBaseY = pTipY - 44 * rpx2px
  const pHalfW = 16 * rpx2px

  // 指针阴影
  ctx.beginPath()
  ctx.moveTo(CX, pTipY + 2 * rpx2px)
  ctx.lineTo(CX - pHalfW, pBaseY + 2 * rpx2px)
  ctx.lineTo(CX + pHalfW, pBaseY + 2 * rpx2px)
  ctx.closePath()
  ctx.fillStyle = 'rgba(74,93,66,0.18)'
  ctx.fill()

  // 指针主体（水滴形:上圆下尖）
  ctx.beginPath()
  ctx.moveTo(CX, pTipY)
  ctx.lineTo(CX - pHalfW, pBaseY)
  ctx.arc(CX, pBaseY - pHalfW * 0.1, pHalfW, Math.PI, 0, false)
  ctx.lineTo(CX + pHalfW, pBaseY)
  ctx.closePath()
  ctx.fillStyle = POINTER_FILL
  ctx.fill()
  ctx.strokeStyle = '#3A4A36'
  ctx.lineWidth = 1
  ctx.stroke()

  // 指针高光
  ctx.beginPath()
  ctx.arc(CX - pHalfW * 0.35, pBaseY - pHalfW * 0.5, pHalfW * 0.22, 0, Math.PI * 2)
  ctx.fillStyle = POINTER_HIGHLIGHT
  ctx.fill()
}

// ----- 命中判定 -----

function getResultIndex(rotation: number): number {
  const n = MAX_SLICES
  const sliceAngle = (2 * Math.PI) / n
  // 指针固定在 -π/2（12 点钟方向）
  // 扇区 i 中心 = rotation + i*slice + slice/2,要求 == -π/2 (mod 2π)
  const normalized = (((-Math.PI / 2 - rotation) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
  return Math.floor(normalized / sliceAngle) % n
}

// ----- RAF tween（小程序兼容,零依赖） -----

function tween(opts: {
  from: number
  to: number
  duration: number
  easing: (t: number) => number
  onUpdate: (v: number) => void
  onComplete?: () => void
}) {
  const start = Date.now()
  function step() {
    const elapsed = Date.now() - start
    const t = Math.min(elapsed / opts.duration, 1)
    const v = opts.from + (opts.to - opts.from) * opts.easing(t)
    opts.onUpdate(v)
    if (t < 1) {
      spinRafId = setTimeout(step, 16)
    }
    else {
      spinRafId = null
      opts.onComplete?.()
    }
  }
  spinRafId = setTimeout(step, 16)
}

// easeOutQuart —— 转盘标准缓动:起步迅猛,末段平滑停下
const easeOutQuart = (t: number) => 1 - (1 - t) ** 4
// easeOutBack —— 轻微回弹,模拟物理惯性
function easeOutBack(t: number) {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2
}

// ----- 旋转 -----

function spin() {
  if (wheelDishes.value.length === 0) return
  if (pickState.value === 'picking') return

  pickState.value = 'picking'
  resultDish.value = null

  const n = MAX_SLICES
  const sliceAngle = (2 * Math.PI) / n
  const targetIdx = Math.floor(Math.random() * n)

  // 计算"目标扇区中心对准 -π/2"所需的旋转角度
  const targetCenter = targetIdx * sliceAngle + sliceAngle / 2
  let targetRotation = -Math.PI / 2 - targetCenter

  // 加 5~7 整圈
  const fullSpins = 2 * Math.PI * (5 + Math.random() * 2)
  targetRotation += fullSpins

  // 保证正向（大于当前角度）
  while (targetRotation <= currentRotation.value) {
    targetRotation += 2 * Math.PI
  }

  // 给一点扇区内偏移,模拟真转盘的"偏停"
  const jitter = (Math.random() - 0.5) * sliceAngle * 0.5
  targetRotation += jitter

  // 阶段 1:主旋转,easeOutQuart
  tween({
    from: currentRotation.value,
    to: targetRotation,
    duration: 4200,
    easing: easeOutQuart,
    onUpdate: (v) => {
      currentRotation.value = v
      drawWheel(v)
    },
    onComplete: () => {
      // 阶段 2:短促回弹（最后 1/4 扇区距离）
      const bounceTo = targetRotation - sliceAngle * 0.08
      tween({
        from: targetRotation,
        to: bounceTo,
        duration: 280,
        easing: easeOutBack,
        onUpdate: (v) => {
          currentRotation.value = v
          drawWheel(v)
        },
        onComplete: () => {
          currentRotation.value = bounceTo
          drawWheel(bounceTo)
          const actualIdx = getResultIndex(bounceTo)
          onSpinEnd(actualIdx)
        },
      })
    },
  })
}

function onSpinEnd(targetIdx: number) {
  pickState.value = 'done'
  const dish = wheelDishes.value[targetIdx]
  resultDish.value = dish || null
  drawWheel(currentRotation.value) // 重绘以更新中心 GO -> ✓
  if (dish) {
    decisionStore.setResult(dish)
    decisionStore.addToHistory(dish)
  }
  uni.vibrateShort({ type: 'light' })
}

function cancelAnyAnim() {
  if (spinRafId) {
    clearTimeout(spinRafId)
    spinRafId = null
  }
}

// ====== 用户操作 ======

function onWheelTap() {
  // 中心 CTA 即"开始抽取";idle / done 都允许触发
  if (pickState.value === 'picking') return
  if (pickState.value === 'done') {
    pickAgain()
    // 重置后立刻再抽:微延迟,让 idle 状态先渲染一次
    setTimeout(spin, 60)
    return
  }
  spin()
}

function pickAgain() {
  cancelAnyAnim()
  pickState.value = 'idle'
  resultDish.value = null
  prepareWheelDishes()
  currentRotation.value = -Math.PI / 2
  drawWheel(currentRotation.value)
}

function addResultToCart() {
  if (!resultDish.value) return
  cartStore.addItem({
    id: resultDish.value.id,
    name: resultDish.value.name,
    price: 0,
    category: '决策推荐',
  }, 1)
  uni.showToast({ title: '已加入购物车', icon: 'success', duration: 1500 })
  uni.vibrateShort({ type: 'light' })
}

function goToDetail() {
  if (!resultDish.value) return
  uni.navigateTo({ url: `/pages/dish-detail/index?id=${resultDish.value.id}` })
}

function selectScope(type: ScopeType, categoryId?: string) {
  scopeType.value = type
  if (type === 'category' && categoryId) {
    scopeCategoryId.value = categoryId
  }
  showScopePicker.value = false
  decisionStore.setScope({ type, id: categoryId })
  pickAgain()
}

// ====== 生命周期 ======

onMounted(async () => {
  calcWheelSize()

  const [dishes, cats] = await Promise.all([getAllDishes(), getCategories()])
  allDishes.value = dishes
  categories.value = cats
  loading.value = false

  initCanvas()
})

onUnmounted(() => {
  cancelAnyAnim()
})

watch(currentMeal, (val) => {
  decisionStore.setMealType(val)
  pickAgain()
})
</script>

<template>
  <view class="min-h-screen overflow-x-hidden bg-[#F2EEE8]">
    <!-- ===== 顶部标题 ===== -->
    <view
      class="px-[48rpx] pb-[24rpx]"
      :style="{ paddingTop: `${topBarHeight}px` }"
    >
      <view class="flex items-end justify-between">
        <text class="text-[44rpx] text-[#5D6D5A] leading-[1.1] tracking-[6rpx] font-[300]">
          帮我选
        </text>
        <text class="text-[20rpx] text-[#B8C0A0] tracking-[4rpx]">
          · HELP ME CHOOSE ·
        </text>
      </view>
    </view>

    <view v-if="loading" class="flex justify-center pt-[200rpx]">
      <text class="text-[24rpx] text-[#B8C0A0] tracking-[2rpx]">加载中...</text>
    </view>

    <template v-else>
      <!-- ===== 餐次 ===== -->
      <view class="px-[48rpx]">
        <view class="flex border border-[#D8D8C8] bg-[#FFFFFF]">
          <view
            v-for="meal in mealTypes"
            :key="meal.key"
            class="flex flex-1 items-center justify-center gap-[10rpx] py-[24rpx]"
            hover-class="meal-hover"
            :style="{
              background: currentMeal === meal.key ? '#5D6D5A' : '#FFFFFF',
              borderRight: meal.key === 'dinner' ? 'none' : '1rpx solid #D8D8C8',
            }"
            @click="currentMeal = meal.key"
          >
            <view
              :class="meal.icon"
              :style="{ fontSize: '26rpx', color: currentMeal === meal.key ? '#FFFFFF' : '#6B8A6E' }"
            />
            <text
              :style="{
                fontSize: '24rpx',
                fontWeight: currentMeal === meal.key ? 500 : 400,
                color: currentMeal === meal.key ? '#FFFFFF' : '#4A5D42',
                letterSpacing: '3rpx',
              }"
            >
              {{ meal.label }}
            </text>
          </view>
        </view>
      </view>

      <!-- ===== 日期 / 范围 ===== -->
      <view class="mt-[20rpx] flex items-center justify-between px-[48rpx]">
        <view class="flex items-center gap-[12rpx]">
          <view class="h-[20rpx] w-[4rpx] bg-[#8CB896]" />
          <text class="text-[22rpx] text-[#6B8A6E] tracking-[2rpx]">
            {{ todayLabel }}
          </text>
        </view>
        <view
          class="flex items-center gap-[8rpx] border border-[#D8D8C8] bg-[#FFFFFF] px-[20rpx] py-[8rpx]"
          hover-class="btn-hover"
          @click="showScopePicker = !showScopePicker"
        >
          <text class="text-[22rpx] text-[#5D6D5A] tracking-[2rpx]">
            {{ scopeLabel }}
          </text>
          <view class="i-lucide-chevron-down text-[22rpx] text-[#8CB896]" />
        </view>
      </view>

      <!-- ===== 转盘舞台 ===== -->
      <view class="mt-[36rpx] px-[32rpx]">
        <!-- 副标题条 -->
        <view class="mb-[12rpx] flex items-center justify-between">
          <text class="text-[22rpx] text-[#B8C0A0] tracking-[4rpx]">
            · LUCKY WHEEL ·
          </text>
          <text class="text-[20rpx] text-[#B8C0A0] tracking-[2rpx]">
            {{ candidateDishes.length }} 道候选 · 抽 {{ wheelDishes.length }}
          </text>
        </view>

        <!-- Canvas 转盘（点中心 CTA 即触发） -->
        <view class="flex justify-center" @click="onWheelTap">
          <canvas
            id="wheelCanvas"
            ref="canvasRef"
            type="2d"
            class="block"
            :style="{ width: `${canvasW}px`, height: `${canvasH}px` }"
          />
        </view>
      </view>

      <!-- ===== 状态提示条 / 结果卡 ===== -->
      <view class="mt-[8rpx] px-[48rpx]">
        <!-- IDLE -->
        <view v-if="pickState === 'idle'" class="flex items-center justify-center gap-[12rpx]">
          <view class="i-lucide-mouse-pointer-click text-[24rpx] text-[#8CB896]" />
          <text class="text-[24rpx] text-[#6B8A6E] tracking-[3rpx]">
            点击中心 GO 开始抽取
          </text>
        </view>

        <!-- PICKING -->
        <view v-else-if="pickState === 'picking'" class="flex items-center justify-center gap-[12rpx]">
          <view class="i-lucide-loader animate-spin text-[24rpx] text-[#8CB896]" />
          <text class="text-[24rpx] text-[#5D6D5A] tracking-[3rpx]">
            正 在 抽 取
          </text>
        </view>

        <!-- DONE 结果卡（与转盘留出充足呼吸距） -->
        <view v-else-if="pickState === 'done' && resultDish" class="relative mt-[40rpx] border border-[#D8D8C8] bg-[#FFFFFF] px-[32rpx] py-[28rpx]">
          <view class="absolute bottom-0 left-0 top-0 w-[4rpx] bg-[#8CB896]" />
          <text class="text-[20rpx] text-[#B8C0A0] tracking-[4rpx]">
            · TODAY'S PICK ·
          </text>
          <text class="mt-[10rpx] block text-[36rpx] text-[#4A5D42] leading-[1.3] tracking-[4rpx] font-[500]">
            {{ resultDish.name }}
          </text>
          <text
            v-if="resultDish.description"
            class="mt-[8rpx] block text-[22rpx] text-[#6B8A6E] leading-[1.6] tracking-[1rpx]"
          >
            {{ resultDish.description }}
          </text>
          <view v-if="resultDish.tags?.length" class="mt-[12rpx] flex items-center gap-[16rpx]">
            <text
              v-for="tag in resultDish.tags.slice(0, 3)"
              :key="tag"
              class="text-[20rpx] text-[#7A9A7E] tracking-[2rpx]"
            >
              #{{ tag }}
            </text>
          </view>
        </view>
      </view>

      <!-- ===== 结果操作按钮 ===== -->
      <view v-if="pickState === 'done' && resultDish" class="mt-[24rpx] px-[48rpx]">
        <view class="flex border border-[#D8D8C8] bg-[#FFFFFF]">
          <view
            class="flex flex-1 items-center justify-center gap-[8rpx] border-r border-[#D8D8C8] py-[24rpx]"
            hover-class="btn-hover"
            @click="pickAgain"
          >
            <view class="i-lucide-rotate-cw text-[22rpx] text-[#5D6D5A]" />
            <text class="text-[22rpx] text-[#4A5D42] tracking-[3rpx]">再来一次</text>
          </view>
          <view
            class="flex flex-1 items-center justify-center gap-[8rpx] border-r border-[#D8D8C8] py-[24rpx]"
            hover-class="btn-hover"
            @click="goToDetail"
          >
            <view class="i-lucide-info text-[22rpx] text-[#5D6D5A]" />
            <text class="text-[22rpx] text-[#4A5D42] tracking-[3rpx]">查看详情</text>
          </view>
          <view
            class="flex flex-1 items-center justify-center gap-[8rpx] bg-[#E2ECD8] py-[24rpx]"
            hover-class="btn-cta-hover"
            @click="addResultToCart"
          >
            <view class="i-lucide-shopping-cart text-[22rpx] text-[#5D6D5A]" />
            <text class="text-[22rpx] text-[#5D6D5A] tracking-[3rpx] font-[500]">加入购物车</text>
          </view>
        </view>
      </view>

      <!-- ===== 范围选择弹窗 ===== -->
      <view v-if="showScopePicker" class="fixed inset-0 z-50" @click="showScopePicker = false">
        <view class="absolute inset-0" style="background: rgba(60,50,40,0.4);" />
        <view
          class="absolute bottom-0 left-0 right-0 border-t border-[#D8D8C8] bg-[#FFFFFF]"
          style="padding-bottom: calc(env(safe-area-inset-bottom) + 24rpx);"
          @click.stop
        >
          <view class="flex items-center justify-between border-b border-[#E8E0D0] px-[48rpx] py-[28rpx]">
            <view class="flex items-center gap-[12rpx]">
              <view class="h-[24rpx] w-[4rpx] bg-[#8CB896]" />
              <text class="text-[26rpx] text-[#4A5D42] tracking-[3rpx]">限定抽取范围</text>
            </view>
            <view class="i-lucide-x text-[28rpx] text-[#B8C0A0]" @click="showScopePicker = false" />
          </view>
          <view class="max-h-[60vh] overflow-y-auto px-[48rpx] pb-[24rpx] pt-[16rpx]">
            <view
              class="flex items-center justify-between border-b border-[#F0E8E0] py-[24rpx]"
              @click="selectScope('all')"
            >
              <text
                :style="{
                  fontSize: '24rpx',
                  fontWeight: scopeType === 'all' ? 500 : 400,
                  color: scopeType === 'all' ? '#5D6D5A' : '#6B8A6E',
                  letterSpacing: '2rpx',
                }"
              >
                全部菜品
              </text>
              <view v-if="scopeType === 'all'" class="i-lucide-check text-[24rpx] text-[#8CB896]" />
            </view>
            <view
              v-for="cat in categories"
              :key="cat.id"
              class="flex items-center justify-between border-b border-[#F0E8E0] py-[24rpx]"
              @click="selectScope('category', cat.id)"
            >
              <view class="flex items-center gap-[16rpx]">
                <view :class="cat.icon" :style="{ fontSize: '28rpx', color: cat.color }" />
                <text
                  :style="{
                    fontSize: '24rpx',
                    fontWeight: scopeType === 'category' && scopeCategoryId === cat.id ? 500 : 400,
                    color: scopeType === 'category' && scopeCategoryId === cat.id ? '#5D6D5A' : '#6B8A6E',
                    letterSpacing: '2rpx',
                  }"
                >
                  {{ cat.name }}
                </text>
              </view>
              <view
                v-if="scopeType === 'category' && scopeCategoryId === cat.id"
                class="i-lucide-check text-[24rpx] text-[#8CB896]"
              />
            </view>
          </view>
        </view>
      </view>
    </template>

    <view style="padding-bottom: calc(env(safe-area-inset-bottom) + 48rpx);" />
  </view>
</template>

<style scoped>
.meal-hover {
  opacity: 0.85;
}
.btn-hover {
  background: #f2f6ee !important;
}
.btn-cta-hover {
  opacity: 0.88;
}
.animate-spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
