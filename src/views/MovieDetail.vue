<template>
  <div class="page-container">
    <div class="bg-blur" v-if="movie" :style="{ backgroundImage: `url(${movie.posters?.[0]})` }"></div>

    <div class="detail-wrap">
      <div class="nav-bar">
        <el-button link @click="router.back()" class="back-btn">
          <el-icon><ArrowLeft /></el-icon> 返回
        </el-button>
      </div>

      <div v-loading="loadingMovie" class="movie-card" v-if="movie">
        <div class="poster-side">
          <el-image :src="movie.posters?.[0]" fit="cover" class="main-poster">
            <template #placeholder><div class="img-slot">加载中...</div></template>
          </el-image>
        </div>
        <div class="info-side">
          <div class="title-row">
            <h1>{{ movie.title }}</h1>
            <span class="alias">{{ movie.alias }}</span>
          </div>
          
          <div class="tags-row">
            <el-tag v-for="c in (movie.categories || [])" :key="c" size="small" effect="plain" class="custom-tag">
              {{ c }}
            </el-tag>
          </div>

          <div class="meta-grid">
            <div class="meta-item"><span class="label">状态</span><span class="val">{{ movie.status }}</span></div>
            <div class="meta-item"><span class="label">时长</span><span class="val">{{ movie.durationMin }} min</span></div>
            <div class="meta-item"><span class="label">上映</span><span class="val">{{ movie.releaseDate }}</span></div>
          </div>

          <p class="movie-intro" :title="movie.intro">{{ movie.intro }}</p>
        </div>
      </div>

      <div class="screening-section" v-loading="loadingScreenings">
        <div class="section-header">
          <h3><el-icon><Calendar /></el-icon> 场次列表</h3>
          <el-button :icon="Refresh" circle @click="refreshAllScreenings" :loading="loadingScreenings" />
        </div>

        <div v-if="screenings.length === 0 && !loadingScreenings" class="empty-state">
          <el-empty description="暂无可用场次" :image-size="80" />
        </div>

        <div class="screening-grid">
          <div v-for="s in screenings" :key="s.screeningId" 
            class="s-card" :class="{ 's-disabled': s.saleState !== 'SELLING' }">
            
            <div class="s-time">
              <div class="time-range">{{ fmtHM(s.startTime) }} ~ {{ fmtHM(s.endTime) }}</div>
              <div class="sale-note">
                开售: {{ fmtMDHM(s.saleStartTime) }}
              </div>
            </div>

            <div class="s-info">
              <div class="price-row">
                <span class="currency">¥</span>
                <span class="price-val">{{ fen2yuan(s.minPrice) }}</span>
                <span class="price-sep">起</span>
              </div>
              <div class="stock-row">
                <el-progress 
                  :percentage="Math.floor((s.availableTickets / s.totalTickets) * 100)" 
                  :status="s.availableTickets < 10 ? 'exception' : ''"
                  :show-text="false" 
                  stroke-width="4"
                />
                <span class="stock-text">余 {{ s.availableTickets }} / {{ s.totalTickets }}</span>
              </div>
            </div>

            <div class="s-action">
              <div class="status-tag" :class="s.saleState.toLowerCase()">
                <span v-if="refreshingMap[s.screeningId]" class="sync-icon"><el-icon class="is-loading"><Loading /></el-icon></span>
                {{ stateText(s.saleState) }}
              </div>

              <div v-if="s.saleState === 'NOT_STARTED'" class="s-countdown">
                距开售 <span class="num">{{ displayRemain(s) }}</span>s
              </div>

              <el-button
                class="buy-btn"
                :type="s.saleState === 'SELLING' ? 'primary' : 'info'"
                :disabled="s.saleState !== 'SELLING'"
                :loading="buyingId === String(s.screeningId)"
                round
                @click="onBuy(s)"
              >
                {{ s.saleState === 'SELLING' ? '立即抢购' : '停止销售' }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { TicketingAPI } from '@/api/ticketing'
import { ElMessage } from 'element-plus'
// 导入美化版需要的图标
import { ArrowLeft, Refresh, Calendar, Loading } from '@element-plus/icons-vue'
import http from '../request/http'

const nowTick = ref(Date.now())

const route = useRoute()
const router = useRouter()

const movieId = String(route.params.movieId || '')

const movie = ref(null)
const screenings = ref([])

const loadingMovie = ref(false)
const loadingScreenings = ref(false)

/**
 * ===== 倒计时 & 临界刷新相关状态 =====
 */

const remainMap = reactive({}) 
const refreshingMap = reactive({}) 

const nextRefreshAt = reactive({}) 

const afterZeroTries = reactive({}) 

const remainByStartTime = (s) => {
  const t = Date.parse(s.saleStartTime)
  if (!Number.isFinite(t)) return null
  return clampNonNeg(Math.ceil((t - nowTick.value) / 1000))
}

let tickTimer = null

const fetchMovie = async () => {
  loadingMovie.value = true
  try {
    const res = await http.get(`/movies/${movieId}`)
    movie.value = res?.data ?? res
  } catch (e) {
    movie.value = null
    ElMessage.error('电影详情加载失败')
  } finally {
    loadingMovie.value = false
  }
}

const normalizeScreening = (s) => {
  const saleState = String(s.saleState ?? s.canBuy ?? '')
  return { ...s, saleState }
}

const fetchScreenings = async () => {
  loadingScreenings.value = true
  try {
    const res = await http.get(`/ticketing/screenings/movie/${movieId}`)
    const list = (Array.isArray(res) ? res : (res?.data ?? [])).map(normalizeScreening)
    screenings.value = list

    for (const s of list) {
      const id = s.screeningId
      if (!id) continue
      if (s.saleState  === 'NOT_STARTED') {
        remainMap[id] = clampNonNeg(Number(s.remainSeconds ?? 0))
      } else {
        remainMap[id] = 0
        // 已不在未开售，清理到点后的重试次数
        afterZeroTries[id] = 0
      }
    }
  } catch (e) {
    screenings.value = []
  } finally {
    loadingScreenings.value = false
  }
}

const refreshOneScreening = async (screeningId) => {
  if (!screeningId) return
  if (refreshingMap[screeningId]) return
  refreshingMap[screeningId] = true

  try {
    const res = await http.get(`/ticketing/screenings/${screeningId}`)
    const nextRaw = res?.data ?? res
    if (!nextRaw) return

    const next = normalizeScreening(nextRaw)

    const idx = screenings.value.findIndex(x => String(x.screeningId) === String(screeningId))
    if (idx !== -1) {
      const merged = normalizeScreening({ ...screenings.value[idx], ...next })
      screenings.value.splice(idx, 1, merged)

      if (merged.saleState !== 'NOT_STARTED') {
        afterZeroTries[screeningId] = 0
      }
    }
  } finally {
    refreshingMap[screeningId] = false
  }
}



const refreshAllScreenings = async () => {
  await fetchScreenings()
}

/**
 * ===== 核心：倒计时 tick + 临界刷新策略 =====
 *
 * 刷新策略（你后端思路）：
 * - remainSeconds > 60：不自动刷新
 * - 60 >= remainSeconds > 10：每 5 秒刷新该场次
 * - 10 >= remainSeconds > 0：每 1 秒刷新该场次
 * - remainSeconds == 0：立即刷新一次
 *   如果仍 NOT_STARTED：1~2 秒刷，最多 8 次
 */

// 倒计时展示：优先使用 remainMap（更平滑）
const displayRemain = (s) => {
  const r = remainByStartTime(s)
  if (r !== null) return r
  // 兜底：没有 saleStartTime 时用后端 remainSeconds + 本地 remainMap
  const id = s?.screeningId
  if (!id) return 0
  const v = remainMap[id]
  return clampNonNeg(Number.isFinite(v) ? v : Number(s.remainSeconds ?? 0))
}

const startTick = () => {
  stopTick()
  tickTimer = setInterval(() => {
    nowTick.value = Date.now() // ✅ 关键：驱动 displayRemain 每秒重新计算

    for (const s of screenings.value) {
      const id = s?.screeningId
      if (!id) continue
      if (s.saleState !== 'NOT_STARTED') continue

      const r = displayRemain(s)
      scheduleRefreshIfNeeded(id, r)
    }
  }, 1000)
}

const stopTick = () => {
  if (tickTimer) {
    clearInterval(tickTimer)
    tickTimer = null
  }
}

// 根据 remainSeconds 和“下一次允许刷新时间”决定是否刷新
const scheduleRefreshIfNeeded = (id, remainSeconds) => {
  const now = Date.now()
  const nextAt = Number(nextRefreshAt[id] ?? 0)
  if (now < nextAt) return // 还没到允许刷新时间

    // 3 秒内：强制每秒刷（不抖动）
    if (remainSeconds <= 3 && remainSeconds > 0) {
      nextRefreshAt[id] = now + 950
      refreshOneScreening(id)
      return
    }

  // remainSeconds == 0：立刻刷新一次
  if (remainSeconds <= 0) {
    // 到点后最多重试 8 次（防止后端时间差/队列延迟导致一直 NOT_STARTED）
    const tries = Number(afterZeroTries[id] ?? 0)
    if (tries >= 8) return

    afterZeroTries[id] = tries + 1

    // 1~2 秒随机抖动
    nextRefreshAt[id] = now + randBetween(900, 1800)
    refreshOneScreening(id)
    return
  }

  // 10 秒内：每 1 秒刷（带 jitter）
  if (remainSeconds <= 10) {
    nextRefreshAt[id] = now + randBetween(900, 1200)
    refreshOneScreening(id)
    return
  }

  // 60~10 秒：每 5 秒刷（带 jitter）
  if (remainSeconds <= 60) {
    nextRefreshAt[id] = now + randBetween(4500, 5500)
    refreshOneScreening(id)
    return
  }

  // > 60：不刷
  return
}

/**
 * ===== 工具函数 =====
 */
const clampNonNeg = (n) => {
  const x = Number(n)
  if (!Number.isFinite(x)) return 0
  return Math.max(0, Math.floor(x))
}
const randBetween = (min, max) => {
  const a = Number(min), b = Number(max)
  return Math.floor(a + Math.random() * (b - a + 1))
}

const fen2yuan = (fen) => {
  const n = Number(fen)
  if (!Number.isFinite(n)) return '--'
  return (n / 100).toFixed(2)
}

const fmtHM = (iso) => String(iso || '').slice(11, 16)
const fmtMDHM = (iso) => {
  if (!iso) return ''
  const s = String(iso).replace('T', ' ')
  return s.slice(5, 16)
}

const stateText = (s) => {
  const map = {
    NOT_STARTED: '未开售',
    SELLING: '可购买',
    SOLD_OUT: '已售罄',
    STOPPED: '已停售',
    CLOSED: '已关闭',
    CANCELED: '已取消'
  }
  return map[s] || s
}

const buyingId = ref(null)

const onBuy = async (s) => {
  if (!s?.screeningId) return
  if (s.saleState !== 'SELLING') return

  if (buyingId.value) return
  buyingId.value = String(s.screeningId)

  try {
    const res = await TicketingAPI.grabOrder(s.screeningId)

    if (res?.code === 0) {
      ElMessage.success(res.msg || '下单成功')
      router.push({
        name: 'Order',
        query: {
          orderNo: res.orderNo,
          screeningId: String(s.screeningId),
          leftStock: String(res.leftStock ?? ''),
          movieId: movieId
        }
      })
    } else {
      ElMessage.error(res?.msg || '下单失败')
      refreshOneScreening(s.screeningId)
    }
  } catch (e) {
    refreshOneScreening(s.screeningId)
  } finally {
    buyingId.value = null
  }
}

onMounted(async () => {
  if (!movieId) {
    ElMessage.warning('movieId 缺失')
    router.back()
    return
  }
  await Promise.all([fetchMovie(), fetchScreenings()])
  startTick()
})

onBeforeUnmount(() => {
  stopTick()
})
</script>

<style scoped>
/* 页面背景与容器 */
.page-container {
  min-height: 100vh;
  background: #0f111a;
  color: #ffffff;
  position: relative;
  overflow-x: hidden;
  padding-bottom: 50px;
}

.bg-blur {
  position: absolute;
  top: 0; left: 0; right: 0; height: 500px;
  background-size: cover;
  background-position: center;
  filter: blur(80px) brightness(0.3);
  z-index: 0;
  transform: scale(1.1);
}

.detail-wrap {
  position: relative;
  z-index: 1;
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px 16px;
}

/* 导航 */
.nav-bar { margin-bottom: 20px; }
.back-btn { color: #fff; opacity: 0.8; }
.back-btn:hover { opacity: 1; color: #409eff; }

/* 电影详情卡片 - 玻璃拟态 */
.movie-card {
  display: flex;
  gap: 30px;
  padding: 30px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4);
  margin-bottom: 40px;
}

.main-poster {
  width: 200px;
  height: 280px;
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.5);
  flex-shrink: 0;
}

.info-side {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.title-row h1 { margin: 0; font-size: 28px; font-weight: 700; }
.alias { opacity: 0.5; font-size: 14px; margin-top: 4px; display: block; }

.tags-row { margin: 16px 0; display: flex; gap: 8px; }
.custom-tag { background: rgba(255,255,255,0.1); border: none; color: #ddd; }

.meta-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin: 15px 0;
  padding: 15px 0;
  border-top: 1px solid rgba(255,255,255,0.05);
}

.meta-item { display: flex; flex-direction: column; gap: 4px; }
.meta-item .label { font-size: 12px; opacity: 0.4; text-transform: uppercase; }
.meta-item .val { font-size: 15px; font-weight: 500; }

.movie-intro {
  font-size: 14px;
  line-height: 1.6;
  opacity: 0.7;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-top: auto;
}

/* 场次区域 */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h3 { display: flex; align-items: center; gap: 8px; margin: 0; font-size: 20px; }

/* 场次卡片列表 */
.screening-grid { display: flex; flex-direction: column; gap: 16px; }

.s-card {
  display: grid;
  grid-template-columns: 1.5fr 2fr 1.5fr;
  align-items: center;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  transition: all 0.3s ease;
}

.s-card:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-2px);
  border-color: rgba(64, 158, 255, 0.3);
}

