import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useAdminStore = defineStore(
  'admin',
  () => {
    const isLoggedIn = ref(false)
    const token = ref('')

    /** 管理密码的 bcrypt hash（存储 hash，不存明文） */
    const PASSWORD_HASH = '$2b$10$placeholder_hash_for_admin_888888'

    const isAdmin = computed(() => isLoggedIn.value && !!token.value)

    /**
     * 简易登录验证
     * 一期使用简单密码比对（后续替换为 bcrypt）
     */
    async function login(password: string): Promise<boolean> {
      // 一期简易校验：管理员密码为 'admin888'
      if (password === 'admin888') {
        isLoggedIn.value = true
        token.value = `admin-token-${Date.now()}`
        return true
      }
      return false
    }

    function logout() {
      isLoggedIn.value = false
      token.value = ''
    }

    return {
      isLoggedIn,
      token,
      isAdmin,
      login,
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
