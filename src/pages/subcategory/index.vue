<script lang="ts" setup>
import type { Category, SubCategory } from '@/api/dish'
import { onMounted, ref } from 'vue'
import { getCategories, getSubCategories } from '@/api/dish'

defineOptions({ name: 'SubCategoryPage' })
definePage({
  style: {
    navigationStyle: 'default',
    navigationBarTitleText: '分类大全',
  },
})

const loading = ref(true)
const groups = ref<{ cat: Category, subs: SubCategory[] }[]>([])

onMounted(async () => {
  const cats = await getCategories()
  const sorted = cats.sort((a, b) => a.sort - b.sort)
  const result: { cat: Category, subs: SubCategory[] }[] = []
  for (const cat of sorted) {
    const subs = await getSubCategories(cat.id)
    result.push({ cat, subs: subs.sort((a, b) => a.sort - b.sort) })
  }
  groups.value = result
  loading.value = false
})

function goToSubcategory(sub: SubCategory, catName: string) {
  uni.navigateTo({
    url: `/pages/dishes/index?subCategoryId=${sub.id}&subCategoryName=${encodeURIComponent(sub.name)}`,
  })
}

function goToCategory(cat: Category) {
  uni.navigateTo({
    url: `/pages/subcategory/index?categoryId=${cat.id}&categoryName=${encodeURIComponent(cat.name)}`,
  })
}
</script>

<template>
  <view class="min-h-screen bg-[#F2EEE8]">
    <view v-if="loading" class="flex justify-center pt-[200rpx]">
      <text class="text-[24rpx] text-[#B8C0A0] tracking-[2rpx]">加载中...</text>
    </view>

    <scroll-view v-else scroll-y class="px-[48rpx] pt-[32rpx]" style="padding-bottom: calc(env(safe-area-inset-bottom) + 48rpx);">
      <template v-for="{ cat, subs } in groups" :key="cat.id">
        <!-- 大类标题 -->
        <view class="mb-[20rpx] mt-[12rpx] flex items-center gap-[16rpx]">
          <view :class="cat.icon" :style="{ color: cat.color, fontSize: '36rpx' }" />
          <text class="text-[28rpx] text-[#4A5D42] tracking-[4rpx] font-[300]">{{ cat.name }}</text>
          <text class="text-[20rpx] text-[#B0B8A0] tracking-[2rpx]">{{ subs.length }} 小类</text>
        </view>

        <!-- 小类网格 -->
        <view class="mb-[32rpx] flex flex-wrap -m-[8rpx]">
          <view
            v-for="sub in subs"
            :key="sub.id"
            class="m-[8rpx] w-[calc(50%-16rpx)] border border-[#E8E0D0] bg-[#FFFFFF] p-[24rpx] transition-all duration-200"
            hover-class="sub-hover"
            @click="goToSubcategory(sub, cat.name)"
          >
            <text class="block text-[24rpx] text-[#4A5D42] tracking-[2rpx] font-[500]">{{ sub.name }}</text>
            <text class="mt-[6rpx] block text-[20rpx] text-[#B0B8A0]">{{ sub.dishCount }} 道菜</text>
          </view>
        </view>
      </template>
    </scroll-view>
  </view>
</template>

<style scoped>
.sub-hover {
  background: #f2f6ee !important;
  border-color: #b0d0a8 !important;
}
</style>
