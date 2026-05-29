<script lang="ts" setup>
import type { ThirdPartyDishDetail } from '@/api/third-party'
import type { DishItem } from '@/data/dishes.json'
import { onMounted, ref } from 'vue'
import { getDishDetail } from '@/api/dish'
import { fetchThirdPartyDetail } from '@/api/third-party'
import { useCartStore } from '@/store/cart'

defineOptions({ name: 'DishDetailPage' })
definePage({
  style: {
    navigationStyle: 'default',
    navigationBarTitleText: '菜品详情',
  },
})

const dish = ref<DishItem | null>(null)
const detail = ref<ThirdPartyDishDetail | null>(null)
const loading = ref(true)
const cartStore = useCartStore()

onMounted(async () => {
  const pages = getCurrentPages()
  const query = pages[pages.length - 1]?.options || {}
  const dishId = (query.id as string) || ''

  const local = await getDishDetail(dishId)
  dish.value = local
  if (local) {
    uni.setNavigationBarTitle({ title: local.name })
  }

  const thirdParty = await fetchThirdPartyDetail(dishId)
  detail.value = thirdParty

  loading.value = false
})

function addToCart() {
  if (!dish.value) return
  cartStore.addItem({
    id: dish.value.id,
    name: dish.value.name,
    price: 0,
    category: '菜品',
  }, 1)
  uni.showToast({ title: '已加入购物车', icon: 'success', duration: 1200 })
  uni.vibrateShort({ type: 'light' })
}

function goToDecision() {
  uni.switchTab({ url: '/pages/decision/index' })
}
</script>

