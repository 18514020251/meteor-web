<template>
  <div class="user-wrapper">
    <div class="login-container">
      <div class="stars"></div>
      <div class="meteor-container">
        <div v-for="n in 6" :key="n" class="meteor"></div>
      </div>

      <header class="glass-nav">
        <div v-if="userData" class="nav-content">
          <div class="brand">METEOR <span class="sub">CINEMA</span></div>

          <div class="user-portal">
            <div class="user-text">
              <span class="name">{{ userData.username }}</span>
              <span class="role">UID: {{ userData.userId || '000' }}</span>
                <span class="phone" v-if="hasPhone">
                  {{ maskedPhone }}
                </span>
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
        <el-row :gutter="25">
          <el-col :md="17">
            <div class="glass-section">
              <div class="section-title">
                <el-icon><VideoCamera /></el-icon> 正在热映 / 实时抢购
              </div>
              
              <div class="movie-grid">
                <div v-for="movie in hotMovies" :key="movie.id" class="glass-card">
                  <div class="poster-box">
                    <img :src="movie.poster" />
                    <div class="badge" v-if="movie.isFlash">抢票中</div>
                  </div>
                  <div class="info-box">
                    <h4>{{ movie.title }}</h4>
                    <p>{{ movie.type }}</p>
                    <div class="footer-action">
                      <span class="score">{{ movie.score }}分</span>
                      <el-button type="primary" size="small" round @click="handleGrab(movie)">
                        {{ movie.isFlash ? '立即抢' : '预约' }}
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-col>

          <el-col :md="7">
            <div class="glass-section side-bar">
              <div class="section-title"><el-icon><DataLine /></el-icon> 实时热度榜</div>
              <div class="rank-list">
                <div v-for="(item, index) in rankData" :key="index" class="rank-item">
                  <span class="rank-num" :class="'top-' + (index+1)">{{ index + 1 }}</span>
                  <span class="rank-name">{{ item.name }}</span>
                  <span class="rank-hot">{{ item.hot }}℃</span>
                </div>
              </div>
              <div class="quick-status">
                <div class="status-card"><p>我的抢票</p><h3>02</h3></div>
                <div class="status-card"><p>待付款</p><h3 class="warn">01</h3></div>
              </div>
            </div>
          </el-col>
        </el-row>
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
              <el-avatar :size="80" :src="userData.avatar" class="avatar-glow" />
              <p class="uid-tag">ID: {{ userData.userId }}</p>
                        
              <el-upload
                :show-file-list="false"
                :before-upload="beforeAvatarUpload"
                :http-request="uploadAvatar"
              >
                <el-button size="small" type="primary" plain>
                  修改头像
                </el-button>
              </el-upload>
            </div>

            <el-form label-position="top" class="custom-form">
              <el-form-item label="用户名">
                <el-input v-model="profileForm.username" placeholder="请输入新用户名" />
              </el-form-item>
              <el-form-item label="手机号">
                <el-input v-model="profileForm.phone" placeholder="绑定手机号" />
              </el-form-item>
              <el-form-item label="验证码">
                <div class="code-input-group">
                  <el-input v-model="profileForm.code" placeholder="输入验证码" />
                  <el-button type="primary" plain :disabled="countdown > 0" @click="sendCode">
                    {{ countdown > 0 ? countdown + 's' : '获取' }}
                  </el-button>
                </div>
              </el-form-item>
              <el-button type="primary" class="save-btn" @click="handleUpdate">保存资料</el-button>
            </el-form>
          </div>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="showLogoutConfirm" class="logout-overlay">
        <div class="logout-glass-card">
          <div class="logout-icon"><el-icon><Warning /></el-icon></div>
          <h3>确认退出？</h3>
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
import { VideoCamera, DataLine, SwitchButton, Warning, Close } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { storeToRefs } from 'pinia'
import http from '../request/http'

/** ========== 基础 ========== */
const router = useRouter()
const authStore = useAuthStore()
const { userInfo: userData } = storeToRefs(authStore)

/** ========== 手机号展示（是否有手机号 + 脱敏） ========== */
const hasPhone = computed(() => {
  const p = userData.value?.phone
  return !!(p && String(p).trim())
})

const maskedPhone = computed(() => {
  const p = String(userData.value?.phone || '')
  if (!p) return ''
  return p.length >= 7 ? `${p.slice(0, 3)}****${p.slice(-4)}` : p
})

/** ========== UI 状态 ========== */
const showLogoutConfirm = ref(false)
const showProfilePanel = ref(false)
const countdown = ref(0)
let countdownTimer = null

/** ========== 表单 ========== */
const profileForm = reactive({
  username: '',
  phone: '',
  code: '' // 注意：这里对应后端的 phoneCode（提交时映射）
})

watchEffect(() => {
  if (!userData.value) return
  profileForm.username = userData.value.username || ''
  profileForm.phone = userData.value.phone || ''
})

/** ========== 倒计时工具 ========== */
const startCountdown = () => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
  countdown.value = 60
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(countdownTimer)
      countdownTimer = null
      countdown.value = 0
    }
  }, 1000)
}

const stopCountdown = () => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
  countdown.value = 0
}

onBeforeUnmount(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
})

/** ========== 获取验证码：校验 + 调接口 ========== */
const sendCode = async () => {
  if (countdown.value > 0) return

  const phone = String(profileForm.phone || '').trim()
  const phoneReg = /^1[3-9]\d{9}$/

  if (!phone) {
    ElMessage.warning('请先输入手机号')
    return
  }
  if (!phoneReg.test(phone)) {
    ElMessage.warning('手机号格式不正确')
    return
  }

  try {
    // scene 固定
    const payload = { phone, scene: 'BIND_PHONE' }

    // 你之前玩过 X-Forwarded-For，这里给你保留，但不强依赖
    const clientIp = localStorage.getItem('clientIp') || ''
    if (clientIp) {
      await http.post('/user/phone/code', payload, {
        headers: { 'X-Forwarded-For': clientIp }
      })
    } else {
      await http.post('/user/phone/code', payload)
    }

    ElMessage.success('验证码已发送')
    startCountdown()
  } catch (e) {
    // http 拦截器一般已经提示了，这里不重复轰炸用户
  }
}

const beforeAvatarUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 <= 5

  if (!isImage) {
    ElMessage.warning('只能上传图片文件')
    return false
  }
  if (!isLt5M) {
    ElMessage.warning('图片大小不能超过 5MB')
    return false
  }
  return true
}


const uploadAvatar = async ({ file }) => {
  try {
    const formData = new FormData()
    formData.append('file', file)

    // 关键点：multipart 不要手动写 boundary，axios 会自动处理
    const newUrl = await http.put('/user/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    // newUrl 就是后端返回的 data（字符串）
    ElMessage.success('头像更新成功')

    // 立刻刷新用户信息（最稳，不用你手动拼 store）
    await authStore.fetchUserInfoFromServer()

  } catch (e) {
    // 失败提示拦截器一般已经弹了
  }
}

/** ========== 保存资料：只提交变更字段（支持单改/双改） ========== */
const handleUpdate = async () => {
  // 老数据（来自 userInfo）
  const oldUsername = String(userData.value?.username || '').trim()
  const oldPhone = String(userData.value?.phone || '').trim()

  // 新数据（来自表单）
  const newUsername = String(profileForm.username || '').trim()
  const newPhone = String(profileForm.phone || '').trim()
  const phoneCode = String(profileForm.code || '').trim()

  const usernameChanged = newUsername !== oldUsername
  const phoneChanged = newPhone !== oldPhone

  // 1) 两个都没改：别请求
  if (!usernameChanged && !phoneChanged) {
    ElMessage.info('没有修改内容')
    return
  }

  // 2) 最小校验
  if (usernameChanged) {
    if (!newUsername) {
      ElMessage.warning('用户名不能为空')
      return
    }
    if (newUsername.length < 1 || newUsername.length > 20) {
      ElMessage.warning('用户名长度必须在 1-20 之间')
      return
    }
  }

  const phoneReg = /^1[3-9]\d{9}$/
  if (phoneChanged) {
    if (!newPhone) {
      ElMessage.warning('手机号不能为空')
      return
    }
    if (!phoneReg.test(newPhone)) {
      ElMessage.warning('手机号格式不正确')
      return
    }
    // 只要改了手机号，验证码必填
    if (!phoneCode) {
      ElMessage.warning('请输入手机验证码')
      return
    }
  }

  // 3) 只提交变更字段
  const payload = {}
  if (usernameChanged) payload.username = newUsername
  if (phoneChanged) {
    payload.phone = newPhone
    payload.phoneCode = phoneCode
  }

  try {
    await http.put('/user/profile', payload)

    ElMessage.success('资料更新成功')

    // 刷新用户信息（更新顶部显示 + 刷新本地缓存）
    await authStore.fetchUserInfoFromServer()

    // 清理验证码输入
    profileForm.code = ''
    stopCountdown()

    // 关闭面板
    showProfilePanel.value = false
  } catch (e) {
    // http 拦截器已提示
  }
}

/** ========== 退出登录 ========== */
const handleLogout = () => {
  showLogoutConfirm.value = true
}

const confirmLogout = () => {
  authStore.logout()
  router.push('/login')
  showLogoutConfirm.value = false
}

/** ========== 抢票按钮（占位） ========== */
const handleGrab = (movie) => {
  ElMessage.info(`正在尝试${movie.isFlash ? '抢购' : '预约'}: ${movie.title}`)
}

/** ========== 假数据 ========== */
const hotMovies = ref([
  { id: 1, title: '流浪地球 3', type: '科幻/冒险', score: '9.3', isFlash: true, poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300' },
  { id: 2, title: '奥本海默', type: '剧情/传记', score: '8.8', isFlash: false, poster: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=300' },
  { id: 3, title: '星际穿越', type: '科幻', score: '9.6', isFlash: true, poster: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=300' },
  { id: 4, title: '复仇者联盟', type: '英雄', score: '9.0', isFlash: true, poster: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=300' },
  { id: 5, title: '沙丘', type: '战争', score: '9.1', isFlash: false, poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300' },
  { id: 6, title: '蝙蝠侠', type: '动作', score: '8.7', isFlash: true, poster: 'https://images.unsplash.com/photo-1531259683007-016a7b628fc3?w=300' }
])

const rankData = ref([
  { name: '流浪地球 3', hot: '9982' },
  { name: '星际穿越', hot: '8721' },
  { name: '复仇者联盟', hot: '7655' },
  { name: '奥本海默', hot: '5421' },
  { name: '沙丘', hot: '4322' }
])
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
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  z-index: 1; /* 提升层级以处理流光 */
}

.glass-card::before {
  content: "";
  position: absolute;
  top: -50%; left: -50%; width: 200%; height: 200%;
  background: conic-gradient(transparent, #409eff, transparent 30%);
  animation: rotate-stream 4s linear infinite;
  opacity: 0; transition: opacity 0.3s;
  z-index: 0;
}
.glass-card:hover::before { opacity: 1; }
.glass-card:hover { transform: translateY(-8px); box-shadow: 0 0 20px rgba(64, 158, 255, 0.4); }

.poster-box, .info-box { position: relative; z-index: 2; }
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
.code-input-group { display: flex; gap: 8px; }
.save-btn { width: 100%; margin-top: 20px; }

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
@keyframes rotate-stream { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
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

</style>