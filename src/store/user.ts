import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * 简易 User Store
 * 一期：存储用户基本信息
 */
export const useUserStore = defineStore(
  'user',
  () => {
    const userInfo = ref<{
      username?: string
      nickname?: string
      avatar?: string
      roles?: string[]
      role?: string
    }>({})

    function setUserInfo(info: typeof userInfo.value) {
      userInfo.value = { ...info }
    }

    function clearUserInfo() {
      userInfo.value = {}
    }

    return {
      userInfo,
      setUserInfo,
      clearUserInfo,
    }
  },
  {
    persist: {
      storage: {
        getItem: (key: string) => uni.getStorageSync(key),
        setItem: (key: string, value: any) => uni.setStorageSync(key, value),
      },
    },
  },
)
