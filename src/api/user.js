import http from '@/request/http'

export function getUserInfo() {
  return http.get('/user/info')
}