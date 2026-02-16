<template>
  <div class="page-container">
    <div class="detail-wrap">
      <div class="nav-bar">
        <el-button link @click="router.back()" class="back-btn">
          <el-icon><ArrowLeft /></el-icon> 返回
        </el-button>
      </div>

      <div class="glass-section">
        <div class="section-title">
          <el-icon><CircleCheck /></el-icon> 下单结果
        </div>

        <el-result
          icon="success"
          title="下单受理成功"
          sub-title="订单已进入处理流程，后续可在订单列表查看状态"
        >
          <template #extra>
            <div class="order-box">
              <div class="row">
                <span class="k">订单号</span>
                <span class="v mono">{{ orderNo || '-' }}</span>
                <el-button v-if="orderNo" size="small" text @click="copy(orderNo)">复制</el-button>
              </div>
              <div class="row">
                <span class="k">场次ID</span>
                <span class="v mono">{{ screeningId || '-' }}</span>
              </div>
 <div class="row">
                <span class="k">剩余库存</span>
                <span class="v">{{ leftStockText }}</span>
              </div>
            </div>

            <div class="btn-row">
              <el-button 
                type="primary" 
                @click="goOrderList"
                :disabled="isOrderBtnDisabled"
              >
                {{ isOrderBtnDisabled ? `去订单列表 (${countdown}s)` : '去订单列表' }}
              </el-button>
              <el-button @click="goBackToMovie">返回继续选场次</el-button>
            </div>
          </template>
        </el-result>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, CircleCheck } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const orderNo = String(route.query.orderNo || '')
const screeningId = String(route.query.screeningId || '')
const leftStock = route.query.leftStock

const movieId = String(route.query.movieId || '')

// 添加3秒锁定功能
const isOrderBtnDisabled = ref(true)
const countdown = ref(3)
let countdownTimer = null

const leftStockText = computed(() => {
  const n = Number(leftStock)
  if (!Number.isFinite(n)) return '-'
  return `${n} 张`
})

const copy = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制')
  } catch (e) {
    ElMessage.warning('复制失败，请手动复制')
  }
}

const goOrderList = () => {
  router.push({
    name: 'OrderList',
    query: {
      orderNo,
      screeningId,
      leftStock: String(leftStock ?? ''),
      movieId
    }
  })
}

const goBackToMovie = () => {
  if (movieId) router.push(`/movies/${movieId}`)
  else router.back()
}

// 启动倒计时
const startCountdown = () => {
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(countdownTimer)
      countdownTimer = null
      isOrderBtnDisabled.value = false
    }
  }, 1000)
}

onMounted(() => {
  startCountdown()
})

onBeforeUnmount(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
})
</script>

<style scoped>
.page-container {
  min-height: 100vh;
}

.detail-wrap {
  padding: 16px;
}

.glass-section {
  padding: 16px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(10px);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: rgba(255, 255, 255, 0.92);
}

.order-box {
  margin: 12px auto 0;
  padding: 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  max-width: 520px;
}

.row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}

.k {
  width: 72px;
  color: rgba(255, 255, 255, 0.65);
}

.v {
  flex: 1;
  color: rgba(255, 255, 255, 0.92);
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.btn-row {
  margin-top: 14px;
  display: flex;
  gap: 12px;
  justify-content: center;
}
</style>
