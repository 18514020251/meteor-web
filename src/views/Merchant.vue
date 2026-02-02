<template>
  <div class="merchant-wrapper">
    <div class="stars"></div>
    <div class="meteor-container">
      <div v-for="n in 6" :key="n" class="meteor"></div>
    </div>

    <div class="login-container">
      <header class="glass-nav">
        <div v-if="userData" class="nav-content">
          <div class="brand">METEOR <span class="sub">MERCHANT</span></div>

          <div class="user-portal">
            <div class="user-text">
              <span class="name">{{ userData.username }}</span>
              <span class="role">商家中心 | UID: {{ userData.userId || '000' }}</span>
              <span class="phone" v-if="hasPhone">{{ maskedPhone }}</span>
              <span class="phone phone-missing" v-else @click="showProfilePanel = true">
                未绑定手机号（点我去绑）
              </span>
            </div>
            
            <el-avatar
              :size="42"
              :src="userData.avatar"
              class="avatar-glow clickable"
              @click="showProfilePanel = true"
            />

            <el-button link class="exit-btn" :icon="SwitchButton" @click="handleLogout"></el-button>
          </div>
        </div>
      </header>

      <main class="content-body">
        <div class="welcome-section fade-in-item" style="--delay: 1">
          <h1 class="merchant-title">MERCHANT PORTAL</h1>
          <p class="merchant-subtitle">商家工作台 - 欢迎回来，{{ userData?.username }}</p>
          <div class="glass-placeholder">
            <el-empty description="工作台模块开发中..." :image-size="200" />
          </div>
        </div>
      </main>
    </div>

    <transition name="slide-right">
      <div v-if="showProfilePanel" class="profile-panel-overlay" @click.self="showProfilePanel = false">
        <div class="profile-glass-panel">
          <div class="panel-header">
            <h3>个人中心</h3>
            <el-icon class="close-icon" @click="showProfilePanel = false"><Close /></el-icon>
          </div>

          <div class="profile-content">
            <div class="avatar-edit-section">
              <el-image 
                class="avatar-glow preview-avatar"
                :src="userData.avatar" 
                :preview-src-list="[userData.avatar]"
                :preview-teleported="true" :hide-on-click-modal="true" fit="cover"
              />
              <p class="uid-tag">ID: {{ userData.userId }}</p>
              <el-upload :show-file-list="false" :before-upload="beforeAvatarUpload" :http-request="uploadAvatar">
                <el-button size="small" type="primary" plain class="purple-btn-plain">修改头像</el-button>
              </el-upload>
            </div>

            <el-form label-position="top" class="custom-form">
              <el-form-item label="用户名" class="fade-in-item" style="--delay: 1">
                <el-input v-model="profileForm.username" :prefix-icon="User" />
              </el-form-item>

              <el-form-item label="手机号" class="fade-in-item" style="--delay: 2">
                <el-input v-model="profileForm.phone" :prefix-icon="Iphone" />
              </el-form-item>

              <el-form-item label="验证码" class="fade-in-item" style="--delay: 3">
                <div class="code-input-group">
                  <el-input v-model="profileForm.code" placeholder="输入验证码" :prefix-icon="Lock" />
                  <el-button class="get-code-btn" :disabled="countdown > 0" @click="sendCode">
                    {{ countdown > 0 ? countdown + 's' : '获取' }}
                  </el-button>
                </div>
              </el-form-item>

              <el-button type="primary" class="save-btn fade-in-item" style="--delay: 4" @click="handleUpdate">
                保存资料
              </el-button>
            </el-form>
          </div>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="showLogoutConfirm" class="logout-overlay">
        <div class="logout-glass-card">
          <div class="logout-icon"><el-icon><Warning /></el-icon></div>
          <h3>确认退出商家端？</h3>
          <p style="color: rgba(255,255,255,0.6); font-size: 14px; margin-bottom: 20px;">退出后需重新登录</p>
          <div class="logout-actions">
            <button class="btn-cancel" @click="showLogoutConfirm = false">取消</button>
            <button class="btn-confirm" @click="confirmLogout">确认</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watchEffect, onBeforeUnmount } from 'vue'
