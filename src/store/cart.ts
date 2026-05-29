import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export interface CartItem {
  id: string
  userId: string
  dishId: string
  name: string
  image: string
  price: number
  quantity: number
  category: string
}

export const useCartStore = defineStore(
  'cart',
  () => {
    const items = ref<CartItem[]>([])

    const totalCount = computed(() =>
      items.value.reduce((sum, item) => sum + item.quantity, 0),
    )

    const totalAmount = computed(() =>
      items.value.reduce((sum, item) => sum + item.price * item.quantity, 0),
    )

    /** 按分类分组的购物车项 */
    const groupedItems = computed(() => {
      const groups: Record<string, CartItem[]> = {}
      items.value.forEach((item) => {
        if (!groups[item.category]) {
          groups[item.category] = []
        }
        groups[item.category].push(item)
      })
      return groups
    })

    function addItem(dish: {
      id: string
      name: string
      image?: string
      price: number
      category?: string
    }, quantity = 1) {
      const existing = items.value.find(item => item.dishId === dish.id)
      if (existing) {
        existing.quantity += quantity
      }
      else {
        items.value.push({
          id: `cart-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          userId: '',
          dishId: dish.id,
          name: dish.name,
          image: dish.image || '',
          price: dish.price,
          quantity,
          category: dish.category || '其他',
        })
      }
    }

    function removeItem(itemId: string) {
      const index = items.value.findIndex(item => item.id === itemId)
      if (index > -1) {
        items.value.splice(index, 1)
      }
    }

    function updateQuantity(itemId: string, quantity: number) {
      const item = items.value.find(item => item.id === itemId)
      if (item) {
        item.quantity = Math.max(0, quantity)
        if (item.quantity === 0) {
          removeItem(itemId)
        }
      }
    }

    function incrementQuantity(itemId: string) {
      const item = items.value.find(item => item.id === itemId)
      if (item) {
        item.quantity++
      }
    }

    function decrementQuantity(itemId: string) {
      const item = items.value.find(item => item.id === itemId)
      if (item && item.quantity > 1) {
        item.quantity--
      }
      else if (item && item.quantity === 1) {
        removeItem(itemId)
      }
    }

    function clearCart() {
      items.value = []
    }

    return {
      items,
      totalCount,
      totalAmount,
      groupedItems,
      addItem,
      removeItem,
      updateQuantity,
      incrementQuantity,
      decrementQuantity,
      clearCart,
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
