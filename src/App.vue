<template>
  <div class="app-container">
    <template v-if="route.path === '/login'">
      <router-view />
    </template>

    <el-container v-else class="full-layout">
      <el-main class="main-content">
        <router-view />
      </el-main>

      <el-footer>
        <div class="footer-content">
          <p>© 2026 meteor</p>
        </div>
      </el-footer>
    </el-container>
  </div>
</template>

<script setup>
import { onMounted, watch, ref } from 'vue'
import { useAuthStore } from './stores/auth'
import { useRoute, useRouter } from 'vue-router'
// ⚠️ 你下面用到 ElMessage，但没 import，自己补上
import { ElMessage } from 'element-plus'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const activeIndex = ref('/')

// 刷新页面时触发
onMounted(() => {
  if (authStore.token) {
    authStore.initUserInfo()
  }
})

watch(() => route.path, (newPath) => {
  activeIndex.value = newPath
}, { immediate: true })

onMounted(() => {
  window.oncontextmenu = (e) => {
    e.preventDefault()
    ElMessage({
      message: '>>> CRITICAL: CONTEXT_MENU_LOCKED. TERMINAL ACCESS ONLY.',
      type: 'warning',
      duration: 1500,
      offset: 20
    })
  }

  window.onkeydown = (e) => {
    if (
      e.keyCode === 123 ||
      (e.ctrlKey && e.shiftKey && e.keyCode === 73) ||
      (e.ctrlKey && e.shiftKey && e.keyCode === 74) ||
      (e.ctrlKey && e.keyCode === 85)
    ) {
      return false
    }
  }

  if (authStore.token) {
    authStore.initUserInfo()
  }
})
</script>



<style>
/* 侧边菜单 hover 修正 */
/* =========================
   Element Plus 全局暗黑 Hover
   ========================= */

/* el-button link 悬浮白色修正 */
.el-button.is-link:hover {
  background: rgba(255,255,255,0.06) !important;
  color: #7fd4ff !important;
}

/* 普通按钮 hover */
.el-button:hover {
  background: rgba(255,255,255,0.06) !important;
  border-color: rgba(255,255,255,0.15) !important;
}

/* menu hover */
.el-menu-item:hover {
  background: rgba(255,255,255,0.06) !important;
}

.el-menu-item.is-active {
  background: rgba(0,180,255,0.15) !important;
}

/* dropdown / select hover */
.el-select-dropdown__item.hover,
.el-select-dropdown__item:hover {
  background: rgba(255,255,255,0.06) !important;
}

/* segmented hover（你 inbox 在用） */
.el-segmented__item:hover {
  background: rgba(255,255,255,0.08) !important;
}

/* pagination hover */
.el-pager li:hover {
  background: rgba(255,255,255,0.08) !important;
}

/* 表格 hover 行 */
.el-table__body tr:hover > td {
  background: rgba(255,255,255,0.04) !important;
}

/* message card 内 icon 按钮 */
.icon-glass-btn:hover {
  background: rgba(255,255,255,0.06) !important;
  backdrop-filter: blur(6px);
}

/* segmented 选中态统一 */
.el-segmented__item.is-selected {
  background: rgba(0,180,255,0.18) !important;
  color: #7fd4ff !important;
}

/* 1. 彻底清除基础样式，取消 body 的 flex 居中 */
html, body {
  margin: 0;
  padding: 0;
  height: 100%; /* 使用 100% 比 100vh 在移动端更稳 */
  width: 100%;
  overflow: hidden; /* 禁止最外层 body 滚动 */
}

#app {
  height: 100%;
  width: 100%;
}

/* --- 重塑 Message 提醒框 --- */
.el-message {
  background: rgba(13, 25, 48, 0.85) !important;
  backdrop-filter: blur(12px) !important;
  border: 1px solid rgba(88, 166, 255, 0.4) !important;
  border-radius: 2px !important;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.8) !important;
  min-width: 320px !important;
  
  /* 1. 初始位置设为左侧 */
  left: 0 !important; 
  /* 2. 执行我们自定义的飞入动画 */
  animation: meteor-fly-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
  /* 3. 这里的 transition 负责排队时的上下移动 */
  transition: top 0.4s ease, opacity 0.3s !important;
}

@keyframes meteor-fly-in {
  0% {
    opacity: 0;
    /* 从屏幕左侧外起始，并带有一点倾斜感 */
    transform: translateX(-100%) skewX(-15deg);
    filter: blur(15px);
  }
  70% {
    /* 模拟冲过头一点点（回弹效果的基础） */
    opacity: 1;
    transform: translateX(52%) skewX(5deg);
    filter: blur(0);
  }
  100% {
    opacity: 1;
    /* 最终停在正中间：因为 left 是 0，所以这里直接移动到 50% 视口宽度 */
    /* 同时用 -50% 修正自身宽度的偏移，确保真正的中心对齐 */
    transform: translateX(calc(50vw - 50%)) skewX(0deg);
  }
}

/* 离开动画：向右侧滑出，模拟划过的流星 */
.el-message-fade-leave-active {
  opacity: 0 !important;
  transform: translateX(100vw) !important;
  transition: all 0.4s cubic-bezier(0.7, 0, 0.84, 0) !important;
}

