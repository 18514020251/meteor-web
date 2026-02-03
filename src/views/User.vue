<template>
  <div class="user-wrapper">
    <div class="login-container">
      <div class="stars"></div>
      <div class="meteor-container">
        <div v-for="n in 6" :key="n" class="meteor"></div>
      </div>

      <header class="glass-nav">
        <div v-if="userData" class="nav-content">
          <div class="brand">METEOR <span class="sub">CINEMA</span></div>

          <div class="user-portal">
            <div class="user-text">
              <span class="name">{{ userData.username }}</span>
              <span class="role">UID: {{ userData.userId || '000' }}</span>
                <span class="phone" v-if="hasPhone">
                  {{ maskedPhone }}
                </span>
                <span class="phone phone-missing" v-else @click="showProfilePanel = true">
                  未绑定手机号（点我去绑）
                </span>
            </div>

            <el-badge
              :value="unreadCount"
              :max="99"
              :hidden="unreadCount <= 0"
              class="nav-badge-item"
            >
              <el-button link class="nav-icon-btn" :icon="Message" @click="handleMailClick"></el-button>
            </el-badge>
            <el-button link class="nav-icon-btn" :icon="Setting" @click="handleSettingClick"></el-button>
            
            <el-avatar
              :size="42"
              :src="userData.avatar"
              class="avatar-glow clickable"
              @click="showProfilePanel = true"
            />

            <el-button link class="exit-btn" :icon="SwitchButton" @click="handleLogout"></el-button>
          </div>
        </div>
      </header>

      <main class="content-body">
        <el-row :gutter="25">
          <el-col :md="17">
            <div class="glass-section">
              <div class="section-title">
                <el-icon><VideoCamera /></el-icon> 正在热映 / 实时抢购
              </div>
              
              <div class="movie-grid">
                <div v-for="movie in hotMovies" :key="movie.id" class="glass-card">
                  <div class="card-inner">
                    <div class="poster-box">
                      <img :src="movie.poster" />
                      <div class="badge" v-if="movie.isFlash">抢票中</div>
                    </div>
                    <div class="info-box">
                      <h4>{{ movie.title }}</h4>
                      <p>{{ movie.type }}</p>
                      <div class="footer-action">
                        <span class="score">{{ movie.score }}分</span>
                        <el-button type="primary" size="small" round @click="handleGrab(movie)">
                          {{ movie.isFlash ? '立即抢' : '预约' }}
                        </el-button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-col>

          <el-col :md="7">
            <div class="glass-section side-bar">
              <div class="section-title"><el-icon><DataLine /></el-icon> 实时热度榜</div>
              <div class="rank-list">
                <div v-for="(item, index) in rankData" :key="index" class="rank-item">
                  <span class="rank-num" :class="'top-' + (index+1)">{{ index + 1 }}</span>
                  <span class="rank-name">{{ item.name }}</span>
                  <span class="rank-hot">{{ item.hot }}℃</span>
                </div>
              </div>
              <div class="quick-status">
                <div class="status-card"><p>我的抢票</p><h3>02</h3></div>
                <div class="status-card"><p>待付款</p><h3 class="warn">01</h3></div>
              </div>
            </div>
          </el-col>
        </el-row>
      </main>
      <el-drawer
  v-model="showInbox"
  direction="ltr"
  size="700px"
  :with-header="false"
  class="inbox-drawer"
>

  <div class="inbox-panel">
<div class="inbox-header">
  <div class="inbox-title">
    <el-icon><Message /></el-icon>
    <span>我的消息</span>
    <span class="inbox-sub" v-if="inboxTotal">共 {{ inboxTotal }} 条</span>
  </div>

<div class="inbox-actions">
  <!-- 发光胶囊筛选 -->
  <div class="seg-wrap">
    <el-segmented
      v-model="inboxQuery.readStatus"
      :options="readStatusOptions"
      size="small"
    />
  </div>

  <!-- 批量操作：一键已读 / 一键删除 -->
  <div class="bulk-actions">
    <button
      class="bulk-btn bulk-read"
      :disabled="inboxLoading || inboxTotal === 0"
      @click.stop="onMarkAllRead"
      title="一键标记当前列表为已读（接口后续实现）"
    >
      一键已读
    </button>

    <button
      class="bulk-btn bulk-del"
      :disabled="inboxLoading || inboxTotal === 0"
      @click.stop="onDeleteAll"
      title="一键删除当前列表（接口后续实现）"
    >
      一键删除
    </button>
  </div>

  <!-- 刷新按钮 -->
  <el-button
    link
    class="icon-glass-btn"
    @click="fetchInbox"
    :disabled="inboxLoading"
    title="刷新"
  >
    <el-icon class="spin-when-loading" :class="{ spinning: inboxLoading }">
      <Refresh />
    </el-icon>
  </el-button>

  <!-- 关闭按钮 -->
  <el-button link class="icon-glass-btn close" @click="showInbox = false" title="关闭">
    <el-icon><Close /></el-icon>
  </el-button>
</div>

</div>

<div class="inbox-body" v-loading="inboxLoading">
  <div v-if="!inboxLoading && inboxList.length === 0" class="empty">
    暂无消息
  </div>

  <transition-group name="msg-fly" tag="div" class="msg-list">
    <div
      v-for="(msg, index) in inboxList"
      :key="msg.id" 
      class="msg-card"
      :class="{
        unread: msg.readStatus === 0,
        active: activeMsgId === msg.id
      }"
      :style="{ '--i': index }"
      @click.stop="selectMessage(msg)"
    >
      <div class="msg-top">
        <span class="msg-title">{{ msg.title }}</span>

        <div class="msg-top-right">
          <span class="msg-time">{{ formatTime(msg.createTime) }}</span>

          <transition name="pop-actions">
            <div
              v-if="activeMsgId === msg.id"
              class="msg-actions-top"
              @click.stop
            >
              <button class="action-btn read" @click="onMarkRead(msg)">已读</button>
              <button class="action-btn del" @click="onDelete(msg)">删除</button>
            </div>
          </transition>
        </div>
      </div>

      <div class="msg-content">{{ msg.content }}</div>
    </div>
  </transition-group>
