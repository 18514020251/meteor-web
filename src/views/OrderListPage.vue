<template>
  <div class="page-container">
    <div class="detail-wrap">
      <div class="nav-bar">
        <el-button link @click="router.back()" class="back-btn">
          <el-icon><ArrowLeft /></el-icon> 返回
        </el-button>
        <div class="nav-title">订单列表</div>
        <div class="nav-right">
          <el-button text @click="clearMock">刷新</el-button>
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
          <el-empty description="暂无订单" :image-size="90" />
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
                  <span class="dot">·</span>
                  <span class="muted">下单：</span>
                  <span>{{ o.createTime }}</span>
                </div>
              </div>

              <div class="right">
                <el-tag size="small" :type="statusTagType(o.status)">
                  {{ statusText(o.status) }}
                </el-tag>
              </div>
            </div>

            <div class="row actions">
              <el-button size="small" @click="openDetail(o)">详情</el-button>
              <el-button size="small" text @click="copy(o.orderNo)">复制订单号</el-button>
            
              <el-button
                v-if="canDelete(o.status)"
                size="small"
                type="danger"
                plain
                @click="doDelete(o)"
              >
                删除
              </el-button>
            </div>

          </div>
        </div>
        <el-pagination
          v-if="total > 0"
          class="pager"
          background
          layout="prev, pager, next, sizes, total"
          :total="total"
          v-model:current-page="page"
          v-model:page-size="size"
          :page-sizes="[10, 20, 50]"
          @current-change="fetchList"
          @size-change="fetchList"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getOrderList, deleteOrder } from '@/api/order'
import { ArrowLeft, Search, InfoFilled, Warning } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

// ====== UI 状态 ======
const activeTab = ref('ALL')
const keyword = ref('')

// ====== 分页 ======
const page = ref(1)
const size = ref(10)
const total = ref(0)

// ====== 后端数据 ======
const loading = ref(false)
const orders = ref([]) 

// tab -> 后端 status 枚举映射
const tabToStatus = (tab) => {
  if (tab === 'PROCESSING') return 'WAIT_PAY'
  if (tab === 'SUCCESS') return 'PAID'
  if (tab === 'FAILED') return 'CLOSED_TIMEOUT' // 你没做取消，先按超时关闭当失败
  return undefined // ALL 不传
}

const clearMock = () => {
  keyword.value = ''
  activeTab.value = 'ALL'
  page.value = 1
  fetchList()
}

const fetchList = async () => {
  loading.value = true
  try {
    const status = tabToStatus(activeTab.value)
    const data = await getOrderList({
      page: page.value,
      size: size.value,
      status
    })

    orders.value = (data.records || []).map(x => ({
      orderNo: x.orderNo,
      status: x.status,                 
      payAmount: x.payAmount,
      expireTime: x.expireTime,
      createTime: x.createTime,

      screeningId: null,
      movieId: null,
      leftStock: null
    }))

    total.value = data.total || 0
    size.value = data.size || size.value
    page.value = data.current || page.value
  } catch (e) {
  } finally {
    loading.value = false
  }
}

const canDelete = (status) => ['CLOSED_TIMEOUT', 'CANCELED', 'REFUNDED'].includes(status)

const doDelete = async (o) => {
  try {
    await ElMessageBox.confirm(
      `确认删除该订单？\n订单号：${o.orderNo}`,
      '提示',
      { type: 'warning' }
    )
    await deleteOrder(o.orderNo)
    ElMessage.success('已删除')
    if (orders.value.length === 1 && page.value > 1) page.value -= 1
    await fetchList()
  } catch (e) {
  }
}

const filtered = computed(() => {
  const kw = keyword.value.trim()
  if (!kw) return orders.value
  return orders.value.filter(o => String(o.orderNo).includes(kw))
})

// 状态展示：用后端枚举
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

// 金额分 -> 元（可选）
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

// 详情：跳你的详情页（你后端已有 GET /order?orderNo=）
const openDetail = (o) => {
  router.push({ path: '/order-detail', query: { orderNo: o.orderNo } })
}

const goBackToMovie = () => router.back()