<template>
  <view class="min-h-screen bg-[#F2EEE8]">
    <view v-if="loading" class="flex justify-center pt-[200rpx]">
      <text class="text-[24rpx] text-[#B8C0A0] tracking-[2rpx]">加载中...</text>
    </view>

    <template v-else-if="dish">
      <!-- ===== 顶图占位 ===== -->
      <view class="h-[360rpx] flex items-center justify-center bg-[#E2ECD8]">
        <view class="i-lucide-chef-hat text-[96rpx] text-[#8CB896]/40" />
      </view>

      <!-- ===== 基本信息 ===== -->
      <view class="px-[48rpx] pb-[8rpx] pt-[32rpx]">
        <text class="block text-[40rpx] text-[#4A5D42] leading-[1.2] tracking-[4rpx] font-[300]">
          {{ dish.name }}
        </text>
        <view v-if="dish.tags?.length" class="mt-[16rpx] flex items-center gap-[12rpx]">
          <text
            v-for="tag in dish.tags"
            :key="tag"
            class="text-[20rpx] text-[#7A9A7E] tracking-[2rpx]"
          >
            #{{ tag }}
          </text>
        </view>
      </view>

      <view v-if="dish.description" class="mt-[8rpx] px-[48rpx]">
        <text class="text-[24rpx] text-[#6B8A6E] leading-[1.6] tracking-[1rpx]">
          {{ dish.description }}
        </text>
      </view>

      <!-- ===== 分隔线 ===== -->
      <view class="mx-[48rpx] mt-[28rpx] h-[1rpx] bg-[#D8D8C8]" />

      <!-- ===== 详情 ===== -->
      <view v-if="detail" class="mt-[28rpx] px-[48rpx]">
        <!-- 简介 -->
        <view class="relative mb-[24rpx] overflow-hidden border border-[#D8D8C8] bg-[#FFFFFF]">
          <view class="absolute bottom-[20rpx] left-0 top-[20rpx] w-[4rpx] bg-[#8CB896]" />
          <view class="p-[28rpx_32rpx_28rpx_40rpx]">
            <text class="mb-[12rpx] block text-[22rpx] text-[#B8C0A0] tracking-[4rpx]">
              · 简介 ·
            </text>
            <text class="block text-[24rpx] text-[#4A5D42] leading-[1.7] tracking-[1rpx]">
              {{ detail.description }}
            </text>
          </view>
        </view>

        <!-- 食材 -->
        <view class="relative mb-[24rpx] overflow-hidden border border-[#D8D8C8] bg-[#FFFFFF]">
          <view class="absolute bottom-[20rpx] left-0 top-[20rpx] w-[4rpx] bg-[#8CB896]" />
          <view class="p-[28rpx_32rpx_28rpx_40rpx]">
            <text class="mb-[16rpx] block text-[22rpx] text-[#B8C0A0] tracking-[4rpx]">
              · 食材 ·
            </text>
            <view class="flex flex-wrap gap-[12rpx]">
              <text
                v-for="(ing, i) in detail.ingredients"
                :key="i"
                class="bg-[#F2F6EE] px-[20rpx] py-[8rpx] text-[22rpx] text-[#5D6D5A] tracking-[1rpx]"
              >
                {{ ing }}
              </text>
            </view>
          </view>
        </view>

        <!-- 做法步骤 -->
        <view class="relative mb-[24rpx] overflow-hidden border border-[#D8D8C8] bg-[#FFFFFF]">
          <view class="absolute bottom-[20rpx] left-0 top-[20rpx] w-[4rpx] bg-[#8CB896]" />
          <view class="p-[28rpx_32rpx_28rpx_40rpx]">
            <text class="mb-[16rpx] block text-[22rpx] text-[#B8C0A0] tracking-[4rpx]">
              · 做法 ·
            </text>
            <view
              v-for="(step, i) in detail.steps"
              :key="i"
              class="mb-[16rpx] flex gap-[16rpx]"
            >
              <text class="mt-[4rpx] shrink-0 text-[20rpx] text-[#8CB896] font-[500]">
                {{ String(i + 1).padStart(2, '0') }}
              </text>
              <text class="text-[24rpx] text-[#4A5D42] leading-[1.7] tracking-[1rpx]">
                {{ step }}
              </text>
            </view>
          </view>
        </view>

        <!-- 小贴士 -->
        <view v-if="detail.tips" class="relative mb-[24rpx] overflow-hidden border border-[#C8D8B0] bg-[#F2F6EE]">
          <view class="absolute bottom-[20rpx] left-0 top-[20rpx] w-[4rpx] bg-[#7A9A7E]" />
          <view class="p-[24rpx_32rpx_24rpx_40rpx]">
            <text class="mb-[10rpx] block text-[22rpx] text-[#7A9A7E] tracking-[4rpx]">
              · TIPS ·
            </text>
            <text class="block text-[22rpx] text-[#5D6D5A] leading-[1.7] tracking-[1rpx]">
              {{ detail.tips }}
            </text>
          </view>
        </view>
      </view>
      <!-- ===== 底部留白（避开固定操作栏） ===== -->
      <view style="padding-bottom: calc(env(safe-area-inset-bottom) + 120rpx);" />
    </template>

    <view v-else class="flex justify-center pt-[200rpx]">
      <text class="text-[24rpx] text-[#B8C0A0] tracking-[2rpx]">菜品不存在</text>
    </view>

    <!-- ===== 底部操作栏 ===== -->
    <view
      v-if="dish"
      class="fixed bottom-0 left-0 right-0 z-50 border-t border-[#D8D8C8] bg-[#FFFFFF]"
      style="padding-bottom: calc(env(safe-area-inset-bottom) + 16rpx); padding-top: 16rpx;"
    >
      <view class="flex gap-[16rpx] px-[48rpx]">
        <view
          class="flex flex-1 items-center justify-center border border-[#8CB896] bg-[#FFFFFF] py-[24rpx] transition-all duration-200"
          hover-class="btn-hover"
          @click="goToDecision"
        >
          <text class="text-[26rpx] text-[#5D6D5A] tracking-[4rpx] font-[400]">帮我选</text>
        </view>
        <view
          class="flex flex-1 items-center justify-center border border-[#5D6D5A] bg-[#5D6D5A] py-[24rpx] transition-all duration-200"
          hover-class="btn-active"
          @click="addToCart"
        >
          <text class="text-[26rpx] text-[#FFFFFF] tracking-[4rpx] font-[400]">加入购物车</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.btn-hover {
  background: #f2f6ee !important;
}
.btn-active {
  opacity: 0.9;
}
</style>