/* --- 文字颜色修正 --- */
.el-message__content {
  color: #58a6ff !important;
  font-family: 'Consolas', monospace !important;
  letter-spacing: 2px !important;
}

/* --- 不同状态的边框色 --- */
.el-message--success {
  border-color: rgba(0, 255, 136, 0.5) !important;
}
.el-message--success .el-message__content {
  color: #00ff88 !important;
}

.el-message--warning {
  border-color: rgba(255, 170, 0, 0.5) !important;
}
.el-message--warning .el-message__content {
  color: #ffaa00 !important;
}

/* --- 图标美化 --- */
.el-message .el-icon {
  filter: drop-shadow(0 0 3px currentColor);
}

@keyframes msg-slide-in {
  from {
    transform: translate(-50%, -70%) scale(0.9);
    opacity: 0;
  }
  to {
    transform: translate(-50%, 0) scale(1);
    opacity: 1;
  }
}

@keyframes terminal-entry {
  0% {
    opacity: 0;
    /* 保持水平居中(-50%)，同时垂直方向(Y)从上方-30px入场，并带有一点点缩放 */
    transform: translateX(-50%) translateY(-30px) scale(0.98);
  }
  100% {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1);
  }
}

/* 当消息消失时的平滑度处理 */
.el-message-fade-leave-active {
  opacity: 0 !important;
  transform: translateX(-50%) translateY(-20px) !important;
  transition: all 0.3s cubic-bezier(0.7, 0, 0.84, 0) !important;
}
.app-container {
  height: 100%;
  width: 100%;
}

/* 2. 修正 Element 容器高度 */
.full-layout {
  height: 100vh; /* 严格等于屏幕高度 */
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 防止父壳产生滚动条 */
}

/* 3. 关键：去除 el-main 的默认边距和背景色 */
.main-content::-webkit-scrollbar {
  width: 0px; /* 宽度设为0，滚动条就彻底消失了，但依然可以滚动 */
  background: transparent;
}

.main-content::-webkit-scrollbar {
  width: 0px; 
  height: 0px;
  background: transparent;
}

.main-content::-webkit-scrollbar-thumb {
  background: linear-gradient(
    to bottom,
    transparent,
    rgba(0, 255, 136, 0.5), /* 加入一点点成功绿，模拟能量流动 */
    transparent
  );
}

/* 2. 针对 Firefox 的隐藏方式 */
.main-content {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 10+ */
  
  padding: 0 !important;
  background: transparent !important;
  
  /* --- 关键修改点 --- */
  flex: 1;             /* 占据剩余所有空间 */
  overflow-y: auto;    /* 允许垂直方向滚动 */
  overflow-x: hidden;  /* 彻底禁止水平方向滚动 */
  /* ----------------- */
}

.el-footer {
  height: 40px !important; /* 给固定高度 */
  line-height: 40px;
  padding: 0;
  flex-shrink: 0; /* 禁止被压缩 */
  background: #090A0F; /* 配合你的星空背景色 */
  border-top: 1px solid rgba(255,255,255,0.1);
}

/* 修改全局 loading 背景 */
.el-loading-mask {
  background-color: rgba(9, 10, 15, 0.9) !important;
  backdrop-filter: blur(4px);
}

/* 自定义一个扫描线动画 */
.el-loading-spinner {
  background: linear-gradient(to bottom, 
    transparent, 
    rgba(88, 166, 255, 0.2) 50%, 
    rgba(88, 166, 255, 0.5) 50%, 
    transparent);
  background-size: 100% 20px;
  animation: scanning 2s linear infinite;
  height: 100% !important;
  top: 0 !important;
  margin-top: 0 !important;
}

/* 隐藏原本的圆圈 */
.el-loading-spinner .circular {
  display: none;
}



@keyframes scanning {
  from { background-position: 0 -100vh; }
  to { background-position: 0 100vh; }
}

.footer-content p {
  margin: 0;
  font-size: 12px;
}

/* --- 全局滚动条重塑 --- */
::-webkit-scrollbar {
  width: 6px;  /* 纵向滚动条宽度 */
  height: 6px; /* 横向滚动条高度 */
}

/* 滚动条轨道：深色透明，保持背景纯净 */
::-webkit-scrollbar-track {
  background: rgba(9, 10, 15, 0.5);
  border-radius: 10px;
}

/* 滚动条滑块：幽蓝色发光线条 */
::-webkit-scrollbar-thumb {
  background: rgba(88, 166, 255, 0.3);
  border-radius: 10px;
  border: 1px solid rgba(88, 166, 255, 0.1);
  transition: all 0.3s ease;
}

/* 鼠标悬停时：滑块加亮，增加互动感 */
::-webkit-scrollbar-thumb:hover {
  background: rgba(88, 166, 255, 0.6);
  box-shadow: 0 0 10px rgba(88, 166, 255, 0.5);
}

/* 针对 Firefox 的兼容处理 */
* {
  scrollbar-width: thin;
  scrollbar-color: rgba(88, 166, 255, 0.3) rgba(9, 10, 15, 0.5);
}
</style>