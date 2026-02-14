import http from '@/request/http'

// 电影模块 API
export const MovieAPI = {
  // 分类列表
  getCategories() {
    return http.get('/movies/categories')
  },

  // 搜索（分页）
  // params: { q, categoryIds:[], status, sort, page, size }
  searchMovies(params) {
    return http.get('/movies/search', { params })
  }
}