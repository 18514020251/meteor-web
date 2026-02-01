<template>
  <div class="loading-container">
    <div class="loader">
      <div class="inner one"></div>
      <div class="inner two"></div>
      <div class="inner three"></div>
    </div>
    <p class="loading-text">正在同步星际数据...</p>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import http from '../request/http'
import { ElMessage } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()

onMounted(() => {
  // 获取用户信息
  http.get('/user/info')
    .then(res => {
      // 假设后端返回的数据结构中包含 role (用户角色: user/merchant/admin)
      authStore.setUserInfo(res) 
      
      // 根据角色跳转到对应页面，或者统一去 user 页面
      setTimeout(() => {
        if (res.role === 'admin') router.push('/admin')
        else if (res.role === 'merchant') router.push('/merchant')
        else router.push('/user')
      }, 1500) // 这里的延迟是为了让用户看一眼帅气的动画
    })
    .catch(err => {
      console.error('获取用户信息失败', err)
      ElMessage.error('无法同步用户信息')
      router.push('/login')
    })
})
</script>

<style scoped>
.loading-container {
  height: 100vh;
  background: #090A0F;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.loading-text {
  color: #409EFF;
  margin-top: 50px;
  letter-spacing: 4px;
  font-family: 'Avenir', sans-serif;
  animation: blink 1.5s infinite;
}

/* 帅气的星轨加载动画 */
.loader {
  position: relative;
  width: 100px; height: 100px;
  perspective: 120px;
}

.inner {
  position: absolute;
  width: 100%; height: 100%;
  border-radius: 50%;
}

.inner.one {
  left: 0%; top: 0%;
  animation: rotate-one 1s linear infinite;
  border-bottom: 3px solid #EFEFFA;
}

.inner.two {
  right: 0%; top: 0%;
  animation: rotate-two 1s linear infinite;
  border-right: 3px solid #EFEFFA;
}

.inner.three {
  right: 0%; bottom: 0%;
  animation: rotate-three 1s linear infinite;
  border-top: 3px solid #EFEFFA;
}

@keyframes rotate-one { 0% { transform: rotateX(35deg) rotateY(-45deg) rotateZ(0deg); } 100% { transform: rotateX(35deg) rotateY(-45deg) rotateZ(360deg); } }
@keyframes rotate-two { 0% { transform: rotateX(50deg) rotateY(10deg) rotateZ(0deg); } 100% { transform: rotateX(50deg) rotateY(10deg) rotateZ(360deg); } }
@keyframes rotate-three { 0% { transform: rotateX(35deg) rotateY(55deg) rotateZ(0deg); } 100% { transform: rotateX(35deg) rotateY(55deg) rotateZ(360deg); } }
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
</style>