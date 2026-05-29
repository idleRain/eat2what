<script lang="ts" setup>
import type { Order } from '@/store/order'
import { onMounted, ref } from 'vue'
import { useOrderStore } from '@/store/order'

defineOptions({ name: 'OrderDetailPage' })
definePage({
  style: {
    navigationStyle: 'default',
    navigationBarTitleText: '订单详情',
  },
})

const order = ref<Order | null>(null)

onMounted(() => {
  const pages = getCurrentPages()
  const query = pages[pages.length - 1]?.options || {}
  const orderId = (query.id as string) || ''
  order.value = useOrderStore().getOrderById(orderId) || null
})

const statusMap: Record<string, string> = {
  pending: '待处理',
  processing: '处理中',
  completed: '已完成',
  cancelled: '已取消',
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<template>
  <view class="min-h-screen bg-[#F2EEE8]">
    <view v-if="!order" class="flex justify-center pt-[200rpx]">
      <text class="text-[24rpx] text-[#B8C0A0] tracking-[2rpx]">订单不存在</text>
    </view>
    <template v-else>
      <!-- 订单状态 -->
      <view class="px-[48rpx] pt-[24rpx]">
        <view class="bg-[#FFFFFF] border border-[#D8D8C8] relative overflow-hidden">
          <view class="absolute left-0 top-[20rpx] bottom-[20rpx] w-[4rpx] bg-[#8CB896]" />
          <view class="p-[28rpx_32rpx_28rpx_40rpx]">
            <view class="flex items-center justify-between">
              <text class="text-[26rpx] text-[#4A5D42] font-[500] tracking-[2rpx]">订单 {{ order.orderNo }}</text>
              <text class="text-[22rpx] text-[#5D6D5A] tracking-[2rpx] px-[16rpx] py-[4rpx] bg-[#F2F6EE]">
                {{ statusMap[order.status] || order.status }}
              </text>
            </view>
            <text class="mt-[12rpx] block text-[22rpx] text-[#8C9C82] tracking-[1rpx]">创建：{{ formatTime(order.createdAt) }}</text>
            <text class="text-[22rpx] text-[#8C9C82] tracking-[1rpx]">更新：{{ formatTime(order.updatedAt) }}</text>
          </view>
        </view>
      </view>

      <!-- 商品列表 -->
      <view class="px-[48rpx] pt-[28rpx]">
        <text class="block text-[22rpx] text-[#B8C0A0] tracking-[4rpx] mb-[16rpx]">· 商品明细 ·</text>
        <view class="bg-[#FFFFFF] border border-[#D8D8C8] relative overflow-hidden">
          <view class="absolute left-0 top-[20rpx] bottom-[20rpx] w-[4rpx] bg-[#8CB896]" />
          <view class="p-[24rpx_32rpx_24rpx_40rpx]">
            <view
              v-for="(item, i) in order.items"
              :key="i"
              class="flex items-center justify-between py-[16rpx] border-b border-[#F0E8E0] last:border-0"
            >
              <text class="text-[24rpx] text-[#4A5D42] tracking-[1rpx]">{{ item.name }}</text>
              <text class="text-[22rpx] text-[#8C9C82] tracking-[1rpx]">×{{ item.quantity }}</text>
            </view>
          </view>
        </view>
      </view>
    </template>
  </view>
</template>
