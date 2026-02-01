<template>
  <div class="login-wrapper">
    <div class="login-container" @mousemove="handleMouseMove">
      <div class="cursor-glow" :style="cursorStyle"></div>
      <div class="brand-title-container">
        <h1 class="meteor-text" data-text="METEOR">METEOR</h1>
        <div class="sub-text">ADVANCED SYSTEM TERMINAL</div>
      </div>
      <div class="stars" :style="{ transform: bgTransform }"></div>
        <div class="meteor-container">
          <div v-for="n in 8" :key="n" class="meteor"></div>
        </div>
      
        <div class="system-info">
          <div class="line">SYSTEM STATUS: <span class="active">ONLINE</span></div>
          <div class="line">ENCRYPTION: AES-256</div>
          <div class="line">LOCATION: 31.2304° N, 121.4737° E</div>
        </div>
      
        <div class="scan-line"></div>
      
      <el-card shadow="always" class="login-card">
        <div class="card-header">
          <div class="system-status">STATUS: {{ activeTab === 'login' ? 'STABLE' : 'STANDBY' }}</div>
          <h2 class="glitch-text" :data-text="activeTab === 'login' ? 'AUTH_REQUIRED' : 'INITIALIZING...'">
            {{ activeTab === 'login' ? 'AUTH_REQUIRED' : 'INITIALIZING...' }}
          </h2>
        </div>
        
        <div class="card-body">
          <transition name="fade" mode="out-in">
            <div v-if="activeTab === 'login'" key="login">
              <el-form :model="loginForm" label-position="top">
                <el-form-item label="用户名">
                  <el-input v-model="loginForm.username" placeholder="请输入用户名" :prefix-icon="User" @keyup.enter="handleLogin", class="neon-input"></el-input>
                </el-form-item>
                <el-form-item label="密码">
                  <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" :prefix-icon="Lock" show-password @keyup.enter="handleLogin" , class="neon-input"></el-input>
                </el-form-item>
                <div class="action-buttons">
                  <el-button type="primary" class="main-button breath-btn" :loading="loading" @click="handleLogin">立即登录</el-button>
                  <el-button link class="switch-button" @click="switchToRegister">没有账号？去注册</el-button>
                </div>
              </el-form>
            </div>
            
            <div v-else key="register">
              <el-form :model="registerForm" label-position="top">
                <el-form-item label="用户名">
                  <el-input v-model="registerForm.username" placeholder="设置用户名" :prefix-icon="User" , class="neon-input"></el-input>
                </el-form-item>
                <el-form-item label="密码">
                  <el-input v-model="registerForm.password" type="password" placeholder="设置密码" :prefix-icon="Lock" show-password , class="neon-input"></el-input>
                </el-form-item>
                <div class="action-buttons">
                  <el-button type="success" class="main-button breath-btn" :loading="loading" @click="handleRegister">提交注册</el-button>
                  <el-button link class="switch-button" @click="switchToLogin">已有账号？去登录</el-button>
                </div>
              </el-form>
            </div>
          </transition>
        </div>
      </el-card>


      <div class="user-portal" v-if="authStore.userInfo">
        <div class="id-scanner-tag">
          <div class="pulse-dot"></div>
          <span class="status-text">IDENTITY CONFIRMED:</span>
          <span class="name">{{ authStore.userInfo.username }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue' // 确保引入了 computed
import { useAuthStore } from '../stores/auth'
import http from '../request/http'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { User, Lock } from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()

// 1. 响应式坐标
const cursorPosition = ref({ x: 0, y: 0 })

// 2. 鼠标移动监听（只负责更新坐标）
const handleMouseMove = (e) => {
  cursorPosition.value = { x: e.clientX, y: e.clientY }
}

// 3. 计算属性：光标跟随样式（放在顶层）
const cursorStyle = computed(() => ({
  transform: `translate(${cursorPosition.value.x - 150}px, ${cursorPosition.value.y - 150}px)`
}))

// 4. 计算属性：星空视差偏移（放在顶层）
const bgTransform = computed(() => {
  const moveX = (cursorPosition.value.x - window.innerWidth / 2) / 50
  const moveY = (cursorPosition.value.y - window.innerHeight / 2) / 50
  return `translate(${moveX}px, ${moveY}px) scale(1.1)`
})

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
      ElMessage({
        message: '[SYSTEM] AUTH_SUCCESS: 正在接入终端...',
        type: 'success',
        plain: true // 开启纯净模式，方便样式覆盖
      })
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
.system-info {
  position: absolute;
  top: 40px;
  left: 40px;
  font-family: 'Courier New', Courier, monospace;
  color: rgba(88, 166, 255, 0.4);
  font-size: 12px;
  line-height: 1.8;
  z-index: 2;
  pointer-events: none; /* 防止遮挡点击 */
}
.system-info .active {
  color: #00ff88;
  text-shadow: 0 0 5px #00ff88;
}

/* --- 2. 背景激光扫描线 --- */
.scan-line {
  position: absolute;
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(88, 166, 255, 0.4), transparent);
  top: 0;
  z-index: 1;
  animation: scan 8s linear infinite;
}

