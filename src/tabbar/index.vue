<script setup lang="ts">
import { computed } from 'vue'
import { useCartStore } from '@/store/cart'
import { customTabbarEnable, needHideNativeTabbar, tabbarCacheEnable } from './config'
import { tabbarList, tabbarStore } from './store'
import TabbarItem from './TabbarItem.vue'

// #ifdef MP-WEIXIN
defineOptions({ virtualHost: true })
// #endif

const cartStore = useCartStore()

/** 动态更新购物车角标 */
computed(() => {
  const list = tabbarList.value
  const cartIndex = list.findIndex(item => item.pagePath === 'pages/cart/index')
  if (cartIndex > -1) {
    const count = cartStore.totalCount
    if (count > 0) {
      tabbarStore.setTabbarItemBadge(cartIndex, count)
    }
    else {
      tabbarStore.setTabbarItemBadge(cartIndex, 'dot')
    }
  }
  return null
})

function handleClickBulge() {
  uni.showToast({ title: '点击了中间的鼓包tabbarItem', icon: 'none' })
}

function handleClick(index: number) {
  if (index === tabbarStore.curIdx) return
  const list = tabbarList.value
  if (!list[index]) return
  if (list[index].isBulge) {
    handleClickBulge()
    return
  }
  const url = list[index].pagePath
  tabbarStore.setCurIdx(index)
  if (tabbarCacheEnable) {
    uni.switchTab({ url })
  }
  else {
    uni.navigateTo({ url })
  }
}

// #ifndef MP-WEIXIN || MP-ALIPAY
onLoad(() => {
  needHideNativeTabbar
  && uni.hideTabBar({
    fail(err) { console.log('hideTabBar fail: ', err) },
  })
})
// #endif

// #ifdef MP-ALIPAY
onMounted(() => {
  customTabbarEnable
  && uni.hideTabBar({
    fail(err) { console.log('hideTabBar fail: ', err) },
  })
})
// #endif

const activeColor = '#5D6D5A'
const inactiveColor = '#B0B8A0'
function getColorByIndex(index: number) {
  return tabbarStore.curIdx === index ? activeColor : inactiveColor
}
</script>

<template>
  <view v-if="customTabbarEnable" class="h-50px pb-safe">
    <view class="border-and-fixed bg-white" @touchmove.stop.prevent>
      <view class="h-50px flex items-center">
        <view
          v-for="(item, index) in tabbarList" :key="index"
          class="flex flex-1 flex-col items-center justify-center"
          :style="{ color: getColorByIndex(index) }"
          @click="handleClick(index)"
        >
          <view v-if="item.isBulge" class="relative">
            <view class="bulge">
              <TabbarItem :item="item" :index="index" class="text-center" is-bulge />
            </view>
          </view>
          <TabbarItem v-else :item="item" :index="index" class="relative px-3 text-center" />
        </view>
      </view>
      <view class="pb-safe" />
    </view>
  </view>
</template>

<style scoped lang="scss">
.border-and-fixed {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  border-top: 1px solid #d8d8c8;
  box-sizing: border-box;
}
.bulge {
  position: absolute;
  top: -20px;
  left: 50%;
  transform-origin: top center;
  transform: translateX(-50%) scale(0.5) translateY(-33%);
  display: flex;
  justify-content: center;
  align-items: center;
  width: 250rpx;
  height: 250rpx;
  border-radius: 50%;
  background-color: #fff;
  box-shadow: inset 0 0 0 1px #fefefe;
}
</style>
