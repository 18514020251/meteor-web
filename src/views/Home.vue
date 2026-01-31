<template>
  <div class="home">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>首页</span>
        </div>
      </template>
      <div class="card-body">
        <h1>欢迎来到 Vue 3 + Vite 项目</h1>
        <p>这是一个使用以下技术栈构建的项目：</p>
        <ul>
          <li>Vue 3</li>
          <li>Vite</li>
          <li>Vue Router</li>
          <li>Pinia</li>
          <li>Element Plus</li>
          <li>Axios</li>
        </ul>
        <el-button type="primary" @click="gotoAbout">查看关于页面</el-button>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'HomeView',
  methods: {
    gotoAbout() {
      this.$router.push('/about')
    }
  }
}
</script>

<style scoped>
.home {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-body {
  padding: 20px 0;
}

h1 {
  margin-bottom: 20px;
  color: #333;
}

p {
  margin-bottom: 15px;
  color: #666;
}

ul {
  margin-bottom: 20px;
  padding-left: 20px;
}

li {
  margin-bottom: 8px;
  color: #666;
}
</style>
