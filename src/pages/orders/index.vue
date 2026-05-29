<script lang="ts" setup>
import type { Order } from '@/store/order'
import { onMounted, ref } from 'vue'
import { useOrderStore } from '@/store/order'

defineOptions({ name: 'OrdersPage' })
definePage({
  style: {
    navigationStyle: 'default',
    navigationBarTitleText: '我的订单',
  },
})

const orderStore = useOrderStore()
const orders = ref<Order[]>([])

onMounted(() => {
  orders.value = orderStore.orders
})

const statusMap: Record<string, { text: string, color: string }> = {
  pending: { text: '待处理', color: 'text-warning' },
  processing: { text: '处理中', color: 'text-info' },
  completed: { text: '已完成', color: 'text-success' },
  cancelled: { text: '已取消', color: 'text-text-hint' },
}

function goToDetail(order: Order) {
  uni.navigateTo({ url: `/pages/order-detail/index?id=${order.id}` })
}

async function handleCancel(order: Order) {
  const res = await uni.showModal({
    title: '确认撤销',
    content: '确定要撤销此订单吗？',
  })
  if (res.confirm) {
    await orderStore.cancelOrder(order.id)
    uni.showToast({ title: '已撤销', icon: 'success' })
    orders.value = orderStore.orders
  }
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<template>
  <view class="min-h-screen bg-bg-page px-4 pt-4">
    <view v-if="orders.length === 0" class="center pt-20">
      <text class="text-text-hint">暂无订单</text>
    </view>
    <view
      v-for="order in orders"
      :key="order.id"
      class="mb-3 rounded-md bg-bg-surface p-4 card-shadow"
      @click="goToDetail(order)"
    >
      <view class="flex items-center justify-between">
        <text class="text-xs text-text-hint">订单号：{{ order.orderNo }}</text>
        <text class="text-xs font-medium" :class="statusMap[order.status]?.color">
          {{ statusMap[order.status]?.text || order.status }}
        </text>
      </view>
      <view class="mt-2">
        <text class="text-sm text-text-primary">
          {{ order.items.map(i => i.name).join('、') }}
        </text>
      </view>
      <view class="mt-2 flex items-center justify-between">
        <text class="text-sm text-text-hint">{{ formatTime(order.createdAt) }}</text>
      </view>
      <view v-if="order.status === 'pending'" class="mt-3 flex justify-end gap-3">
        <view
          class="border border-error rounded-full px-4 py-1"
          @click.stop="handleCancel(order)"
        >
          <text class="text-xs text-error">撤销订单</text>
        </view>
      </view>
    </view>
  </view>
</template>
