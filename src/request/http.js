import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'
import { useAuthStore } from '../stores/auth'

// 配置常量
const TOKEN_HEADER_KEY = 'Authorization'

// 创建 axios 实例
const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
  timeout: 15000
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    const authStore = useAuthStore()
    const token = authStore.token
    
    if (token) {
      config.headers[TOKEN_HEADER_KEY] = `Bearer ${token}`
    }
    
    return config
  },
  error => {
    console.log(error)
    return Promise.reject(error)
  }
)



// 响应拦截器
service.interceptors.response.use(
  response => {
    const res = response.data
    
    if (res.code === 200) {
      return res.data
    } else {
      if (res.code === 409) {
        ElMessage.error('请求过快稍后再试')
      } else {
        ElMessage.error(res.msg || '请求过快稍后再试')
      }
      return Promise.reject(new Error(res.msg || '请求过快稍后再试'))
    }
  },
  error => {
    if (error.response) {
      const { status } = error.response
      
      switch (status) {
        case 401:
          const authStore = useAuthStore()
          authStore.logout()
          router.push('/login')
          ElMessage.error('登录已过期，请重新登录')
          break
        case 409:
          ElMessage.error('请求过快稍后再试')
          break
        default:
          ElMessage.error(error.response.data?.msg || `请求过快稍后再试`)
      }
    } else {
      ElMessage.error(error.message || '网络错误')
    }
    return Promise.reject(error)
  }
)
export default service
