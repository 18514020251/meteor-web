<template>
  <div class="onboarding-wrapper" @mousemove="handleMouseMove">
    <div class="cursor-glow" :style="cursorStyle"></div>
    <div class="stars" :style="{ transform: bgTransform }"></div>
    <div class="meteor-container">
      <div v-for="n in 8" :key="n" class="meteor"></div>
    </div>
    <div class="scan-line"></div>

    <div class="system-info">
      <div class="line">PREFERENCE_MODULE: <span class="active">ACTIVE</span></div>
      <div class="line">USER_IDENTITY: {{ authStore.userInfo?.username || 'GUEST' }}</div>
      <div class="line">DATA_SYNC: READY</div>
    </div>

    <div class="panel-container">
      <div class="panel-header">
        <div class="system-status">MODULE: CATEGORY_SELECTOR</div>
        <h1 class="glitch-text" data-text="SELECT YOUR INTERESTS">SELECT YOUR INTERESTS</h1>
        <p class="subtitle">用于个性化推荐，系统将根据您的选择优化推送算法</p>
      </div>

      <div class="panel-body">
        <el-checkbox-group v-model="selected" class="grid">
          <el-checkbox 
            v-for="c in categories" 
            :key="c.id" 
            :label="c.id" 
            class="neon-checkbox"
          >
            <span class="label-inner">{{ c.name }}</span>
          </el-checkbox>
        </el-checkbox-group>
      </div>

      <div class="panel-footer">
        <div class="info-row">
          <div class="hint">SELECTED_COUNT: <span class="count">{{ selected.length }}</span> / 4</div>
          <div class="id-scanner-tag" v-if="selected.length > 0">
            <div class="pulse-dot"></div>
            <span class="status-text">PREFERENCE_LOCKED</span>
          </div>
        </div>
        
        <div class="actions">
          <el-button 
            type="primary" 
            class="main-button breath-btn" 
            :loading="loading" 
            @click="submit"
          >
            CONFIRM & INITIALIZE
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import http from '../request/http'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const router = useRouter()
const authStore = useAuthStore()

// --- 交互逻辑 (保持不变) ---
const categories = [
  { id: 1, name: '动作' }, { id: 2, name: '科幻' }, { id: 3, name: '爱情' },
  { id: 4, name: '动画' }, { id: 5, name: '悬疑' }, { id: 6, name: '喜剧' },
  { id: 7, name: '剧情' }, { id: 8, name: '惊悚' }, { id: 9, name: '恐怖' },
  { id: 10, name: '犯罪' }, { id: 11, name: '战争' }, { id: 12, name: '冒险' },
  { id: 13, name: '奇幻' }, { id: 14, name: '纪录片' }, { id: 15, name: '家庭' }
]

const selected = ref([])
const loading = ref(false)

const goNext = () => {
  if (authStore.role === 'admin') return router.replace('/admin')
  if (authStore.role === 'merchant') return router.replace('/merchant')
  return router.replace('/user')
}

const submit = async () => {
  if (selected.value.length === 0) {
    ElMessage.warning('[SYSTEM] 错误: 请至少选择一个分类以继续')
    return
  }
    if (selected.value.length > 4) {
    ElMessage.warning('[SYSTEM] 错误: 最多选择 4 个分类')
    return
  }
  loading.value = true
  try {
    await http.post('/user/preference/categories', { categoryIds: selected.value })
    authStore.finishOnboarding()
    ElMessage.success('[SYSTEM] 同步成功: 偏好设置已更新')
    goNext()
  } finally {
    loading.value = false
  }
}

// --- 视觉特效逻辑 ---
const cursorPosition = ref({ x: 0, y: 0 })
const handleMouseMove = (e) => {
  cursorPosition.value = { x: e.clientX, y: e.clientY }
}

const cursorStyle = computed(() => ({
  transform: `translate(${cursorPosition.value.x - 150}px, ${cursorPosition.value.y - 150}px)`
}))

const bgTransform = computed(() => {
  const moveX = (cursorPosition.value.x - window.innerWidth / 2) / 60
  const moveY = (cursorPosition.value.y - window.innerHeight / 2) / 60
  return `translate(${moveX}px, ${moveY}px) scale(1.1)`
})
</script>

