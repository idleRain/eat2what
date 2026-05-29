<script lang="ts" setup>
import { navigateToInterceptor } from '@/router/interceptor'

onLaunch((options: any) => {
  console.log('[App] onLaunch', options)
})

onShow((options: any) => {
  if (options?.path) {
    navigateToInterceptor.invoke({ url: `/${options.path}`, query: options.query })
  }
  else {
    navigateToInterceptor.invoke({ url: '/' })
  }
})

onHide(() => {
  console.log('[App] onHide')
})
</script>

<style lang="scss">
@import 'uview-pro/index.scss';
</style>
