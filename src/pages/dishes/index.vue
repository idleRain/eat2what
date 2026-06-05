<script lang="ts" setup>
import type { DishItem } from '@/types/dish'
import { computed, onMounted, ref } from 'vue'
import { getDishes } from '@/api/dish'
import PinyinIndex from '@/components/PinyinIndex.vue'
import { useCartStore } from '@/store/cart'
import { groupByPinyin } from '@/utils/pinyin'

defineOptions({ name: 'DishesPage' })
definePage({
  style: {
    navigationStyle: 'default',
    navigationBarTitleText: '菜品列表',
  },
})

const dishes = ref<DishItem[]>([])
const loading = ref(true)
const subCategoryName = ref('')
const cartStore = useCartStore()
const activeLetter = ref('')

const grouped = computed(() => groupByPinyin(dishes.value))

onMounted(() => {
  const pages = getCurrentPages()
  const query = pages[pages.length - 1]?.options || {}
  const subCategoryId = (query.subCategoryId as string) || ''
  subCategoryName.value = decodeURIComponent((query.subCategoryName as string) || '菜品')
  uni.setNavigationBarTitle({ title: subCategoryName.value })

  getDishes(subCategoryId).then((list) => {
    dishes.value = list
    loading.value = false
  })
})

function goToDetail(dish: DishItem) {
  uni.navigateTo({ url: `/pages/dish-detail/index?id=${dish.id}` })
}

function quickAddToCart(dish: DishItem, e: Event) {
  e.stopPropagation()
  cartStore.addItem({ id: dish.id, name: dish.name, price: 0, category: subCategoryName.value }, 1)
  uni.showToast({ title: '已加入购物车', icon: 'success', duration: 1200 })
  uni.vibrateShort({ type: 'light' })
}

function onLetterSelect(letter: string) {
  activeLetter.value = letter
  uni.createSelectorQuery()
    .select(`#pinyin-${letter}`)
    .boundingClientRect((res: any) => {
      if (res) {
        uni.pageScrollTo({ scrollTop: res.top - 80, duration: 200 })
      }
    })
    .exec()
}
</script>

<template>
  <view class="min-h-screen bg-[#F2EEE8]">
    <view v-if="loading" class="flex justify-center pt-[200rpx]">
      <text class="text-[24rpx] text-[#B8C0A0] tracking-[2rpx]">加载中...</text>
    </view>

    <PinyinIndex
      v-if="!loading && dishes.length > 0"
      :dishes="dishes"
      :active-letter="activeLetter"
      @select="onLetterSelect"
    />

    <view v-else-if="!loading && dishes.length === 0" class="flex justify-center pt-[200rpx]">
      <text class="text-[24rpx] text-[#B8C0A0] tracking-[2rpx]">暂无菜品</text>
    </view>

    <view v-for="group in grouped" :key="group.letter" class="px-[48rpx] pt-[16rpx]">
      <view :id="`pinyin-${group.letter}`" class="py-[16rpx]">
        <text class="text-[22rpx] text-[#5D6D5A] font-[600] tracking-[4rpx]">{{ group.letter }}</text>
      </view>

      <view
        v-for="dish in group.items"
        :key="dish.id"
        class="flex items-center bg-[#FFFFFF] border border-[#E8E0D0] p-[20rpx] mb-[12rpx] transition-all duration-200"
        hover-class="dish-hover"
        @click="goToDetail(dish)"
      >
        <view class="w-[80rpx] h-[80rpx] flex items-center justify-center bg-[#F2F6EE] shrink-0">
          <view class="text-[36rpx] text-[#8CB896] i-lucide-utensils-crossed" />
        </view>
        <view class="ml-[16rpx] flex-1 overflow-hidden">
          <text class="block text-[26rpx] text-[#4A5D42] font-[500] tracking-[1rpx] overflow-hidden text-ellipsis whitespace-nowrap">{{ dish.name }}</text>
          <text v-if="dish.description" class="block mt-[4rpx] text-[20rpx] text-[#8C9C82] overflow-hidden text-ellipsis whitespace-nowrap">{{ dish.description }}</text>
          <view v-if="dish.tags?.length" class="flex items-center gap-[8rpx] mt-[6rpx]">
            <text v-for="tag in dish.tags" :key="tag" class="text-[18rpx] text-[#A0B898] tracking-[1rpx]">#{{ tag }}</text>
          </view>
        </view>
        <view
          class="w-[48rpx] h-[48rpx] flex items-center justify-center bg-[#5D6D5A] shrink-0 ml-[16rpx]"
          @click="(e: Event) => quickAddToCart(dish, e)"
        >
          <view class="text-[28rpx] text-[#FFFFFF] i-lucide-plus" />
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.dish-hover {
  background: #F2F6EE !important;
  border-color: #B0D0A8 !important;
}
</style>
