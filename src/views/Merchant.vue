<template>
  <div class="merchant-wrapper">
    <div class="stars"></div>
    <div class="meteor-container">
      <div v-for="n in 6" :key="n" class="meteor"></div>
    </div>

    <div class="login-container">
      <!-- 顶部导航 -->
      <header class="glass-nav">
        <div v-if="userData" class="nav-content">
          <div class="brand">METEOR <span class="sub">MERCHANT</span></div>

          <div class="user-portal">
            <div class="user-text">
              <span class="name">{{ userData.username }}</span>
              <span class="role">商家中心 | UID: {{ userData.userId || '000' }}</span>
              <span class="phone" v-if="hasPhone">{{ maskedPhone }}</span>
              <span class="phone phone-missing" v-else @click="showProfilePanel = true">
                未绑定手机号（点我去绑）
              </span>
            </div>

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

      <!-- 主体内容 -->
      <main class="content-body">
        <div class="dashboard">
          <!-- 左侧菜单 -->
          <aside class="side-menu glass-panel">
            <div class="menu-title">工作台</div>

            <div class="menu-item" :class="{ active: activeTab === 'base' }" @click="activeTab = 'base'">
              基础信息
            </div>

            <div class="menu-item" :class="{ active: activeTab === 'notice' }" @click="activeTab = 'notice'">
              店铺简介
            </div>

            <div class="menu-item" :class="{ active: activeTab === 'movie' }" @click="activeTab = 'movie'">
              新建电影
            </div>

            <div
              class="menu-item"
              :class="{ active: activeTab === 'ticket' }"
              @click="activeTab = 'ticket'"
            >
              新增票务
            </div>


            <div class="menu-divider"></div>

            <div class="menu-item danger" :class="{ active: activeTab === 'close' }" @click="activeTab = 'close'">
              商家注销
            </div>
          </aside>

          <!-- 右侧内容 -->
          <section class="main-panel glass-panel" v-loading="pageLoading" element-loading-background="rgba(0,0,0,0.35)">
            <div class="panel-head">
              <div>
                <h2 class="panel-title">MERCHANT PORTAL</h2>
                <p class="panel-sub">能跑就行版本：先把流程走通。</p>
              </div>

              <div class="head-actions">
                <el-button size="small" class="ghost-btn" @click="refreshAll" :loading="refreshLoading">
                  刷新
                </el-button>
              </div>
            </div>

            <!-- 基础信息 -->
            <div v-show="activeTab === 'base'" class="tab">
              <div class="section-title">商家信息</div>

              <div class="info-cards">
                <div class="info-card">
                  <div class="label">店铺名</div>
                  <div class="value">{{ merchantMe.shopName || '-' }}</div>
                </div>

                <div class="info-card">
                  <div class="label">状态</div>
                  <div class="value">
                    <span class="pill" :class="statusClass">{{ merchantMe.status || '-' }}</span>
                  </div>
                </div>

                <div class="info-card">
                  <div class="label">认证时间</div>
                  <div class="value">{{ merchantMe.verifiedTime || '-' }}</div>
                </div>

                <div class="info-card" style="grid-column: 1 / -1;">
                  <div class="label">简介</div>
                  <div class="value">{{ merchantMe.notice || '（暂无简介）' }}</div>
                </div>
              </div>
            </div>

            <!-- 店铺简介 -->
            <div v-show="activeTab === 'notice'" class="tab">
              <div class="section-title">修改店铺简介</div>

              <el-input
                v-model="noticeForm.notice"
                type="textarea"
                :rows="5"
                maxlength="200"
                show-word-limit
                placeholder="写点什么，让用户觉得你是个活人。"
              />

              <div class="row-actions">
                <el-button class="primary-btn" :loading="noticeLoading" @click="saveNotice">
                  保存简介
                </el-button>
                <el-button class="ghost-btn" @click="resetNotice">
                  还原
                </el-button>
              </div>
            </div>

            <!-- 新建电影 -->
            <div v-show="activeTab === 'movie'" class="tab">
              <div class="section-title">新建电影</div>

              <el-form label-position="top" class="custom-form">
                <el-form-item label="电影标题（必填）">
                  <el-input v-model="movieForm.title" placeholder="比如：流星计划 2" />
                </el-form-item>

                <el-form-item label="副标题 / 别名（alias，可选）">
                  <el-input v-model="movieForm.alias" placeholder="Meteor Cinema: It Works" />
                </el-form-item>

                <el-form-item label="电影类型（至少选一个）">
                  <el-select
                    v-model="movieForm.categoryIds"
                    multiple
                    filterable
                    collapse-tags
                    collapse-tags-tooltip
                    :loading="categoryLoading"
                    placeholder="选择类型"
                    style="width: 100%;"
                  >
                    <el-option
                      v-for="c in categoryOptions"
                      :key="c.id"
                      :label="c.name"
                      :value="c.id"
                    />
                  </el-select>
                </el-form-item>

                <el-form-item label="电影简介">
                  <el-input v-model="movieForm.intro" type="textarea" :rows="4" placeholder="一句话能讲清最好。" />
                </el-form-item>

                <div class="grid-2">
                  <el-form-item label="时长（分钟）">
                    <el-input v-model.number="movieForm.durationMin" placeholder="120" />
                  </el-form-item>

                  <el-form-item label="上映日期">
                    <el-date-picker v-model="movieForm.releaseDate" type="date" value-format="YYYY-MM-DD" />
                  </el-form-item>
                </div>

                <!-- 海报（必填） -->
                <el-form-item label="海报（POSTER，必填）">
                  <div class="upload-row">
                    <el-upload
                      :show-file-list="false"
                      :before-upload="beforeImageUpload"
                      :http-request="uploadPoster"
                    >
                      <el-button size="small" type="primary" plain class="purple-btn-plain" :loading="mediaUploading.poster">
                        上传海报
                      </el-button>
                    </el-upload>

                    <div class="path-box" v-if="movieForm.posterKey">
                      <div class="path-label">posterKey</div>
                      <div class="path-value">{{ movieForm.posterKey }}</div>
                    </div>
                  </div>

                  <div class="poster-preview" v-if="movieForm.posterPreviewUrl">
                    <el-image
                      :src="movieForm.posterPreviewUrl"
                      fit="cover"
                      :preview-src-list="[movieForm.posterPreviewUrl]"
                      :preview-teleported="true"
                      :hide-on-click-modal="true"
                    />
                  </div>
                </el-form-item>

                <!-- 封面（可选） -->
                <el-form-item label="封面（COVER，可选）">
                  <div class="upload-row">
                    <el-upload
                      :show-file-list="false"
                      :before-upload="beforeImageUpload"
                      :http-request="uploadCover"
                    >
                      <el-button size="small" type="primary" plain class="purple-btn-plain" :loading="mediaUploading.cover">
                        上传封面
                      </el-button>
                    </el-upload>

                    <div class="path-box" v-if="movieForm.coverKey">
                      <div class="path-label">coverKey</div>
                      <div class="path-value">{{ movieForm.coverKey }}</div>
                    </div>

                    <el-button v-if="movieForm.coverKey" size="small" class="ghost-btn" @click="clearCover">
                      清空封面
                    </el-button>
                  </div>

                  <div class="poster-preview" v-if="movieForm.coverPreviewUrl">
                    <el-image
                      :src="movieForm.coverPreviewUrl"
                      fit="cover"
                      :preview-src-list="[movieForm.coverPreviewUrl]"
                      :preview-teleported="true"
                      :hide-on-click-modal="true"
                    />
                  </div>
                </el-form-item>

                <!-- 图集（可选，简陋追加版） -->
                <el-form-item label="图集（GALLERY，可选，简陋版：一张张追加）">
                  <div class="upload-row">
                    <el-upload
                      :show-file-list="false"
                      :before-upload="beforeImageUpload"
                      :http-request="uploadGallery"
                    >
                      <el-button size="small" type="primary" plain class="purple-btn-plain" :loading="mediaUploading.gallery">
                        添加图集图片
                      </el-button>
                    </el-upload>

                    <div class="hint" v-if="movieForm.galleryKeys.length">
                      已添加 {{ movieForm.galleryKeys.length }} 张
                    </div>

                    <el-button
                      v-if="movieForm.galleryKeys.length"
                      size="small"
                      class="ghost-btn"
                      @click="clearGallery"
                    >
                      清空图集
                    </el-button>
                  </div>

                  <div class="gallery-grid" v-if="movieForm.galleryPreviewUrls.length">
                    <div v-for="(u, idx) in movieForm.galleryPreviewUrls" :key="idx" class="gallery-item-wrap">
                      <el-image
                        :src="u"
                        fit="cover"
                        class="gallery-item"
                        :preview-src-list="movieForm.galleryPreviewUrls"
                        :initial-index="idx"
                        :preview-teleported="true"
                        :hide-on-click-modal="true"
                      />
                      <el-button
                        size="small"
                        class="gallery-remove"
                        @click="removeGalleryAt(idx)"
                      >
                        删除
                      </el-button>
                    </div>
                  </div>
                </el-form-item>

                <div class="row-actions">
                <el-button class="primary-btn" :loading="ticketCreating" @click="createTicket">
                  提交新增票务
                </el-button>
                  <el-button class="ghost-btn" @click="resetMovieForm">
                    清空
                  </el-button>
                </div>
              </el-form>
            </div>

            <!-- ================== 新增票务 ================== -->
            <div v-show="activeTab === 'ticket'" class="tab">
              <div class="section-title">新增票务（预览版）</div>
            
              <el-form label-position="top" class="custom-form">
              
                <el-form-item label="选择电影">
                  <el-select
                    v-model="ticketForm.movieId"
                    filterable
                    placeholder="选择电影标题"
                    style="width: 100%;"
                    :loading="movieTitleLoading"
                  >
                    <el-option
                      v-for="m in movieTitleOptions"
                      :key="m.id"
                      :label="m.title"
                      :value="String(m.id)"
                    />
                  </el-select>
                
                  <div class="hint" v-if="ticketForm.movieId" style="margin-top: 8px;">
                    movieId：{{ ticketForm.movieId }}
                  </div>
                </el-form-item>


              
                <div class="grid-2">
                  <el-form-item label="开场时间 startTime">
                    <el-date-picker
                      v-model="ticketForm.startTime"
                      type="datetime"
                      value-format="YYYY-MM-DDTHH:mm:ss"
                    />
                  </el-form-item>
                
                  <el-form-item label="开售时间 saleStartTime">
                    <el-date-picker
                      v-model="ticketForm.saleStartTime"
                      type="datetime"
                      value-format="YYYY-MM-DDTHH:mm:ss"
                    />
                  </el-form-item>
                </div>
              
                <div class="grid-2">
                <el-form-item label="基础价格（元）">
                  <el-input
                    v-model="ticketForm.basePriceYuan"
                    placeholder="39.00"
                    inputmode="decimal"
                  />
                </el-form-item>
                
                  <el-form-item label="票数 totalTickets">
                    <el-input v-model.number="ticketForm.totalTickets" placeholder="60" />
                  </el-form-item>
                </div>
              
                <el-form-item label="售卖模式 saleMode">
                  <el-select v-model="ticketForm.saleMode" placeholder="选择模式">
                    <el-option label="MIXED（混合）" value="MIXED" />
                    <el-option label="NORMAL（普通）" value="NORMAL" />
                    <el-option label="FLASH（秒杀）" value="FLASH" />
                  </el-select>
                </el-form-item>
              
                <div class="row-actions">
                  <el-button
                    class="primary-btn"
                    @click="createTicket"
                  >
                    提交
                  </el-button>
                
                  <el-button class="ghost-btn" @click="resetTicketForm">
                    清空
                  </el-button>
                </div>
              
              </el-form>
            </div>


            <!-- 商家注销（先占位） -->
            <div v-show="activeTab === 'close'" class="tab">
              <div class="section-title">商家注销</div>
              <div class="hint">你还没给注销接口。先占位，别急着自毁。</div>
            </div>
          </section>
        </div>
      </main>
    </div>

    <!-- 个人中心侧滑面板 -->
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
                :preview-teleported="true"
                :hide-on-click-modal="true"
                fit="cover"
              />
              <p class="uid-tag">ID: {{ userData.userId }}</p>
              <el-upload :show-file-list="false" :before-upload="beforeAvatarUpload" :http-request="uploadAvatar">
                <el-button size="small" type="primary" plain class="purple-btn-plain">修改头像</el-button>
              </el-upload>
            </div>

            <el-form label-position="top" class="custom-form">
              <el-form-item label="用户名">
                <el-input v-model="profileForm.username" :prefix-icon="User" />
              </el-form-item>

              <el-form-item label="手机号">
                <el-input v-model="profileForm.phone" :prefix-icon="Iphone" />
              </el-form-item>

              <el-form-item label="验证码">
                <div class="code-input-group">
                  <el-input v-model="profileForm.code" placeholder="输入验证码" :prefix-icon="Lock" />
                  <el-button class="get-code-btn" :disabled="countdown > 0" @click="sendCode">
                    {{ countdown > 0 ? countdown + 's' : '获取' }}
                  </el-button>
                </div>
              </el-form-item>

              <el-button type="primary" class="save-btn" @click="handleUpdate">保存资料</el-button>
            </el-form>
          </div>
        </div>
      </div>
    </transition>

    <!-- 退出确认 -->
    <transition name="fade">
      <div v-if="showLogoutConfirm" class="logout-overlay">
        <div class="logout-glass-card">
          <div class="logout-icon"><el-icon><Warning /></el-icon></div>
          <h3>确认退出商家端？</h3>
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
import { ref, reactive, computed, watchEffect, onMounted, onBeforeUnmount } from 'vue'
import { SwitchButton, Warning, Close, User, Iphone, Lock } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { storeToRefs } from 'pinia'
import http from '../request/http'

