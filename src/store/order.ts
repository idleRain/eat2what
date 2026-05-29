import type { CartItem } from './cart'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled'

export interface Order {
  id: string
  userId: string
  orderNo: string
  items: CartItem[]
  totalAmount: number
  status: OrderStatus
  createdAt: number
  updatedAt: number
}

function generateOrderNo(): string {
  const now = new Date()
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  const random = Math.random().toString(36).slice(2, 6).toUpperCase()
  const seq = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0')
  return `${date}-${random}${seq}`
}

export const useOrderStore = defineStore(
  'order',
  () => {
    const orders = ref<Order[]>([])
    const currentOrder = ref<Order | null>(null)

    /** 按状态筛选 */
    function ordersByStatus(status: OrderStatus) {
      return orders.value.filter(o => o.status === status)
    }

    const pendingOrders = computed(() => ordersByStatus('pending'))
    const processingOrders = computed(() => ordersByStatus('processing'))
    const completedOrders = computed(() => ordersByStatus('completed'))
    const cancelledOrders = computed(() => ordersByStatus('cancelled'))

    async function submitOrder(
      items: CartItem[],
      userId = 'default',
    ): Promise<Order> {
      const totalAmount = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      )
      const order: Order = {
        id: `order-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId,
        orderNo: generateOrderNo(),
        items: [...items],
        totalAmount,
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      orders.value.unshift(order)
      return order
    }

    async function cancelOrder(orderId: string): Promise<void> {
      const order = orders.value.find(o => o.id === orderId)
      if (order && order.status === 'pending') {
        order.status = 'cancelled'
        order.updatedAt = Date.now()
      }
    }

    async function updateOrder(
      orderId: string,
      newItems: CartItem[],
    ): Promise<void> {
      const order = orders.value.find(o => o.id === orderId)
      if (order && order.status === 'pending') {
        order.items = [...newItems]
        order.totalAmount = newItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0,
        )
        order.updatedAt = Date.now()
      }
    }

    function fetchOrders() {
      // 一期从本地持久化读取，已在 pinia persistedstate 中自动加载
      return orders.value
    }

    function getOrderById(id: string): Order | undefined {
      return orders.value.find(o => o.id === id)
    }

    /** 管理员更新订单状态 */
    function updateOrderStatus(orderId: string, status: OrderStatus) {
      const order = orders.value.find(o => o.id === orderId)
      if (order) {
        order.status = status
        order.updatedAt = Date.now()
      }
    }

    return {
      orders,
      currentOrder,
      pendingOrders,
      processingOrders,
      completedOrders,
      cancelledOrders,
      submitOrder,
      cancelOrder,
      updateOrder,
      fetchOrders,
      getOrderById,
      updateOrderStatus,
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
