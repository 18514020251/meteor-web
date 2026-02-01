<template>
  <div class="user-wrapper">
    <div class="login-container">
      <div class="stars"></div>
      <div class="meteor-container">
        <div v-for="n in 6" :key="n" class="meteor"></div>
      </div>

      <header class="glass-nav">
        <div class="nav-content">
          <div class="brand">METEOR <span class="sub">CINEMA</span></div>
          
            <div class="user-portal" v-if="userData">
              <div class="user-text">
                <span class="name">{{ userData.username }}</span>
                <span class="role">UID: {{ userData.userId || '000' }}</span>
              </div>
              <el-avatar :size="42" :src="userData.avatar" class="avatar-glow" />

              <el-button 
                link 
                class="exit-btn" 
                :icon="SwitchButton" 
                @click="handleLogout"
              ></el-button>
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
                <div class="status-card">
                  <p>我的抢票</p>
                  <h3>02</h3>
                </div>
                <div class="status-card">
                  <p>待付款</p>
                  <h3 class="warn">01</h3>
                </div>
              </div>
            </div>
          </el-col>
        </el-row>
      </main>
    </div>

    <transition name="fade">
      <div v-if="showLogoutConfirm" class="logout-overlay">
       <div class="logout-glass-card">
       <div class="logout-icon">
            <el-icon><Warning /></el-icon>
         </div>
          <h3>确认退出系统？</h3>
          <p>退出后将断开与 METEOR 的实时同步</p>
      
         <div class="logout-actions">
           <button class="btn-cancel" @click="showLogoutConfirm = false">取消</button>
            <button class="btn-confirm" @click="confirmLogout">确认退出</button>
          </div>
       </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { VideoCamera, DataLine, SwitchButton } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { Warning } from '@element-plus/icons-vue'

const authStore = useAuthStore()
const router = useRouter()

// --- 这里是核心改动：不再写死，而是指向 store 里的数据 ---
const userData = authStore.userInfo
const showLogoutConfirm = ref(false)
// 退出登录
// 点击退出按钮触发
const handleLogout = () => {
  showLogoutConfirm.value = true
}

// 确认退出的逻辑
const confirmLogout = () => {
  authStore.logout()
  router.push('/login')
}

