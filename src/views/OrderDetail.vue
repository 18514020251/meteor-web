<template>
  <div class="page-container">
    <div class="detail-wrap">
      <div class="nav-bar">
        <el-button link @click="router.back()" class="back-btn">
          <el-icon><ArrowLeft /></el-icon> 返回
        </el-button>
        <div class="nav-title">订单详情</div>
        <div class="nav-right">
          <el-button text @click="fetchDetail">刷新</el-button>
        </div>
      </div>

        <div 
          class="glass-section" 
          v-loading="loading"
          element-loading-background="rgba(0, 0, 0, 0.2)"
        >
        <div v-if="!detail" class="empty">
          <el-empty description="订单不存在或已删除" :image-size="90" />
        </div>

        <template v-else>
          <div class="card">
            <div class="row">
              <div class="k">订单号</div>
              <div class="v mono">{{ detail.orderNo }}</div>
            </div>

            <div class="row">
              <div class="k">状态</div>
              <div class="v">
                <el-tag size="small" :type="statusTagType(detail.status)">
                  {{ statusText(detail.status) }}
                </el-tag>
              </div>
            </div>

            <div class="row">
              <div class="k">实付金额</div>
              <div class="v"><b>{{ fenToYuan(detail.payAmount) }}</b> 元</div>
            </div>

            <div class="row" v-if="detail.status === 'WAIT_PAY'">
              <div class="k">支付倒计时</div>
              <div class="v">
                <b>{{ countdownText }}</b>
              </div>
            </div>

            <div class="row">
              <div class="k">下单时间</div>
              <div class="v">{{ detail.createTime || '-' }}</div>
            </div>

            <div class="row">
              <div class="k">支付截止</div>
              <div class="v">{{ detail.expireTime || '-' }}</div>
            </div>

            <div class="row">
              <div class="k">支付时间</div>
              <div class="v">{{ detail.payTime || '-' }}</div>
            </div>

            <div class="row">
              <div class="k">关闭时间</div>
              <div class="v">{{ detail.closeTime || '-' }}</div>
            </div>

            <div class="row">
              <div class="k">支付渠道</div>
              <div class="v">{{ detail.payChannel || '-' }}</div>
            </div>

            <div class="row">
              <div class="k">支付单号</div>
              <div class="v mono">{{ detail.payNo || '-' }}</div>
            </div>
          </div>

          <div class="card" v-if="detail.item">
            <div class="section-title">订单项</div>

            <div class="row">
              <div class="k">场次ID</div>
              <div class="v mono">{{ detail.item.screeningId }}</div>
            </div>
            <div class="row">
              <div class="k">电影ID</div>
              <div class="v mono">{{ detail.item.movieId }}</div>
            </div>
            <div class="row">
              <div class="k">票数</div>
              <div class="v">{{ detail.item.ticketCount }}</div>
            </div>
            <div class="row">
              <div class="k">单价</div>
              <div class="v">{{ fenToYuan(detail.item.unitPrice) }} 元</div>
            </div>

            <div class="section-title" style="margin-top: 10px;">快照</div>
            <div v-if="snapshotParsed" class="snapshot">
              <div class="row">
                <div class="k">startTime</div>
                <div class="v mono">{{ snapshotParsed.startTime || '-' }}</div>
              </div>
              <div class="row">
                <div class="k">price</div>
                <div class="v">{{ fenToYuan(snapshotParsed.price) }} 元</div>
              </div>
              <div class="row">
                <div class="k">screeningId</div>
                <div class="v mono">{{ snapshotParsed.screeningId || '-' }}</div>
              </div>
            </div>
            <pre v-else class="snapshot-raw">{{ detail.item.snapshot }}</pre>
          </div>

          <div class="actions">
            <el-button size="small" text @click="copy(detail.orderNo)">复制订单号</el-button>

            <el-button
              v-if="canDelete(detail.status)"
              size="small"
              type="danger"
              plain
              @click="doDelete"
            >
              删除订单
            </el-button>
          </div>
          <div class="actions">
            <el-button 
              v-if="detail.status === 'WAIT_PAY'" 
              type="primary" 
              class="pay-btn"
              @click="goToPay"
            >
              立即支付
            </el-button>

            </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { getOrderDetail, deleteOrder } from '@/api/order'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const detail = ref(null)
const timer = ref(null)
const nowTs = ref(Date.now())

const orderNo = computed(() => String(route.query.orderNo || '').trim())

const goToPay = () => {
  router.push({
    path: '/order/pay',
    query: { orderNo: detail.value.orderNo }
  })
}
const fetchDetail = async () => {
  if (!orderNo.value) {
    ElMessage.error('缺少 orderNo')
    return
  }
  loading.value = true
  try {
    const data = await getOrderDetail(orderNo.value)

    detail.value = data

    // 启动倒计时 tick（只有待支付才需要）
    if (detail.value?.status === 'WAIT_PAY') startTick()
    else stopTick()
  } finally {
    loading.value = false
  }
}

