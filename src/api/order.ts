import type { CartItem } from '@/store/cart'
import type { Order, OrderStatus } from '@/store/order'
/**
 * 订单接口
 * 一期使用 Pinia Store 直接管理，此文件预留 HTTP 调用层
 */
import { useOrderStore } from '@/store/order'

function getStore() {
  return useOrderStore()
}

/** 提交订单 */
export async function submitOrder(
  items: CartItem[],
  userId = 'default',
): Promise<Order> {
  return getStore().submitOrder(items, userId)
}

/** 获取当前用户订单列表 */
export async function fetchOrders(): Promise<Order[]> {
  return getStore().orders
}

/** 获取订单详情 */
export async function fetchOrderDetail(orderId: string): Promise<Order | undefined> {
  return getStore().getOrderById(orderId)
}

/** 撤销订单（仅 pending 状态） */
export async function cancelOrder(orderId: string): Promise<void> {
  return getStore().cancelOrder(orderId)
}

/** 修改订单（仅 pending 状态） */
export async function updateOrder(orderId: string, newItems: CartItem[]): Promise<void> {
  return getStore().updateOrder(orderId, newItems)
}

/** （管理员）更新订单状态 */
export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  getStore().updateOrderStatus(orderId, status)
}
