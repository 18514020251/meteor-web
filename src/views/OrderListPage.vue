<template>
  <div class="page-container">
    <div class="detail-wrap">
      <div class="nav-bar">
        <el-button link @click="router.back()" class="back-btn">
          <el-icon><ArrowLeft /></el-icon> 返回
        </el-button>
        <div class="nav-title">订单列表</div>
        <div class="nav-right">
          <el-button text @click="clearMock">清空</el-button>
        </div>
      </div>

      <div class="glass-section">
        <div class="toolbar">
          <el-input
            v-model="keyword"
            placeholder="搜索订单号 / 场次ID"
            clearable
            class="search-input"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

          <el-radio-group v-model="activeTab" size="small">
            <el-radio-button label="ALL">全部</el-radio-button>
            <el-radio-button label="PROCESSING">处理中</el-radio-button>
            <el-radio-button label="SUCCESS">成功</el-radio-button>
            <el-radio-button label="FAILED">失败</el-radio-button>
          </el-radio-group>
        </div>

        <div v-if="filtered.length === 0" class="empty">
          <el-empty description="暂无订单（目前是原型页）" :image-size="90" />
          <el-button type="primary" @click="goBackToMovie" round>去选场次</el-button>
        </div>

        <div v-else class="order-list">
          <div class="order-card" v-for="o in filtered" :key="o.orderNo">
            <div class="row top">
              <div class="left">
                <div class="order-no">
                  <span class="k">订单号</span>
                  <span class="v mono">{{ o.orderNo }}</span>
                </div>
                <div class="sub">
                  <span class="muted">场次ID：</span>
                  <span class="mono">{{ o.screeningId || '-' }}</span>
                  <span class="dot">·</span>
                  <span class="muted">下单：</span>
                  <span>{{ o.createdAt }}</span>
                </div>
              </div>

              <div class="right">
                <el-tag size="small" :type="statusTagType(o.status)">
                  {{ statusText(o.status) }}
                </el-tag>
              </div>
            </div>

            <div class="row mid">
              <div class="hint" v-if="o.leftStock !== null && o.leftStock !== undefined">
                <el-icon class="hint-icon"><InfoFilled /></el-icon>
                当前余票：<b>{{ o.leftStock }}</b>
              </div>
              <div class="hint muted" v-else>
                <el-icon class="hint-icon"><InfoFilled /></el-icon>
                余票未知（后续对接接口）
              </div>
            </div>

            <div class="row actions">
              <el-button size="small" @click="openDetail(o)">详情(占位)</el-button>
              <el-button size="small" text @click="copy(o.orderNo)">复制订单号</el-button>
              <el-button
                size="small"
                type="primary"
                plain
                @click="buyAgain(o)"
              >
                再来一单
              </el-button>
            </div>
          </div>
        </div>

        <div class="footer-tip">
          <el-icon><Warning /></el-icon>
          说明：你后端目前只有“抢票受理”，这里是订单列表原型。后续接入接口后可显示支付状态/座位/影院等。
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Search, InfoFilled, Warning } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

/**
 * ===== 原型数据结构 =====
 * status: PROCESSING | SUCCESS | FAILED
 */
const STORAGE_KEY = 'meteor_mock_orders_v1'

const loadLocal = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

const saveLocal = (arr) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr))
}

const orders = ref(loadLocal())

const activeTab = ref('ALL')
const keyword = ref('')

const statusText = (s) => {
  const map = {
    PROCESSING: '处理中',
    SUCCESS: '成功',
    FAILED: '失败'
  }
  return map[s] || s || '未知'
}

const statusTagType = (s) => {
  if (s === 'SUCCESS') return 'success'
  if (s === 'FAILED') return 'danger'
  if (s === 'PROCESSING') return 'warning'
  return ''
}

const filtered = computed(() => {
  const kw = keyword.value.trim()
  return orders.value
    .filter(o => {
      if (activeTab.value === 'ALL') return true
      return o.status === activeTab.value
    })
    .filter(o => {
      if (!kw) return true
      return String(o.orderNo).includes(kw) || String(o.screeningId || '').includes(kw)
    })
})

// 从下单成功页带来的参数：插入一条“最新订单”
const tryInsertFromQuery = () => {
  const orderNo = String(route.query.orderNo || '')
  if (!orderNo) return

  const screeningId = String(route.query.screeningId || '')
  const movieId = String(route.query.movieId || '')
  const leftStockRaw = route.query.leftStock
  const leftStock = Number.isFinite(Number(leftStockRaw)) ? Number(leftStockRaw) : null

  // 防重复插入（刷新页面时）
  const exists = orders.value.some(o => String(o.orderNo) === orderNo)
  if (exists) return

  const createdAt = new Date().toLocaleString()

  const item = {
    orderNo,
    screeningId: screeningId || null,
    movieId: movieId || null,
    leftStock,
    status: 'PROCESSING', // 原型：默认处理中（因为你后端只是“受理成功”）
    createdAt
  }

  orders.value = [item, ...orders.value]
  saveLocal(orders.value)

  // 可选：把 query 清掉，避免用户刷新又带着 query（这里不强制）
}

const copy = async (text) => {
  try {
    await navigator.clipboard.writeText(String(text))
    ElMessage.success('已复制')
  } catch {
    ElMessage.warning('复制失败，请手动复制')
  }
}

const openDetail = (o) => {
  ElMessage.info(`详情页待开发：orderNo=${o.orderNo}`)
}

// “再来一单”：返回对应电影详情页（继续选场次）
const buyAgain = (o) => {
  if (o.movieId) {
    router.push(`/movies/${o.movieId}`)
    return
  }
  ElMessage.info('缺少 movieId（后续可以在订单详情接口补）')
}

const goBackToMovie = () => {
  // 没有 movieId 时就回上一页
  const movieId = String(route.query.movieId || '')
  if (movieId) router.push(`/movies/${movieId}`)
  else router.back()
}

const clearMock = () => {
  orders.value = []
  saveLocal([])
  ElMessage.success('已清空（原型数据）')
}

onMounted(() => {
  tryInsertFromQuery()
})
</script>

<style scoped>
.page-container {
  min-height: 100vh;
}
.detail-wrap {
  padding: 16px;
}
.nav-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.nav-title {
  flex: 1;
  text-align: center;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.92);
}
.nav-right {
  width: 64px;
  display: flex;
  justify-content: flex-end;
}
.glass-section {
  padding: 16px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(10px);
}
.toolbar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 14px;
}
.search-input {
  width: 100%;
}
.empty {
  padding: 18px 0 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.order-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.order-card {
  padding: 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.05);
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.row.mid {
  margin-top: 10px;
}
.row.actions {
  margin-top: 12px;
  justify-content: flex-end;
  gap: 10px;
}
.left {
  flex: 1;
  min-width: 0;
}
.order-no {
  display: flex;
  gap: 8px;
  align-items: baseline;
}
.k {
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
}
.v {
  color: rgba(255, 255, 255, 0.92);
  font-size: 14px;
}
.sub {
  margin-top: 6px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}
.dot {
  opacity: 0.7;
}
.muted {
  opacity: 0.85;
}
.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}
.hint {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  color: rgba(255, 255, 255, 0.85);
}
.hint-icon {
  opacity: 0.85;
}
.footer-tip {
  margin-top: 14px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.75);
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 12px;
}
</style>
