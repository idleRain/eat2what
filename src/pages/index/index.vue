<script lang="ts" setup>
import type { Category } from '@/api/dish'
import type { DishItem } from '@/data/dishes.json'
import { computed, onMounted, ref } from 'vue'
import { getCategories, getHotDishes } from '@/api/dish'
import { useSafeArea } from '@/hooks/useSafeArea'

defineOptions({ name: 'Home' })
definePage({
  type: 'home',
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '今天吃什么',
  },
})

const { topBarHeight } = useSafeArea()

const categories = ref<Category[]>([])
const hotDishes = ref<DishItem[]>([])
const loading = ref(true)

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 10) return '早安'
  if (h < 14) return '午安'
  if (h < 17) return '下午好'
  return '晚安'
})

const greetingSub = computed(() => {
  const h = new Date().getHours()
  if (h < 10) return '一日之计在于晨，美好从早餐开始'
  if (h < 14) return '午间小憩，用美食犒劳自己'
  if (h < 17) return '一杯清茶，一份甜点，刚刚好'
  return '天色渐晚，为自己挑一份暖心晚餐'
})

onMounted(async () => {
  try {
    const [cats, hot] = await Promise.all([getCategories(), getHotDishes(5)])
    categories.value = cats
    hotDishes.value = hot
  }
  finally {
    loading.value = false
  }
})

function goToCategory(cat: Category) {
  uni.navigateTo({
    url: `/pages/subcategory/index?categoryId=${cat.id}&categoryName=${encodeURIComponent(cat.name)}`,
  })
}

function goToDish(dish: DishItem) {
  uni.navigateTo({ url: `/pages/dish-detail/index?id=${dish.id}` })
}

function goToSearch() {
  uni.navigateTo({ url: '/pages/search/index' })
}

function goToDecision() {
  uni.switchTab({ url: '/pages/decision/index' })
}
</script>

