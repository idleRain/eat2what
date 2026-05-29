<script lang="ts" setup>
defineProps<{
  category: {
    id: string
    name: string
    icon: string
    color?: string
  }
  /** 背景色覆盖（如使用分类专属色 15% 透明度） */
  bgClass?: string
}>()

const emit = defineEmits<{
  (e: 'click', id: string): void
}>()
</script>

<template>
  <view
    class="flex flex-col items-center rounded-md py-3 transition-transform duration-200 active:scale-96"
    :class="bgClass || 'bg-primary-light'"
    @click="emit('click', category.id)"
  >
    <view
      :class="category.icon"
      class="text-3xl"
      :style="category.color ? { color: category.color } : {}"
    />
    <text class="mt-1 text-xs text-text-secondary">
      {{ category.name }}
    </text>
  </view>
</template>
