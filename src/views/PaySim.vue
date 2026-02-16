<template>
  <div class="wrap">
    <h2>模拟扫码支付</h2>

    <div class="info">
      <div>payNo：<b class="mono">{{ payNo }}</b></div>
      <div>orderNo：<b class="mono">{{ orderNo }}</b></div>
      <div>uid：<b class="mono">{{ uid }}</b></div>
      <div>channel：<b>{{ channelText }}</b></div>
    </div>

    <el-input
      v-model="payPwd"
      maxlength="6"
      show-password
      placeholder="请输入6位支付密码（例如 123456）"
      style="margin: 16px 0;"
    />

    <el-button type="primary" :loading="loading" style="width: 100%;" @click="onConfirm">
      确认支付
    </el-button>

    <div class="tip">正确密码示例：123456</div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { confirmPay } from '@/api/order'

const route = useRoute()

const payNo = computed(() => String(route.query.payNo || '').trim())
const orderNo = computed(() => String(route.query.orderNo || '').trim())
const uid = computed(() => Number(route.query.uid || 0))
const channel = computed(() => Number(route.query.channel || 0))
const channelText = computed(() => (channel.value === 1 ? '微信' : channel.value === 2 ? '支付宝' : '未知'))

const payPwd = ref('')
const loading = ref(false)

const onConfirm = async () => {
  if (!payNo.value) return ElMessage.error('缺少 payNo')
  if (!uid.value) return ElMessage.error('缺少 uid')
  if (payPwd.value.length !== 6) return ElMessage.warning('请输入6位密码')

  loading.value = true
  try {
    const ok = await confirmPay({
      payNo: payNo.value,
      payPwd: payPwd.value,
      uid: uid.value
    })

    if (ok === true) {
      ElMessage.success('支付成功（模拟）')
    } else {
      ElMessage.error('支付失败：密码错误/已过期/已支付')
    }
  } catch (e) {
    const status = e?.response?.status
    if (status === 403) {
      ElMessage.error('403：网关/鉴权/CORS 拒绝了请求')
    } else {
      ElMessage.error('请求失败：' + (e?.message || '未知错误'))
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.wrap { max-width: 420px; margin: 30px auto; padding: 18px; }
.info { font-size: 13px; line-height: 1.8; opacity: .9; }
.tip { margin-top: 12px; font-size: 12px; opacity: .6; }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
</style>
