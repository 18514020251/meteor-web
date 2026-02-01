<template>
  <div class="app-container">
    <template v-if="$route.path === '/login'">
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

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const activeIndex = ref('/')

// 核心逻辑：刷新页面时触发
onMounted(() => {
  if (authStore.token) {
    authStore.initUserInfo()
  }
})

watch(() => route.path, (newPath) => {
  activeIndex.value = newPath
}, { immediate: true })
</script>

<style>
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

.footer-content p {
  margin: 0;
  font-size: 12px;
}
</style>