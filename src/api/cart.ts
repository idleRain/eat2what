import type { CartItem } from '@/store/cart'
/**
 * 购物车接口
 * 一期使用 Pinia Store 直接管理，此文件预留 HTTP 调用层
 */
import { useCartStore } from '@/store/cart'

function getStore() {
  return useCartStore()
}

/** 获取当前用户购物车 */
export async function fetchCart(): Promise<CartItem[]> {
  return getStore().items
}

/** 添加商品到购物车 */
export async function addCartItem(dish: {
  id: string
  name: string
  image?: string
  price: number
  category?: string
}, quantity = 1): Promise<void> {
  getStore().addItem(dish, quantity)
}

/** 修改购物车商品数量 */
export async function updateCartItem(itemId: string, quantity: number): Promise<void> {
  getStore().updateQuantity(itemId, quantity)
}

/** 删除购物车商品 */
export async function removeCartItem(itemId: string): Promise<void> {
  getStore().removeItem(itemId)
}

/** 清空购物车 */
export async function clearCart(): Promise<void> {
  getStore().clearCart()
}
