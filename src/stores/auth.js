import { defineStore } from 'pinia'
import http from '../request/http'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    userInfo: null,
    token: localStorage.getItem('token') || null
  }),
  actions: {
    // 1. 设置 token
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
      this.userInfo = null
      this.token = null
      localStorage.removeItem('token')
      localStorage.removeItem('user_cache')
    }
  }
})