import type { TabBar } from '@uni-helper/vite-plugin-uni-pages'
import type { RemoveLeadingSlashFromUnion } from '@/typings'

export type NativeTabBarItem = TabBar['list'][number] & {
  pagePath: RemoveLeadingSlashFromUnion<_LocationUrl>
}

export type CustomTabBarItemBadge = number | 'dot'

export interface CustomTabBarItem {
  text: string
  pagePath: RemoveLeadingSlashFromUnion<_LocationUrl>
  iconType: 'uiLib' | 'unocss' | 'iconfont' | 'image'
  icon: string
  iconActive?: string
  badge?: CustomTabBarItemBadge
  isBulge?: boolean
  roles?: string[]
}
