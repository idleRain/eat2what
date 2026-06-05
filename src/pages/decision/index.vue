<script lang="ts" setup>
import type { Category } from '@/api/dish'
import type { DishItem } from '@/types/dish'
import type { MealType, ScopeType } from '@/store/decision'
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

type PickState = 'idle' | 'picking' | 'done'
const pickState = ref<PickState>('idle')
const resultDish = ref<DishItem | null>(null)

// ====== Canvas 转盘 ======

const MAX_SLICES = 10

const SEGMENT_COLORS = [
  '#E2ECD8',
  '#C8DDB8',
  '#EEEAD8',
  '#D0E0C0',
  '#E8EDE0',
  '#C8D0B0',
  '#E2ECD8',
  '#D0E8C8',
  '#D8E0C8',
  '#BCD0B0',
]

const canvasRef = ref<HTMLCanvasElement | null>(null)
let wheelCtx: CanvasRenderingContext2D | null = null
let animTimerId: ReturnType<typeof setTimeout> | null = null

const wheelDishes = ref<DishItem[]>([])
const currentRotation = ref(0)

// 像素尺寸（动态计算）
const wheelRadius = ref(0)
const canvasW = ref(0)
const canvasH = ref(0)
const cardMinHPx = ref(0) // 卡片最小高度 (px)

// ----- 尺寸计算（同步，在模板渲染前调用） -----

let dpr = 1
let rpx2px = 1

function calcWheelSize() {
  const sys = uni.getSystemInfoSync()
  dpr = sys.pixelRatio || 2
  const sw = sys.windowWidth
  rpx2px = sw / 750
  const pad = 48 * rpx2px
  const cardW = sw - pad * 2

  const r = Math.floor(cardW / 2)
  const h = r + 64 * rpx2px

  wheelRadius.value = r
  canvasW.value = cardW
  canvasH.value = h
  // 卡片底部信息区固定 120px
  cardMinHPx.value = Math.ceil(h + 150 * rpx2px)
}

// ----- 准备转盘菜品 -----

function prepareWheelDishes() {
  const pool = candidateDishes.value
  if (pool.length === 0) {
    wheelDishes.value = []
    return
  }
  if (pool.length <= MAX_SLICES) {
    wheelDishes.value = [...pool]
  }
  else {
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    wheelDishes.value = shuffled.slice(0, MAX_SLICES)
  }
}

// ----- 初始化 Canvas（仅绑定缓冲区尺寸，CSS 尺寸由模板 :style 控制） -----

