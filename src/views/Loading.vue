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

const goByRole = () => {
  if (authStore.role === 'admin') return router.replace('/admin')
  if (authStore.role === 'merchant') return router.replace('/merchant')
  return router.replace('/user')
}

onMounted(async () => {
  // 没 token 直接回登录
  if (!authStore.token) {
    return router.replace('/login')
  }

  // 你想要的：动画展示 1.5s
  await new Promise(resolve => setTimeout(resolve, 1500))

  // 恢复你想要的：动画结束后调 /user/info（用于展示 username/avatar 等）
  // 注意：这一步失败不影响分发，最多不显示头像昵称
  try {
    await authStore.fetchUserInfoFromServer()
  } catch (e) {
    // store 里已经处理了 logout，这里不额外折腾
  }

  // 最关键：按 needOnboarding 分发
  if (authStore.needOnboarding) {
    return router.replace('/onboarding')
  }

  return goByRole()
})
</script>

<style scoped>
.loading-wrapper {
  height: 100vh;
  width: 100vw;
  background: #090A0F;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #409eff;
}
.loader-content { text-align: center; }
.loading-text {
  margin-top: 20px;
  letter-spacing: 2px;
  font-size: 14px;
  animation: pulse 1.5s infinite;
}
.orbit-spinner {
  height: 60px;
  width: 60px;
  border-radius: 50%;
  perspective: 800px;
  margin: 0 auto;
  position: relative;
}
.orbit {
  position: absolute;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  border-radius: 50%;
}
.orbit:nth-child(1) { left: 0%; top: 0%; animation: orbit-rotate-one 1s linear infinite; border-bottom: 3px solid #5f91ff; }
.orbit:nth-child(2) { right: 0%; top: 0%; animation: orbit-rotate-two 1s linear infinite; border-right: 3px solid #5f91ff; }
.orbit:nth-child(3) { right: 0%; bottom: 0%; animation: orbit-rotate-three 1s linear infinite; border-top: 3px solid #5f91ff; }
@keyframes orbit-rotate-one { 0% { transform: rotateX(35deg) rotateY(-45deg) rotateZ(0deg); } 100% { transform: rotateX(35deg) rotateY(-45deg) rotateZ(360deg); } }
@keyframes orbit-rotate-two { 0% { transform: rotateX(50deg) rotateY(10deg) rotateZ(0deg); } 100% { transform: rotateX(50deg) rotateY(10deg) rotateZ(360deg); } }
@keyframes orbit-rotate-three { 0% { transform: rotateX(35deg) rotateY(55deg) rotateZ(0deg); } 100% { transform: rotateX(35deg) rotateY(55deg) rotateZ(360deg); } }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
</style>
