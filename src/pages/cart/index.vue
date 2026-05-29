<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import presetProducts from '@/data/preset-products.json'
import { useCartStore } from '@/store/cart'
import { useOrderStore } from '@/store/order'
import { useSafeArea } from '@/hooks/useSafeArea'

defineOptions({ name: 'CartPage' })
definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '帮我买',
  },
})

const { topBarHeight, bottomSafeStyle } = useSafeArea()

const cartStore = useCartStore()
const orderStore = useOrderStore()
const submitting = ref(false)

const categories = ref<string[]>([])
const productsByCat = ref<Record<string, typeof presetProducts>>({})
const scrollTargetId = ref('')
const activeCat = ref('')
const showCartPanel = ref(false)

const catMeta: Record<string, { icon: string, bg: string, color: string }> = {
  '奶茶': { icon: 'i-lucide-coffee', bg: '#EDE8DC', color: '#B8966E' },
  '甜点': { icon: 'i-lucide-cake', bg: '#F5E8E0', color: '#D4A080' },
  '中餐': { icon: 'i-lucide-utensils-crossed', bg: '#E2ECD8', color: '#6B8A6E' },
  '西餐': { icon: 'i-lucide-beef', bg: '#EFE4D8', color: '#B8906E' },
}

onMounted(() => {
  const catSet = new Set<string>()
  const map: Record<string, typeof presetProducts> = {}
  for (const p of presetProducts) {
    if (!catSet.has(p.category)) {
      catSet.add(p.category)
      map[p.category] = []
    }
    map[p.category].push(p)
  }
  const sortedCats = ['奶茶', '甜点', '中餐', '西餐']
  categories.value = sortedCats.filter(c => catSet.has(c))
  productsByCat.value = map
  activeCat.value = categories.value[0] || ''
})

function onRightScroll(e: any) {
  const st = e.detail?.scrollTop || 0
  // scrollTop 是 px，乘 2 转为 rpx（以 750 设计稿为准）
  const stRpx = st * (750 / uni.getSystemInfoSync().windowWidth)
  let acc = 0
  let idx = 0
  for (let i = 0; i < categories.value.length; i++) {
    const items = productsByCat.value[categories.value[i]] || []
    acc += 56 + items.length * 146
    if (stRpx < acc) { idx = i; break }
  }
  if (categories.value[idx] && activeCat.value !== categories.value[idx]) {
    activeCat.value = categories.value[idx]
  }
}

function goToCategory(idx: number) {
  const cat = categories.value[idx]
  if (!cat) return
  activeCat.value = cat
  scrollTargetId.value = ''
  setTimeout(() => { scrollTargetId.value = 'sec-' + idx }, 50)
}

function addToCart(product: (typeof presetProducts)[number]) {
  cartStore.addItem({ id: product.id, name: product.name, price: 0, category: product.category }, 1)
}
function removeFromCart(product: (typeof presetProducts)[number]) {
  const item = cartStore.items.find(i => i.dishId === product.id)
  if (item) cartStore.decrementQuantity(item.id)
}
function getQty(productId: string): number {
  return cartStore.items.find(i => i.dishId === productId)?.quantity || 0
}

function clearCart() {
  cartStore.clearCart()
  showCartPanel.value = false
}

