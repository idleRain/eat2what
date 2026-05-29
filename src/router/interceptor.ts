/**
 * 路由拦截器（简化版）
 * 一期：不做登录拦截，直接放行
 */
import { tabbarStore } from '@/tabbar/store'
import { parseUrlToObj } from '@/utils'

export const navigateToInterceptor = {
  invoke({ url, query }: { url: string, query?: Record<string, string> }) {
    if (!url) return true

    const { path } = parseUrlToObj(url)

    // 保持 tabbar 选中状态正确
    tabbarStore.setAutoCurIdx(path)

    return true // 直接放行
  },
}

export const routeInterceptor = {
  install() {
    uni.addInterceptor('navigateTo', navigateToInterceptor)
    uni.addInterceptor('reLaunch', navigateToInterceptor)
    uni.addInterceptor('redirectTo', navigateToInterceptor)
    uni.addInterceptor('switchTab', navigateToInterceptor)
  },
}
