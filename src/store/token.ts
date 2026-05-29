import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

/**
 * 简易 Token Store
 * 一期：管理登录状态，不涉及真实 Token 刷新
 */
export const useTokenStore = defineStore(
  'token',
  () => {
    const token = ref('')
    const refreshToken = ref('')

    const hasLogin = computed(() => !!token.value)

    function setToken(t: string) {
      token.value = t
    }

    function setRefreshToken(t: string) {
      refreshToken.value = t
    }

    function logout() {
      token.value = ''
      refreshToken.value = ''
    }

    return {
      token,
      refreshToken,
      hasLogin,
      setToken,
      setRefreshToken,
      logout,
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