@keyframes scan {
  0% { top: 0%; opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { top: 100%; opacity: 0; }
}

/* --- 3. 登录卡片背后的“光晕” --- */
/* 给现有的 login-card 增加一个伪元素作为背光 */
.login-card::before {
  content: "";
  position: absolute;
  top: -2px; left: -2px; right: -2px; bottom: -2px;
  background: linear-gradient(45deg, #1f4287, transparent, #58a6ff);
  z-index: -1;
  border-radius: 15px;
  opacity: 0.3;
}

/* --- 4. 底部欢迎语美化 --- */
.user-portal {
  position: absolute;
  bottom: 40px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 20px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 20px;
  border: 1px solid rgba(88, 166, 255, 0.2);
  backdrop-filter: blur(5px);
  color: #fff;
  font-size: 14px;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background: #00ff88;
  border-radius: 50%;
  box-shadow: 0 0 10px #00ff88;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.5); opacity: 0.5; }
  100% { transform: scale(1); opacity: 1; }
}

/* --- 5. 稍微调整一下原有卡片的边框颜色，呼应深蓝色 --- */
:deep(.el-input__wrapper) {
  background-color: rgba(13, 25, 48, 0.6) !important;
  border: 1px solid rgba(88, 166, 255, 0.3) !important;
}

:deep(.el-input__inner) {
  color: #58a6ff !important;
}

/* --- 标题容器布局 --- */
.brand-title-container {
  position: absolute;
  top: 12%; /* 放在卡片上方 */
  text-align: center;
  z-index: 5;
  pointer-events: none;
}

/* --- METEOR 大字基础样式 --- */
.meteor-text {
  position: relative;
  font-size: 80px; /* 足够大 */
  font-weight: 900;
  color: transparent;
  margin: 0;
  padding: 0;
  letter-spacing: 15px;
  /* 使用文本描边效果 */
  -webkit-text-stroke: 1px rgba(88, 166, 255, 0.6);
  font-family: 'Arial Black', sans-serif;
  text-transform: uppercase;
  /* 基础的外发光 */
  filter: drop-shadow(0 0 15px rgba(88, 166, 255, 0.4));
  animation: glow 3s ease-in-out infinite alternate;
}

/* --- 增强：副标题 --- */
.sub-text {
  font-size: 12px;
  color: #58a6ff;
  letter-spacing: 8px;
  opacity: 0.6;
  margin-top: -5px;
  text-indent: 8px;
}

/* --- 炫酷动画 1: 霓虹呼吸效果 --- */
@keyframes glow {
  from {
    filter: drop-shadow(0 0 5px rgba(88, 166, 255, 0.4));
    -webkit-text-stroke: 1px rgba(88, 166, 255, 0.4);
  }
  to {
    filter: drop-shadow(0 0 25px rgba(88, 166, 255, 0.8));
    -webkit-text-stroke: 1px rgba(173, 211, 255, 1);
  }
}

/* --- 炫酷动画 2: 伪元素制造故障闪烁 (Glitch Effect) --- */
.meteor-text::after {
  content: attr(data-text);
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  color: #58a6ff;
  opacity: 0.1;
  z-index: -1;
  animation: glitch 4s infinite;
}

@keyframes glitch {
  0% { transform: translate(0); }
  2% { transform: translate(-3px, 2px); opacity: 0.5; }
  4% { transform: translate(3px, -2px); opacity: 0.5; }
  6% { transform: translate(0); opacity: 0.1; }
  100% { transform: translate(0); }
}

/* 适配移动端或小屏幕 */
@media (max-height: 800px) {
  .meteor-text { font-size: 60px; }
  .brand-title-container { top: 8%; }
}

:deep(.neon-input .el-input__wrapper) {
  background-color: rgba(10, 20, 40, 0.6) !important;
  border: 1px solid rgba(88, 166, 255, 0.2) !important;
  box-shadow: none !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.neon-input .el-input__wrapper.is-focus) {
  box-shadow: 0 0 12px rgba(88, 166, 255, 0.4) !important;
  border-color: rgba(88, 166, 255, 0.8) !important;
  background-color: rgba(20, 40, 80, 0.8) !important;
}

:deep(.el-input__inner) {
  caret-color: #58a6ff; /* 蓝色光标 */
}

:deep(.neon-input .el-input__wrapper.is-focus .el-input__prefix-icon) {
  color: #58a6ff !important;
  filter: drop-shadow(0 0 5px #58a6ff);
  transform: scale(1.1);
}

/* --- 按钮基础样式重塑 --- */
.breath-btn {
  position: relative;
  border: 1px solid rgba(88, 166, 255, 0.4) !important;
  background: linear-gradient(180deg, rgba(30, 60, 120, 0.6) 0%, rgba(10, 20, 40, 0.8) 100%) !important;
  overflow: hidden;
  transition: all 0.5s ease;
  color: #fff;
  letter-spacing: 2px;
  text-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
}

/* --- 呼吸动画：通过改变内阴影的扩散半径 --- */
.breath-btn {
  animation: button-breath 3s infinite alternate ease-in-out;
}

@keyframes button-breath {
  0% {
    /* 初始状态：淡淡的内光 */
    box-shadow: 
      inset 0 0 10px rgba(88, 166, 255, 0.2),
      0 0 5px rgba(88, 166, 255, 0.1);
    border-color: rgba(88, 166, 255, 0.3);
  }
  100% {
    /* 呼吸顶点：强烈的内流光 + 轻微外扩（不改变尺寸） */
    box-shadow: 
      inset 0 0 25px rgba(88, 166, 255, 0.6),
      0 0 15px rgba(88, 166, 255, 0.3);
    border-color: rgba(173, 211, 255, 0.8);
    background: rgba(40, 80, 160, 0.6) !important;
  }
}

/* --- 鼠标悬停：瞬间过载激发 --- */
.breath-btn:hover {
  animation: none; /* 悬停时停止呼吸，切换到稳定高亮 */
  background: #409eff !important;
  box-shadow: 
    inset 0 0 40px rgba(255, 255, 255, 0.4),
    0 0 25px rgba(64, 158, 255, 0.6) !important;
  transform: translateY(-1px); /* 极其轻微的悬浮感，不产生滚动条 */
}

/* --- 点击时的反馈 --- */
.breath-btn:active {
  transform: translateY(1px) scale(0.98);
  filter: brightness(1.2);
}

.breath-btn::before {
  content: "";
  position: absolute;
  top: -50%;
  left: -150%;
  width: 50%;
  height: 200%;
  background: linear-gradient(
    to right,
    transparent,
    rgba(255, 255, 255, 0.15),
    transparent
  );
  transform: rotate(45deg);
  animation: sweep 4s infinite;
}

@keyframes sweep {
  0% { left: -150%; }
  30%, 100% { left: 250%; }
}

/* --- User 模块外层容器 --- */
.user-portal {
  position: absolute;
  bottom: 40px;
  z-index: 10;
}

/* --- ID 标签样式：绿色科技感 --- */
.id-scanner-tag {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 20px;
  background: rgba(0, 40, 20, 0.4) !important; /* 深绿背景 */
  border: 1px solid rgba(0, 255, 136, 0.3) !important;
  border-radius: 4px;
  color: #00ff88; /* 经典的黑客绿 */
  font-family: 'Courier New', Courier, monospace;
  font-size: 13px;
  letter-spacing: 1px;
  
  /* 基础内阴影 */
  box-shadow: inset 0 0 10px rgba(0, 255, 136, 0.1);
  
  /* 核心：绿色呼吸动画 */
  animation: id-breath 3s infinite alternate ease-in-out;
  backdrop-filter: blur(5px);
}

.status-text {
  opacity: 0.7;
}

.name {
  font-weight: bold;
  text-shadow: 0 0 8px rgba(0, 255, 136, 0.6);
}

/* --- 绿光呼吸动画 --- */
@keyframes id-breath {
  0% {
    box-shadow: 
      inset 0 0 5px rgba(0, 255, 136, 0.2),
      0 0 5px rgba(0, 255, 136, 0.1);
    border-color: rgba(0, 255, 136, 0.2);
  }
  100% {
    box-shadow: 
      inset 0 0 15px rgba(0, 255, 136, 0.4),
      0 0 12px rgba(0, 255, 136, 0.2);
    border-color: rgba(0, 255, 136, 0.6);
  }
}

/* --- 保持那个绿色小圆点 --- */
.pulse-dot {
  width: 6px;
  height: 6px;
  background: #00ff88;
  border-radius: 50%;
  box-shadow: 0 0 10px #00ff88;
  animation: dot-pulse 1.5s infinite;
}

@keyframes dot-pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.4); opacity: 0.6; }
  100% { transform: scale(1); opacity: 1; }
}