const hotMovies = ref([
  { id: 1, title: '流浪地球 3', type: '科幻/冒险', score: '9.3', isFlash: true, poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&auto=format' },
  { id: 2, title: '奥本海默', type: '剧情/传记', score: '8.8', isFlash: false, poster: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=300&auto=format' },
  { id: 3, title: '星际穿越', type: '科幻', score: '9.6', isFlash: true, poster: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=300&auto=format' },
  { id: 4, title: '复仇者联盟', type: '英雄', score: '9.0', isFlash: true, poster: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=300&auto=format' },
  { id: 5, title: '沙丘', type: '战争', score: '9.1', isFlash: false, poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&auto=format' },
  { id: 6, title: '蝙蝠侠', type: '动作', score: '8.7', isFlash: true, poster: 'https://images.unsplash.com/photo-1531259683007-016a7b628fc3?w=300&auto=format' },
])

const rankData = ref([
  { name: '流浪地球 3', hot: '9982' },
  { name: '星际穿越', hot: '8721' },
  { name: '复仇者联盟', hot: '7655' },
  { name: '奥本海默', hot: '5421' },
  { name: '沙丘', hot: '4322' }
])
const handleGrab = (movie) => {
  console.log('开始抢购：', movie.title)
}


</script>

<style scoped>
/* 复用登录页背景 */
.user-wrapper {
  width: 100vw; height: 100vh; overflow: hidden;
}

.login-container {
  position: relative; width: 100%; height: 100%;
  background: radial-gradient(ellipse at bottom, #1B2735 0%, #090A0F 100%);
  overflow-y: auto; /* 允许滚动 */
}

/* 顶部导航毛玻璃 */
.glass-nav {
  position: sticky; top: 0; z-index: 100;
  height: 70px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(15px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex; align-items: center;
}

.nav-content {
  width: 1300px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; padding: 0 20px;
}

.brand { color: #fff; font-size: 22px; font-weight: bold; letter-spacing: 2px; }
.sub { font-size: 12px; color: #409eff; vertical-align: middle; }

.user-portal { display: flex; align-items: center; gap: 15px; }
.user-text { display: flex; flex-direction: column; text-align: right; }
.name { color: #fff; font-size: 14px; }
.role { color: rgba(255,255,255,0.5); font-size: 11px; }

.avatar-glow { border: 2px solid #409eff; box-shadow: 0 0 10px rgba(64, 158, 255, 0.5); }

/* 主体内容 */
.content-body { max-width: 1300px; margin: 30px auto; padding: 0 20px; }

.glass-section {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 20px;
  margin-bottom: 25px;
}

.section-title {
  color: #fff; font-size: 18px; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;
}

/* 电影网格布局 */
.movie-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 20px;
}

.glass-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
}

.glass-card:hover {
  transform: translateY(-8px);
  background: rgba(255, 255, 255, 0.1);
  border-color: #409eff;
}

.poster-box { position: relative; height: 240px; }
.poster-box img { width: 100%; height: 100%; object-fit: cover; }
.badge {
  position: absolute; top: 10px; right: 10px;
  background: #f56c6c; color: #fff; font-size: 10px; padding: 2px 8px; border-radius: 10px;
}

.info-box { padding: 12px; }
.info-box h4 { margin: 0; color: #fff; font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.info-box p { color: rgba(255,255,255,0.5); font-size: 12px; margin: 5px 0 15px 0; }

.footer-action { display: flex; justify-content: space-between; align-items: center; }
.score { color: #ff9900; font-weight: bold; font-size: 14px; }

/* 侧边栏排行 */
.rank-item {
  display: flex; align-items: center; gap: 12px; margin-bottom: 18px; color: #fff;
}
.rank-num {
  width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.1); border-radius: 4px; font-size: 12px;
}
.top-1 { background: #f56c6c; }
.top-2 { background: #e6a23c; }
.top-3 { background: #409eff; }
.rank-name { flex: 1; font-size: 14px; }
.rank-hot { color: #f56c6c; font-size: 12px; }

.quick-status { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 30px; }
.status-card {
  background: rgba(255,255,255,0.05); padding: 15px; border-radius: 12px; text-align: center;
}
.status-card p { color: rgba(255,255,255,0.6); font-size: 12px; margin-bottom: 5px; }
.status-card h3 { color: #fff; margin: 0; }
.status-card h3.warn { color: #f56c6c; }

/* 复用登录页流星背景样式 */
.stars { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: transparent url('https://s3-us-west-2.amazonaws.com/s.cdpn.io/123163/stars.png') repeat; z-index: 0; opacity: 0.5; }
.meteor-container { position: fixed; width: 100%; height: 100%; transform: rotateZ(45deg); z-index: 1; pointer-events: none; }
.meteor { position: absolute; height: 2px; background: linear-gradient(-45deg, #5f91ff, rgba(0, 0, 255, 0)); animation: shooting 3000ms ease-in-out infinite; opacity: 0; }
@keyframes shooting { 0% { transform: translateX(0); opacity: 0; } 10% { opacity: 1; } 100% { transform: translateX(400px); opacity: 0; } }
/* 弹窗遮罩层 */
.logout-overlay {
  position: fixed;
  top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px); /* 背景模糊 */
  z-index: 999;
  display: flex; justify-content: center; align-items: center;
}

/* 弹窗主体卡片 */
.logout-glass-card {
  width: 360px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(64, 158, 255, 0.3); /* 蓝色半透明边框 */
  border-radius: 20px;
  padding: 30px;
  text-align: center;
  box-shadow: 0 0 30px rgba(64, 158, 255, 0.2); /* 蓝色外发光 */
  animation: scaleUp 0.3s ease-out;
}

.logout-icon {
  font-size: 40px;
  color: #f56c6c;
  margin-bottom: 15px;
  filter: drop-shadow(0 0 10px rgba(245, 108, 108, 0.5));
}

.logout-glass-card h3 { color: #fff; margin: 0 0 10px 0; font-weight: 400; letter-spacing: 2px; }
.logout-glass-card p { color: rgba(255, 255, 255, 0.6); font-size: 13px; margin-bottom: 30px; }

/* 按钮组 */
.logout-actions { display: flex; gap: 15px; }

.logout-actions button {
  flex: 1; height: 40px; border-radius: 10px; border: none;
  cursor: pointer; transition: all 0.3s; font-size: 14px;
}

.btn-cancel {
  background: rgba(255, 255, 255, 0.1); color: #fff;
}
.btn-cancel:hover { background: rgba(255, 255, 255, 0.2); }

.btn-confirm {
  background: linear-gradient(45deg, #409eff, #3a8ee6);
  color: #fff;
  box-shadow: 0 4px 15px rgba(64, 158, 255, 0.4);
}
.btn-confirm:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(64, 158, 255, 0.6); }

/* 动画 */
@keyframes scaleUp {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}

</style>