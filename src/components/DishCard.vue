<script lang="ts" setup>
defineProps<{
  dish: {
    id: string
    name: string
    image?: string
    description?: string
    tags?: string[]
  }
}>()

const emit = defineEmits<{
  (e: 'click', id: string): void
  (e: 'addToCart', id: string): void
}>()
</script>

<template>
  <view
    style="
      display: flex;
      align-items: center;
      border-radius: 16rpx;
      background: #fff;
      padding: 24rpx;
      box-shadow: 0 2rpx 12rpx rgba(58,42,36,0.05);
      transition: all 0.2s;
    "
    hover-class="dish-card-hover"
    @click="emit('click', dish.id)"
  >
    <!-- 图片占位 -->
    <view
      style="
        width: 100rpx;
        height: 100rpx;
        border-radius: 12rpx;
        background: #F5ECE6;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      "
    >
      <view style="font-size: 40rpx; color: #C67B5C;" class="i-lucide-utensils-crossed" />
    </view>

    <!-- 信息 -->
    <view style="margin-left: 20rpx; flex: 1; overflow: hidden;">
      <text
        style="
          display: block;
          font-size: 26rpx;
          font-weight: 600;
          color: #3A2A24;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        "
      >
        {{ dish.name }}
      </text>
      <text
        v-if="dish.description"
        style="
          display: block;
          margin-top: 4rpx;
          font-size: 20rpx;
          color: #8C7B72;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        "
      >
        {{ dish.description }}
      </text>
      <view
        v-if="dish.tags?.length"
        style="
          display: flex;
          align-items: center;
          gap: 8rpx;
          margin-top: 10rpx;
        "
      >
        <text
          v-for="tag in dish.tags.slice(0, 3)"
          :key="tag"
          style="
            font-size: 18rpx;
            color: #C67B5C;
            background: #F5ECE6;
            padding: 2rpx 14rpx;
            border-radius: 20rpx;
          "
        >
          {{ tag }}
        </text>
      </view>
    </view>

    <!-- 添加按钮 -->
    <view
      style="
        width: 48rpx;
        height: 48rpx;
        border-radius: 50%;
        background: #C67B5C;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        margin-left: 16rpx;
      "
      @click.stop="emit('addToCart', dish.id)"
    >
      <view style="font-size: 28rpx; color: #fff;" class="i-lucide-plus" />
    </view>
  </view>
</template>

<style scoped>
.dish-card-hover {
  opacity: 0.85;
}
</style>
