/**
 * 安全边距 hook
 * 统一处理微信小程序胶囊按钮 & 底部安全区适配
 */
import { ref, onMounted } from 'vue'

export function useSafeArea() {
  const topBarHeight = ref(44) // px
  const bottomSafeHeight = ref(0) // px

  onMounted(() => {
    try {
      // 顶部：胶囊按钮底部 + 12px 间隔
      const menuRect = uni.getMenuButtonBoundingClientRect()
      topBarHeight.value = menuRect.bottom + 12
    } catch {
      // 非小程序降级
      const sys = uni.getSystemInfoSync()
      topBarHeight.value = (sys.statusBarHeight || 0) + 44
    }

    try {
      // 底部安全区
      bottomSafeHeight.value = uni.getSystemInfoSync().safeAreaInsets?.bottom || 0
    } catch {
      bottomSafeHeight.value = 0
    }
  })

  /** 顶部样式对象（用于 :style 绑定） */
  function topBarStyle() {
    return { paddingTop: `${topBarHeight.value}px` }
  }

  /** 底部留白样式 */
  function bottomSafeStyle(extra = 16) {
    return {
      paddingBottom: `${bottomSafeHeight.value + extra}px`,
    }
  }

  return { topBarHeight, bottomSafeHeight, topBarStyle, bottomSafeStyle }
}
