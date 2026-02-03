import { defineStore } from 'pinia'
import http from '../request/http'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userId: Number(localStorage.getItem('userId') || 0),
    role: localStorage.getItem('role') || '',
    needOnboarding: localStorage.getItem('needOnboarding') === 'true',

    userInfo: null
  }),
 actions: {
    // ✅ 新增：保存登录返回对象
    setLoginInfo(loginData) {
      this.token = loginData.token
      this.userId = loginData.userId
      this.role = loginData.role
      this.needOnboarding = !!loginData.needOnboarding

      localStorage.setItem('token', this.token)
      localStorage.setItem('userId', String(this.userId))
      localStorage.setItem('role', this.role)
      localStorage.setItem('needOnboarding', String(this.needOnboarding))
    },
    setToken(token) {
      this.token = token
      localStorage.setItem('token', token)
    },

    // 2. 设置用户信息并存入本地缓存（10分钟）
    setUserInfo(data) {
      this.userInfo = data
      const expireTime = new Date().getTime() + 10 * 60 * 1000 
      const cacheData = {
        data: data,
        expire: expireTime
      }
      localStorage.setItem('user_cache', JSON.stringify(cacheData))
    },

    // 3. 检查缓存并初始化用户信息（由 App.vue 调用）
    async initUserInfo() {
      const cacheStr = localStorage.getItem('user_cache')
      if (cacheStr) {
        try {
          const cache = JSON.parse(cacheStr)
          const now = new Date().getTime()
          
          if (now < cache.expire) {
            this.userInfo = cache.data
            console.log('--- 缓存有效，跳过接口请求 ---')
            return
          }
        } catch (e) {
          localStorage.removeItem('user_cache')
        }
      }
      
      console.log('--- 缓存过期或为空，正在调用接口 ---')
      await this.fetchUserInfoFromServer()
    },

    // 4. 接口请求核心
    async fetchUserInfoFromServer() {
      if (!this.token) return
      try {
        const userInfo = await http.get('/user/info')
        if (userInfo) {
          this.setUserInfo(userInfo) // 存入 store 并更新本地 10min 缓存
        }
      } catch (error) {
        console.error('获取用户信息失败:', error)
        this.logout()
      }
    },

    // 5. 退出登录
logout() {
      this.token = ''
      this.userId = 0
      this.role = ''
      this.needOnboarding = false
      this.userInfo = null
      localStorage.clear()
    },

    finishOnboarding() {
      this.needOnboarding = false
      localStorage.setItem('needOnboarding', 'false')
    }
  }
})