/** ========== 基础：登录态信息 ========== */
const router = useRouter()
const authStore = useAuthStore()
const { userInfo: userData } = storeToRefs(authStore)

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
const activeTab = ref('base')
const pageLoading = ref(false)
const refreshLoading = ref(false)

const showLogoutConfirm = ref(false)
const showProfilePanel = ref(false)

/** ========== 商家信息：GET /merchant/me ========== */
const merchantMe = reactive({
  merchantId: null,
  userId: null,
  shopName: '',
  notice: '',
  status: '',
  verifiedTime: ''
})

const statusClass = computed(() => {
  const s = String(merchantMe.status || '').toUpperCase()
  if (s.includes('NORMAL') || s.includes('ACTIVE')) return 'ok'
  if (s.includes('PENDING')) return 'pending'
  if (s.includes('BANNED') || s.includes('DISABLE') || s.includes('REJECT')) return 'bad'
  return 'unknown'
})

const yuanToFen = (yuanStr) => {
  const s = String(yuanStr ?? '').trim()
  if (!s) return null
  // 允许：39 / 39.0 / 39.00
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null

  const [intPart, decPart = ''] = s.split('.')
  const fen = Number(intPart) * 100 + Number((decPart + '00').slice(0, 2))
  return Number.isFinite(fen) ? fen : null
}
const ticketCreating = ref(false)

