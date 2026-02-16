<template>
  <div class="page-container">
    <canvas id="meteor-canvas" class="meteor-bg"></canvas>

    <div class="pay-wrap">
      <div class="nav-bar">
        <el-button link @click="router.back()" class="back-btn">
          <el-icon><ArrowLeft /></el-icon> 取消支付
        </el-button>
      </div>

      <div class="glass-section" v-loading="loading">
        <div class="pay-header">
          <div class="amount-label">支付金额</div>
          <div class="amount-value">
            <span class="symbol">￥</span>{{ fenToYuan(orderInfo?.payAmount) }}
          </div>
        </div>

        <div class="order-simple-info">
          <div class="info-item">
            <span class="label">订单编号</span>
            <span class="val">{{ orderInfo?.orderNo }}</span>
          </div>
          <div class="info-item">
            <span class="label">购买内容</span>
            <span class="val">电影票 x {{ orderInfo?.item?.ticketCount || 1 }}</span>
          </div>
        </div>

        <div class="pay-methods">
          <div class="method-title">选择支付方式</div>
          <div
            v-for="m in methods"
            :key="m.id"
            class="method-card"
            :class="{ active: activeMethod === m.id }"
            @click="activeMethod = m.id"
          >
            <el-icon v-if="m.id === 'WECHAT'  "><ChatDotRound /></el-icon>
            <el-icon v-else><Wallet /></el-icon>
            <span class="m-name">{{ m.name }}</span>
            <div class="check-circle"></div>
          </div>
        </div>

        <el-button
          type="primary"
          class="confirm-pay-btn"
          :loading="paying"
          @click="handlePay"
        >
          确认支付 ￥{{ fenToYuan(orderInfo?.payAmount) }}
        </el-button>
      </div>

      <!-- ✅ 二维码弹窗 -->
      <el-dialog
        v-model="qrVisible"
        width="340px"
        center
        :close-on-click-modal="false"
        @close="stopPolling"
      >
        <div class="qr-wrap">
          <div class="qr-title">
            请使用{{ payData?.channel === 1 ? '微信' : '支付宝' }}扫码（模拟）
          </div>

          <canvas ref="qrCanvasRef" class="qr-canvas"></canvas>

          <div class="qr-sub">
            payNo：<span class="mono">{{ payData?.payNo }}</span>
          </div>
          <div class="qr-sub">
            有效期至：{{ payData?.expireTime || '-' }}
          </div>
          <el-link :href="debugQrUrl" target="_blank">在新标签打开模拟扫码页</el-link>

          <div class="qr-tip">
            扫码后会打开“模拟支付页”，输入密码：<b>123456</b>
          </div>
        </div>
      </el-dialog>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, ChatDotRound, Wallet } from '@element-plus/icons-vue'
import QRCode from 'qrcode'
import { getOrderDetail, createPay } from '@/api/order'
import { getUserInfo } from '@/api/user'


const route = useRoute()
const router = useRouter()
const orderNo = String(route.query.orderNo || '').trim()

const loading = ref(false)
const paying = ref(false)
const orderInfo = ref(null)

const activeMethod = ref('WECHAT')
const methods = [
  { id: 'WECHAT', name: '微信支付' },
  { id: 'ALIPAY', name: '支付宝' }
]

const qrVisible = ref(false)
const qrCanvasRef = ref(null)
const payData = ref(null)

let pollTimer = null

const fenToYuan = (fen) => (fen === null || fen === undefined) ? '0.00' : (fen / 100).toFixed(2)

const fetchOrder = async () => {
  if (!orderNo) {
    ElMessage.error('缺少 orderNo')
    router.back()
    return
  }
  loading.value = true
  try {
    const data = await getOrderDetail(orderNo)
    orderInfo.value = data
    if (data.status !== 'WAIT_PAY') {
      ElMessage.warning('该订单不可支付（已非待支付）')
      router.back()
    }
  } finally {
    loading.value = false
  }
}


const handlePay = async () => {
  if (!orderInfo.value) return

  paying.value = true
  try {
    const channel = activeMethod.value === 'WECHAT' ? 1 : 2

    
    const res = await createPay({
      orderNo: orderInfo.value.orderNo,
      channel
    })
    payData.value = res

    const user = await getUserInfo()
    const uid = user.userId

    const origin = import.meta.env.VITE_PUBLIC_ORIGIN || location.origin
    const qrUrl =
      `${origin}/pay-sim` +
      `?payNo=${encodeURIComponent(res.payNo)}` +
      `&orderNo=${encodeURIComponent(orderInfo.value.orderNo)}` +
      `&channel=${encodeURIComponent(res.channel)}` +
      `&uid=${encodeURIComponent(uid)}`

    const debugQrUrl = ref('')
    debugQrUrl.value = qrUrl
    console.log(qrUrl)

    qrVisible.value = true
    await nextTick()
    await QRCode.toCanvas(qrCanvasRef.value, qrUrl, { width: 220 })


  } finally {
    paying.value = false
  }
}

const startPolling = () => {
  stopPolling()
  pollTimer = setInterval(async () => {
    try {
      const d = await getOrderDetail(orderNo)
      orderInfo.value = d
      if (d.status === 'PAID') {
        stopPolling()
        qrVisible.value = false
        ElMessage.success('支付成功')
        router.replace({ path: '/order-detail', query: { orderNo } })
      }
      if (d.status === 'CLOSED_TIMEOUT' || d.status === 'CANCELED') {
        stopPolling()
        qrVisible.value = false
        ElMessage.warning('订单已关闭，无法支付')
      }
    } catch {}
  }, 2000)
}

const stopPolling = () => {
  if (pollTimer) clearInterval(pollTimer)
  pollTimer = null
}

onUnmounted(stopPolling)

onMounted(fetchOrder)

// （你原来有倒计时的话，这里可继续接你的 countdownText 计算）
const countdownText = computed(() => '-')
</script>

<style scoped>
.pay-wrap { padding: 16px; max-width: 500px; margin: 0 auto; position: relative; z-index: 10; }
.pay-header { text-align: center; padding: 20px 0; }
.amount-label { font-size: 14px; color: rgba(255,255,255,0.6); }
.amount-value { font-size: 36px; font-weight: bold; color: #fff; margin: 8px 0; }
.symbol { font-size: 20px; margin-right: 4px; }
.countdown-tip { font-size: 12px; color: #e6a23c; }

.order-simple-info {
  background: rgba(255,255,255,0.05);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 20px;
}
.info-item { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; }
.label { color: rgba(255,255,255,0.4); }
.val { color: #fff; }

.method-title { font-size: 14px; color: rgba(255,255,255,0.8); margin-bottom: 12px; }
.method-card {
  display: flex; align-items: center; gap: 12px;
  padding: 14px; background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px; margin-bottom: 10px; cursor: pointer;
  transition: all 0.3s;
}
.method-card.active {
  background: rgba(64, 158, 255, 0.1);
  border-color: #409eff;
}
.m-name { flex: 1; color: #fff; }
.check-circle { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.2); border-radius: 50%; }
.active .check-circle { background: #409eff; border-color: #409eff; }

.confirm-pay-btn { width: 100%; height: 44px; margin-top: 20px; border-radius: 10px; font-weight: bold; }

/* ✅ 弹窗二维码样式 */
.qr-wrap { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 6px 0; }
.qr-title { font-size: 14px; font-weight: 700; }
.qr-canvas { display:block; }
.qr-sub { font-size: 12px; opacity: .8; }
.qr-tip { margin-top: 6px; font-size: 12px; opacity: .9; text-align: center; }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
</style>