</div>

    <div class="inbox-footer">
      <el-pagination
        layout="prev, pager, next"
        :total="inboxTotal"
        :page-size="inboxQuery.pageSize"
        :current-page="inboxQuery.pageNum"
        @current-change="handleInboxPageChange"
        small
        background
      />
    </div>
  </div>
</el-drawer>

    </div>

    <transition name="slide-right">
      <div v-if="showProfilePanel" class="profile-panel-overlay" @click.self="showProfilePanel = false">
        <div class="profile-glass-panel">
          <div class="panel-header">
            <h3>个人中心</h3>
            <el-icon class="close-icon" @click="showProfilePanel = false"><Close /></el-icon>
          </div>

          <div class="profile-content">
            <div class="avatar-edit-section">
              <el-image 
                class="avatar-glow preview-avatar"
                :src="userData.avatar" 
                :preview-src-list="[userData.avatar]"
                :preview-teleported="true"  :hide-on-click-modal="true" fit="cover"
              />
              <p class="uid-tag">ID: {{ userData.userId }}</p>

              <el-upload
                :show-file-list="false"
                :before-upload="beforeAvatarUpload"
                :http-request="uploadAvatar"
              >
                <el-button size="small" type="primary" plain>修改头像</el-button>
              </el-upload>
            </div>

<el-form label-position="top" class="custom-form">
  <el-form-item label="用户名" class="fade-in-item" style="--delay: 1">
    <el-input v-model="profileForm.username" placeholder="请输入新用户名" :prefix-icon="User" />
  </el-form-item>

  <el-form-item label="手机号" class="fade-in-item" style="--delay: 2">
    <el-input v-model="profileForm.phone" placeholder="绑定手机号" :prefix-icon="Iphone" />
  </el-form-item>

  <el-form-item label="验证码" class="fade-in-item" style="--delay: 3">
    <div class="code-input-group">
      <el-input v-model="profileForm.code" placeholder="输入验证码" :prefix-icon="Lock" />
      <el-button class="get-code-btn" :disabled="countdown > 0" @click="sendCode">
        {{ countdown > 0 ? countdown + 's' : '获取' }}
      </el-button>
    </div>
  </el-form-item>

  <el-button type="primary" class="save-btn fade-in-item" style="--delay: 4" @click="handleUpdate">
    保存资料
  </el-button>
</el-form>
          </div>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="showLogoutConfirm" class="logout-overlay">
        <div class="logout-glass-card">
          <div class="logout-icon"><el-icon><Warning /></el-icon></div>
          <h3>确认退出？</h3>
          <p style="color: rgba(255,255,255,0.6); font-size: 14px; margin-bottom: 20px;">退出后需重新登录</p>
          <div class="logout-actions">
            <button class="btn-cancel" @click="showLogoutConfirm = false">取消</button>
            <button class="btn-confirm" @click="confirmLogout">确认</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watchEffect, onBeforeUnmount, onMounted, watch } from 'vue'

import { VideoCamera, DataLine, SwitchButton, Warning, Close, Message, Setting, Refresh } from '@element-plus/icons-vue'

import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { storeToRefs } from 'pinia'
import http from '../request/http'

const showInbox = ref(false)
const inboxLoading = ref(false)
const inboxList = ref([])
const inboxTotal = ref(0)

const inboxQuery = reactive({
  readStatus: null, // null=全部；0=未读；1=已读（按你后端枚举）
  pageNum: 1,
  pageSize: 12
})

const readStatusOptions = [
  { label: '全部', value: null },
  { label: '未读', value: 0 },
  { label: '已读', value: 1 }
]

const activeMsgId = ref(null)

const selectMessage = (msg) => {
  activeMsgId.value = (activeMsgId.value === msg.id) ? null : msg.id
}

const onMarkRead = async (msg) => {
  if (msg.readStatus === 1) {
    ElMessage.info('该消息已是已读状态')
    return
  }

  try {
    await http.post(`/message/${msg.id}/read`)

    // 1. 本地状态更新（不用重新 fetch）
    msg.readStatus = 1
    msg.readTime = new Date().toISOString()

    // 2. 未读数同步减少
    if (unreadCount.value > 0) {
      unreadCount.value--
    }

    // 3. 关闭操作按钮
    activeMsgId.value = null

    ElMessage.success('已标记为已读')
  } catch (e) {
    // 拦截器一般已经处理
  }
}


const onDelete = async (msg) => {
  try {
    await http.delete(`/message/${msg.id}`)

    // 1) 如果删的是未读，未读数 -1
    if (msg.readStatus === 0 && unreadCount.value > 0) {
      unreadCount.value--
    }

    // 2) 从当前列表里移除（不必重新 fetch）
    const idx = inboxList.value.findIndex((x) => x.id === msg.id)
    if (idx !== -1) inboxList.value.splice(idx, 1)

    // 3) 总数 -1（避免分页显示怪）
    if (inboxTotal.value > 0) inboxTotal.value--

    // 4) 关闭操作按钮
    activeMsgId.value = null

    ElMessage.success('已删除')

    // 5) 如果这一页删空了，自动回退一页再拉一次（可选但很舒服）
    if (inboxList.value.length === 0 && inboxQuery.pageNum > 1) {
      inboxQuery.pageNum--
      await fetchInbox()
    }
  } catch (e) {
    // 失败拦截器一般会提示，这里不重复轰炸
  }
}



