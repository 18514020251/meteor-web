<template>
  <div class="loading-wrapper">
    <div class="loader-content">
      <div class="orbit-spinner">
        <div class="orbit"></div>
        <div class="orbit"></div>
        <div class="orbit"></div>
      </div>
      <p class="loading-text">正在加载个人空间...</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

onMounted(async () => {
  // 1. 在这里调用获取信息的接口
  await authStore.fetchUserInfoFromServer()
  
  // 2. 模拟一个 1.5 秒的延迟，让用户看一眼帅气的动画（可选）
  // 如果不想要人为延迟，可以删掉下面这行
  await new Promise(resolve => setTimeout(resolve, 1500))

  // 3. 执行你的角色分发逻辑
  const userInfo = authStore.userInfo
  if (userInfo) {
    switch (userInfo.role) {
      case 'user':
        router.push('/user')
        break
      case 'merchant':
        router.push('/merchant')
        break
      case 'admin':
        router.push('/admin')
        break
      default:
        router.push('/')
    }
  } else {
    router.push('/login')
  }
})
</script>

<style scoped>
.loading-wrapper {
  height: 100vh;
  width: 100vw;
  background: #090A0F; /* 匹配你的星空背景 */
  display: flex;
  justify-content: center;
  align-items: center;
  color: #409eff;
}

.loader-content {
  text-align: center;
}

.loading-text {
  margin-top: 20px;
  letter-spacing: 2px;
  font-size: 14px;
  animation: pulse 1.5s infinite;
}

/* 简单的科技感动画 */
.orbit-spinner {
  height: 60px;
  width: 60px;
  border-radius: 50%;
  perspective: 800px;
  margin: 0 auto;
}

.orbit {
  position: absolute;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.orbit:nth-child(1) {
  left: 0%; top: 0%;
  animation: orbit-rotate-one 1s linear infinite;
  border-bottom: 3px solid #5f91ff;
}

.orbit:nth-child(2) {
  right: 0%; top: 0%;
  animation: orbit-rotate-two 1s linear infinite;
  border-right: 3px solid #5f91ff;
}

.orbit:nth-child(3) {
  right: 0%; bottom: 0%;
  animation: orbit-rotate-three 1s linear infinite;
  border-top: 3px solid #5f91ff;
}

@keyframes orbit-rotate-one { 0% { transform: rotateX(35deg) rotateY(-45deg) rotateZ(0deg); } 100% { transform: rotateX(35deg) rotateY(-45deg) rotateZ(360deg); } }
@keyframes orbit-rotate-two { 0% { transform: rotateX(50deg) rotateY(10deg) rotateZ(0deg); } 100% { transform: rotateX(50deg) rotateY(10deg) rotateZ(360deg); } }
@keyframes orbit-rotate-three { 0% { transform: rotateX(35deg) rotateY(55deg) rotateZ(0deg); } 100% { transform: rotateX(35deg) rotateY(55deg) rotateZ(360deg); } }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
</style>