const fetchMerchantMe = async () => {
  // http 拦截器返回的直接是 data
  const data = await http.get('/merchant/me')
  merchantMe.merchantId = data.merchantId
  merchantMe.userId = data.userId
  merchantMe.shopName = data.shopName || ''
  merchantMe.notice = data.notice || ''
  merchantMe.status = data.status || ''
  merchantMe.verifiedTime = data.verifiedTime || ''

  // 同步回填
  noticeForm.notice = merchantMe.notice || ''
}

/** ========== 修改简介：PUT /merchant/updateNotice ========== */
const noticeForm = reactive({ notice: '' })
const noticeLoading = ref(false)

const saveNotice = async () => {
  const notice = String(noticeForm.notice || '').trim()
  if (!notice) return ElMessage.warning('简介不能为空')

  noticeLoading.value = true
  try {
    await http.put('/merchant/updateNotice', { notice })
    merchantMe.notice = notice
    ElMessage.success('已保存')
  } finally {
    noticeLoading.value = false
  }
}

const resetNotice = () => {
  noticeForm.notice = merchantMe.notice || ''
}

/** ========== 分类字典：GET /movies/categories ========== */
const categoryOptions = ref([])
const categoryLoading = ref(false)

const fetchCategories = async () => {
  categoryLoading.value = true
  try {
    const list = await http.get('/movies/categories')
    categoryOptions.value = Array.isArray(list) ? list : []
  } finally {
    categoryLoading.value = false
  }
}

