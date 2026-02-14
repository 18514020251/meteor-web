import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/loading',
    name: 'Loading',
    component: () => import('../views/Loading.vue')
  },
  {
    path: '/user',
    name: 'User',
    component: () => import('../views/User.vue')
  },
  {
    path: '/merchant',
    name: 'Merchant',
    component: () => import('../views/Merchant.vue')
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('../views/Admin.vue')
  },
  {
  path: '/onboarding',
  component: () => import('../views/Onboarding.vue')
  },
  {
  path: '/movies/:movieId',
  name: 'MovieDetail',
  component: () => import('../views/MovieDetail.vue'),
  props: true
  },
  {
  path: '/search',
  name: 'Search',
  component: () => import('../views/Search.vue')
  },
  {
  path: '/order',
  name: 'Order',
  component: () => import('@/views/OrderPage.vue')
  },
  {
  path: '/orders',
  name: 'OrderList',
  component: () => import('@/views/OrderListPage.vue')
}
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const token = authStore.token
  
  // 访问非登录页面且无token，跳转到登录页
  if (to.path !== '/login' && !token) {
    next('/login')
  } else {
    next()
  }
})

export default router
