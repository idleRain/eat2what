<script lang="ts" setup>
import { ref } from 'vue'
import { adminLogin } from '@/api/admin'
import { useAdminStore } from '@/store/admin'

defineOptions({ name: 'AdminLogin' })
definePage({
  style: {
    navigationStyle: 'default',
    navigationBarTitleText: '管理员登录',
  },
})

const password = ref('')
const loading = ref(false)
const error = ref('')
const adminStore = useAdminStore()

async function handleLogin() {
  if (!password.value) {
    error.value = '请输入密码'
    return
  }
  loading.value = true
  error.value = ''
  try {
    const ok = await adminLogin(password.value)
    if (ok) {
      uni.showToast({ title: '登录成功', icon: 'success' })
      setTimeout(() => {
        uni.redirectTo({ url: '/pages/admin/dashboard/index' })
      }, 500)
    }
    else {
      error.value = '密码错误，请重试'
    }
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <view class="min-h-screen flex flex-col items-center justify-center bg-[#F2EEE8] px-[48rpx]">
    <view class="w-full" style="max-width: 600rpx;">
      <!-- 图标 + 标题 -->
      <view class="mb-[48rpx] flex flex-col items-center">
        <view class="h-[96rpx] w-[96rpx] flex items-center justify-center bg-[#E2ECD8]">
          <view class="i-lucide-settings text-[48rpx] text-[#5D6D5A]" />
        </view>
        <text class="mt-[20rpx] text-[32rpx] text-[#4A5D42] tracking-[6rpx] font-[300]">
          管理员登录
        </text>
        <text class="mt-[8rpx] text-[20rpx] text-[#B0B8A0] tracking-[4rpx]">
          ADMIN LOGIN
        </text>
      </view>

      <!-- 输入卡片 -->
      <view class="relative overflow-hidden border border-[#D8D8C8] bg-[#FFFFFF]">
        <view class="absolute bottom-[20rpx] left-0 top-[20rpx] w-[4rpx] bg-[#8CB896]" />
        <view class="p-[36rpx_32rpx_36rpx_40rpx]">
          <text class="mb-[16rpx] block text-[22rpx] text-[#B8C0A0] tracking-[4rpx]">
            · PASSWORD ·
          </text>
          <input
            v-model="password"
            type="password"
            placeholder="请输入管理密码"
            class="w-full border-b border-[#D8D8C8] py-[16rpx] text-[26rpx] text-[#4A5D42] tracking-[2rpx] outline-none"
            style="background: transparent;"
            @confirm="handleLogin"
          >
          <text v-if="error" class="mt-[12rpx] block text-[22rpx] text-[#B08070] tracking-[1rpx]">{{ error }}</text>
        </view>
      </view>

      <!-- 登录按钮 -->
      <view
        class="mt-[32rpx] border py-[24rpx] text-center transition-all duration-200"
        :style="{ background: loading ? '#E0D8C8' : '#5D6D5A', borderColor: loading ? '#D0C8B8' : '#5D6D5A' }"
        hover-class="btn-hover"
        @click="handleLogin"
      >
        <text
          class="text-[26rpx] tracking-[6rpx] font-[400]"
          :style="{ color: loading ? '#8C7B72' : '#FFFFFF' }"
        >
          {{ loading ? '验证中...' : '登 录' }}
        </text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.btn-hover {
  opacity: 0.9;
}
</style>
