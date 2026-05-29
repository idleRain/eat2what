<script lang="ts" setup>
import type { Order, OrderStatus } from '@/store/order'
import { computed, onMounted, ref } from 'vue'
import { fetchAllOrders, setOrderStatus } from '@/api/admin'
import { useAdminStore } from '@/store/admin'

defineOptions({ name: 'AdminOrders' })
definePage({
  style: {
    navigationStyle: 'default',
    navigationBarTitleText: '订单管理',
  },
})

const adminStore = useAdminStore()
const orders = ref<Order[]>([])
const filterStatus = ref<OrderStatus | ''>('')

onMounted(async () => {
  if (!adminStore.isAdmin) {
    uni.redirectTo({ url: '/pages/admin/login/index' })
    return
  }
  await refreshOrders()
})

async function refreshOrders() {
  orders.value = await fetchAllOrders(filterStatus.value || undefined)
}

function setFilter(s: OrderStatus | '') {
  filterStatus.value = s
  refreshOrders()
}

const filtered = computed(() => {
  if (!filterStatus.value) return orders.value
  return orders.value.filter(o => o.status === filterStatus.value)
})

async function markProcessing(orderId: string) {
  await setOrderStatus(orderId, 'processing')
  await refreshOrders()
  uni.showToast({ title: '已标记处理中', icon: 'success' })
}

async function markCompleted(orderId: string) {
  await setOrderStatus(orderId, 'completed')
  await refreshOrders()
  uni.showToast({ title: '已标记完成', icon: 'success' })
}

const statusMap: Record<string, { text: string, color: string }> = {
  pending: { text: '待处理', color: 'text-warning' },
  processing: { text: '处理中', color: 'text-info' },
  completed: { text: '已完成', color: 'text-success' },
  cancelled: { text: '已取消', color: 'text-text-hint' },
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<template>
  <view class="min-h-screen bg-bg-page px-4 pt-4">
    <!-- 筛选栏 -->
    <scroll-view scroll-x class="whitespace-nowrap">
      <view class="inline-flex gap-2">
        <view
          v-for="s in [{ k: '', t: '全部' }, { k: 'pending', t: '待处理' }, { k: 'processing', t: '处理中' }, { k: 'completed', t: '已完成' }, { k: 'cancelled', t: '已取消' }]"
          :key="s.k"
          class="inline-block rounded-full px-4 py-1 text-xs transition"
          :class="filterStatus === s.k ? 'bg-primary text-white' : 'bg-bg-surface text-text-secondary'"
          @click="setFilter(s.k as OrderStatus | '')"
        >
          {{ s.t }}
        </view>
      </view>
    </scroll-view>

    <!-- 订单列表 -->
    <view
      v-for="order in filtered"
      :key="order.id"
      class="mt-3 rounded-md bg-bg-surface p-4 card-shadow"
    >
      <view class="flex items-center justify-between">
        <text class="text-xs text-text-hint">{{ order.orderNo }}</text>
        <text class="text-xs font-medium" :class="statusMap[order.status]?.color">
          {{ statusMap[order.status]?.text || order.status }}
        </text>
      </view>
      <text class="mt-1 block text-sm text-text-primary">
        {{ order.items.map(i => `${i.name}×${i.quantity}`).join('、') }}
      </text>
      <view class="mt-2 flex items-center justify-between">
        <text class="text-xs text-text-hint">{{ formatTime(order.createdAt) }}</text>
      </view>
      <!-- 操作按钮 -->
      <view v-if="order.status === 'pending'" class="mt-3 flex justify-end gap-3">
        <view
          class="rounded-full bg-info px-4 py-1"
          @click="markProcessing(order.id)"
        >
          <text class="text-xs text-white">标记处理中</text>
        </view>
      </view>
      <view v-if="order.status === 'processing'" class="mt-3 flex justify-end gap-3">
        <view
          class="rounded-full bg-accent px-4 py-1"
          @click="markCompleted(order.id)"
        >
          <text class="text-xs text-white">标记已完成</text>
        </view>
      </view>
    </view>
    <view v-if="filtered.length === 0" class="center pt-20">
      <text class="text-text-hint">暂无订单</text>
    </view>
  </view>
</template>
