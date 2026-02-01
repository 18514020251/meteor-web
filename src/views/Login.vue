<template>
  <div class="login-wrapper">
    <div class="login-container">
      <div class="stars"></div>
      <div class="meteor-container">
        <div v-for="n in 8" :key="n" class="meteor"></div>
      </div>
      
      <el-card shadow="always" class="login-card">
        <div class="card-header">
          <h2>{{ activeTab === 'login' ? '欢迎回来' : '创建账号' }}</h2>
        </div>
        
        <div class="card-body">
          <transition name="fade" mode="out-in">
            <div v-if="activeTab === 'login'" key="login">
              <el-form :model="loginForm" label-position="top">
                <el-form-item label="用户名">
                  <el-input v-model="loginForm.username" placeholder="请输入用户名" :prefix-icon="User" @keyup.enter="handleLogin"></el-input>
                </el-form-item>
                <el-form-item label="密码">
                  <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" :prefix-icon="Lock" show-password @keyup.enter="handleLogin"></el-input>
                </el-form-item>
                <div class="action-buttons">
                  <el-button type="primary" class="main-button" :loading="loading" @click="handleLogin">立即登录</el-button>
                  <el-button link class="switch-button" @click="switchToRegister">没有账号？去注册</el-button>
                </div>
              </el-form>
            </div>
            
            <div v-else key="register">
              <el-form :model="registerForm" label-position="top">
                <el-form-item label="用户名">
                  <el-input v-model="registerForm.username" placeholder="设置用户名" :prefix-icon="User"></el-input>
                </el-form-item>
                <el-form-item label="密码">
                  <el-input v-model="registerForm.password" type="password" placeholder="设置密码" :prefix-icon="Lock" show-password></el-input>
                </el-form-item>
                <div class="action-buttons">
                  <el-button type="success" class="main-button" :loading="loading" @click="handleRegister">提交注册</el-button>
                  <el-button link class="switch-button" @click="switchToLogin">已有账号？去登录</el-button>
                </div>
              </el-form>
            </div>
          </transition>
        </div>
      </el-card>

      <div class="user-portal" v-if="authStore.userInfo" style="position: absolute; bottom: 20px; color: white;">
        欢迎回来: <span class="name">{{ authStore.userInfo.username }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useAuthStore } from '../stores/auth'
import http from '../request/http'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { User, Lock } from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()
const activeTab = ref('login')
const loading = ref(false)

const loginForm = reactive({ username: '', password: '' })
const registerForm = reactive({ username: '', password: '' })

const validateForm = (form) => {
  if (!form.username?.trim()) { ElMessage.warning('用户名不能为空'); return false }
  if (!form.password || form.password.length < 6) { ElMessage.warning('密码不少于6位'); return false }
  return true
}

const handleLogin = () => {
  if (!validateForm(loginForm)) return 
  loading.value = true
  
  http.post('/user/login', loginForm)
    .then(async token => {
      authStore.setToken(token) 
      // 登录成功直接去加载页，不在这里做判断
      ElMessage.success('登录成功，正在进入系统...')
      router.push('/loading') 
    })
    .finally(() => loading.value = false)
}

const handleRegister = () => {
  if (!validateForm(registerForm)) return 
  loading.value = true
  http.post('/user/register', registerForm)
    .then(() => {
      ElMessage.success('注册成功')
      activeTab.value = 'login'
    })
    .finally(() => loading.value = false)
}

const switchToRegister = () => { activeTab.value = 'register' }
const switchToLogin = () => { activeTab.value = 'login' }
</script>
<style>
html, body {
  margin: 0; padding: 0;
  width: 100%; height: 100%;
  overflow: hidden;
}
</style>

<style scoped>
.login-wrapper {
  width: 100vw; height: 100vh;
  overflow: hidden;
}

.login-container {
  position: relative;
  width: 100%; height: 100%;
  display: flex; justify-content: center; align-items: center;
  background: radial-gradient(ellipse at bottom, #1B2735 0%, #090A0F 100%);
}

.stars {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: transparent url('https://s3-us-west-2.amazonaws.com/s.cdpn.io/123163/stars.png') repeat;
  opacity: 0.5;
  z-index: 0;
}

/* --- 增强版流星样式 --- */
.meteor-container {
  position: absolute;
  width: 100%; height: 100%;
  transform: rotateZ(35deg); /* 稍微调整角度 */
  z-index: 1;
}

.meteor {
  position: absolute;
  height: 2px;
  background: linear-gradient(-45deg, #5f91ff, rgba(0, 0, 255, 0));
  filter: drop-shadow(0 0 6px #699bff);
  opacity: 0;
  /* 使用 cubic-bezier 让动画更有加速冲刺感 */
  animation: tail 4000ms cubic-bezier(0.175, 0.885, 0.32, 1) infinite, 
             shooting 4000ms cubic-bezier(0.175, 0.885, 0.32, 1) infinite;
}

/* 随机性配置 */
.meteor:nth-child(1) { top: 10%; left: 10%; animation-duration: 3500ms; animation-delay: 0s; }
.meteor:nth-child(2) { top: 30%; left: 60%; animation-duration: 4500ms; animation-delay: 1.2s; opacity: 0.7; }
.meteor:nth-child(3) { top: 50%; left: 20%; animation-duration: 4000ms; animation-delay: 2.5s; }
.meteor:nth-child(4) { top: 15%; left: 85%; animation-duration: 5000ms; animation-delay: 4s; opacity: 0.4; }
.meteor:nth-child(5) { top: 75%; left: 45%; animation-duration: 3000ms; animation-delay: 1s; }
.meteor:nth-child(6) { top: 45%; left: 95%; animation-duration: 4200ms; animation-delay: 5.5s; }
.meteor:nth-child(7) { top: 5%; left: 40%; animation-duration: 3800ms; animation-delay: 3s; opacity: 0.6; }
.meteor:nth-child(8) { top: 85%; left: 70%; animation-duration: 4800ms; animation-delay: 2s; }

@keyframes tail {
  0% { width: 0; }
  20% { width: 140px; }
  100% { width: 0; }
}

@keyframes shooting {
  0% { transform: translateX(0); opacity: 0; }
  5% { opacity: 1; }
  30% { transform: translateX(580px); opacity: 0; } /* 划过的距离变长 */
  100% { transform: translateX(600px); opacity: 0; }
}

/* --- 卡片样式保持不变 --- */
.login-card {
  position: relative; z-index: 10;
  width: 420px; border: none; border-radius: 15px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  color: #fff;
}

.card-header { text-align: center; margin-bottom: 20px; }
.card-header h2 { margin: 0; font-weight: 300; letter-spacing: 2px; color: #fff; }

:deep(.el-input__prefix-inner) { font-size: 18px; color: rgba(255, 255, 255, 0.7) !important; }
:deep(.el-form-item__label) { color: rgba(255, 255, 255, 0.8) !important; }
:deep(.el-input__wrapper) { background-color: rgba(255, 255, 255, 0.1) !important; box-shadow: none !important; border: 1px solid rgba(255, 255, 255, 0.2); }
:deep(.el-input__inner) { color: #fff !important; }

.action-buttons { display: flex; flex-direction: column; gap: 10px; margin-top: 20px; }
.main-button { width: 100%; height: 45px; font-size: 16px; border-radius: 8px; }
.switch-button { color: rgba(255, 255, 255, 0.6); font-size: 13px; }
.switch-button:hover { color: #409eff; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>