.s-disabled { opacity: 0.6; }

.time-range { font-size: 20px; font-weight: 700; color: #fff; }
.sale-note { font-size: 12px; opacity: 0.5; margin-top: 6px; }

/* 价格与余票 */
.price-row { color: #f56c6c; display: flex; align-items: baseline; gap: 2px; }
.price-val { font-size: 24px; font-weight: 700; }
.price-sep { font-size: 12px; opacity: 0.7; margin-left: 4px; }

.stock-row { width: 140px; margin-top: 10px; }
.stock-text { font-size: 11px; opacity: 0.6; margin-top: 4px; display: block; }

/* 动作区 */
.s-action { text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }

.status-tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(255,255,255,0.1);
  display: flex; align-items: center; gap: 4px;
}
.status-tag.selling { color: #67c23a; background: rgba(103, 194, 58, 0.1); }
.status-tag.not_started { color: #e6a23c; background: rgba(230, 162, 60, 0.1); }

.s-countdown { font-size: 12px; color: #e6a23c; font-family: monospace; }
.s-countdown .num { font-size: 16px; font-weight: bold; }

.buy-btn {
  width: 120px;
  height: 40px;
  font-weight: bold;
  letter-spacing: 1px;
}

.sync-icon { display: inline-block; animation: rotate 2s linear infinite; }

@media (max-width: 768px) {
  .movie-card { flex-direction: column; padding: 20px; }
  .main-poster { width: 140px; height: 196px; margin: 0 auto; }
  .s-card { grid-template-columns: 1fr; gap: 15px; text-align: center; }
  .s-action { align-items: center; }
  .meta-grid { grid-template-columns: 1fr 1fr; }
}
</style>
