<template>
  <div class="app-container">
    <el-container>
      <!-- 只在非登录页面显示头部和底部 -->
      <el-header v-if="$route.path !== '/login'">
        <div class="header-content">
          <h1>Vue 3 + Vite 项目</h1>
          <el-menu :default-active="activeIndex" class="el-menu-demo" mode="horizontal" @select="handleSelect">
            <el-menu-item index="/">首页</el-menu-item>
            <el-menu-item index="/about">关于</el-menu-item>
          </el-menu>
        </div>
      </el-header>
      <el-main>
        <router-view />
      </el-main>
      <el-footer v-if="$route.path !== '/login'">
        <div class="footer-content">
          <p>© 2026 Vue 3 + Vite 项目</p>
        </div>
      </el-footer>
    </el-container>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      activeIndex: '/'
    }
  },
  watch: {
    $route: {
      handler() {
        this.activeIndex = this.$route.path
      },
      immediate: true
    }
  },
  methods: {
    handleSelect(key) {
      this.$router.push(key)
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.app-container {
  min-height: 100vh;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 0 20px;
}

.header-content h1 {
  color: #fff;
  font-size: 20px;
}

.el-header {
  background-color: #409EFF;
  color: #fff;
  line-height: 60px;
}

.el-footer {
  background-color: #f5f7fa;
  color: #909399;
  line-height: 60px;
  text-align: center;
}

.footer-content {
  padding: 0 20px;
}
</style>
