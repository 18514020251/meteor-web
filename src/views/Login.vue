<template>
  <div class="login-container">
    <el-card shadow="hover" class="login-card">
      <template #header>
        <div class="card-header">
          <span>用户登录/注册</span>
        </div>
      </template>
      <div class="card-body">
        <!-- 登录表单 -->
        <div v-if="activeTab === 'login'">
          <el-form :model="loginForm" label-width="80px">
            <el-form-item label="用户名">
              <el-input v-model="loginForm.username" placeholder="请输入用户名"></el-input>
            </el-form-item>
            <el-form-item label="密码">
              <el-input v-model="loginForm.password" type="password" placeholder="请输入密码"></el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" class="login-button" :loading="loading" @click="handleLogin">登录</el-button>
            </el-form-item>
            <el-form-item>
              <el-button type="default" class="register-button" @click="switchToRegister">没有账号？点击注册</el-button>
            </el-form-item>
          </el-form>
        </div>
        
        <!-- 注册表单 -->
        <div v-else-if="activeTab === 'register'">
          <el-form :model="registerForm" label-width="80px">
            <el-form-item label="用户名">
              <el-input v-model="registerForm.username" placeholder="请输入用户名"></el-input>
            </el-form-item>
            <el-form-item label="密码">
              <el-input v-model="registerForm.password" type="password" placeholder="请输入密码"></el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" class="register-button" @click="handleRegister">注册</el-button>
            </el-form-item>
            <el-form-item>
              <el-button type="default" class="login-button" @click="switchToLogin">已有账号？点击登录</el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import { useAuthStore } from '../stores/auth'
import http from '../request/http'

export default {
  name: 'LoginView',
  data() {
    return {
      activeTab: 'login',
      loginForm: {
        username: '',
        password: ''
      },
      registerForm: {
        username: '',
        password: ''
      },
      loading: false
    }
  },
  methods: {
    handleLogin() {
      this.loading = true
      
      // 发送登录请求
      http.post('/user/login', this.loginForm)
        .then(token => {
          const authStore = useAuthStore()
          authStore.setToken(token)
          this.$message.success('登录成功')
          this.$router.push('/')
        })
        .catch(error => {
          console.error('登录失败:', error)
        })
        .finally(() => {
          this.loading = false
        })
    },
    handleRegister() {
      // 注册功能待实现
      this.$message.info('注册功能待实现')
    },
    switchToRegister() {
      this.activeTab = 'register'
    },
    switchToLogin() {
      this.activeTab = 'login'
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  padding: 20px;
}

.login-card {
  width: 400px;
  max-width: 100%;
}

.card-header {
  display: flex;
  justify-content: center;
  align-items: center;
}

.login-tabs {
  /* 标签栏样式 */
}

.login-tabs .el-tabs__content {
  display: none;
}

.card-body {
  padding: 20px 0;
}

.login-button {
  width: 100%;
}

.register-button {
  width: 100%;
}
</style>