.cursor-glow {
  position: fixed;
  top: 0;
  left: 0;
  width: 300px;  /* 扩散半径 */
  height: 300px;
  background: radial-gradient(
    circle,
    rgba(88, 166, 255, 0.15) 0%,
    rgba(88, 166, 255, 0.05) 40%,
    transparent 70%
  );
  border-radius: 50%;
  pointer-events: none; /* 关键：不干扰鼠标点击 */
  z-index: 100; /* 位于星空之上，卡片之下 */
  transition: transform 0.1s ease-out; /* 增加一点延迟感，更像引力场 */
  mix-blend-mode: screen; /* 混合模式：让它只点亮背景，不遮挡内容 */
}

/* 进阶互动：当鼠标移入卡片区域时，光晕可以稍微缩小或改变颜色 */
.login-card:hover ~ .cursor-glow {
  background: radial-gradient(
    circle,
    rgba(0, 255, 136, 0.1) 0%,
    transparent 70%
  );
}

.card-header h2 {
  font-family: 'Consolas', monospace;
  color: #58a6ff;
  text-transform: uppercase;
  letter-spacing: 4px;
  position: relative;
  text-shadow: 0 0 10px rgba(88, 166, 255, 0.7);
}

/* 增加一个小状态灯 */
.system-status {
  font-size: 10px;
  color: #00ff88;
  margin-bottom: 5px;
  font-family: 'Courier New', Courier, monospace;
}

.system-status::before {
  content: "";
  display: inline-block;
  width: 8px;
  height: 8px;
  background: #00ff88;
  border-radius: 50%;
  margin-right: 8px;
  box-shadow: 0 0 8px #00ff88;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.3; }
  100% { opacity: 1; }
}
</style>