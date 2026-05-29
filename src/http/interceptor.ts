/**
 * HTTP 请求拦截器（简化版）
 * 一期：注入 baseURL 和 token，不做自动刷新
 */
import { useTokenStore } from '@/store/token'

// #ifndef H5
const baseURL = __VITE_APP_PROXY__ ? '' : (import.meta.env.VITE_SERVER_BASEURL || '')
// #endif

export const requestInterceptor = {
  install() {
    uni.addInterceptor('request', {
      invoke(args) {
        // #ifndef H5
        if (baseURL && args.url && !args.url.startsWith('http')) {
          args.url = baseURL + args.url
        }
        // #endif

        const tokenStore = useTokenStore()
        if (tokenStore.token) {
          args.header = {
            ...args.header,
            Authorization: `Bearer ${tokenStore.token}`,
          }
        }
        return args
      },
    })

    uni.addInterceptor('uploadFile', {
      invoke(args) {
        const tokenStore = useTokenStore()
        if (tokenStore.token) {
          args.header = {
            ...args.header,
            Authorization: `Bearer ${tokenStore.token}`,
          }
        }
        return args
      },
    })
  },
}