const startTick = () => {
  stopTick()
  timer.value = setInterval(() => {
    nowTs.value = Date.now()
  }, 1000)
}

const stopTick = () => {
  if (timer.value) clearInterval(timer.value)
  timer.value = null
}

const snapshotParsed = computed(() => {
  const s = detail.value?.item?.snapshot
  if (!s) return null
  try {
    return JSON.parse(s)
  } catch {
    return null
  }
})

const countdownText = computed(() => {
  const exp = detail.value?.expireTime
  if (!exp) return '-'
  const expMs = Date.parse(exp)
  if (Number.isNaN(expMs)) return '-'
  let diff = expMs - nowTs.value
  if (diff <= 0) return '已过期'

  const sec = Math.floor(diff / 1000)
  const mm = String(Math.floor(sec / 60)).padStart(2, '0')
  const ss = String(sec % 60).padStart(2, '0')
  return `${mm}:${ss}`
})

const statusText = (s) => {
  const map = {
    WAIT_PAY: '待支付',
    PAID: '已支付',
    CANCELED: '已取消',
    CLOSED_TIMEOUT: '超时关闭',
    REFUNDING: '退款中',
    REFUNDED: '已退款'
  }
  return map[s] || s || '未知'
}

const statusTagType = (s) => {
  if (s === 'PAID') return 'success'
  if (s === 'WAIT_PAY') return 'warning'
  if (s === 'CLOSED_TIMEOUT' || s === 'CANCELED') return 'info'
  if (s === 'REFUNDING') return 'warning'
  if (s === 'REFUNDED') return 'success'
  return ''
}

const fenToYuan = (fen) => {
  if (fen === null || fen === undefined) return '-'
  return (fen / 100).toFixed(2)
}

const copy = async (text) => {
  try {
    await navigator.clipboard.writeText(String(text))
    ElMessage.success('已复制')
  } catch {
    ElMessage.warning('复制失败，请手动复制')
  }
}

const canDelete = (status) => ['CLOSED_TIMEOUT', 'CANCELED', 'REFUNDED'].includes(status)

const doDelete = async () => {
  await ElMessageBox.confirm('确认删除该订单？（逻辑删除）', '提示', { type: 'warning' })
  await deleteOrder(detail.value.orderNo)
  ElMessage.success('已删除')
  router.back()
}

onMounted(fetchDetail)
onUnmounted(stopTick)
</script>

<style scoped>
.page-container { min-height: 100vh; }
.detail-wrap { padding: 16px; }
.nav-bar { display:flex; align-items:center; gap:10px; margin-bottom:12px; }
.nav-title { flex:1; text-align:center; font-weight:700; color: rgba(255,255,255,0.92); }
.nav-right { width:64px; display:flex; justify-content:flex-end; }

.glass-section {
  padding: 16px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(10px);
}

.empty { padding: 18px 0 8px; display:flex; justify-content:center; }

.card {
  padding: 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.05);
  margin-bottom: 12px;
}

.row { display:flex; align-items:center; justify-content:space-between; gap:10px; padding: 6px 0; }
.k { color: rgba(255,255,255,0.6); font-size: 12px; }
.v { color: rgba(255,255,255,0.92); font-size: 13px; }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }

.section-title { font-weight: 700; color: rgba(255,255,255,0.9); margin-bottom: 6px; }
.snapshot-raw {
  margin: 0;
  padding: 10px;
  border-radius: 10px;
  background: rgba(0,0,0,0.25);
  color: rgba(255,255,255,0.85);
  white-space: pre-wrap;
  word-break: break-all;
}
.actions { display:flex; gap:10px; justify-content:flex-end; }
:deep(.el-empty__description p) {
  color: rgba(255, 255, 255, 0.5) !important;
}

:deep(.el-empty__image) {
  filter: invert(1) opacity(0.6); /* 如果是默认位图，反相并降低透明度 */
}
/* 统一导航栏按钮颜色 */
.nav-bar .el-button {
  color: rgba(255, 255, 255, 0.8);
}

.nav-bar .el-button:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.1) !important;
}

/* 针对危险按钮（删除）的调整 */
.el-button--danger.is-plain {
  --el-button-bg-color: rgba(245, 108, 108, 0.1);
  --el-button-border-color: rgba(245, 108, 108, 0.5);
  background-color: var(--el-button-bg-color);
}
:deep(.el-tag) {
  background-color: rgba(255, 255, 255, 0.05) !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
  color: rgba(255, 255, 255, 0.9);
}

/* 针对不同状态的 Tag 进行微调 */
:deep(.el-tag--success) { color: #67c23a; }
:deep(.el-tag--warning) { color: #e6a23c; }
:deep(.el-tag--info) { color: #909399; }
</style>