import { SwitchButton, Warning, Close, User, Iphone, Lock } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { storeToRefs } from 'pinia'
import http from '../request/http'

/** ========== 基础逻辑 (与用户端保持一致) ========== */
const router = useRouter()
const authStore = useAuthStore()
const { userInfo: userData } = storeToRefs(authStore)

const hasPhone = computed(() => {
  const p = userData.value?.phone
  return !!(p && String(p).trim())
})

const maskedPhone = computed(() => {
  const p = String(userData.value?.phone || '')
  if (!p) return ''
  return p.length >= 7 ? `${p.slice(0, 3)}****${p.slice(-4)}` : p
})

const showLogoutConfirm = ref(false)
const showProfilePanel = ref(false)
const countdown = ref(0)
let countdownTimer = null

const profileForm = reactive({
  username: '',
  phone: '',
  code: ''
})

watchEffect(() => {
  if (!userData.value) return
  profileForm.username = userData.value.username || ''
  profileForm.phone = userData.value.phone || ''
})

/** ========== 业务接口 (与用户端保持一致) ========== */
const sendCode = async () => {
  if (countdown.value > 0) return
  const phone = String(profileForm.phone || '').trim()
  const phoneReg = /^1[3-9]\d{9}$/
  if (!phone || !phoneReg.test(phone)) return ElMessage.warning('请输入正确的手机号')

  try {
    await http.post('/user/phone/code', { phone, scene: 'BIND_PHONE' })
    ElMessage.success('验证码已发送')
    startCountdown()
  } catch (e) {}
}

