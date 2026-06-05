import type { DishItem } from '@/types/dish'
/**
 * 第三方公开数据接口适配层
 * 调用下厨房/豆果美食等公开接口获取菜品详情
 * 一期：预置静态兜底数据，后续对接真实 API
 */
import { getDishDetail } from './dish'

export interface ThirdPartyDishDetail {
  title: string
  description: string
  ingredients: string[]
  steps: string[]
  tips: string
  sourceUrl: string
  sourceName: string
}

/**
 * 尝试从第三方获取菜品详情
 * 失败时回退到本地预置数据
 */
export async function fetchThirdPartyDetail(
  dishId: string,
): Promise<ThirdPartyDishDetail | null> {
  try {
    // 先从本地获取菜品基础信息
    const local = await getDishDetail(dishId)
    if (!local) return null

    // 一期返回本地数据构建的详情
    return buildMockDetail(local)
  }
  catch {
    return null
  }
}

/** 兜底：基于本地数据构建菜品详情 */
function buildMockDetail(dish: DishItem): ThirdPartyDishDetail {
  return {
    title: dish.name,
    description: dish.description || `${dish.name}是一道美味佳肴。`,
    ingredients: ['主料', '调料', '辅料'],
    steps: [
      '1. 准备食材，清洗干净',
      '2. 按顺序烹饪',
      '3. 装盘即可享用',
    ],
    tips: '根据个人口味可适当调整调料用量。',
    sourceUrl: '',
    sourceName: '本地数据',
  }
}

/**
 * 代理调用第三方公开 API
 * 预留接口，后续对接真实 API 时使用
 */
export async function proxyThirdPartyApi(url: string): Promise<unknown> {
  try {
    // #ifdef H5
    // H5 端直接请求
    const res = await uni.request({ url, method: 'GET', timeout: 10000 })
    return res.data
    // #endif
    // #ifdef MP-WEIXIN
    // 小程序端需要通过后端代理（域名白名单限制）
    // 一期返回 mock
    return null
    // #endif
  }
  catch {
    return null
  }
}