/** ========== 媒体上传：POST /movies/pic/media（file + kind） ========== */
const mediaUploading = reactive({
  poster: false,
  cover: false,
  gallery: false
})

const beforeImageUpload = (file) => {
  const isImg = file.type.startsWith('image/')
  const okSize = file.size / 1024 / 1024 <= 5
  if (!isImg) ElMessage.warning('请上传图片文件')
  if (!okSize) ElMessage.warning('请上传 5MB 以内图片')
  return isImg && okSize
}

/** ================== 新增票务（暂不调用接口） ================== */
const ticketForm = reactive({
  movieId: null,           
  startTime: '',
  saleStartTime: '',
  basePriceYuan: '',     
  totalTickets: null,
  saleMode: 'MIXED'
})

const resetTicketForm = () => {
  ticketForm.movieId = ''
  ticketForm.startTime = ''
  ticketForm.saleStartTime = ''
  ticketForm.basePriceYuan = ''
  ticketForm.totalTickets = null
  ticketForm.saleMode = 'MIXED'
}


const createTicket = async () => {
  if (!ticketForm.movieId) return ElMessage.warning('请选择电影')
  if (!ticketForm.startTime) return ElMessage.warning('请选择开场时间')
  if (!ticketForm.saleStartTime) return ElMessage.warning('请选择开售时间')
  if (!ticketForm.totalTickets || ticketForm.totalTickets <= 0) return ElMessage.warning('票数必须大于 0')

  const basePrice = yuanToFen(ticketForm.basePriceYuan)
  if (basePrice == null) return ElMessage.warning('价格格式不正确（最多两位小数）')

  ticketCreating.value = true
  try {
    await http.post('/ticketing/screenings', {
      movieId: String.ticketForm.movieId,          
      startTime: ticketForm.startTime,      
      saleStartTime: ticketForm.saleStartTime,
      basePrice,                            
      totalTickets: ticketForm.totalTickets,
      saleMode: ticketForm.saleMode
    })

    ElMessage.success('票务已创建')
    resetTicketForm()
  } finally {
    ticketCreating.value = false
  }
}


