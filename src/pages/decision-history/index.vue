<script lang="ts" setup>
import { useDecisionStore } from '@/store/decision'

defineOptions({ name: 'DecisionHistoryPage' })
definePage({
  style: {
    navigationStyle: 'default',
    navigationBarTitleText: '决策历史',
  },
})

const decisionStore = useDecisionStore()

const mealTypeMap: Record<string, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function clearHistory() {
  uni.showModal({
    title: '确认清空',
    content: '确定要清空所有决策历史吗？',
    success: (res) => {
      if (res.confirm) {
        decisionStore.clearHistory()
        uni.showToast({ title: '已清空', icon: 'success' })
      }
    },
  })
}
</script>

<template>
  <view class="min-h-screen bg-[#F2EEE8]">
    <view v-if="decisionStore.history.length === 0" class="flex flex-col items-center pt-[160rpx]">
      <view class="text-[56rpx] text-[#D8D8C8] i-lucide-rotate-cw" />
      <text class="mt-[16rpx] text-[26rpx] text-[#C0B8A8] tracking-[2rpx]">暂无决策记录</text>
    </view>
    <view v-else class="px-[48rpx] pt-[24rpx]">
      <view class="flex items-center justify-between mb-[20rpx]">
        <text class="text-[22rpx] text-[#B0B8A0] tracking-[1rpx]">共 {{ decisionStore.history.length }} 条</text>
        <text class="text-[22rpx] text-[#B08070] tracking-[1rpx]" @click="clearHistory">清空历史</text>
      </view>
      <view
        v-for="record in decisionStore.history"
        :key="record.id"
        class="flex items-center justify-between bg-[#FFFFFF] border border-[#E8E0D0] p-[24rpx_28rpx] mb-[12rpx] transition-all duration-200"
        hover-class="item-hover"
      >
        <view>
          <text class="block text-[26rpx] text-[#4A5D42] font-[500] tracking-[2rpx]">{{ record.resultDishName }}</text>
          <text class="mt-[6rpx] block text-[20rpx] text-[#8C9C82] tracking-[1rpx]">
            {{ mealTypeMap[record.mealType] || record.mealType }} · {{ formatTime(record.createdAt) }}
          </text>
        </view>
        <text class="text-[20rpx] text-[#5D6D5A] tracking-[2rpx] bg-[#F2F6EE] px-[20rpx] py-[6rpx]">
          {{ mealTypeMap[record.mealType] || record.mealType }}
        </text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.item-hover {
  background: #F2F6EE !important;
  border-color: #B0D0A8 !important;
}
</style>
