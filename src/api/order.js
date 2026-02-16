import http from '@/request/http'

export function getOrderList(params) {
  return http.get('/order/list', { params })
}

export function getOrderDetail(orderNo) {
  return http.get('/order', { params: { orderNo } })
}

export function deleteOrder(orderNo) {
  return http.delete('/order', { params: { orderNo } })
}

export function createPay(data) {
  return http.post('/order/pay/create', data)
}

// 输入密码确认支付（你已有接口）
export function confirmPay(data) {
  return http.post('/order/pay/confirm', data)
}