// tab / 分页变化时拉取
watch(activeTab, () => { page.value = 1; fetchList() })
watch(size, () => { page.value = 1; fetchList() })

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background: radial-gradient(ellipse at bottom, #1B2735 0%, #090A0F 100%);
  overflow-y: auto;
}
.detail-wrap {
  padding: 16px;
  max-width: 1200px;
  margin: 0 auto;
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
  border: 1px solid rgba(255, 255, 255, 0.1);
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
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.3s ease;
}
.order-card:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
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
.pager {
  margin-top: 14px;
  display: flex;
  justify-content: center;
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

/* Element Plus 暗色主题样式覆盖 */
:deep(.el-input__wrapper) {
  background-color: rgba(10, 25, 47, 0.6) !important;
  box-shadow: 0 0 0 1px rgba(64, 158, 255, 0.2) inset !important;
  border-radius: 8px;
  padding: 5px 12px;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #409eff inset, 0 0 12px rgba(64, 158, 255, 0.4) !important;
  background-color: rgba(10, 25, 47, 0.8) !important;
}

:deep(.el-input__inner) {
  color: #ffffff !important;
}

:deep(.el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.3);
}

:deep(.el-radio-button__inner) {
  background-color: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.8);
}

:deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background-color: rgba(64, 158, 255, 0.2);
  border-color: rgba(64, 158, 255, 0.4);
  color: #409eff;
  box-shadow: -1px 0 0 0 rgba(64, 158, 255, 0.4);
}

:deep(.el-radio-button__original-radio:checked + .el-radio-button__inner):focus {
  box-shadow: -1px 0 0 0 rgba(64, 158, 255, 0.4), 0 0 0 1px rgba(64, 158, 255, 0.2) inset;
}

:deep(.el-pagination.is-background .el-pager li) {
  background: rgba(255,255,255,0.05) !important;
  border: 1px solid rgba(255,255,255,0.10) !important;
  color: rgba(255,255,255,0.75) !important;
  border-radius: 10px !important;
}

:deep(.el-pagination.is-background .el-pager li.is-active) {
  background: rgba(64,158,255,0.18) !important;
  border-color: rgba(64,158,255,0.25) !important;
  color: #fff !important;
  box-shadow: 0 0 12px rgba(64,158,255,0.22);
}

:deep(.el-pagination.is-background .btn-prev),
:deep(.el-pagination.is-background .btn-next) {
  background: rgba(255, 255, 255, 0.06) !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  color: rgba(255, 255, 255, 0.85) !important;
  border-radius: 10px !important;
}

:deep(.el-pagination.is-background .btn-prev:hover),
:deep(.el-pagination.is-background .btn-next:hover) {
  background: rgba(64, 158, 255, 0.18) !important;
  border-color: rgba(64, 158, 255, 0.35) !important;
  color: #fff !important;
  box-shadow: 0 0 12px rgba(64, 158, 255, 0.35);
}

:deep(.el-pagination.is-background .btn-prev:disabled),
:deep(.el-pagination.is-background .btn-next:disabled) {
  background: rgba(255, 255, 255, 0.03) !important;
  color: rgba(255, 255, 255, 0.25) !important;
  border-color: rgba(255, 255, 255, 0.06) !important;
}

:deep(.el-button) {
  border-radius: 8px;
}

:deep(.el-button--primary) {
  background: linear-gradient(90deg, #1e3c72 0%, #2a5298 100%);
  border: none;
  font-weight: bold;
  letter-spacing: 1px;
  box-shadow: 0 4px 15px rgba(30, 60, 114, 0.4);
  transition: all 0.3s ease;
}

:deep(.el-button--primary:hover) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(64, 158, 255, 0.6);
  filter: brightness(1.2);
}

:deep(.el-button--text) {
  color: rgba(255, 255, 255, 0.8);
}

:deep(.el-button--text:hover) {
  color: #409eff;
}

:deep(.el-empty__description) {
  color: rgba(255, 255, 255, 0.6);
}

:deep(.el-tag) {
  border-radius: 6px;
  font-size: 12px;
  padding: 2px 8px;
}

:deep(.el-tag--success) {
  background-color: rgba(103, 194, 58, 0.2);
  border-color: rgba(103, 194, 58, 0.3);
  color: #67c23a;
}

:deep(.el-tag--warning) {
  background-color: rgba(230, 162, 60, 0.2);
  border-color: rgba(230, 162, 60, 0.3);
  color: #e6a23c;
}

:deep(.el-tag--info) {
  background-color: rgba(144, 147, 153, 0.2);
  border-color: rgba(144, 147, 153, 0.3);
  color: #909399;
}
</style>