// 电影标题字典（用于票务选择）
const movieTitleOptions = ref([])
const movieTitleLoading = ref(false)

const fetchMovieTitles = async () => {
  movieTitleLoading.value = true
  try {
    const list = await http.get('/movies/titles')
    const arr = Array.isArray(list) ? list : []

    movieTitleOptions.value = arr.map((x) => ({
      ...x,
      id: String(x?.id ?? '') 
    }))
  } finally {
    movieTitleLoading.value = false
  }
}




const uploadMedia = async (file, kind) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('kind', kind) // POSTER/COVER/GALLERY

  // 返回 { objectKey, previewUrl }
  return await http.post('/movies/pic/media', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

/** ========== 新建电影：POST /movies ========== */
const movieForm = reactive({
  title: '',
  alias: '',
  intro: '',
  durationMin: null,
  releaseDate: '',
  categoryIds: [],

  posterKey: '',
  posterPreviewUrl: '',

  coverKey: '',
  coverPreviewUrl: '',

  galleryKeys: [],
  galleryPreviewUrls: []
})

const movieCreating = ref(false)

const uploadPoster = async ({ file }) => {
  mediaUploading.poster = true
  try {
    const data = await uploadMedia(file, 'POSTER')
    movieForm.posterKey = data.objectKey
    movieForm.posterPreviewUrl = data.previewUrl
    ElMessage.success('海报已上传')
  } finally {
    mediaUploading.poster = false
  }
}

const uploadCover = async ({ file }) => {
  mediaUploading.cover = true
  try {
    const data = await uploadMedia(file, 'COVER')
    movieForm.coverKey = data.objectKey
    movieForm.coverPreviewUrl = data.previewUrl
    ElMessage.success('封面已上传')
  } finally {
    mediaUploading.cover = false
  }
}

const uploadGallery = async ({ file }) => {
  mediaUploading.gallery = true
  try {
    const data = await uploadMedia(file, 'GALLERY')
    movieForm.galleryKeys.push(data.objectKey)
    movieForm.galleryPreviewUrls.push(data.previewUrl)
    ElMessage.success('图集图片已添加')
  } finally {
    mediaUploading.gallery = false
  }
}

const removeGalleryAt = (idx) => {
  movieForm.galleryKeys.splice(idx, 1)
  movieForm.galleryPreviewUrls.splice(idx, 1)
}

const clearCover = () => {
  movieForm.coverKey = ''
  movieForm.coverPreviewUrl = ''
}

const clearGallery = () => {
  movieForm.galleryKeys = []
  movieForm.galleryPreviewUrls = []
}

const resetMovieForm = () => {
  movieForm.title = ''
  movieForm.alias = ''
  movieForm.intro = ''
  movieForm.durationMin = null
  movieForm.releaseDate = ''
  movieForm.categoryIds = []

  movieForm.posterKey = ''
  movieForm.posterPreviewUrl = ''

  movieForm.coverKey = ''
  movieForm.coverPreviewUrl = ''

  movieForm.galleryKeys = []
  movieForm.galleryPreviewUrls = []
}

const createMovie = async () => {
  const title = String(movieForm.title || '').trim()
  if (!title) return ElMessage.warning('标题不能为空')

  if (!Array.isArray(movieForm.categoryIds) || movieForm.categoryIds.length === 0) {
    return ElMessage.warning('至少选择一个电影类型')
  }

  if (!movieForm.posterKey) {
    return ElMessage.warning('请先上传海报')
  }

  movieCreating.value = true
  try {
    await http.post('/movies', {
      title,
      alias: String(movieForm.alias || '').trim(),
      intro: String(movieForm.intro || '').trim(),
      durationMin: movieForm.durationMin,
      releaseDate: movieForm.releaseDate,
      categoryIds: movieForm.categoryIds,

      posterKey: movieForm.posterKey,
      coverKey: movieForm.coverKey || null,
      galleryKeys: movieForm.galleryKeys || []
    })

    ElMessage.success('电影创建成功')
    resetMovieForm()
  } finally {
    movieCreating.value = false
  }
}

/** ========== 刷新 ========== */
const refreshAll = async () => {
  refreshLoading.value = true
  try {
    await fetchMovieTitles()
    await fetchMerchantMe()
    await fetchCategories()
  } finally {
    refreshLoading.value = false
  }
}

/** ========== 个人中心（复用你用户端接口） ========== */
const countdown = ref(0)
let countdownTimer = null

const profileForm = reactive({
  username: '',
  phone: '',
  code: ''
})

watchEffect(() => {
  if (!userData.value) return
  profileForm.username = userData.value.username || ''
  profileForm.phone = userData.value.phone || ''
})

const sendCode = async () => {
  if (countdown.value > 0) return
  const phone = String(profileForm.phone || '').trim()
  const phoneReg = /^1[3-9]\d{9}$/
  if (!phone || !phoneReg.test(phone)) return ElMessage.warning('请输入正确的手机号')

  await http.post('/user/phone/code', { phone, scene: 'BIND_PHONE' })
  ElMessage.success('验证码已发送')
  startCountdown()
}

const uploadAvatar = async ({ file }) => {
  const formData = new FormData()
  formData.append('file', file)
  await http.put('/user/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
  ElMessage.success('头像更新成功')
  await authStore.fetchUserInfoFromServer()
}

const handleUpdate = async () => {
  const oldUsername = String(userData.value?.username || '').trim()
  const oldPhone = String(userData.value?.phone || '').trim()
  const newUsername = String(profileForm.username || '').trim()
  const newPhone = String(profileForm.phone || '').trim()

  if (newUsername === oldUsername && newPhone === oldPhone) return ElMessage.info('没有修改内容')

  const payload = {}
  if (newUsername !== oldUsername) payload.username = newUsername
  if (newPhone !== oldPhone) {
    if (!profileForm.code) return ElMessage.warning('请输入验证码')
    payload.phone = newPhone
    payload.phoneCode = profileForm.code
  }

  await http.put('/user/profile', payload)
  ElMessage.success('资料更新成功')
  await authStore.fetchUserInfoFromServer()
  showProfilePanel.value = false
}

// 倒计时
const startCountdown = () => {
  countdown.value = 60
  countdownTimer = setInterval(() => {
    if (--countdown.value <= 0) clearInterval(countdownTimer)
  }, 1000)
}
onBeforeUnmount(() => clearInterval(countdownTimer))

const beforeAvatarUpload = (file) => {
  const isImg = file.type.startsWith('image/') && file.size / 1024 / 1024 <= 5
  if (!isImg) ElMessage.warning('请上传5MB以内的图片')
  return isImg
}

/** ========== 退出 ========== */
const handleLogout = () => (showLogoutConfirm.value = true)
const confirmLogout = () => {
  authStore.logout()
  router.push('/login')
}

/** ========== 初始化 ========== */
onMounted(async () => {
  pageLoading.value = true
  try {
    // 确保 userInfo 有值
    if (!userData.value) await authStore.fetchUserInfoFromServer()

    await fetchMerchantMe()
    await fetchMovieTitles()
    await fetchCategories()
  } finally {
    pageLoading.value = false
  }
})
</script>


<style scoped>
/* 你原来的底子基本都能复用，这里只补“商家工作台”的布局样式 */

/* 背景与容器 */
.merchant-wrapper { width: 100vw; height: 100vh; overflow: hidden; position: relative; }
.login-container { width: 100%; height: 100%; background: radial-gradient(ellipse at bottom, #1B2735 0%, #090A0F 100%); overflow-y: auto; }
.stars { position: fixed; inset: 0; background: url('https://s3-us-west-2.amazonaws.com/s.cdpn.io/123163/stars.png'); opacity: 0.35; pointer-events: none; }

/* 顶部导航 */
.glass-nav { position: sticky; top: 0; z-index: 100; height: 70px; background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(15px); border-bottom: 1px solid rgba(255, 255, 255, 0.1); display: flex; align-items: center; }
.nav-content { width: 1300px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; padding: 0 20px; }
.brand { color: #fff; font-size: 22px; font-weight: bold; letter-spacing: 2px; }
.sub { font-size: 12px; color: #409eff; }
.user-portal { display: flex; align-items: center; gap: 15px; }
.user-text { display: flex; flex-direction: column; text-align: right; color: #fff; }
.name { font-size: 14px; }
.role { font-size: 11px; color: rgba(255,255,255,0.5); }
.avatar-glow { border: 2px solid #409eff; box-shadow: 0 0 10px rgba(64, 158, 255, 0.5); cursor: pointer; transition: 0.3s; }
.avatar-glow:hover { transform: scale(1.05); }
.exit-btn { color: #fff; font-size: 20px; }
.exit-btn:hover { color: #f56c6c; }

.phone { font-size: 11px; color: rgba(255,255,255,0.7); margin-top: 4px; }
.phone-missing { color: #e6a23c; cursor: pointer; text-decoration: underline; }
.clickable { cursor: pointer; }

/* 主体布局 */
.content-body { max-width: 1300px; margin: 24px auto; padding: 0 20px; }
.dashboard { display: grid; grid-template-columns: 240px 1fr; gap: 18px; align-items: start; }

.glass-panel {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  backdrop-filter: blur(12px);
  box-shadow: 0 18px 45px rgba(0,0,0,0.35);
}

/* 侧边菜单 */
.side-menu { padding: 16px; position: sticky; top: 92px; }
.menu-title { color: #fff; font-weight: 700; letter-spacing: 2px; margin-bottom: 12px; opacity: 0.9; }
.menu-item {
  padding: 10px 12px;
  border-radius: 12px;
  color: rgba(255,255,255,0.85);
  cursor: pointer;
  transition: 0.25s;
  margin-bottom: 8px;
  background: rgba(0,0,0,0.15);
  border: 1px solid rgba(255,255,255,0.06);
}
.menu-item:hover { transform: translateY(-1px); border-color: rgba(64,158,255,0.35); }
.menu-item.active { background: rgba(64,158,255,0.14); border-color: rgba(64,158,255,0.5); color: #fff; }
.menu-item.danger { border-color: rgba(245,108,108,0.25); }
.menu-item.danger.active { background: rgba(245,108,108,0.12); border-color: rgba(245,108,108,0.5); }

.menu-divider { height: 1px; background: rgba(255,255,255,0.08); margin: 12px 0; }

/* 主面板 */
.main-panel { padding: 18px; }
.panel-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 14px; }
.panel-title { margin: 0; color: #fff; letter-spacing: 2px; }
.panel-sub { margin: 6px 0 0; color: rgba(255,255,255,0.55); font-size: 13px; }
.head-actions { display: flex; gap: 10px; }

.tab { padding: 12px 2px; }
.section-title { color: #70c0ff; font-weight: 600; letter-spacing: 1.5px; margin-bottom: 12px; }
.danger-text { color: #f56c6c; }

/* 信息卡 */
.info-cards { display: grid; grid-template-columns: 1fr 1fr 1.2fr; gap: 12px; }
.info-card {
  padding: 14px;
  border-radius: 14px;
  background: rgba(0,0,0,0.18);
  border: 1px solid rgba(255,255,255,0.08);
}
.label { color: rgba(255,255,255,0.55); font-size: 12px; margin-bottom: 8px; }
.value { color: #fff; font-size: 14px; }
.truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.06);
}
.pill.ok { border-color: rgba(103,194,58,0.4); background: rgba(103,194,58,0.1); }
.pill.pending { border-color: rgba(230,162,60,0.4); background: rgba(230,162,60,0.1); }
.pill.bad { border-color: rgba(245,108,108,0.45); background: rgba(245,108,108,0.12); }
.pill.unknown { opacity: 0.8; }

.hint { margin-top: 14px; color: rgba(255,255,255,0.55); font-size: 12px; line-height: 1.6; }
.hint code { color: #70c0ff; background: rgba(64,158,255,0.12); padding: 1px 6px; border-radius: 6px; }

/* 表单与按钮 */
.custom-form { margin-top: 6px; }
.row-actions { display: flex; gap: 10px; margin-top: 12px; }
.primary-btn {
  background: linear-gradient(90deg, #1e3c72 0%, #2a5298 100%) !important;
  border: none !important;
  height: 40px;
  padding: 0 18px;
  border-radius: 12px;
  font-weight: 700;
  letter-spacing: 2px;
}
.ghost-btn {
  background: rgba(255,255,255,0.06) !important;
  border: 1px solid rgba(255,255,255,0.15) !important;
  color: #fff !important;
  border-radius: 12px;
  height: 40px;
  padding: 0 16px;
}

.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.upload-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.path-box {
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(0,0,0,0.18);
  border: 1px solid rgba(255,255,255,0.08);
  max-width: 520px;
}
.path-label { font-size: 11px; color: rgba(255,255,255,0.55); margin-bottom: 6px; }
.path-value { font-size: 12px; color: rgba(255,255,255,0.9); word-break: break-all; }

.poster-preview {
  margin-top: 12px;
  width: 180px;
  height: 240px;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(0,0,0,0.25);
}
.poster-preview :deep(img) { width: 100%; height: 100%; object-fit: cover; }

/* 危险区 */
.danger-box {
  padding: 16px;
  border-radius: 16px;
  background: rgba(245,108,108,0.08);
  border: 1px solid rgba(245,108,108,0.25);
  color: rgba(255,255,255,0.85);
}

/* 退出弹窗（你原来的） */
.logout-overlay {
  position: fixed; inset: 0; background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(10px); display: flex; align-items: center;
  justify-content: center; z-index: 3000;
}
.logout-glass-card {
  background: rgba(30, 35, 45, 0.9); border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 40px; border-radius: 24px; text-align: center; width: 340px;
  box-shadow: 0 25px 50px rgba(0,0,0,0.5);
}
.logout-icon { font-size: 50px; color: #f56c6c; margin-bottom: 15px; }
.logout-glass-card h3 { color: #fff; margin: 0 0 10px 0; }
.logout-actions { display: flex; gap: 15px; margin-top: 25px; }
.btn-cancel, .btn-confirm {
  flex: 1; padding: 12px; border-radius: 10px; border: none; cursor: pointer; transition: 0.3s; font-weight: bold;
}
.btn-cancel { background: rgba(255,255,255,0.08); color: #fff; }
.btn-cancel:hover { background: rgba(255,255,255,0.15); }
.btn-confirm { background: #f56c6c; color: #fff; }
.btn-confirm:hover { background: #ff4d4d; transform: scale(1.05); }

/* 个人面板（你原来的） */
.profile-panel-overlay {
  position: fixed; inset: 0; background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px); z-index: 2000; display: flex; justify-content: flex-end;
}
.profile-glass-panel {
  width: 360px; height: 100%; background: rgba(15, 20, 30, 0.95);
  border-left: 1px solid rgba(64, 158, 255, 0.3); padding: 40px 25px;
}
.panel-header { display: flex; justify-content: space-between; color: #fff; margin-bottom: 30px; }
.close-icon { cursor: pointer; font-size: 20px; }

/* 输入框深色风格覆盖 */
:deep(.el-form-item__label) { color: #70c0ff !important; font-weight: 500; letter-spacing: 1.5px; font-size: 13px; margin-bottom: 8px !important; text-transform: uppercase; }
:deep(.el-input__wrapper) { background-color: rgba(10, 25, 47, 0.6) !important; box-shadow: 0 0 0 1px rgba(64, 158, 255, 0.2) inset !important; border-radius: 10px; padding: 6px 12px; transition: all 0.3s ease; }
:deep(.el-input__wrapper.is-focus) { box-shadow: 0 0 0 1px #409eff inset, 0 0 12px rgba(64, 158, 255, 0.4) !important; background-color: rgba(10, 25, 47, 0.8) !important; }
:deep(.el-input__inner) { color: #ffffff !important; }
:deep(.el-input__inner::placeholder) { color: rgba(255, 255, 255, 0.3); }
:deep(.el-textarea__inner) { background: rgba(10, 25, 47, 0.6) !important; color: #fff !important; border-radius: 10px; border: 1px solid rgba(64,158,255,0.15) !important; }

/* 预览头像 */
.preview-avatar { width: 80px; height: 80px; border-radius: 50%; border: 2px solid #409eff; box-shadow: 0 0 15px rgba(64, 158, 255, 0.5); overflow: hidden; }
.preview-avatar :deep(img) { border-radius: 50%; }

/* 动画 */
.slide-right-enter-active, .slide-right-leave-active { transition: all 0.4s ease; }
.slide-right-enter-from, .slide-right-leave-to { transform: translateX(100%); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* 流星（你原来的斜向版本） */
.meteor-container { position: fixed; inset: 0; overflow: hidden; pointer-events: none; z-index: 0; }
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

/* 响应式 */
@media (max-width: 980px) {
  .dashboard { grid-template-columns: 1fr; }
  .side-menu { position: relative; top: 0; }
  .info-cards { grid-template-columns: 1fr; }
}
</style>