<style scoped>
/* --- 基础容器 --- */
.onboarding-wrapper {
  width: 100vw;
  height: 100vh;
  background: radial-gradient(ellipse at bottom, #1B2735 0%, #090A0F 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  box-sizing: border-box;
  overflow: hidden;
  position: relative;
}

/* --- 背景特效 (参考 Meteor 风格) --- */
.stars {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: transparent url('https://s3-us-west-2.amazonaws.com/s.cdpn.io/123163/stars.png') repeat;
  opacity: 0.4;
  z-index: 0;
}

.cursor-glow {
  position: fixed;
  top: 0; left: 0;
  width: 300px; height: 300px;
  background: radial-gradient(circle, rgba(88, 166, 255, 0.12) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
  z-index: 1;
}

.scan-line {
  position: absolute;
  width: 100%; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(88, 166, 255, 0.3), transparent);
  top: 0; z-index: 1;
  animation: scan 8s linear infinite;
}

@keyframes scan {
  0% { top: 0%; opacity: 0; }
  50% { opacity: 1; }
  100% { top: 100%; opacity: 0; }
}

/* --- 系统信息 --- */
.system-info {
  position: absolute;
  top: 40px; left: 40px;
  font-family: 'Courier New', Courier, monospace;
  color: rgba(88, 166, 255, 0.5);
  font-size: 12px;
  z-index: 2;
  pointer-events: none;
}
.system-info .active { color: #00ff88; text-shadow: 0 0 5px #00ff88; }

/* --- 流星动画 --- */
.meteor-container {
  position: absolute;
  width: 100%; height: 100%;
  transform: rotateZ(35deg);
  z-index: 1;
}
.meteor {
  position: absolute; height: 1px;
  background: linear-gradient(-45deg, #5f91ff, rgba(0, 0, 255, 0));
  filter: drop-shadow(0 0 6px #699bff);
  opacity: 0;
  animation: tail 4s infinite, shooting 4s infinite;
}
.meteor:nth-child(1) { top: 10%; left: 10%; animation-delay: 0s; }
.meteor:nth-child(2) { top: 30%; left: 60%; animation-delay: 1.2s; }
.meteor:nth-child(3) { top: 70%; left: 20%; animation-delay: 2.5s; }
@keyframes tail { 0%, 20% { width: 0; } 30% { width: 100px; } 100% { width: 0; } }
@keyframes shooting { 0% { transform: translateX(0); opacity: 0; } 10% { opacity: 1; } 35% { transform: translateX(600px); opacity: 0; } 100% { transform: translateX(600px); opacity: 0; } }

/* --- 主面板 --- */
.panel-container {
  position: relative;
  z-index: 10;
  width: min(800px, 100%);
  background: rgba(13, 25, 48, 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(88, 166, 255, 0.2);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
}

.panel-container::before {
  content: "";
  position: absolute;
  inset: -1px;
  background: linear-gradient(45deg, #1f4287, transparent, #58a6ff);
  z-index: -1;
  border-radius: 20px;
  opacity: 0.2;
}

/* --- 标题与文本 --- */
.panel-header { text-align: left; margin-bottom: 30px; }
.system-status { font-size: 10px; color: #00ff88; font-family: monospace; margin-bottom: 8px; }
.system-status::before { content: ""; display: inline-block; width: 6px; height: 6px; background: #00ff88; border-radius: 50%; margin-right: 8px; box-shadow: 0 0 8px #00ff88; }

.glitch-text {
  font-family: 'Consolas', monospace;
  font-size: 28px;
  color: #fff;
  letter-spacing: 2px;
  margin: 0;
  position: relative;
}
.subtitle { color: rgba(255, 255, 255, 0.5); font-size: 13px; margin-top: 8px; }

/* --- 网格与多选框 --- */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 15px;
}

:deep(.neon-checkbox) {
  margin-right: 0 !important;
  height: auto;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(88, 166, 255, 0.15);
  border-radius: 8px;
  padding: 12px 15px !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.neon-checkbox.is-checked) {
  background: rgba(88, 166, 255, 0.1) !important;
  border-color: #58a6ff !important;
  box-shadow: inset 0 0 10px rgba(88, 166, 255, 0.2);
}

:deep(.neon-checkbox .el-checkbox__label) {
  color: rgba(255, 255, 255, 0.7) !important;
  font-family: 'PingFang SC', sans-serif;
  transition: color 0.3s;
}

:deep(.neon-checkbox.is-checked .el-checkbox__label) {
  color: #58a6ff !important;
  text-shadow: 0 0 8px rgba(88, 166, 255, 0.5);
}

:deep(.el-checkbox__inner) {
  background-color: transparent !important;
  border-color: rgba(88, 166, 255, 0.5) !important;
}

/* --- 底部与按钮 --- */
.panel-footer {
  margin-top: 35px;
  border-top: 1px solid rgba(88, 166, 255, 0.1);
  padding-top: 25px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.hint { font-family: monospace; font-size: 13px; color: rgba(255, 255, 255, 0.4); }
.hint .count { color: #58a6ff; font-weight: bold; }

.id-scanner-tag {
  display: flex; align-items: center; gap: 8px;
  padding: 4px 12px;
  background: rgba(0, 255, 136, 0.05);
  border: 1px solid rgba(0, 255, 136, 0.3);
  border-radius: 4px;
  color: #00ff88; font-size: 11px; font-family: monospace;
}

.pulse-dot {
  width: 6px; height: 6px; background: #00ff88; border-radius: 50%;
  box-shadow: 0 0 8px #00ff88; animation: pulse 1.5s infinite;
}

.main-button {
  width: 100%;
  height: 50px;
  font-size: 16px;
  font-family: 'Consolas', monospace;
  background: linear-gradient(180deg, rgba(30, 60, 120, 0.6) 0%, rgba(10, 20, 40, 0.8) 100%) !important;
  border: 1px solid rgba(88, 166, 255, 0.4) !important;
  border-radius: 8px;
  color: #fff;
  letter-spacing: 2px;
  animation: button-breath 3s infinite alternate ease-in-out;
}

.main-button:hover {
  background: #409eff !important;
  box-shadow: 0 0 20px rgba(64, 158, 255, 0.6) !important;
}

@keyframes button-breath {
  0% { box-shadow: inset 0 0 10px rgba(88, 166, 255, 0.2); }
  100% { box-shadow: inset 0 0 25px rgba(88, 166, 255, 0.5), 0 0 15px rgba(88, 166, 255, 0.2); }
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.4); opacity: 0.5; }
  100% { transform: scale(1); opacity: 1; }
}
</style>