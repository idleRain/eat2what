import type { Order, OrderStatus } from '@/store/order'
/**
 * 管理端接口
 * 一期使用 Pinia Store 模拟
 */
import { useAdminStore } from '@/store/admin'
import { useCartStore } from '@/store/cart'
import { useOrderStore } from '@/store/order'

/** 管理员登录 */
export async function adminLogin(password: string): Promise<boolean> {
  return useAdminStore().login(password)
}

/** 获取仪表盘数据 */
export async function fetchDashboard(): Promise<{
  totalUsers: number
  totalOrders: number
  todayOrders: number
  recentOrders: Order[]
}> {
  const orderStore = useOrderStore()
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const todayOrders = orderStore.orders.filter(
    o => o.createdAt >= todayStart,
  ).length

  return {
    totalUsers: 128, // 一期 mock
    totalOrders: orderStore.orders.length,
    todayOrders,
    recentOrders: orderStore.orders.slice(0, 10),
  }
}

/** 获取所有用户购物车 */
export async function fetchAllCarts() {
  return useCartStore().items
}

/** 获取所有订单 */
export async function fetchAllOrders(status?: OrderStatus): Promise<Order[]> {
  const orders = useOrderStore().orders
  if (status) {
    return orders.filter(o => o.status === status)
  }
  return orders
}

/** 更新订单状态 */
export async function setOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  useOrderStore().updateOrderStatus(orderId, status)
}
