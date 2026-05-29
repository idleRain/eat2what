<script lang="ts" setup>
import type { CartItem } from '@/store/cart'
import { onMounted, ref } from 'vue'
import { fetchAllCarts } from '@/api/admin'
import { useAdminStore } from '@/store/admin'

defineOptions({ name: 'AdminCarts' })
definePage({
  style: {
    navigationStyle: 'default',
    navigationBarTitleText: '购物车管理',
  },
})

const adminStore = useAdminStore()
const items = ref<CartItem[]>([])

onMounted(() => {
  if (!adminStore.isAdmin) {
    uni.redirectTo({ url: '/pages/admin/login/index' })
    return
  }
  items.value = fetchAllCarts()
})
</script>

<template>
  <view class="min-h-screen bg-bg-page px-4 pt-4">
    <view v-if="items.length === 0" class="center pt-20">
      <text class="text-text-hint">暂无购物车数据</text>
    </view>
    <view v-else>
      <text class="text-xs text-text-hint">共 {{ items.length }} 个购物车项</text>
      <view
        v-for="item in items"
        :key="item.id"
        class="mt-3 flex items-center justify-between rounded-md bg-bg-surface p-4 card-shadow"
      >
        <view class="flex-1">
          <text class="text-sm text-text-primary font-medium">{{ item.name }}</text>
          <text class="ml-2 text-xs text-text-hint">{{ item.category }} · ×{{ item.quantity }}</text>
        </view>
      </view>
    </view>
  </view>
</template>
