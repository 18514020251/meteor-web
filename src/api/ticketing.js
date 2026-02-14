import http from '@/request/http'

export const TicketingAPI = {
  // 抢购下单
  grabOrder(screeningId) {
    return http.post('/ticketing/order/grab', null, {
      params: { screeningId }
    })
  }
}