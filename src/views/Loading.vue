<template>
  <div class="loading-container">
    <div class="loading-content">
      <el-loading :fullscreen="true" text="加载中..." />
    </div>
  </div>
</template>

<script>
import http from '../request/http'
import { useAuthStore } from '../stores/auth'

export default {
  name: 'LoadingView',
  mounted() {
    this.getUserInfo()
  },
  methods: {
    getUserInfo() {
      http.get('/user/info')
        .then(userInfo => {
          const authStore = useAuthStore()
          // 保存用户信息到store
          authStore.user = userInfo
          
          // 根据用户角色跳转到不同页面
          switch (userInfo.role) {
            case 'user':
              this.$router.push('/user')
              break
            case 'merchant':
              this.$router.push('/merchant')
              break
            case 'admin':
              this.$router.push('/admin')
              break
            default:
              this.$router.push('/')
          }
        })
        .catch(error => {
          console.error('获取用户信息失败:', error)
          this.$router.push('/')
        })
    }
  }
}
</script>

<style scoped>
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
  background-color: #f0f2f5;
}
</style>
