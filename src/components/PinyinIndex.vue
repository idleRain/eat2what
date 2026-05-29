<script lang="ts" setup>
import { computed, ref } from 'vue'
import { ALPHABET, getAvailableLetters } from '@/utils/pinyin'

const props = withDefaults(
  defineProps<{
    dishes: Array<{ id: string, name: string }>
    /** 当前激活的字母（双向绑定可选） */
    activeLetter?: string
  }>(),
  {
    activeLetter: '',
  },
)

const emit = defineEmits<{
  (e: 'select', letter: string): void
  (e: 'update:activeLetter', letter: string): void
}>()

const internalActive = ref('')
const currentActive = computed(() => props.activeLetter || internalActive.value)

/** 可用的字母 */
const availableLetters = computed(() => getAvailableLetters(props.dishes))

/** 最近触摸的字母 */
const touchedLetter = ref('')
const showTooltip = ref(false)
let tooltipTimer: ReturnType<typeof setTimeout> | null = null

/** 判断字母是否可用 */
function isLetterAvailable(letter: string): boolean {
  return availableLetters.value.has(letter)
}

/** 处理字母选择 */
function selectLetter(letter: string) {
  if (!isLetterAvailable(letter)) return
  internalActive.value = letter
  emit('update:activeLetter', letter)
  emit('select', letter)
  // 震动反馈
  uni.vibrateShort({ type: 'light' })
}

/** 触摸索引条的处理 */
function handleTouchMove(e: TouchEvent) {
  if (!e.touches?.length) return
  const touch = e.touches[0]
  // 通过坐标计算当前触摸的字母
  const target = uni.createSelectorQuery().select('.pinyin-index-bar')
  if (!target) return

  // 简化方案：通过 y 坐标估算字母位置
  const y = touch.clientY
  // 每个字母约 28px 高度（根据索引条实际大小调整）
  const indexEl = uni
    .createSelectorQuery()
    .select('.pinyin-index-bar')
    .boundingClientRect()

  indexEl.exec((res: any) => {
    if (!res?.[0]) return
    const { top, height } = res[0]
    const relativeY = y - top
    const letterIndex = Math.floor((relativeY / height) * ALPHABET.length)
    const idx = Math.max(0, Math.min(ALPHABET.length - 1, letterIndex))
    const letter = ALPHABET[idx]

    if (letter !== touchedLetter.value && isLetterAvailable(letter)) {
      touchedLetter.value = letter
      showTooltip.value = true
      selectLetter(letter)
      // 重置提示框消失定时器
      if (tooltipTimer) clearTimeout(tooltipTimer)
      tooltipTimer = setTimeout(() => {
        showTooltip.value = false
      }, 1000)
    }
  })
}

function handleTouchEnd() {
  if (tooltipTimer) clearTimeout(tooltipTimer)
  setTimeout(() => {
    showTooltip.value = false
  }, 300)
}
</script>

<template>
  <view class="fixed right-0 top-1/2 z-40 flex flex-col items-center" style="transform: translateY(-50%);">
    <!-- 触摸提示气泡 -->
    <view
      v-if="showTooltip && touchedLetter"
      class="absolute h-10 w-10 flex items-center justify-center rounded-full bg-primary text-lg text-white font-bold shadow-lg -left-14 -top-4"
    >
      {{ touchedLetter }}
    </view>

    <!-- 字母索引条 -->
    <view
      class="pinyin-index-bar flex flex-col items-center gap-0 rounded-l-md bg-bg-surface/80 py-2 pr-1 backdrop-blur-sm"
      @touchmove.prevent="handleTouchMove"
      @touchend="handleTouchEnd"
      @touchstart="handleTouchMove"
    >
      <view
        v-for="letter in ALPHABET"
        :key="letter"
        class="h-5 w-5 flex items-center justify-center transition-all duration-150"
        :class="[
          currentActive === letter
            ? 'scale-125 font-bold text-primary'
            : 'text-text-hint',
          isLetterAvailable(letter) ? 'opacity-100' : 'opacity-30',
        ]"
        @click.stop="selectLetter(letter)"
      >
        <text :class="currentActive === letter ? 'text-xs' : 'text-3xs'">
          {{ letter }}
        </text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.pinyin-index-bar {
  width: 28rpx;
  box-shadow: -4rpx 0 12rpx rgba(0, 0, 0, 0.04);
}
</style>
