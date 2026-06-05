<script lang="ts" setup>
import type { DishItem } from '@/types/dish'
import { ref } from 'vue'
import { searchDishes } from '@/api/dish'
import { useCartStore } from '@/store/cart'

defineOptions({ name: 'SearchPage' })
definePage({
  style: {
    navigationStyle: 'default',
    navigationBarTitleText: '搜索菜品',
  },
})

const keyword = ref('')
const results = ref<DishItem[]>([])
const searched = ref(false)
const cartStore = useCartStore()

let searchTimer: ReturnType<typeof setTimeout> | null = null
function onInput(e: any) {
  const val = e?.detail?.value || keyword.value
  keyword.value = val

  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(async () => {
    if (!val.trim()) {
      results.value = []
      searched.value = false
      return
    }
    results.value = await searchDishes(val.trim())
    searched.value = true
  }, 300)
}

function clearSearch() {
  keyword.value = ''
  results.value = []
  searched.value = false
}

function goToDetail(dish: DishItem) {
  uni.navigateTo({ url: `/pages/dish-detail/index?id=${dish.id}` })
}

function addToCart(dish: DishItem, e: Event) {
  e.stopPropagation()
  cartStore.addItem({
    id: dish.id,
    name: dish.name,
    price: 0,
    category: '搜索',
  }, 1)
  uni.showToast({ title: '已加入购物车', icon: 'success', duration: 1200 })
  uni.vibrateShort({ type: 'light' })
}

const hotTags = ['宫保鸡丁', '珍珠奶茶', '火锅', '寿司', '牛排', '提拉米苏', '水煮鱼', '韩式炸鸡']

function tapHotTag(tag: string) {
  keyword.value = tag
  onInput({ detail: { value: tag } })
}
</script>

<template>
  <view class="min-h-screen bg-[#F2EEE8]">
    <!-- ===== 搜索栏 ===== -->
    <view class="px-[48rpx] pb-[16rpx] pt-[24rpx]">
      <view class="flex items-center gap-[16rpx] border border-[#D8D8C8] bg-[#FFFFFF] px-[24rpx] py-[16rpx]">
        <view class="i-lucide-search shrink-0 text-[28rpx] text-[#B0B8A0]" />
        <input
          :value="keyword"
          class="flex-1 text-[26rpx] text-[#4A5D42] outline-none"
          placeholder="搜索菜品名称..."
          confirm-type="search"
          style="background: transparent;"
          @input="onInput"
        >
        <view
          v-if="keyword"
          class="i-lucide-x shrink-0 text-[28rpx] text-[#B0B8A0]"
          @click="clearSearch"
        />
      </view>
    </view>

    <!-- ===== 搜索结果 ===== -->
    <view v-if="searched" class="px-[48rpx] pt-[8rpx]">
      <text class="text-[22rpx] text-[#B0B8A0] tracking-[1rpx]">
        {{ results.length > 0 ? `找到 ${results.length} 道菜品` : '未找到相关菜品' }}
      </text>
      <view
        v-for="dish in results"
        :key="dish.id"
        class="mt-[16rpx] flex items-center border border-[#E8E0D0] bg-[#FFFFFF] p-[24rpx] transition-all duration-200"
        hover-class="result-hover"
        @click="goToDetail(dish)"
      >
        <view class="h-[100rpx] w-[100rpx] flex shrink-0 items-center justify-center bg-[#F2F6EE]">
          <view class="i-lucide-utensils-crossed text-[40rpx] text-[#6B8A6E]" />
        </view>
        <view class="ml-[16rpx] flex-1 overflow-hidden">
          <text class="block overflow-hidden text-ellipsis whitespace-nowrap text-[26rpx] text-[#4A5D42] font-[500]">
            {{ dish.name }}
          </text>
          <text v-if="dish.description" class="mt-[4rpx] block overflow-hidden text-ellipsis whitespace-nowrap text-[22rpx] text-[#8C9C82]">
            {{ dish.description }}
          </text>
          <view v-if="dish.tags?.length" class="mt-[8rpx] flex items-center gap-[12rpx]">
            <text
              v-for="tag in dish.tags.slice(0, 3)"
              :key="tag"
              class="text-[18rpx] text-[#7A9A7E] tracking-[1rpx]"
            >
              #{{ tag }}
            </text>
          </view>
        </view>
        <view
          class="ml-[16rpx] h-[48rpx] w-[48rpx] flex shrink-0 items-center justify-center bg-[#5D6D5A]"
          @click="(e: Event) => addToCart(dish, e)"
        >
          <view class="i-lucide-plus text-[28rpx] text-[#FFFFFF]" />
        </view>
      </view>
    </view>

    <!-- ===== 热门搜索 ===== -->
    <view v-else class="px-[48rpx] pt-[32rpx]">
      <text class="mb-[20rpx] block text-[22rpx] text-[#B8C0A0] tracking-[6rpx]">
        · 热门搜索 ·
      </text>
      <view class="flex flex-wrap gap-[16rpx]">
        <text
          v-for="tag in hotTags"
          :key="tag"
          class="border border-[#D8D8C8] bg-[#FFFFFF] px-[24rpx] py-[14rpx] text-[22rpx] text-[#5D6D5A] tracking-[2rpx]"
          hover-class="tag-hover"
          @click="tapHotTag(tag)"
        >
          {{ tag }}
        </text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.result-hover {
  background: #f2f6ee !important;
  border-color: #b0d0a8 !important;
}
.tag-hover {
  background: #f2f6ee !important;
  border-color: #8cb896 !important;
}
</style>