const fetchInbox = async () => {
  inboxLoading.value = true
  try {
    const params = {
      pageNum: inboxQuery.pageNum,
      pageSize: inboxQuery.pageSize
    }
    if (inboxQuery.readStatus !== null && inboxQuery.readStatus !== undefined) {
      params.readStatus = inboxQuery.readStatus
    }

    const res = await http.get('/message', { params })

    // 同样兼容两种封装：res 是完整结构 or 已拆壳
    const data = res?.data?.records ? res.data : res

    inboxList.value = data.records || []
    inboxTotal.value = Number(data.total || 0)
  } catch (e) {
    inboxList.value = []
    inboxTotal.value = 0
  } finally {
    inboxLoading.value = false
  }
}

watch(
  () => inboxQuery.readStatus,
  async () => {
    if (!showInbox.value) return
    inboxQuery.pageNum = 1
    await fetchInbox()
  }
)

const formatTime = (iso) => {
  if (!iso) return ''
  // 2026-02-01T11:07:52 -> 2026-02-01 11:07
  return String(iso).replace('T', ' ').slice(0, 16)
}



const handleMailClick = async () => {
  showInbox.value = true
  inboxQuery.pageNum = 1
  await fetchInbox()
}

const handleInboxPageChange = async (p) => {
  inboxQuery.pageNum = p
  await fetchInbox()
}



/** ========== 基础 ========== */
const router = useRouter()
const authStore = useAuthStore()
const { userInfo: userData } = storeToRefs(authStore)

/** ========== 手机号展示（是否有手机号 + 脱敏） ========== */
const hasPhone = computed(() => {
  const p = userData.value?.phone
  return !!(p && String(p).trim())
})

const maskedPhone = computed(() => {
  const p = String(userData.value?.phone || '')
  if (!p) return ''
  return p.length >= 7 ? `${p.slice(0, 3)}****${p.slice(-4)}` : p
})

/** ========== UI 状态 ========== */
const showLogoutConfirm = ref(false)
const showProfilePanel = ref(false)
const countdown = ref(0)
let countdownTimer = null

const unreadCount = ref(0)

const fetchUnreadCount = async () => {
  try {
    // 你的 http 封装如果 baseURL 已配，就用相对路径
    const res = await http.get('/message/unread/count')

    // 适配两种常见封装：
    // 1) http 返回的是后端完整结构：{ code, msg, data }
    // 2) http 直接返回 data（拦截器拆过壳）：0
    if (typeof res === 'number') {
      unreadCount.value = res
    } else {
      unreadCount.value = Number(res?.data ?? 0)
    }
  } catch (e) {
    // 不要弹窗轰炸用户，静默失败即可
    unreadCount.value = 0
  }
}

onMounted(() => {
  fetchUnreadCount()
})



/** ========== 表单 ========== */
const profileForm = reactive({
  username: '',
  phone: '',
  code: '' // 注意：这里对应后端的 phoneCode（提交时映射）
})

watchEffect(() => {
  if (!userData.value) return
  profileForm.username = userData.value.username || ''
  profileForm.phone = userData.value.phone || ''
})

/** ========== 倒计时工具 ========== */
const startCountdown = () => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
  countdown.value = 60
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(countdownTimer)
      countdownTimer = null
      countdown.value = 0
    }
  }, 1000)
}

const stopCountdown = () => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
  countdown.value = 0
}

onBeforeUnmount(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
})

/** ========== 获取验证码：校验 + 调接口 ========== */
const sendCode = async () => {
  if (countdown.value > 0) return

  const phone = String(profileForm.phone || '').trim()
  const phoneReg = /^1[3-9]\d{9}$/

  if (!phone) {
    ElMessage.warning('请先输入手机号')
    return
  }
  if (!phoneReg.test(phone)) {
    ElMessage.warning('手机号格式不正确')
    return
  }

  try {
    // scene 固定
    const payload = { phone, scene: 'BIND_PHONE' }

    // 你之前玩过 X-Forwarded-For，这里给你保留，但不强依赖
    const clientIp = localStorage.getItem('clientIp') || ''
    if (clientIp) {
      await http.post('/user/phone/code', payload, {
        headers: { 'X-Forwarded-For': clientIp }
      })
    } else {
      await http.post('/user/phone/code', payload)
    }

    ElMessage.success('验证码已发送')
    startCountdown()
  } catch (e) {
    // http 拦截器一般已经提示了，这里不重复轰炸用户
  }
}

const beforeAvatarUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 <= 5

  if (!isImage) {
    ElMessage.warning('只能上传图片文件')
    return false
  }
  if (!isLt5M) {
    ElMessage.warning('图片大小不能超过 5MB')
    return false
  }
  return true
}


