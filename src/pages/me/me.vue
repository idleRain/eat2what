<script lang="ts" setup>
import { computed } from 'vue'
import { useAdminStore } from '@/store/admin'
import { useDecisionStore } from '@/store/decision'
import { useOrderStore } from '@/store/order'
import { useTokenStore } from '@/store/token'

definePage({
  style: {
    navigationStyle: 'default',
    navigationBarTitleText: '我的',
  },
})

const tokenStore = useTokenStore()
const adminStore = useAdminStore()
const orderStore = useOrderStore()
const decisionStore = useDecisionStore()

const orderCount = computed(() => orderStore.orders.length)
const historyCount = computed(() => decisionStore.history.length)

function goToOrders() {
  uni.navigateTo({ url: '/pages/orders/index' })
}

function goToDecisionHistory() {
  uni.navigateTo({ url: '/pages/decision-history/index' })
}

function goToAdminLogin() {
  if (adminStore.isAdmin) {
    uni.navigateTo({ url: '/pages/admin/dashboard/index' })
  }
  else {
    uni.navigateTo({ url: '/pages/admin/login/index' })
  }
}

function handleLogout() {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        tokenStore.logout()
        adminStore.logout()
        uni.showToast({ title: '已退出', icon: 'success' })
      }
    },
  })
}
</script>

<template>
  <view class="min-h-screen overflow-x-hidden bg-[#F2EEE8] pt-[40rpx]">
    <!-- 英文副标题 -->
    <text class="mb-[4rpx] block text-center text-[20rpx] text-[#B8C0A0] tracking-[6rpx]">
      · MY PROFILE ·
    </text>

    <!-- ===== 用户卡片 ===== -->
    <view class="relative mx-[40rpx] overflow-hidden bg-[#5D6D5A]">
      <view class="absolute bottom-[20rpx] left-0 top-[20rpx] w-[4rpx] bg-[#FFFFFF]" />
      <view class="flex items-center gap-[24rpx] p-[32rpx_36rpx]">
        <view class="h-[80rpx] w-[80rpx] flex items-center justify-center bg-[#FFFFFF]/20">
          <view class="i-lucide-user text-[40rpx] text-[#FFFFFF]" />
        </view>
        <view>
          <text class="block text-[28rpx] text-[#FFFFFF] tracking-[2rpx] font-[500]">
            {{ tokenStore.hasLogin ? '食客' : '未登录' }}
          </text>
          <text class="mt-[4rpx] block text-[20rpx] text-[#FFFFFF]/70 tracking-[1rpx]">
            今天想吃什么？
          </text>
        </view>
      </view>
    </view>

    <!-- ===== 功能菜单 ===== -->
    <view class="mx-[40rpx] mt-[24rpx] border border-[#D8D8C8] bg-[#FFFFFF]">
      <view
        class="flex items-center justify-between border-b border-[#E8E0D0] px-[28rpx] py-[24rpx]"
        @click="goToOrders"
      >
        <view class="flex items-center gap-[16rpx]">
          <view class="i-lucide-list text-[28rpx] text-[#5D6D5A]" />
          <text class="text-[26rpx] text-[#4A5D42] tracking-[2rpx]">我的订单</text>
        </view>
        <view class="flex items-center gap-[12rpx]">
          <text v-if="orderCount > 0" class="text-[20rpx] text-[#8C9C82]">{{ orderCount }} 笔</text>
          <view class="i-lucide-chevron-right text-[24rpx] text-[#C0C0B0]" />
        </view>
      </view>
      <view
        class="flex items-center justify-between border-b border-[#E8E0D0] px-[28rpx] py-[24rpx]"
        @click="goToDecisionHistory"
      >
        <view class="flex items-center gap-[16rpx]">
          <view class="i-lucide-rotate-cw text-[28rpx] text-[#5D6D5A]" />
          <text class="text-[26rpx] text-[#4A5D42] tracking-[2rpx]">决策历史</text>
        </view>
        <view class="flex items-center gap-[12rpx]">
          <text v-if="historyCount > 0" class="text-[20rpx] text-[#8C9C82]">{{ historyCount }} 条</text>
          <view class="i-lucide-chevron-right text-[24rpx] text-[#C0C0B0]" />
        </view>
      </view>
      <view
        class="flex items-center justify-between px-[28rpx] py-[24rpx]"
        @click="goToAdminLogin"
      >
        <view class="flex items-center gap-[16rpx]">
          <view class="i-lucide-settings text-[28rpx] text-[#5D6D5A]" />
          <text class="text-[26rpx] text-[#4A5D42] tracking-[2rpx]">管理员入口</text>
        </view>
        <view class="i-lucide-chevron-right text-[24rpx] text-[#C0C0B0]" />
      </view>
    </view>

    <!-- ===== 退出登录 ===== -->
    <view v-if="tokenStore.hasLogin" class="mx-[40rpx] mt-[32rpx]">
      <view
        class="border border-[#D8D8C8] bg-[#FFFFFF] py-[24rpx] text-center"
        @click="handleLogout"
      >
        <text class="text-[26rpx] text-[#B0A090] tracking-[2rpx]">退出登录</text>
      </view>
    </view>
  </view>
</template>
