<script lang="ts" setup>
import type { Order } from '@/store/order'
import { onMounted, ref } from 'vue'
import { fetchDashboard } from '@/api/admin'
import { useAdminStore } from '@/store/admin'

defineOptions({ name: 'AdminDashboard' })
definePage({
  style: {
    navigationStyle: 'default',
    navigationBarTitleText: '管理后台',
  },
})

const adminStore = useAdminStore()
const totalUsers = ref(0)
const totalOrders = ref(0)
const todayOrders = ref(0)
const recentOrders = ref<Order[]>([])

onMounted(async () => {
  if (!adminStore.isAdmin) {
    uni.redirectTo({ url: '/pages/admin/login/index' })
    return
  }
  const data = await fetchDashboard()
  totalUsers.value = data.totalUsers
  totalOrders.value = data.totalOrders
  todayOrders.value = data.todayOrders
  recentOrders.value = data.recentOrders
})

function logout() {
  adminStore.logout()
  uni.switchTab({ url: '/pages/me/me' })
}

function goToCarts() {
  uni.navigateTo({ url: '/pages/admin/carts/index' })
}

function goToOrders() {
  uni.navigateTo({ url: '/pages/admin/orders/index' })
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const statusMap: Record<string, string> = {
  pending: '待处理',
  processing: '处理中',
  completed: '已完成',
  cancelled: '已取消',
}
</script>

<template>
  <view class="min-h-screen bg-bg-page px-4">
    <!-- 导航栏 -->
    <view class="flex items-center justify-between py-4">
      <text class="text-xl text-text-primary font-bold">管理后台</text>
      <text class="text-sm text-error" @click="logout">退出</text>
    </view>

    <!-- 指标卡片 -->
    <view class="grid grid-cols-3 gap-3">
      <view class="rounded-md bg-bg-surface p-4 text-center card-shadow">
        <text class="text-2xl text-primary font-bold">{{ totalUsers }}</text>
        <text class="mt-1 block text-xs text-text-hint">总用户</text>
      </view>
      <view class="rounded-md bg-bg-surface p-4 text-center card-shadow">
        <text class="text-2xl text-accent font-bold">{{ totalOrders }}</text>
        <text class="mt-1 block text-xs text-text-hint">总订单</text>
      </view>
      <view class="rounded-md bg-bg-surface p-4 text-center card-shadow">
        <text class="text-2xl text-warning font-bold">{{ todayOrders }}</text>
        <text class="mt-1 block text-xs text-text-hint">今日订单</text>
      </view>
    </view>

    <!-- 快捷入口 -->
    <view class="grid grid-cols-2 mt-4 gap-3">
      <view
        class="rounded-md bg-bg-surface p-4 text-center card-shadow"
        @click="goToCarts"
      >
        <view class="i-lucide-shopping-cart mx-auto text-2xl text-primary" />
        <text class="mt-1 block text-sm text-text-primary">购物车管理</text>
      </view>
      <view
        class="rounded-md bg-bg-surface p-4 text-center card-shadow"
        @click="goToOrders"
      >
        <view class="i-lucide-list mx-auto text-2xl text-accent" />
        <text class="mt-1 block text-sm text-text-primary">订单管理</text>
      </view>
    </view>

    <!-- 最近订单 -->
    <view class="mt-6">
      <text class="text-base text-text-primary font-semibold">最近订单</text>
      <view
        v-for="order in recentOrders"
        :key="order.id"
        class="mt-3 rounded-md bg-bg-surface p-3 card-shadow"
      >
        <view class="flex items-center justify-between">
          <text class="text-xs text-text-hint">{{ order.orderNo }}</text>
          <text class="text-xs text-primary">{{ statusMap[order.status] || order.status }}</text>
        </view>
        <text class="mt-1 block truncate text-sm text-text-primary">
          {{ order.items.map(i => i.name).join('、') }}
        </text>
        <view class="mt-1 flex items-center justify-between">
          <text class="text-xs text-text-hint">{{ formatTime(order.createdAt) }}</text>
        </view>
      </view>
      <view v-if="recentOrders.length === 0" class="py-8 text-center">
        <text class="text-sm text-text-hint">暂无订单</text>
      </view>
    </view>
  </view>
</template>