async function submitOrder() {
  if (cartStore.items.length === 0) return
  submitting.value = true
  try {
    const order = await orderStore.submitOrder([...cartStore.items])
    cartStore.clearCart()
    showCartPanel.value = false
    uni.showToast({ title: '下单成功', icon: 'success', duration: 2000 })
    setTimeout(() => {
      uni.navigateTo({ url: `/pages/order-detail/index?id=${order.id}` })
    }, 800)
  } catch {
    uni.showToast({ title: '下单失败', icon: 'error' })
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <view class="h-[calc(100vh-50px)] flex flex-col overflow-hidden bg-[#F2EEE8]">
    <!-- ===== 顶部导航 ===== -->
    <view class="pb-[16rpx] pl-[48rpx] pr-[48rpx]" :style="{ paddingTop: `${topBarHeight}px` }">
      <view class="flex items-end justify-between">
        <view>
          <text class="block text-[40rpx] text-[#5D6D5A] leading-[1.1] tracking-[6rpx] font-[300]">帮我买</text>
          <text class="mt-[4rpx] block text-[20rpx] text-[#B8C0A0] tracking-[4rpx]">BUY FOR ME</text>
        </view>
      </view>
    </view>

    <!-- ===== 主区域 ===== -->
    <view class="flex-1 overflow-hidden flex">
      <!-- 左侧侧边栏 -->
      <scroll-view scroll-y class="w-[180rpx] shrink-0 h-full bg-[#F5F2EC]">
        <view
          v-for="(cat, idx) in categories"
          :key="cat"
          class="relative flex flex-col items-center justify-center h-[116rpx] transition-all duration-200"
          :class="activeCat === cat ? 'bg-[#FFFFFF]' : ''"
          @click="goToCategory(idx)"
        >
          <view v-if="activeCat === cat" class="absolute left-0 top-[16rpx] bottom-[16rpx] w-[4rpx] bg-[#8CB896]" />
          <view
            class="w-[44rpx] h-[44rpx] flex items-center justify-center"
            :style="{ background: activeCat === cat ? catMeta[cat]?.bg || '#F2F6EE' : 'transparent' }"
          >
            <view :class="catMeta[cat]?.icon || 'i-lucide-circle'" :style="{ fontSize: '28rpx', color: activeCat === cat ? (catMeta[cat]?.color || '#5D6D5A') : '#A8B8A8' }" />
          </view>
          <text class="mt-[6rpx] text-[22rpx] tracking-[2rpx] text-center leading-[1.2]" :class="activeCat === cat ? 'text-[#4A5D42] font-[600]' : 'text-[#A8B8A8]'">
            {{ cat }}
          </text>
        </view>
      </scroll-view>

      <!-- 右侧菜品列表 -->
      <scroll-view
        scroll-y
        class="flex-1 bg-[#FFFFFF] overflow-x-hidden h-full"
        :scroll-into-view="scrollTargetId"
        :scroll-with-animation="true"
        @scroll="onRightScroll"
      >
        <view class="px-[24rpx] pt-[20rpx] pb-[12rpx] bg-[#FFFFFF]">
          <text class="block text-[20rpx] text-[#B8C0A0] tracking-[6rpx]">· MENU ·</text>
        </view>

        <view v-for="(cat, idx) in categories" :key="cat" :id="'sec-' + idx">
          <view class="sticky top-0 z-10 bg-[#FAF8F4] px-[24rpx] py-[14rpx] border-t border-[#F0ECE4] border-b border-[#F0ECE4]">
            <text class="text-[22rpx] text-[#5D6D5A] tracking-[4rpx] font-[500]">{{ cat }}</text>
          </view>

          <view v-if="productsByCat[cat]?.length">
            <view
              v-for="product in productsByCat[cat]"
              :key="product.id"
              class="flex items-center px-[24rpx] py-[24rpx] border-b border-[#F5F0E8]"
            >
              <view class="w-[96rpx] h-[96rpx] flex items-center justify-center shrink-0" :style="{ background: catMeta[cat]?.bg || '#F2F6EE' }">
                <view :class="catMeta[cat]?.icon || 'i-lucide-circle'" :style="{ fontSize: '40rpx', color: catMeta[cat]?.color || '#8CB896' }" />
              </view>
              <view class="ml-[16rpx] flex-1 overflow-hidden">
                <text class="block text-[28rpx] text-[#4A5D42] font-[500] tracking-[2rpx] overflow-hidden text-ellipsis whitespace-nowrap">{{ product.name }}</text>
                <text class="block mt-[4rpx] text-[22rpx] text-[#A8B8A0] tracking-[1rpx] overflow-hidden text-ellipsis whitespace-nowrap">{{ product.description }}</text>
              </view>
              <view class="flex items-center gap-[6rpx] shrink-0 ml-[16rpx]">
                <view
                  v-if="getQty(product.id) > 0"
                  class="w-[48rpx] h-[48rpx] flex items-center justify-center border border-[#D8D0C0] text-[#8C9C82] transition-all duration-150"
                  hover-class="opacity-70"
                  @click.stop="removeFromCart(product)"
                ><text class="text-[28rpx] leading-none">−</text></view>
                <text v-if="getQty(product.id) > 0" class="text-[26rpx] text-[#4A5D42] font-[500] text-center min-w-[40rpx] transition-all duration-150">{{ getQty(product.id) }}</text>
                <view
                  class="w-[48rpx] h-[48rpx] flex items-center justify-center border border-[#8CB896] transition-all duration-150"
                  :class="getQty(product.id) > 0 ? 'bg-[#5D6D5A]' : 'bg-[#FFFFFF]'"
                  hover-class="opacity-80"
                  @click.stop="addToCart(product)"
                >
                  <text :class="getQty(product.id) > 0 ? 'text-[#FFFFFF]' : 'text-[#5D6D5A]'" class="text-[28rpx] leading-none">+</text>
                </view>
              </view>
            </view>
          </view>
        </view>
        <view class="h-[32rpx]" />
      </scroll-view>
    </view>

    <!-- ===== 底部购物车栏 ===== -->
    <view v-show="cartStore.items.length > 0" class="shrink-0 bg-[#FFFFFF] border-t border-[#D8D8C8]" :style="{ ...bottomSafeStyle(16), paddingTop: '16px', paddingBottom: '56px' }">
      <view class="flex items-center justify-between px-[32rpx]">
        <view class="flex items-center gap-[16rpx]" @click="showCartPanel = true">
          <view class="relative">
            <view class="text-[36rpx] text-[#5D6D5A] i-lucide-shopping-cart" />
            <view v-if="cartStore.totalCount > 0" class="absolute -top-[10rpx] -right-[10rpx] min-w-[30rpx] h-[30rpx] flex items-center justify-center px-[8rpx] bg-[#C67B5C]">
              <text class="text-[18rpx] text-[#FFFFFF] font-[600]" style="line-height: 1;">{{ cartStore.totalCount > 99 ? '99+' : cartStore.totalCount }}</text>
            </view>
          </view>
          <view>
            <text class="block text-[26rpx] text-[#4A5D42] font-[500] tracking-[2rpx]">{{ cartStore.totalCount > 0 ? `已选 ${cartStore.totalCount} 件` : '购物车' }}</text>
            <text v-if="cartStore.items.length > 0" class="block mt-[2rpx] text-[18rpx] text-[#B0B8A0]">点击查看详情</text>
          </view>
        </view>
        <view
          class="px-[44rpx] py-[18rpx] flex items-center gap-[8rpx] transition-all duration-200"
          :class="cartStore.items.length > 0 ? 'bg-[#5D6D5A]' : 'bg-[#D0C8B8]'"
          hover-class="opacity-90"
          @click="submitOrder"
        >
          <view v-if="submitting" class="text-[22rpx] text-[#FFFFFF] i-lucide-loader-2" style="animation: spin-icon 1s linear infinite;" />
          <text class="text-[26rpx] text-[#FFFFFF] tracking-[4rpx] font-[400]">{{ submitting ? '提交中' : '去结算' }}</text>
        </view>
      </view>
    </view>

    <!-- ===== 购物车详情面板 ===== -->
    <view v-if="showCartPanel" class="fixed inset-0 z-50" @click="showCartPanel = false">
      <view class="absolute inset-0" style="background: rgba(40,30,20,0.45);" />
      <view class="absolute bottom-0 left-0 right-0 bg-[#FFFFFF] transition-all duration-300" :style="{ maxHeight: '70vh', ...bottomSafeStyle(0) }" @click.stop>
        <!-- 面板头部 -->
        <view class="flex items-center justify-between px-[32rpx] py-[28rpx] border-b border-[#E8E0D0]">
          <view>
            <text class="block text-[28rpx] text-[#4A5D42] font-[500] tracking-[2rpx]">已选商品</text>
            <text class="mt-[4rpx] block text-[20rpx] text-[#B0B8A0] tracking-[1rpx]">共 {{ cartStore.totalCount }} 件</text>
          </view>
          <view class="flex items-center gap-[24rpx]">
            <text v-if="cartStore.items.length > 0" class="text-[22rpx] text-[#B08070] tracking-[2rpx]" @click="clearCart">清空</text>
            <view class="text-[32rpx] text-[#B8C0A0] i-lucide-x" @click="showCartPanel = false" />
          </view>
        </view>

        <!-- 商品列表 -->
        <scroll-view scroll-y style="max-height: calc(70vh - 140rpx);">
          <view v-if="cartStore.items.length === 0" class="flex flex-col items-center py-[80rpx]">
            <view class="text-[56rpx] text-[#E0D8C8] i-lucide-shopping-cart" />
            <text class="mt-[16rpx] text-[26rpx] text-[#C0B8A8] tracking-[2rpx]">购物车还是空的</text>
            <text class="mt-[8rpx] text-[22rpx] text-[#D0C8B8] tracking-[1rpx]">去选几道喜欢的菜品吧</text>
          </view>

          <view v-for="item in cartStore.items" :key="item.id" class="flex items-center justify-between px-[32rpx] py-[24rpx] border-b border-[#F5F0E8]">
            <view class="flex items-center gap-[16rpx] flex-1 overflow-hidden">
              <view class="w-[64rpx] h-[64rpx] flex items-center justify-center shrink-0" :style="{ background: catMeta[item.category]?.bg || '#F2F6EE' }">
                <view :class="catMeta[item.category]?.icon || 'i-lucide-circle'" :style="{ fontSize: '28rpx', color: catMeta[item.category]?.color || '#5D6D5A' }" />
              </view>
              <view class="overflow-hidden">
                <text class="block text-[26rpx] text-[#4A5D42] tracking-[1rpx] overflow-hidden text-ellipsis whitespace-nowrap">{{ item.name }}</text>
              </view>
            </view>
            <view class="flex items-center gap-[8rpx] shrink-0 ml-[12rpx]">
              <view class="w-[44rpx] h-[44rpx] flex items-center justify-center border border-[#D8D0C0]" @click="cartStore.decrementQuantity(item.id)">
                <text class="text-[24rpx] text-[#8C9C82]">−</text>
              </view>
              <text class="text-[24rpx] text-[#4A5D42] font-[500] text-center min-w-[36rpx]">{{ item.quantity }}</text>
              <view class="w-[44rpx] h-[44rpx] flex items-center justify-center" @click="cartStore.incrementQuantity(item.id)">
                <text class="text-[24rpx] text-[#5D6D5A]">+</text>
              </view>
            </view>
          </view>
        </scroll-view>

        <!-- 结算按钮 -->
        <view v-if="cartStore.items.length > 0" class="border-t border-[#E8E0D0] px-[32rpx] py-[20rpx]">
          <view class="w-full py-[20rpx] flex items-center justify-center transition-all duration-200" :style="{ background: submitting ? '#C8D0B8' : '#5D6D5A' }" hover-class="opacity-90" @click="submitOrder">
            <text class="text-[26rpx] text-[#FFFFFF] tracking-[4rpx] font-[400]">{{ submitting ? '提交中...' : '提交订单' }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
@keyframes spin-icon {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