function initCanvas() {
  nextTick(() => {
    // SelectorQuery 在 H5 和小程序都可用
    const query = uni.createSelectorQuery()
    query.select('#wheelCanvas')
      .fields({ node: true, size: true })
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

// ----- 绘制转盘 -----

function drawWheel(rotation: number) {
  const ctx = wheelCtx
  if (!ctx) return

  const r = wheelRadius.value
  const cx = canvasW.value / 2
  const cy = 0 // 圆心在画布顶部

  const dishes = wheelDishes.value
  const n = dishes.length
  if (n === 0) return

  const sliceAngle = (2 * Math.PI) / n

  ctx.clearRect(0, 0, canvasW.value, canvasH.value)

  // ---- 绘制所有扇区 ----
  for (let i = 0; i < n; i++) {
    const start = rotation + i * sliceAngle
    const end = rotation + (i + 1) * sliceAngle

    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, r, start, end)
    ctx.closePath()
    ctx.fillStyle = SEGMENT_COLORS[i % SEGMENT_COLORS.length]
    ctx.fill()
    ctx.strokeStyle = '#A0B898'
    ctx.lineWidth = 0.5
    ctx.stroke()

    // 标签文字
    const mid = start + sliceAngle / 2
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(mid)

    // 字号随半径调整，不超过 14px
    const fontSize = Math.max(10, Math.min(14, r / 6))
    ctx.font = `500 ${fontSize}px sans-serif`
    ctx.fillStyle = '#4A5D42'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // 限制长度
    let name = dishes[i].name
    if (name.length > 4) name = name.slice(0, 4)

    // 放在半径 65% 处
    ctx.fillText(name, r * 0.65, 0)
    ctx.restore()
  }

  // ---- 外圈描边 ----
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.strokeStyle = '#8CB896'
  ctx.lineWidth = 2
  ctx.stroke()

  // ---- 中心圆 ----
  const cr = Math.max(24, Math.min(40, r * 0.18))
  ctx.beginPath()
  ctx.arc(cx, cy, cr, 0, Math.PI * 2)
  ctx.fillStyle = '#FFFFFF'
  ctx.fill()
  ctx.strokeStyle = '#5D6D5A'
  ctx.lineWidth = 2
  ctx.stroke()

  // ---- 状态文字（中心圆内） ----
  ctx.fillStyle = '#5D6D5A'
  ctx.font = `500 ${Math.max(10, r * 0.07)}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  if (pickState.value === 'idle') {
    ctx.fillText('抽 取', cx, cy)
  }
  else if (pickState.value === 'done') {
    ctx.fillText('✓', cx, cy)
  }

  // ---- 底部指示器（三角箭头） ----
  const py = r + 4
  ctx.beginPath()
  ctx.moveTo(cx, py)
  ctx.lineTo(cx - 10, py + 18)
  ctx.lineTo(cx + 10, py + 18)
  ctx.closePath()
  ctx.fillStyle = '#5D6D5A'
  ctx.fill()
}

// ----- 从旋转角度反算指针所指扇区索引 -----

function getResultIndex(rotation: number): number {
  const n = wheelDishes.value.length
  if (n === 0) return -1
  const sliceAngle = (2 * Math.PI) / n
  // 指示器在底部（π/2），扇区从角度 0 顺时针排列
  // 经过旋转 rotation 后，底部指向的角度 = (π/2 - rotation) mod 2π
  const normalized = (((Math.PI / 2 - rotation) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
  return Math.floor(normalized / sliceAngle) % n
}

// ----- 旋转动画 -----

function spin() {
  if (wheelDishes.value.length === 0) return
  if (pickState.value === 'picking') return

  pickState.value = 'picking'
  resultDish.value = null

  const n = wheelDishes.value.length
  const sliceAngle = (2 * Math.PI) / n

  // 目标扇区（随机）
  const targetIdx = Math.floor(Math.random() * n)

  // 计算该扇区中心到底部指示器的旋转角度
  // 扇区中心初始角度 = targetIdx * sliceAngle + sliceAngle/2
  // 需要停在底部指示器 (π/2) 处：
  //   (rotation + targetIdx * sliceAngle + sliceAngle/2) mod 2π = π/2
  //   rotation = π/2 - (targetIdx * sliceAngle + sliceAngle/2)
  const targetCenter = targetIdx * sliceAngle + sliceAngle / 2
  let targetRotation = Math.PI / 2 - targetCenter

  // 保持正旋转方向，加 5~8 圈
  const fullSpins = 2 * Math.PI * (5 + Math.random() * 3)
  targetRotation += fullSpins

  // 确保比当前角度大（正向旋转）
  while (targetRotation <= currentRotation.value) {
    targetRotation += 2 * Math.PI
  }

  const startRotation = currentRotation.value
  const totalDelta = targetRotation - startRotation
  const startTime = Date.now()
  const duration = 3000 + Math.random() * 1000 // 3~4 秒

  function animate() {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)

    // ease-out cubic
    const eased = 1 - (1 - progress) ** 3

    currentRotation.value = startRotation + totalDelta * eased
    drawWheel(currentRotation.value)

    if (progress < 1) {
      animTimerId = setTimeout(animate, 16) // ~60fps
    }
    else {
      // 从实际旋转位置反算指针所指扇区
      currentRotation.value = targetRotation
      drawWheel(targetRotation)
      const actualIdx = getResultIndex(targetRotation)
      onSpinEnd(actualIdx)
    }
  }

  animTimerId = setTimeout(animate, 16)
}

function onSpinEnd(targetIdx: number) {
  pickState.value = 'done'
  const dish = wheelDishes.value[targetIdx]
  resultDish.value = dish || null
  if (dish) {
    decisionStore.setResult(dish)
    decisionStore.addToHistory(dish)
  }
  uni.vibrateShort({ type: 'light' })
}

// ----- 用户操作 -----

function pickAgain() {
  pickState.value = 'idle'
  resultDish.value = null
  prepareWheelDishes()
  currentRotation.value = 0
  drawWheel(0)
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
  // 先同步计算尺寸，模板 :style 依赖 canvasW/canvasH
  calcWheelSize()

  const [dishes, cats] = await Promise.all([getAllDishes(), getCategories()])
  allDishes.value = dishes
  categories.value = cats
  loading.value = false

  initCanvas()
})

onUnmounted(() => {
  if (animTimerId) clearTimeout(animTimerId)
})

watch(currentMeal, (val) => {
  decisionStore.setMealType(val)
  pickAgain()
})
</script>

<template>
  <view class="min-h-screen overflow-x-hidden bg-[#F2EEE8]">
    <!-- ===== 顶部 ===== -->
    <view
      class="pb-[24rpx] pl-[48rpx] pr-[48rpx]"
      :style="{ paddingTop: `${topBarHeight}px` }"
    >
      <view class="flex items-end justify-between">
        <text class="text-[40rpx] text-[#5D6D5A] leading-[1.1] tracking-[6rpx] font-[300]">
          帮我选
        </text>
        <text class="text-[20rpx] text-[#B8C0A0] tracking-[4rpx]">
          HELP ME CHOOSE
        </text>
      </view>
    </view>

    <view v-if="loading" class="flex justify-center pt-[200rpx]">
      <text class="text-[24rpx] text-[#B8C0A0] tracking-[2rpx]">加载中...</text>
    </view>

    <template v-else>
      <!-- ===== 餐次选择 ===== -->
      <view class="px-[48rpx]">
        <view class="flex border border-[#D8D8C8] bg-[#FFFFFF]">
          <view
            v-for="meal in mealTypes"
            :key="meal.key"
            class="flex flex-1 items-center justify-center gap-[8rpx] py-[20rpx] transition-all duration-150"
            :style="{
              background: currentMeal === meal.key ? '#5D6D5A' : '#FFFFFF',
              borderRight: meal.key === 'dinner' ? 'none' : '1rpx solid #D8D8C8',
            }"
            hover-class="meal-hover"
            @click="currentMeal = meal.key"
          >
            <view
              :class="meal.icon"
              :style="{ fontSize: '24rpx', color: currentMeal === meal.key ? '#FFFFFF' : '#6B8A6E' }"
            />
            <text
              :style="{
                fontSize: '24rpx',
                fontWeight: currentMeal === meal.key ? 500 : 400,
                color: currentMeal === meal.key ? '#FFFFFF' : '#4A5D42',
                letterSpacing: '2rpx',
              }"
            >
              {{ meal.label }}
            </text>
          </view>
        </view>
      </view>

      <!-- ===== 日期 & 范围 ===== -->
      <view class="flex items-center justify-center gap-[16rpx] px-[48rpx] pt-[20rpx]">
        <text class="text-[22rpx] text-[#8C9C82] tracking-[1rpx]">
          {{ new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' }) }}
        </text>
        <text class="text-[20rpx] text-[#C0C8B0]">|</text>
        <view class="flex items-center gap-[8rpx]" @click="showScopePicker = !showScopePicker">
          <text class="text-[22rpx] text-[#5D6D5A] tracking-[1rpx]">
            {{ scopeLabel }}
          </text>
          <view class="i-lucide-chevron-down text-[20rpx] text-[#5D6D5A]" />
        </view>
      </view>

      <!-- ===== 分隔线 ===== -->
      <view class="mx-[48rpx] mt-[24rpx] h-[1rpx] bg-[#D8D8C8]" />

      <!-- ===== 转盘卡片 ===== -->
      <view
        class="mx-[48rpx] mt-[16rpx] border border-[#D8D8C8] bg-[#FFFFFF]"
        :style="{ minHeight: `${cardMinHPx}px` }"
      >
        <view class="relative">
          <!-- Canvas 转盘 -->
          <canvas
            id="wheelCanvas"
            ref="canvasRef"
            type="2d"
            class="block"
            :style="{ width: `${canvasW}px`, height: `${canvasH}px` }"
          />

          <!-- 底部信息区（固定高度，状态切换时不会跳动） -->
          <view
            class="min-h-[120rpx] flex items-center justify-center"
          >
            <!-- IDLE -->
            <view v-if="pickState === 'idle'" class="text-center">
              <text class="text-[20rpx] text-[#B8C0A0] tracking-[2rpx]">
                共 {{ wheelDishes.length || candidateDishes.length }} 道候选菜品
              </text>
            </view>

            <!-- DONE -->
            <view v-else-if="pickState === 'done' && resultDish" class="pl-[48rpx] pr-[24rpx]">
              <text class="block text-[32rpx] text-[#4A5D42] leading-[1.3] tracking-[4rpx] font-[500]">
                {{ resultDish.name }}
              </text>
              <text
                v-if="resultDish.description"
                class="mt-[6rpx] block text-[22rpx] text-[#6B8A6E] leading-[1.6] tracking-[1rpx]"
              >
                {{ resultDish.description }}
              </text>
              <view v-if="resultDish.tags?.length" class="mt-[8rpx] flex items-center gap-[12rpx]">
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
        </view>
      </view>

      <!-- ===== 抽取按钮 ===== -->
      <view v-if="pickState !== 'done'" class="mt-[32rpx] flex justify-center">
        <view
          class="flex items-center justify-center gap-[12rpx] border border-[#8CB896] bg-[#FFFFFF] px-[80rpx] py-[24rpx] transition-all duration-200"
          hover-class="btn-hover"
          @click="spin"
        >
          <view
            v-if="pickState !== 'picking'"
            class="i-lucide-shuffle text-[28rpx] text-[#5D6D5A]"
          />
          <text class="text-[26rpx] text-[#4A5D42] tracking-[4rpx] font-[400]">
            {{ pickState === 'picking' ? '正 在 选...' : '开 始 抽 取' }}
          </text>
        </view>
      </view>

      <!-- ===== 结果操作区 ===== -->
      <view v-if="pickState === 'done' && resultDish">
        <view class="mx-[48rpx] mt-[28rpx] flex justify-center border border-[#D8D8C8] bg-[#FFFFFF]">
          <view
            class="flex flex-1 items-center justify-center gap-[8rpx] border-r border-[#D8D8C8] py-[22rpx]"
            hover-class="btn-hover"
            @click="pickAgain"
          >
            <view class="i-lucide-rotate-cw text-[22rpx] text-[#5D6D5A]" />
            <text class="text-[22rpx] text-[#4A5D42] tracking-[2rpx]">再来一次</text>
          </view>
          <view
            class="flex flex-1 items-center justify-center gap-[8rpx] border-r border-[#D8D8C8] py-[22rpx]"
            hover-class="btn-hover"
            @click="goToDetail"
          >
            <view class="i-lucide-info text-[22rpx] text-[#5D6D5A]" />
            <text class="text-[22rpx] text-[#4A5D42] tracking-[2rpx]">查看详情</text>
          </view>
          <view
            class="flex flex-1 items-center justify-center gap-[8rpx] py-[22rpx]"
            hover-class="btn-hover"
            @click="addResultToCart"
          >
            <view class="i-lucide-shopping-cart text-[22rpx] text-[#8CB896]" />
            <text class="text-[22rpx] text-[#5D6D5A] tracking-[2rpx] font-[500]">加入购物车</text>
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
            <text class="text-[26rpx] text-[#4A5D42] tracking-[2rpx]">限定抽取范围</text>
            <view class="i-lucide-x text-[28rpx] text-[#B8C0A0]" @click="showScopePicker = false" />
          </view>
          <view class="px-[48rpx] pb-[24rpx] pt-[16rpx]">
            <view
              class="flex items-center justify-between border-b border-[#F0E8E0] py-[24rpx]"
              @click="selectScope('all')"
            >
              <text :style="{ fontSize: '24rpx', fontWeight: scopeType === 'all' ? 500 : 400, color: scopeType === 'all' ? '#5D6D5A' : '#6B8A6E', letterSpacing: '2rpx' }">
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
                <text :style="{ fontSize: '24rpx', fontWeight: scopeType === 'category' && scopeCategoryId === cat.id ? 500 : 400, color: scopeType === 'category' && scopeCategoryId === cat.id ? '#5D6D5A' : '#6B8A6E', letterSpacing: '2rpx' }">
                  {{ cat.name }}
                </text>
              </view>
              <view v-if="scopeType === 'category' && scopeCategoryId === cat.id" class="i-lucide-check text-[24rpx] text-[#8CB896]" />
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
  opacity: 0.88;
}
.btn-hover {
  background: #f2f6ee !important;
}
</style>