const uploadAvatar = async ({ file }) => {
  try {
    const formData = new FormData()
    formData.append('file', file)
    await http.put('/user/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    ElMessage.success('头像更新成功')
    await authStore.fetchUserInfoFromServer()
  } catch (e) {}
}

const handleUpdate = async () => {
  const oldUsername = String(userData.value?.username || '').trim()
  const oldPhone = String(userData.value?.phone || '').trim()
  const newUsername = String(profileForm.username || '').trim()
  const newPhone = String(profileForm.phone || '').trim()
  
  if (newUsername === oldUsername && newPhone === oldPhone) return ElMessage.info('没有修改内容')
  
  const payload = {}
  if (newUsername !== oldUsername) payload.username = newUsername
  if (newPhone !== oldPhone) {
    if (!profileForm.code) return ElMessage.warning('请输入验证码')
    payload.phone = newPhone
    payload.phoneCode = profileForm.code
  }

  try {
    await http.put('/user/profile', payload)
    ElMessage.success('资料更新成功')
    await authStore.fetchUserInfoFromServer()
    showProfilePanel.value = false
  } catch (e) {}
}

const handleLogout = () => showLogoutConfirm.value = true
const confirmLogout = () => {
  authStore.logout()
  router.push('/login')
}

// 倒计时辅助
const startCountdown = () => {
  countdown.value = 60
  countdownTimer = setInterval(() => {
    if (--countdown.value <= 0) clearInterval(countdownTimer)
  }, 1000)
}
onBeforeUnmount(() => clearInterval(countdownTimer))

const beforeAvatarUpload = (file) => {
  const isImg = file.type.startsWith('image/') && file.size / 1024 / 1024 <= 5
  if (!isImg) ElMessage.warning('请上传5MB以内的图片')
  return isImg
}
</script>

<style scoped>
/* ================== 1. 布局与背景 ================== */
.user-wrapper { width: 100vw; height: 100vh; overflow: hidden; position: relative; }
.login-container { width: 100%; height: 100%; background: radial-gradient(ellipse at bottom, #1B2735 0%, #090A0F 100%); overflow-y: auto; }
.stars { position: fixed; inset: 0; background: url('https://s3-us-west-2.amazonaws.com/s.cdpn.io/123163/stars.png'); opacity: 0.4; pointer-events: none; }

/* 导航栏 */
.glass-nav { position: sticky; top: 0; z-index: 100; height: 70px; background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(15px); border-bottom: 1px solid rgba(255, 255, 255, 0.1); display: flex; align-items: center; }
.nav-content { width: 1300px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; padding: 0 20px; }
.brand { color: #fff; font-size: 22px; font-weight: bold; letter-spacing: 2px; }
.sub { font-size: 12px; color: #409eff; }
.user-portal { display: flex; align-items: center; gap: 15px; }
.user-text { display: flex; flex-direction: column; text-align: right; color: #fff; }
.name { font-size: 14px; }
.role { font-size: 11px; color: rgba(255,255,255,0.5); }
.avatar-glow { border: 2px solid #409eff; box-shadow: 0 0 10px rgba(64, 158, 255, 0.5); cursor: pointer; transition: 0.3s; }
.avatar-glow:hover { transform: scale(1.05); }
.exit-btn { color: #fff; font-size: 20px; }
.exit-btn:hover { color: #f56c6c; }

/* ================== 2. 电影卡片 ================== */
.content-body { max-width: 1300px; margin: 30px auto; padding: 0 20px; }
.movie-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 20px; }

.glass-card {
  position: relative;
  border-radius: 12px;
  overflow: hidden; /* 裁剪超出边框的流光 */
  padding: 2px;    /* 这里的 padding 就是流光边框的粗细 */
  background: rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  display: flex;
}

.glass-card::before {
  content: "";
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  /* 锥形渐变，你可以修改颜色 #409eff 为你喜欢的颜色 */
  background: conic-gradient(
    transparent, 
    #409eff, 
    transparent 30%
  );
  animation: rotate-stream 3s linear infinite;
  opacity: 0;
  transition: opacity 0.4s;
  z-index: 0;
}
.glass-card:hover::before { opacity: 1; }
.glass-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 0 20px rgba(64, 158, 255, 0.4);
}
.poster-box, .info-box {
  position: relative;
  z-index: 2;
}
.poster-box { height: 240px; overflow: hidden; position: relative; }
.poster-box img { width: 100%; height: 100%; object-fit: cover; }

.badge {
  position: absolute; top: 10px; right: 10px;
  background: #f56c6c; color: #fff; font-size: 10px; padding: 3px 8px; border-radius: 4px;
  z-index: 10; box-shadow: 0 2px 10px rgba(245, 108, 108, 0.4);
}
.info-box { padding: 12px; background: #161b22; }
.info-box h4 { margin: 0; color: #fff; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.info-box p { color: rgba(255,255,255,0.5); font-size: 11px; margin: 5px 0 12px; }
.footer-action { display: flex; justify-content: space-between; align-items: center; }
.score { color: #ff9900; font-weight: bold; font-size: 13px; }

/* ================== 3. 退出弹窗 (补全样式) ================== */
.logout-overlay {
  position: fixed; inset: 0; background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(10px); display: flex; align-items: center;
  justify-content: center; z-index: 3000; /* 绝对最高层 */
}
.logout-glass-card {
  background: rgba(30, 35, 45, 0.9); border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 40px; border-radius: 24px; text-align: center; width: 340px;
  box-shadow: 0 25px 50px rgba(0,0,0,0.5);
}
.logout-icon { font-size: 50px; color: #f56c6c; margin-bottom: 15px; }
.logout-glass-card h3 { color: #fff; margin: 0 0 10px 0; }
.logout-actions { display: flex; gap: 15px; margin-top: 25px; }
.btn-cancel, .btn-confirm {
  flex: 1; padding: 12px; border-radius: 10px; border: none; cursor: pointer; transition: 0.3s; font-weight: bold;
}
.btn-cancel { background: rgba(255,255,255,0.08); color: #fff; }
.btn-cancel:hover { background: rgba(255,255,255,0.15); }
.btn-confirm { background: #f56c6c; color: #fff; }
.btn-confirm:hover { background: #ff4d4d; transform: scale(1.05); }

/* ================== 4. 个人面板与侧边栏 ================== */
.profile-panel-overlay {
  position: fixed; inset: 0; background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px); z-index: 2000; display: flex; justify-content: flex-end;
}
.profile-glass-panel {
  width: 360px; height: 100%; background: rgba(15, 20, 30, 0.95);
  border-left: 1px solid rgba(64, 158, 255, 0.3); padding: 40px 25px;
}
.panel-header { display: flex; justify-content: space-between; color: #fff; margin-bottom: 30px; }
.close-icon { cursor: pointer; font-size: 20px; }
.code-input-group {
  display: flex;
  gap: 12px;
}
.code-input-group .el-button {
  background: rgba(64, 158, 255, 0.1);
  border: 1px solid rgba(64, 158, 255, 0.4);
  color: #409eff;
  border-radius: 8px;
  transition: 0.3s;
}
.code-input-group .el-button:hover:not(:disabled) {
  background: #409eff;
  color: #fff;
  box-shadow: 0 0 15px rgba(64, 158, 255, 0.5);
}
.save-btn {
  width: 100%;
  height: 45px;
  margin-top: 30px;
  background: linear-gradient(90deg, #1e3c72 0%, #2a5298 100%); /* 经典深海蓝渐变 */
  border: none;
  font-weight: bold;
  letter-spacing: 4px;
  box-shadow: 0 4px 15px rgba(30, 60, 114, 0.4);
  transition: 0.4s;
}

.save-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(64, 158, 255, 0.6);
  filter: brightness(1.2);
}
:deep(.el-form-item) {
  margin-bottom: 25px;
}

.glass-section { background: rgba(255, 255, 255, 0.04); backdrop-filter: blur(10px); border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1); padding: 20px; margin-bottom: 25px; }
.section-title { color: #fff; display: flex; align-items: center; gap: 8px; margin-bottom: 15px; }
.rank-item { display: flex; align-items: center; gap: 10px; margin-bottom: 15px; color: #fff; font-size: 13px; }
.rank-num { width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.1); border-radius: 4px; }
.top-1 { background: #f56c6c; }
.top-2 { background: #e6a23c; }
.top-3 { background: #409eff; }
.quick-status { display: flex; gap: 15px; margin-top: 20px; }
.status-card { flex: 1; background: rgba(255,255,255,0.05); padding: 12px; border-radius: 10px; text-align: center; }
.status-card p { font-size: 11px; color: #aaa; margin: 0; }
.status-card h3 { color: #fff; margin: 5px 0 0; }
.status-card h3.warn { color: #f56c6c; }

/* 动画定义 */
@keyframes rotate-stream {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes shooting { 0% { transform: translate(0,0); opacity: 0; } 10% { opacity: 1; } 100% { transform: translate(400px, 400px); opacity: 0; } }

.meteor { position: absolute; top: -50px; width: 2px; height: 50px; background: linear-gradient(to bottom, #409eff, transparent); animation: shooting 3s infinite linear; opacity: 0; }
.meteor:nth-child(1) { left: 10%; animation-delay: 0s; }
.meteor:nth-child(2) { left: 30%; animation-delay: 1s; }
.meteor:nth-child(3) { left: 50%; animation-delay: 2s; }

.slide-right-enter-active, .slide-right-leave-active { transition: all 0.4s ease; }
.slide-right-enter-from, .slide-right-leave-to { transform: translateX(100%); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
/* ================== 完美的斜向流星 ================== */
.meteor-container {
  position: fixed;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.meteor {
  position: absolute;
  /* 调整为长条状，宽度代表流星长度 */
  width: 150px; 
  height: 2px; 
  /* 这里的旋转角度需要和下面动画的位移角度一致，35度通常视觉效果最好 */
  transform: rotate(-35deg); 
  background: linear-gradient(to right, rgba(64, 158, 255, 0.8), transparent);
  animation: diagonal-fly 2s infinite linear;
  opacity: 0;
  filter: drop-shadow(0 0 5px #409eff);
}

/* 随机分布流星的起始位置（主要在顶部和右侧） */
.meteor:nth-child(1) { top: -10%; right: 10%; animation-delay: 0s; }
.meteor:nth-child(2) { top: 10%; right: -5%; animation-delay: 1s; }
.meteor:nth-child(3) { top: 30%; right: 20%; animation-delay: 2.5s; }
.meteor:nth-child(4) { top: -5%; right: 40%; animation-delay: 1.5s; }
.meteor:nth-child(5) { top: 20%; right: 50%; animation-delay: 0.5s; }
.meteor:nth-child(6) { top: 40%; right: -10%; animation-delay: 2s; }

/* 斜向飞行核心动画 */
@keyframes diagonal-fly {
  0% {
    /* 初始状态：在屏幕外，右上角 */
    transform: translate(200px, -200px) rotate(-35deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 0.5;
  }
  100% {
    /* 结束状态：向左下方大幅度位移 */
    transform: translate(-120vw, 120vh) rotate(-35deg);
    opacity: 0;
  }
}

.phone {
  font-size: 11px;
  color: rgba(255,255,255,0.7);
  margin-top: 4px;
}

.phone-missing {
  color: #e6a23c;
  cursor: pointer;
  text-decoration: underline;
}
.clickable { cursor: pointer; }

.avatar-uploader { margin-top: 12px; }

.avatar-change-btn {
  width: 100%;
}
.card-inner {
  position: relative;
  z-index: 1;
  width: 100%;
  background: #161b22; /* 必须和背景色一致，或使用深色 */
  border-radius: 10px; /* 比外层稍微小一点点 */
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
/* 让预览用的图片保持圆形并有光效 */
.preview-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%; 
  border: 2px solid #409eff;
  box-shadow: 0 0 15px rgba(64, 158, 255, 0.5);
  cursor: zoom-in;
  transition: 0.3s;
  overflow: hidden; /* 确保图片缩放时不会超出圆角范围 */
}
.preview-avatar :deep(img) {
  border-radius: 50%;
}

.preview-avatar:hover {
  transform: scale(1.05);
  box-shadow: 0 0 25px rgba(64, 158, 255, 0.8);
}

/* 覆盖 Element Plus 预览层的背景（可选，为了统一你的暗黑风格） */
:deep(.el-image-viewer__mask) {
  background: rgba(0, 0, 0, 0.8) !important;
  backdrop-filter: blur(10px);
}

.custom-form {
  margin-top: 30px;
  padding: 0 5px;
}

/* 标签文字优化：改为深青蓝色，带一点科技感 */
:deep(.el-form-item__label) {
  color: #70c0ff !important; /* 淡青蓝 */
  font-weight: 500;
  letter-spacing: 1.5px;
  font-size: 13px;
  margin-bottom: 8px !important;
  text-transform: uppercase; /* 大写字母更像 UI 界面 */
}

/* --- 文本框重塑 --- */
:deep(.el-input__wrapper) {
  background-color: rgba(10, 25, 47, 0.6) !important; /* 深海蓝透明底 */
  box-shadow: 0 0 0 1px rgba(64, 158, 255, 0.2) inset !important; /* 微弱边框 */
  border-radius: 8px;
  padding: 5px 12px;
  transition: all 0.3s ease;
}

/* 文本框聚焦时的呼吸光效 */
:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #409eff inset, 0 0 12px rgba(64, 158, 255, 0.4) !important;
  background-color: rgba(10, 25, 47, 0.8) !important;
}

/* 输入框文字颜色 */
:deep(.el-input__inner) {
  color: #ffffff !important;
  font-family: 'Inter', sans-serif;
}

/* 占位符颜色 */
:deep(.el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.3);
}

/* 定义入场动画 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px); /* 从下方20像素处开始 */
    filter: blur(5px); /* 增加一点模糊感，更有科技味 */
  }
  to {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
}

/* 应用于每一项 */
.fade-in-item {
  opacity: 0; /* 初始隐藏 */
  animation: fadeInUp 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards;
  /* 使用我们在 HTML 中定义的 --delay 变量 */
  animation-delay: calc(var(--delay) * 0.3s); 
}

/* 强制覆盖 Element Plus 默认的 margin，确保间距美观 */
:deep(.el-form-item) {
  margin-bottom: 22px !important;
}
</style>