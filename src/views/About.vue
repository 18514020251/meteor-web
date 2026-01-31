<template>
  <div class="about">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>关于页面</span>
        </div>
      </template>
      <div class="card-body">
        <h1>关于本项目</h1>
        <p>这是一个使用 Vue 3 + Vite 构建的项目骨架，集成了以下技术：</p>
        <el-table :data="techList" style="width: 100%">
          <el-table-column prop="name" label="技术名称" width="180">
          </el-table-column>
          <el-table-column prop="description" label="描述">
          </el-table-column>
        </el-table>
        <el-button type="primary" @click="gotoHome">返回首页</el-button>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'AboutView',
  data() {
    return {
      techList: [
        { name: 'Vue 3', description: '渐进式 JavaScript 框架' },
        { name: 'Vite', description: '前端构建工具' },
        { name: 'Vue Router', description: '官方路由管理器' },
        { name: 'Pinia', description: '状态管理库' },
        { name: 'Element Plus', description: 'UI 组件库' },
        { name: 'Axios', description: 'HTTP 客户端' }
      ]
    }
  },
  methods: {
    gotoHome() {
      this.$router.push('/')
    }
  }
}
</script>

<style scoped>
.about {
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

.el-table {
  margin-bottom: 20px;
}
</style>
