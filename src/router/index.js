import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import component from 'element-plus/es/components/tree-select/src/tree-select-option.mjs'

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
  },
  {
  path: '/order-detail',
  name: 'OrderDetail',
  component: () => import('@/views/OrderDetail.vue')
  },
  {
    path: '/order/pay',
    name: 'OrderPay',
    component: () => import('@/views/OrderPay.vue')
  },
  {
  path: '/pay-sim',
  component: () => import('@/views/PaySim.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const token = authStore.token

  const WHITE_LIST = ['/login', '/', '/loading', '/pay-sim']

  if (WHITE_LIST.includes(to.path)) return next()

  if (!token) {
    return next({ path: '/login', query: { redirect: to.fullPath } })
  }

  next()
})

export default router