<template>
  <view class="min-h-screen overflow-x-hidden bg-[#F2EEE8]">
    <!-- ===== 顶部导航 ===== -->
    <view
      class="pb-[24rpx] pl-[48rpx] pr-[48rpx]"
      :style="{ paddingTop: `${topBarHeight}px` }"
    >
      <view class="flex items-end justify-between">
        <view>
          <text class="block text-[40rpx] text-[#5D6D5A] leading-[1.1] tracking-[6rpx] font-[300]">
            今天吃什么
          </text>
          <text class="mt-[6rpx] block text-[20rpx] text-[#A8B8A0] tracking-[4rpx]">
            eat2what
          </text>
        </view>
        <view
          class="text-[40rpx] text-[#7A9A7E]"
          hover-class="opacity-70"
          @click="goToSearch"
        >
          <view class="i-lucide-search" />
        </view>
      </view>
    </view>

    <!-- ===== 问候区 ===== -->
    <view class="px-[48rpx] pb-[32rpx]">
      <view class="relative overflow-hidden bg-[#E2ECD8] p-[36rpx_40rpx]">
        <view class="absolute bottom-[20rpx] left-0 top-[20rpx] w-[4rpx] bg-[#8CB896]" />
        <text class="block text-[44rpx] text-[#4A5D42] tracking-[4rpx] font-[300]">
          {{ greeting }}
        </text>
        <text class="mt-[12rpx] block text-[24rpx] text-[#6B8A6E] leading-[1.6] tracking-[1rpx]">
          {{ greetingSub }}
        </text>
      </view>
    </view>

    <!-- ===== 分隔线 ===== -->
    <view class="mx-[48rpx] h-[1rpx] bg-[#D8D8C8]" />

    <!-- ===== 分类标签条 ===== -->
    <view class="mt-[40rpx]">
      <text class="block px-[48rpx] pb-[24rpx] text-[20rpx] text-[#B8C0A8] tracking-[6rpx]">
        · CATEGORIES ·
      </text>
      <scroll-view scroll-x show-scrollbar="false" class="whitespace-nowrap pl-[48rpx]">
        <view class="inline-flex gap-[24rpx] pr-[96rpx]">
          <view
            v-for="cat in categories"
            :key="cat.id"
            class="w-[140rpx] inline-flex flex-col items-center gap-[16rpx] border border-[#E0D8C8] bg-[#FFFFFF] pb-[20rpx] pt-[28rpx] transition-all duration-200"
            hover-class="cat-active"
            @click="goToCategory(cat)"
          >
            <view
              class="h-[64rpx] w-[64rpx] flex items-center justify-center text-[36rpx]"
              :class="cat.icon"
              :style="{ color: cat.color }"
            />
            <text class="text-[22rpx] text-[#5D6D5A] tracking-[2rpx] font-[400]">
              {{ cat.name }}
            </text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- ===== 今日精选 ===== -->
    <view class="mt-[44rpx]">
      <text class="block px-[48rpx] pb-[24rpx] text-[20rpx] text-[#B8C0A8] tracking-[6rpx]">
        · TODAY'S PICK ·
      </text>

      <view class="px-[48rpx]">
        <view
          v-for="(dish, i) in hotDishes"
          :key="dish.id"
          class="mb-[8rpx] flex items-center border border-[#E8E0D0] bg-[#FFFFFF] p-[28rpx_32rpx] transition-all duration-150"
          hover-class="dish-active"
          @click="goToDish(dish)"
        >
          <text
            class="mr-[24rpx] w-[40rpx] shrink-0 text-center text-[28rpx] font-[300]"
            :style="{ color: i < 3 ? '#8CB896' : '#C8C0B0' }"
          >
            {{ String(i + 1).padStart(2, '0') }}
          </text>
          <view class="flex-1 overflow-hidden">
            <text class="block overflow-hidden text-ellipsis whitespace-nowrap text-[28rpx] text-[#4A5D42] leading-[1.3] font-[500]">
              {{ dish.name }}
            </text>
            <view v-if="dish.tags?.length" class="mt-[10rpx] flex items-center gap-[12rpx]">
              <text
                v-for="tag in dish.tags.slice(0, 2)"
                :key="tag"
                class="text-[18rpx] text-[#7A9A7E] tracking-[1rpx]"
              >
                #{{ tag }}
              </text>
            </view>
          </view>
          <text class="ml-[16rpx] text-[24rpx] text-[#C8C0B0]">→</text>
        </view>
      </view>
    </view>

    <!-- ===== 底部 CTA ===== -->
    <view class="relative mx-[48rpx] mt-[36rpx] overflow-hidden bg-[#E2ECD8] p-[44rpx_40rpx]">
      <view class="absolute bottom-0 right-0 top-0 w-[3rpx] bg-[#8CB896]" />
      <text class="block text-[32rpx] text-[#4A5D42] tracking-[4rpx] font-[300]">
        选择困难？
      </text>
      <text class="mt-[8rpx] block text-[22rpx] text-[#6B8A6E] leading-[1.6]">
        244 道菜品，一键随机抽取 · 把选择交给命运
      </text>

      <view
        class="mt-[28rpx] flex items-center justify-between border border-[#8CB896] bg-[#FFFFFF] p-[24rpx_32rpx] transition-all duration-200"
        hover-class="cta-active"
        @click="goToDecision"
      >
        <text class="text-[26rpx] text-[#4A5D42] tracking-[4rpx] font-[400]">
          帮我选
        </text>
        <view class="flex items-center gap-[8rpx]">
          <text class="text-[22rpx] text-[#A0B898]">3 秒拍板</text>
          <view class="i-lucide-shuffle text-[32rpx] text-[#8CB896]" />
        </view>
      </view>
    </view>

    <!-- ===== 页脚 ===== -->
    <view class="flex items-center justify-between p-[52rpx_48rpx]" style="padding-bottom: calc(env(safe-area-inset-bottom) + 36rpx);">
      <text class="text-[20rpx] text-[#B0B8A0]">
        eat2what © 2026
      </text>
      <text class="text-[20rpx] text-[#C0C0B0]">
        {{ categories.length }} 大类 · 244 道菜
      </text>
    </view>
  </view>
</template>

<style scoped>
.cat-active {
  opacity: 0.88;
  border-color: #8cb896 !important;
}
.dish-active {
  background: #f2f6ee !important;
  border-color: #b0d0a8 !important;
}
.cta-active {
  opacity: 0.9;
}
</style>