const uploadAvatar = async ({ file }) => {
  try {
    const formData = new FormData()
    formData.append('file', file)

    // 关键点：multipart 不要手动写 boundary，axios 会自动处理
    const newUrl = await http.put('/user/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    // newUrl 就是后端返回的 data（字符串）
    ElMessage.success('头像更新成功')

    // 立刻刷新用户信息（最稳，不用你手动拼 store）
    await authStore.fetchUserInfoFromServer()

  } catch (e) {
    // 失败提示拦截器一般已经弹了
  }
}

/** ========== 保存资料：只提交变更字段（支持单改/双改） ========== */
const handleUpdate = async () => {
  // 老数据（来自 userInfo）
  const oldUsername = String(userData.value?.username || '').trim()
  const oldPhone = String(userData.value?.phone || '').trim()

  // 新数据（来自表单）
  const newUsername = String(profileForm.username || '').trim()
  const newPhone = String(profileForm.phone || '').trim()
  const phoneCode = String(profileForm.code || '').trim()

  const usernameChanged = newUsername !== oldUsername
  const phoneChanged = newPhone !== oldPhone

  // 1) 两个都没改：别请求
  if (!usernameChanged && !phoneChanged) {
    ElMessage.info('没有修改内容')
    return
  }

  // 2) 最小校验
  if (usernameChanged) {
    if (!newUsername) {
      ElMessage.warning('用户名不能为空')
      return
    }
    if (newUsername.length < 1 || newUsername.length > 20) {
      ElMessage.warning('用户名长度必须在 1-20 之间')
      return
    }
  }

  const phoneReg = /^1[3-9]\d{9}$/
  if (phoneChanged) {
    if (!newPhone) {
      ElMessage.warning('手机号不能为空')
      return
    }
    if (!phoneReg.test(newPhone)) {
      ElMessage.warning('手机号格式不正确')
      return
    }
    // 只要改了手机号，验证码必填
    if (!phoneCode) {
      ElMessage.warning('请输入手机验证码')
      return
    }
  }

  // 3) 只提交变更字段
  const payload = {}
  if (usernameChanged) payload.username = newUsername
  if (phoneChanged) {
    payload.phone = newPhone
    payload.phoneCode = phoneCode
  }

  try {
    await http.put('/user/profile', payload)

    ElMessage.success('资料更新成功')

    // 刷新用户信息（更新顶部显示 + 刷新本地缓存）
    await authStore.fetchUserInfoFromServer()

    // 清理验证码输入
    profileForm.code = ''
    stopCountdown()

    // 关闭面板
    showProfilePanel.value = false
  } catch (e) {
    // http 拦截器已提示
  }
}

/** ========== 退出登录 ========== */
const handleLogout = () => {
  showLogoutConfirm.value = true
}

const confirmLogout = () => {
  authStore.logout()
  router.push('/login')
  showLogoutConfirm.value = false
}

/** ========== 抢票按钮（占位） ========== */
const handleGrab = (movie) => {
  ElMessage.info(`正在尝试${movie.isFlash ? '抢购' : '预约'}: ${movie.title}`)
}

/** ========== 假数据 ========== */
const hotMovies = ref([
  { id: 1, title: '流浪地球 3', type: '科幻/冒险', score: '9.3', isFlash: true, poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300' },
  { id: 2, title: '奥本海默', type: '剧情/传记', score: '8.8', isFlash: false, poster: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=300' },
  { id: 3, title: '星际穿越', type: '科幻', score: '9.6', isFlash: true, poster: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=300' },
  { id: 4, title: '复仇者联盟', type: '英雄', score: '9.0', isFlash: true, poster: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=300' },
  { id: 5, title: '沙丘', type: '战争', score: '9.1', isFlash: false, poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300' },
  { id: 6, title: '蝙蝠侠', type: '动作', score: '8.7', isFlash: true, poster: 'https://images.unsplash.com/photo-1531259683007-016a7b628fc3?w=300' }
])

const rankData = ref([
  { name: '流浪地球 3', hot: '9982' },
  { name: '星际穿越', hot: '8721' },
  { name: '复仇者联盟', hot: '7655' },
  { name: '奥本海默', hot: '5421' },
  { name: '沙丘', hot: '4322' }
])

const onMarkAllRead = async () => {
  // 接口后续实现：比如 POST /message/read/all 或 POST /message/read/batch
  // 现在先做前端“假动作”，让 UI 先完整
  try {
    // 1) 本地把当前页未读全部标已读
    let changed = 0
    inboxList.value.forEach((m) => {
      if (m.readStatus === 0) {
        m.readStatus = 1
        m.readTime = new Date().toISOString()
        changed++
      }
    })

    // 2) 未读数同步减少（只减少当前页改掉的数量，后端做完再全量刷新最稳）
    if (changed > 0) {
      unreadCount.value = Math.max(0, unreadCount.value - changed)
      ElMessage.success(`已读 ${changed} 条`)
    } else {
      ElMessage.info('当前页没有未读消息')
    }

    activeMsgId.value = null
  } catch (e) {}
}

const onDeleteAll = async () => {
  // 接口后续实现：比如 DELETE /message 或 DELETE /message/batch
  // 现在先做前端“假动作”
  try {
    const deletingCount = inboxList.value.length
    if (deletingCount === 0) {
      ElMessage.info('当前页没有消息')
      return
    }

    // 如果当前页里有未读，未读数也扣掉
    const unreadDeleting = inboxList.value.filter((m) => m.readStatus === 0).length
    if (unreadDeleting > 0) {
      unreadCount.value = Math.max(0, unreadCount.value - unreadDeleting)
    }

    // 清空当前页
    inboxList.value = []
    inboxTotal.value = Math.max(0, inboxTotal.value - deletingCount)
    activeMsgId.value = null

    ElMessage.success(`已删除当前页 ${deletingCount} 条`)

    // 当前页删空后，如果还有上一页，就回退再拉一次（保持体验）
    if (inboxQuery.pageNum > 1) {
      inboxQuery.pageNum--
      await fetchInbox()
    } else {
      // 你也可以选择直接 fetchInbox() 让后端数据兜底
      // await fetchInbox()
    }
  } catch (e) {}
}

</script>



<style scoped>
/* ================== 1. 布局与背景 ================== */
.user-wrapper { width: 100vw; height: 100vh; overflow: hidden; position: relative; }
.login-container { width: 100%; height: 100%; background: radial-gradient(ellipse at bottom, #1B2735 0%, #090A0F 100%); overflow-y: auto; }
.stars { position: fixed; inset: 0; background: url('https://s3-us-west-2.amazonaws.com/s.cdpn.io/123163/stars.png'); opacity: 0.4; pointer-events: none; }

/* ================== 2. 导航栏 ================== */
.glass-nav {
  position: sticky; top: 0; z-index: 100;
  height: 70px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(15px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex; align-items: center;
}
.nav-content { width: 1300px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; padding: 0 20px; }
.brand { color: #fff; font-size: 22px; font-weight: bold; letter-spacing: 2px; }
.sub { font-size: 12px; color: #409eff; }

.user-portal { display: flex; align-items: center; gap: 20px; }
.user-text { display: flex; flex-direction: column; text-align: right; color: #fff; }
.name { font-size: 14px; }
.role { font-size: 11px; color: rgba(255,255,255,0.5); }

.nav-icon-btn {
  color: rgba(255, 255, 255, 0.8) !important;
  font-size: 20px !important;
  transition: all 0.3s ease;
  padding: 8px !important;
}
.nav-icon-btn:hover {
  color: #409eff !important;
  transform: scale(1.1);
  text-shadow: 0 0 10px rgba(64, 158, 255, 0.5);
}

.nav-badge-item { display: flex; align-items: center; }
:deep(.el-badge__content.is-fixed) {
  top: 8px;
  right: 12px;
  background-color: #f56c6c;
  border: none;
  box-shadow: 0 0 8px rgba(245, 108, 108, 0.6);
}

.avatar-glow {
  border: 2px solid #409eff;
  box-shadow: 0 0 10px rgba(64, 158, 255, 0.5);
  cursor: pointer;
  transition: 0.3s;
}
.avatar-glow:hover { transform: scale(1.05); }
.exit-btn { color: #fff; font-size: 20px; }
.exit-btn:hover { color: #f56c6c; }

/* ================== 3. 主体布局 / 电影卡片 ================== */
.content-body { max-width: 1300px; margin: 30px auto; padding: 0 20px; }
.movie-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 20px; }

.glass-card {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  padding: 2px;
  background: rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  display: flex;
}

.glass-card::before {
  content: "";
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: conic-gradient(transparent, #409eff, transparent 30%);
  animation: rotate-stream 3s linear infinite;
  opacity: 0;
  transition: opacity 0.4s;
  z-index: 0;
}
.glass-card:hover::before { opacity: 1; }
.glass-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 0 20px rgba(64, 158, 255, 0.4);
}

.card-inner {
  position: relative;
  z-index: 1;
  width: 100%;
  background: #161b22;
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.poster-box, .info-box { position: relative; z-index: 2; }
.poster-box { height: 240px; overflow: hidden; position: relative; }
.poster-box img { width: 100%; height: 100%; object-fit: cover; }

.badge {
  position: absolute; top: 10px; right: 10px;
  background: #f56c6c; color: #fff;
  font-size: 10px; padding: 3px 8px; border-radius: 4px;
  z-index: 10; box-shadow: 0 2px 10px rgba(245, 108, 108, 0.4);
}
.info-box { padding: 12px; background: #161b22; }
.info-box h4 { margin: 0; color: #fff; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.info-box p { color: rgba(255,255,255,0.5); font-size: 11px; margin: 5px 0 12px; }
.footer-action { display: flex; justify-content: space-between; align-items: center; }
.score { color: #ff9900; font-weight: bold; font-size: 13px; }

/* ================== 4. 退出弹窗 ================== */
.logout-overlay {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(10px);
  display: flex; align-items: center; justify-content: center;
  z-index: 3000;
}
.logout-glass-card {
  background: rgba(30, 35, 45, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 40px;
  border-radius: 24px;
  text-align: center;
  width: 340px;
  box-shadow: 0 25px 50px rgba(0,0,0,0.5);
}
.logout-icon { font-size: 50px; color: #f56c6c; margin-bottom: 15px; }
.logout-glass-card h3 { color: #fff; margin: 0 0 10px 0; }

.logout-actions { display: flex; gap: 15px; margin-top: 25px; }
.btn-cancel, .btn-confirm {
  flex: 1; padding: 12px;
  border-radius: 10px; border: none;
  cursor: pointer; transition: 0.3s;
  font-weight: bold;
}
.btn-cancel { background: rgba(255,255,255,0.08); color: #fff; }
.btn-cancel:hover { background: rgba(255,255,255,0.15); }
.btn-confirm { background: #f56c6c; color: #fff; }
.btn-confirm:hover { background: #ff4d4d; transform: scale(1.05); }

/* ================== 5. 个人面板 ================== */
.profile-panel-overlay {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  z-index: 2000;
  display: flex; justify-content: flex-end;
}
.profile-glass-panel {
  width: 360px; height: 100%;
  background: rgba(15, 20, 30, 0.95);
  border-left: 1px solid rgba(64, 158, 255, 0.3);
  padding: 40px 25px;
}
.panel-header { display: flex; justify-content: space-between; color: #fff; margin-bottom: 30px; }
.close-icon { cursor: pointer; font-size: 20px; }

.custom-form { margin-top: 30px; padding: 0 5px; }

:deep(.el-form-item__label) {
  color: #70c0ff !important;
  font-weight: 500;
  letter-spacing: 1.5px;
  font-size: 13px;
  margin-bottom: 8px !important;
  text-transform: uppercase;
}
:deep(.el-form-item) { margin-bottom: 22px !important; }

:deep(.el-input__wrapper) {
  background-color: rgba(10, 25, 47, 0.6) !important;
  box-shadow: 0 0 0 1px rgba(64, 158, 255, 0.2) inset !important;
  border-radius: 8px;
  padding: 5px 12px;
  transition: all 0.3s ease;
}
:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #409eff inset, 0 0 12px rgba(64, 158, 255, 0.4) !important;
  background-color: rgba(10, 25, 47, 0.8) !important;
}
:deep(.el-input__inner) { color: #ffffff !important; font-family: 'Inter', sans-serif; }
:deep(.el-input__inner::placeholder) { color: rgba(255, 255, 255, 0.3); }

.code-input-group { display: flex; gap: 12px; }
.code-input-group .el-button {
  background: rgba(64, 158, 255, 0.1);
  border: 1px solid rgba(64, 158, 255, 0.4);
  color: #409eff;
  border-radius: 8px;
  transition: 0.3s;
}
.code-input-group .el-button:hover:not(:disabled) {
  background: #409eff;
  color: #fff;
  box-shadow: 0 0 15px rgba(64, 158, 255, 0.5);
}

.save-btn {
  width: 100%;
  height: 45px;
  margin-top: 30px;
  background: linear-gradient(90deg, #1e3c72 0%, #2a5298 100%);
  border: none;
  font-weight: bold;
  letter-spacing: 4px;
  box-shadow: 0 4px 15px rgba(30, 60, 114, 0.4);
  transition: 0.4s;
}
.save-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(64, 158, 255, 0.6);
  filter: brightness(1.2);
}

/* 预览头像 */
.preview-avatar {
  width: 80px; height: 80px;
  border-radius: 50%;
  border: 2px solid #409eff;
  box-shadow: 0 0 15px rgba(64, 158, 255, 0.5);
  cursor: zoom-in;
  transition: 0.3s;
  overflow: hidden;
}
.preview-avatar :deep(img) { border-radius: 50%; }
.preview-avatar:hover {
  transform: scale(1.05);
  box-shadow: 0 0 25px rgba(64, 158, 255, 0.8);
}
:deep(.el-image-viewer__mask) {
  background: rgba(0, 0, 0, 0.8) !important;
  backdrop-filter: blur(10px);
}

/* 手机号展示 */
.phone { font-size: 11px; color: rgba(255,255,255,0.7); margin-top: 4px; }
.phone-missing { color: #e6a23c; cursor: pointer; text-decoration: underline; }
.clickable { cursor: pointer; }

/* ================== 6. 侧边栏通用 ================== */
.glass-section {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 20px;
  margin-bottom: 25px;
}
.section-title { color: #fff; display: flex; align-items: center; gap: 8px; margin-bottom: 15px; }
.rank-item { display: flex; align-items: center; gap: 10px; margin-bottom: 15px; color: #fff; font-size: 13px; }
.rank-num { width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.1); border-radius: 4px; }
.top-1 { background: #f56c6c; }
.top-2 { background: #e6a23c; }
.top-3 { background: #409eff; }
.quick-status { display: flex; gap: 15px; margin-top: 20px; }
.status-card { flex: 1; background: rgba(255,255,255,0.05); padding: 12px; border-radius: 10px; text-align: center; }
.status-card p { font-size: 11px; color: #aaa; margin: 0; }
.status-card h3 { color: #fff; margin: 5px 0 0; }
.status-card h3.warn { color: #f56c6c; }

/* ================== 7. Drawer：消息面板 ================== */
:deep(.el-drawer__body) { padding: 0 !important; background: transparent !important; }
:deep(.el-drawer__body) {
  overflow-x: hidden !important; /* 禁止左右滚动条 */
}
:deep(.el-drawer) {
  transition-duration: 0.6s !important; /* 默认很快，拉长 */
  transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1) !important;
}
:deep(.el-overlay) {
  transition-duration: 2s !important;
}

.inbox-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, rgba(18, 24, 34, 0.96), rgba(10, 13, 18, 0.94));
  border-right: 1px solid rgba(64, 158, 255, 0.22);
  box-shadow: 20px 0 60px rgba(0, 0, 0, 0.55);
  position: relative;
  overflow: hidden;
}
.inbox-panel::before {
  content: "";
  position: absolute;
  top: -120px; left: -120px;
  width: 260px; height: 260px;
  background: radial-gradient(circle, rgba(64,158,255,0.18), transparent 65%);
  filter: blur(2px);
  pointer-events: none;
}

.inbox-header {
  padding: 18px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 5;
  backdrop-filter: blur(10px);
  background: rgba(10, 13, 18, 0.55);
}

.inbox-title {
  display: flex; gap: 10px;
  align-items: center;
  color: #fff;
  font-weight: 700;
  letter-spacing: 1px;
}
.inbox-sub {
  font-size: 11px;
  color: rgba(255,255,255,0.55);
  border: 1px solid rgba(255,255,255,0.10);
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(255,255,255,0.04);
}

.inbox-actions { display: flex; align-items: center; gap: 10px; }

/* segmented 外壳 */
.seg-wrap {
  padding: 6px;
  border-radius: 999px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(64,158,255,0.18);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06);
  overflow: hidden; /* 裁掉内部方块 */
}

/* segmented 本体 + 强行圆角核弹 */
.seg-wrap :deep(.el-segmented) {
  background: transparent !important;
  border: none !important;
  border-radius: 999px !important;
  overflow: hidden !important;
}
.seg-wrap :deep(.el-segmented__item) {
  color: rgba(255,255,255,0.70) !important;
  border-radius: 999px !important;
  overflow: hidden !important;
  transition: 0.25s;
}
.seg-wrap :deep(.el-segmented__item.is-selected) {
  background: transparent !important;
  color: #fff !important;
  border-radius: 999px !important;
}
/* 选中滑块层：不同版本类名都打 */
.seg-wrap :deep(.el-segmented__item-selected),
.seg-wrap :deep(.el-segmented__indicator),
.seg-wrap :deep(.el-segmented__selected) {
  border-radius: 999px !important;
  background: rgba(64, 158, 255, 0.22) !important;
  box-shadow:
    0 0 0 1px rgba(64,158,255,0.35) inset,
    0 0 14px rgba(64,158,255,0.28) !important;
}

.icon-glass-btn {
  width: 34px; height: 34px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.10);
  transition: transform 0.22s ease, box-shadow 0.22s ease, background 0.22s ease;
}
.icon-glass-btn:hover {
  transform: translateY(-1px) scale(1.06);
  background: rgba(64,158,255,0.10);
  box-shadow: 0 10px 22px rgba(0,0,0,0.35), 0 0 14px rgba(64,158,255,0.22);
}
.icon-glass-btn.close:hover {
  background: rgba(245,108,108,0.10);
  border-color: rgba(245,108,108,0.25);
  box-shadow: 0 10px 22px rgba(0,0,0,0.35), 0 0 14px rgba(245,108,108,0.18);
}

/* 刷新 loading 旋转 */
.spin-when-loading { transition: 0.2s; }
.spinning { animation: spin 0.9s linear infinite; }
@keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }

/* 内容区 */
.inbox-body { flex: 1; padding: 14px; overflow: auto; 
  overflow-x: hidden;  /* 禁止横向滚动条 */
  overflow-y: auto; }
.inbox-body::-webkit-scrollbar { width: 10px; }
.inbox-body::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.10);
  border: 2px solid rgba(0,0,0,0);
  background-clip: padding-box;
  border-radius: 999px;
}
.inbox-body::-webkit-scrollbar-thumb:hover { background: rgba(64,158,255,0.18); }

.empty {
  color: rgba(255,255,255,0.55);
  text-align: center;
  padding: 50px 0;
  border: 1px dashed rgba(255,255,255,0.14);
  border-radius: 14px;
  background: rgba(255,255,255,0.03);
}

/* 消息列表 */
.msg-list { display: flex; flex-direction: column; gap: 12px; }

.msg-card {
  padding: 12px 12px;
  border-radius: 14px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  transition: 0.25s;
  position: relative;
  overflow: hidden;
}
.msg-card::after {
  content: "";
  position: absolute;
  inset: -40%;
  background: radial-gradient(circle, rgba(64,158,255,0.10), transparent 60%);
  opacity: 0;
  transform: translate(20%, -10%);
  transition: opacity 0.25s;
  pointer-events: none;
}
.msg-card:hover {
  transform: translateY(-2px);
  background: rgba(255,255,255,0.06);
  box-shadow: 0 14px 26px rgba(0,0,0,0.35);
}
.msg-card:hover::after { opacity: 1; }

.msg-card.unread {
  border-color: rgba(64,158,255,0.28);
  box-shadow: 0 0 0 1px rgba(64,158,255,0.10) inset;
}
.msg-card.unread::before {
  content: "";
  position: absolute;
  top: 12px; right: 12px;
  width: 8px; height: 8px;
  border-radius: 999px;
  background: rgba(64,158,255,0.9);
  box-shadow: 0 0 12px rgba(64,158,255,0.8);
  animation: pulse 1.6s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.85; }
  50% { transform: scale(1.35); opacity: 1; }
}

/* 选中态 */
.msg-card.active {
  border-color: rgba(64,158,255,0.35);
  box-shadow: 0 0 0 1px rgba(64,158,255,0.12) inset, 0 16px 30px rgba(0,0,0,0.35);
}

.msg-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 8px;
}
.msg-title {
  color: #fff;
  font-size: 14px;
  font-weight: 650;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  flex: 1;
}
.msg-time {
  color: rgba(255,255,255,0.48);
  font-size: 11px;
  flex-shrink: 0;
}
.msg-content {
  color: rgba(255,255,255,0.72);
  font-size: 12px;
  line-height: 1.55;
  white-space: pre-wrap;
}

/* 右上角操作区 */
.msg-top-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.msg-actions-top { display: flex; gap: 10px; }

/* 操作按钮（已读/删除） */
.action-btn {
  height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.22);
  background: rgba(255,255,255,0.12);
  color: #fff;
  cursor: pointer;
  font-size: 12.5px;
  font-weight: 650;
  letter-spacing: 1px;
  transition: all 0.22s ease;
  backdrop-filter: blur(10px);
  box-shadow: 0 10px 18px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.08) inset;
}
.action-btn:hover {
  transform: translateY(-1px) scale(1.06);
  background: rgba(255,255,255,0.16);
  border-color: rgba(255,255,255,0.30);
}
.action-btn.read {
  background: rgba(64,158,255,0.22);
  border-color: rgba(64,158,255,0.42);
  box-shadow: 0 10px 18px rgba(0,0,0,0.28), 0 0 14px rgba(64,158,255,0.25);
}
.action-btn.read:hover {
  background: rgba(64,158,255,0.30);
  box-shadow: 0 12px 22px rgba(0,0,0,0.32), 0 0 18px rgba(64,158,255,0.40);
}
.action-btn.del {
  background: rgba(245,108,108,0.20);
  border-color: rgba(245,108,108,0.40);
  box-shadow: 0 10px 18px rgba(0,0,0,0.28), 0 0 14px rgba(245,108,108,0.18);
}
.action-btn.del:hover {
  background: rgba(245,108,108,0.28);
  box-shadow: 0 12px 22px rgba(0,0,0,0.32), 0 0 18px rgba(245,108,108,0.32);
}

/* “飞出”动画 */
.pop-actions-enter-active { animation: popIn 0.22s cubic-bezier(0.22, 1, 0.36, 1); }
.pop-actions-leave-active { animation: popOut 0.16s ease-in forwards; }
@keyframes popIn {
  from { opacity: 0; transform: translateY(8px) scale(0.92); filter: blur(2px); }
  to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
}
@keyframes popOut {
  from { opacity: 1; transform: translateY(0) scale(1); }
  to { opacity: 0; transform: translateY(6px) scale(0.95); }
}

/* 进入动画：stagger */
.msg-card.enter {
  opacity: 0;
  transform: translateX(10px) translateY(6px);
  animation: enterCard 1.0s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  animation-delay: calc(var(--i) * 70ms);
  
}
@keyframes enterCard { to { opacity: 1; transform: translateX(0) translateY(0); } }

/* footer 分页 */
.inbox-footer {
  padding: 12px;
  border-top: 1px solid rgba(255,255,255,0.08);
  background: rgba(10, 13, 18, 0.55);
  backdrop-filter: blur(10px);
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
  transition: all 0.25s ease;
}
:deep(.el-pagination.is-background .btn-prev:hover),
:deep(.el-pagination.is-background .btn-next:hover) {
  background: rgba(64, 158, 255, 0.18) !important;
  border-color: rgba(64, 158, 255, 0.35) !important;
  color: #fff !important;
  box-shadow: 0 0 12px rgba(64, 158, 255, 0.35);
  transform: translateY(-1px) scale(1.05);
}
:deep(.el-pagination.is-background .btn-prev:disabled),
:deep(.el-pagination.is-background .btn-next:disabled) {
  background: rgba(255, 255, 255, 0.03) !important;
  color: rgba(255, 255, 255, 0.25) !important;
  border-color: rgba(255, 255, 255, 0.06) !important;
  cursor: not-allowed;
  box-shadow: none;
}

/* ================== 8. 动画 & 流星背景 ================== */
.slide-right-enter-active, .slide-right-leave-active { transition: all 0.4s ease; }
.slide-right-enter-from, .slide-right-leave-to { transform: translateX(100%); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@keyframes rotate-stream { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

/* 斜向流星容器 */
.meteor-container {
  position: fixed;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

/* 斜向流星 */
.meteor {
  position: absolute;
  width: 150px;
  height: 2px;
  transform: rotate(-35deg);
  background: linear-gradient(to right, rgba(64, 158, 255, 0.8), transparent);
  animation: diagonal-fly 2s infinite linear;
  opacity: 0;
  filter: drop-shadow(0 0 5px #409eff);
}
.meteor:nth-child(1) { top: -10%; right: 10%; animation-delay: 0s; }
.meteor:nth-child(2) { top: 10%; right: -5%; animation-delay: 1s; }
.meteor:nth-child(3) { top: 30%; right: 20%; animation-delay: 2.5s; }
.meteor:nth-child(4) { top: -5%; right: 40%; animation-delay: 1.5s; }
.meteor:nth-child(5) { top: 20%; right: 50%; animation-delay: 0.5s; }
.meteor:nth-child(6) { top: 40%; right: -10%; animation-delay: 2s; }

@keyframes diagonal-fly {
  0% { transform: translate(200px, -200px) rotate(-35deg); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 0.5; }
  100% { transform: translate(-120vw, 120vh) rotate(-35deg); opacity: 0; }
}

/* 入场动画 */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); filter: blur(5px); }
  to { opacity: 1; transform: translateY(0); filter: blur(0); }
}
.fade-in-item {
  opacity: 0;
  animation: fadeInUp 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards;
  animation-delay: calc(var(--delay) * 0.3s);
}

/* --- 飞走动画核心 --- */

/* 1. 离开过程中的动画 */
.msg-fly-leave-active {
  position: absolute;    /* 必须：让元素脱离文档流，下方的元素才能平滑滚上来 */
  width: 100%;           /* 保持宽度，防止飞走时突然缩窄 */
  z-index: 100;
  pointer-events: none;  /* 飞走时不可点击 */
  transition: all 0.6s cubic-bezier(0.55, 0, 0.1, 1);
}

/* 2. 飞往的目的地：右上方 + 旋转 + 缩小 + 透明 */
.msg-fly-leave-to {
  opacity: 0;
  transform: translateX(150px) translateY(-80px) rotate(20deg) scale(0.7);
}

/* 3. 排序过渡：当某一项消失，其他项“滑”上去的动画 */
.msg-fly-move {
  transition: transform 0.5s cubic-bezier(0.55, 0, 0.1, 1);
}

/* --- 优化 msg-card 基础样式 --- */
.msg-card {
  position: relative;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 12px; /* 建议使用 margin 而不是 gap，动画更稳 */
  transition: all 0.3s ease;
}

.msg-card:hover {
  background: rgba(255, 255, 255, 0.08);
}

.msg-card.active {
  border-color: #409eff;
  box-shadow: 0 0 15px rgba(64, 158, 255, 0.2);
}

/* 原有的进入动画（可选） */
.msg-fly-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
.msg-fly-enter-active {
  transition: all 0.4s ease;
}

/* 批量操作按钮容器 */
.bulk-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 批量按钮 */
.bulk-btn {
  height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.18);
  background: rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.92);
  cursor: pointer;
  font-size: 12.5px;
  font-weight: 700;
  letter-spacing: 1px;
  transition: transform 0.22s ease, box-shadow 0.22s ease, background 0.22s ease, border-color 0.22s ease, opacity 0.22s ease;
  backdrop-filter: blur(10px);
  box-shadow: 0 10px 18px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.06) inset;
}

.bulk-btn:hover:not(:disabled) {
  transform: translateY(-1px) scale(1.06);
  background: rgba(255,255,255,0.12);
  border-color: rgba(255,255,255,0.28);
}

.bulk-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 一键已读 */
.bulk-btn.bulk-read {
  background: rgba(64,158,255,0.18);
  border-color: rgba(64,158,255,0.35);
  box-shadow: 0 10px 18px rgba(0,0,0,0.22), 0 0 14px rgba(64,158,255,0.18);
}
.bulk-btn.bulk-read:hover:not(:disabled) {
  background: rgba(64,158,255,0.26);
  box-shadow: 0 12px 22px rgba(0,0,0,0.28), 0 0 18px rgba(64,158,255,0.30);
}

/* 一键删除 */
.bulk-btn.bulk-del {
  background: rgba(245,108,108,0.16);
  border-color: rgba(245,108,108,0.32);
  box-shadow: 0 10px 18px rgba(0,0,0,0.22), 0 0 14px rgba(245,108,108,0.14);
}
.bulk-btn.bulk-del:hover:not(:disabled) {
  background: rgba(245,108,108,0.22);
  box-shadow: 0 12px 22px rgba(0,0,0,0.28), 0 0 18px rgba(245,108,108,0.24);
}

</style>
