<script lang="ts" setup>
import type { Category } from '@/api/dish'
import type { DishItem } from '@/data/dishes.json'
import type { MealType, ScopeType } from '@/store/decision'
import { computed, onMounted, ref, watch } from 'vue'
import { getAllDishes, getCategories } from '@/api/dish'
import { useCartStore } from '@/store/cart'
import { useDecisionStore } from '@/store/decision'
import { useSafeArea } from '@/hooks/useSafeArea'

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

const rollingName = ref('')
let pickTimer: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  const [dishes, cats] = await Promise.all([getAllDishes(), getCategories()])
  allDishes.value = dishes
  categories.value = cats
  loading.value = false
})

function pick() {
  if (pickState.value === 'picking' || candidateDishes.value.length === 0) return

  pickState.value = 'picking'
  resultDish.value = null

  let count = 0
  const totalTicks = 20 + Math.floor(Math.random() * 10)
  const pool = candidateDishes.value

  pickTimer = setInterval(() => {
    const idx = Math.floor(Math.random() * pool.length)
    rollingName.value = pool[idx].name
    count++

    if (count >= totalTicks) {
      if (pickTimer) clearInterval(pickTimer)
      pickTimer = null
      const finalIdx = Math.floor(Math.random() * pool.length)
      const dish = pool[finalIdx]
      resultDish.value = dish
      decisionStore.setResult(dish)
      decisionStore.addToHistory(dish)
      pickState.value = 'done'
      uni.vibrateShort({ type: 'light' })
    }
  }, 60 + count * 2)
}

function pickAgain() {
  pickState.value = 'idle'
  resultDish.value = null
  rollingName.value = ''
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
}

watch(currentMeal, (val) => {
  decisionStore.setMealType(val)
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
            :class="currentMeal === meal.key ? '' : ''"
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

      <!-- ===== 抽取卡片 ===== -->
      <view class="mt-[16rpx] px-[48rpx]">
        <view class="relative min-h-[260rpx] flex flex-col justify-center overflow-hidden border border-[#D8D8C8] bg-[#FFFFFF]">
          <view class="absolute bottom-[20rpx] left-0 top-[20rpx] w-[4rpx] bg-[#8CB896]" />

          <!-- idle -->
          <view v-if="pickState === 'idle'" class="flex flex-col items-center justify-center p-[48rpx_40rpx]">
            <view class="i-lucide-shuffle text-[48rpx] text-[#B8C8AC]" />
            <text class="mt-[20rpx] text-[28rpx] text-[#8C9C82] tracking-[4rpx]">点 击 抽 取</text>
            <text v-if="candidateDishes.length > 0" class="mt-[8rpx] text-[20rpx] text-[#B8C0A0] tracking-[2rpx]">
              共 {{ candidateDishes.length }} 道候选菜品
            </text>
          </view>

          <!-- picking -->
          <view v-if="pickState === 'picking'" class="flex flex-col items-center justify-center p-[56rpx_40rpx]">
            <text
              class="text-center text-[40rpx] text-[#5D6D5A] leading-[1.4] tracking-[6rpx] font-[300]"
            >
              {{ rollingName }}
            </text>
            <view class="mt-[24rpx] flex gap-[8rpx]">
              <view
                v-for="i in 3" :key="i"
                class="h-[8rpx] w-[8rpx] bg-[#8CB896] opacity-60"
                :style="{ animation: `dot-pulse 0.8s ease-in-out ${(i - 1) * 0.15}s infinite` }"
              />
            </view>
          </view>

          <!-- done -->
          <view v-if="pickState === 'done' && resultDish" class="p-[32rpx_40rpx_32rpx_48rpx]">
            <text class="block text-[36rpx] text-[#4A5D42] leading-[1.3] tracking-[4rpx] font-[400]">
              {{ resultDish.name }}
            </text>
            <text v-if="resultDish.description" class="mt-[8rpx] block text-[24rpx] text-[#6B8A6E] leading-[1.6] tracking-[1rpx]">
              {{ resultDish.description }}
            </text>
            <view v-if="resultDish.tags?.length" class="mt-[16rpx] flex items-center gap-[12rpx]">
              <text v-for="tag in resultDish.tags.slice(0, 3)" :key="tag" class="text-[20rpx] text-[#7A9A7E] tracking-[2rpx]">
                #{{ tag }}
              </text>
            </view>
          </view>
        </view>
      </view>

      <!-- ===== 抽取按钮 ===== -->
      <view v-if="pickState !== 'done'" class="mt-[32rpx] flex justify-center">
        <view
          class="flex items-center justify-center gap-[12rpx] border border-[#8CB896] bg-[#FFFFFF] px-[80rpx] py-[24rpx] transition-all duration-200"
          hover-class="btn-hover"
          @click="pick"
        >
          <view v-if="pickState !== 'picking'" class="i-lucide-shuffle text-[28rpx] text-[#5D6D5A]" />
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
@keyframes dot-pulse {
  0%,
  100% {
    opacity: 0.2;
  }
  50% {
    opacity: 0.8;
  }
}
</style>
