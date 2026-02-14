<template>
  <div class="search-wrapper">
    <canvas id="meteor-canvas" class="meteor-bg"></canvas>
    
    <div class="login-container">
      <header class="glass-nav">
        <div class="nav-content">
          <div class="brand">
            <span class="glitch-text">METEOR</span> 
            <span class="sub">CINEMA</span>
          </div>
          <div class="user-portal">
            <el-button link class="nav-icon-btn" @click="goBack">
              <el-icon><ArrowLeft /></el-icon>
            </el-button>
          </div>
        </div>
      </header>

      <main class="content-body">
        <div class="glass-section terminal-window">
          <div class="terminal-header">
            <div class="dots">
              <span></span><span></span><span></span>
            </div>
            <div class="terminal-title">DATABASE_SEARCH.EXE</div>
          </div>

          <div class="section-title">
            <el-icon class="scan-icon"><Search /></el-icon> 电影库搜索
          </div>

          <div class="search-bar">
            <el-input
              v-model="query.q"
              clearable
              class="custom-input"
              placeholder="输入片名 / 别名 / 简介关键词"
              @keyup.enter="doSearch(true)"
            >
              <template #append>
                <el-button :loading="loading" @click="doSearch(true)">
                  EXECUTE
                </el-button>
              </template>
            </el-input>
          </div>

          <div class="filters">
            <div class="filter-row">
              <div class="filter-label">TAGS_</div>
              <div class="filter-content">
                <el-skeleton v-if="catLoading" :rows="1" animated />
                <div v-else class="category-tags">
                  <el-check-tag
                    v-for="c in categories"
                    :key="c.id"
                    class="cyber-tag"
                    :checked="selectedCategorySet.has(c.id)"
                    @change="onToggleCategory(c.id)"
                  >
                    {{ c.name }}
                  </el-check-tag>
                  <el-button
                    v-if="selectedCategorySet.size > 0"
                    class="clear-btn-neon"
                    link
                    @click="clearCategories"
                  >
                    [ CLEAR ]
                  </el-button>
                </div>
              </div>
            </div>

            <div class="filter-row">
              <div class="filter-label">STATUS_</div>
              <div class="filter-content">
                <el-segmented
                  v-model="statusUi"
                  class="cyber-segmented"
                  :options="statusOptions"
                  @change="onStatusChange"
                />
              </div>
            </div>
          </div>

          <div class="result-area">
            <el-skeleton v-if="loading" :rows="6" animated />

            <template v-else>
              <el-empty v-if="list.length === 0" description="NO_DATA_FOUND" />

              <div v-else class="grid">
                <div
                  v-for="item in list"
                  :key="item.movieId"
                  class="movie-card"
                  @click="goDetail(item.movieId)"
                >
                  <div class="poster-wrapper">
                    <img :src="resolvePoster(item.posterUrl)" alt="poster" />
                    <div class="poster-overlay"></div>
                  </div>

                  <div class="info">
                    <div class="title-row">
                      <div class="title">{{ item.title }}</div>
                      <div class="status-indicator" :class="statusTagType(item.status)">
                        {{ statusText(item.status) }}
                      </div>
                    </div>

                    <div class="sub">
                      <span>{{ item.alias || '---' }}</span>
                      <span class="slash">/</span>
                      <span class="muted">{{ item.releaseDate || 'UNKNOWN' }}</span>
                      <span class="slash">/</span>
                      <span class="muted">{{ item.durationMin ? item.durationMin + 'm' : '?' }}</span>
                    </div>

                    <div class="cats">
                      <span v-for="(c, idx) in (item.categories || [])" :key="idx" class="mini-tag">
                        #{{ c }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="total > 0" class="pager">
                <el-pagination
                  background
                  layout="total, prev, pager, next"
                  :total="total"
                  :page-size="query.size"
                  :current-page="query.page"
                  @current-change="onPageChange"
                />
              </div>
            </template>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ArrowLeft, Search } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { MovieAPI } from '@/api/movie'
import { onMounted, reactive, ref, onUnmounted } from 'vue'

const router = useRouter()

const goBack = () => router.back()

// ========== 状态映射（UI -> 后端参数）==========
const statusOptions = [
  { label: '全部', value: 'ALL' },
  { label: '即将上映', value: 'COMING' },
  { label: '上映中', value: 'SHOWING' },
  { label: '已下映', value: 'OFF' }
]
const statusUi = ref('ALL')

// 你的后端 DTO status 是 Integer：1/2/3
const statusToInt = (ui) => {
  if (ui === 'COMING') return 1
  if (ui === 'SHOWING') return 2
  if (ui === 'OFF') return 3
  return null
}

const initMeteor = () => {
  const canvas = document.getElementById('meteor-canvas')
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  let w = canvas.width = window.innerWidth
  let h = canvas.height = window.innerHeight

  const meteors = []
  const createMeteor = () => ({
    x: Math.random() * w,
    y: Math.random() * h * 0.5,
    len: Math.random() * 80 + 20,
    speed: Math.random() * 10 + 5,
    opacity: Math.random()
  })

  for (let i = 0; i < 15; i++) meteors.push(createMeteor())

  const draw = () => {
    ctx.clearRect(0, 0, w, h)
    meteors.forEach(m => {
      m.x -= m.speed
      m.y += m.speed
      if (m.x < -100 || m.y > h + 100) {
        Object.assign(m, createMeteor(), { x: w + 100, y: Math.random() * h * 0.5 - 100 })
      }

      const grad = ctx.createLinearGradient(m.x, m.y, m.x + m.len, m.y - m.len)
      // 改为绿色调流星，增加科技感
      grad.addColorStop(0, `rgba(0, 255, 157, ${m.opacity})`) 
      grad.addColorStop(1, 'rgba(0, 255, 157, 0)')

      ctx.strokeStyle = grad
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(m.x, m.y)
      ctx.lineTo(m.x + m.len, m.y - m.len)
      ctx.stroke()
    })
    requestAnimationFrame(draw)
  }
  draw()
  
  window.addEventListener('resize', () => {
    w = canvas.width = window.innerWidth
    h = canvas.height = window.innerHeight
  })
}

// ========== 查询状态 ==========
const query = reactive({
  q: '',
  categoryIds: [], // 最终发给后端
  status: null,
  sort: 'releaseDateDesc',
  page: 1,
  size: 20
})

const loading = ref(false)
const catLoading = ref(false)

const categories = ref([]) // [{id,name}]
const selectedCategorySet = ref(new Set())

const list = ref([])
const total = ref(0)

// 你的 posterUrl 返回的是 object_key（类似 movie/poster/...），这里做一下前缀兼容
const resolvePoster = (p) => {
  if (!p) return ''
  // 已经是完整 http(s) 就直接返回
  if (p.startsWith('http://') || p.startsWith('https://')) return p
  // 否则用环境变量拼（你项目里如果有专门的静态资源域名，就放到 VITE_ASSET_BASE）
  const base = import.meta.env.VITE_ASSET_BASE || ''
  if (!base) return p
  return `${base.replace(/\/$/, '')}/${p.replace(/^\//, '')}`
}

const statusText = (s) => {
  // 你返回里是 "COMING"/"SHOWING" 这种字符串（看你的示例）
  if (s === 'COMING' || s === 1) return '即将上映'
  if (s === 'SHOWING' || s === 2) return '上映中'
  if (s === 'OFF' || s === 3) return '已下映'
  return '未知'
}

const statusTagType = (s) => {
  if (s === 'SHOWING' || s === 2) return 'success'
  if (s === 'COMING' || s === 1) return 'warning'
  if (s === 'OFF' || s === 3) return 'info'
  return ''
}

// ========== 事件处理 ==========
const onToggleCategory = (id) => {
  const set = selectedCategorySet.value
  if (set.has(id)) set.delete(id)
  else set.add(id)

  query.categoryIds = Array.from(set)
  query.page = 1
  doSearch(false)
}

const clearCategories = () => {
  selectedCategorySet.value = new Set()
  query.categoryIds = []
  query.page = 1
  doSearch(false)
}

const onStatusChange = () => {
  query.status = statusToInt(statusUi.value)
  query.page = 1
  doSearch(false)
}

const onPageChange = (p) => {
  query.page = p
  doSearch(false)
}

const onSizeChange = (s) => {
  query.size = s
  query.page = 1
  doSearch(false)
}

const goDetail = (movieId) => {
  // 你项目里如果详情页路由不是这个，改成你自己的
  router.push(`/movies/${movieId}`)
}

// ========== 请求 ==========
const fetchCategories = async () => {
  catLoading.value = true
  try {
    categories.value = await MovieAPI.getCategories()
  } finally {
    catLoading.value = false
  }
}

const doSearch = async (resetPage) => {
  if (resetPage) query.page = 1

  loading.value = true
  try {
    const res = await MovieAPI.searchMovies({
      q: query.q?.trim() || undefined,
      categoryIds: query.categoryIds.length ? query.categoryIds : undefined,
      status: query.status ?? undefined,
      sort: query.sort,
      page: query.page,
      size: query.size
    })

    // 你的 HTTP.js 已经把 {code,msg,data} 解包成 data 了
    // data: { records, total, pageNum, pageSize }
    list.value = res.records || []
    total.value = res.total || 0

    // 兼容后端回传 pageNum/pageSize（如果后端有矫正）
    if (res.pageNum) query.page = res.pageNum
    if (res.pageSize) query.size = res.pageSize
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  initMeteor()
  await fetchCategories()
  await doSearch(true)
})
</script>

<style scoped>
/* 1. 基础容器：彻底暗化 */
.search-wrapper {
  width: 100vw;
  height: 100vh;
  overflow-y: auto;
  /* 极深背景色 */
  background: #050505;
  position: relative;
  color: #a0a0a0;
  font-family: 'Input Mono', 'Consolas', monospace;
}

/* 2. 流星背景：调暗亮度 */
.meteor-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  opacity: 0.4; /* 降低流星亮度，不抢戏 */
}

/* 3. 玻璃卡片：去白，深色半透明 */
.glass-section {
  background: rgba(10, 10, 12, 0.8);
  backdrop-filter: blur(25px);
  border: 1px solid rgba(0, 255, 157, 0.15); /* 霓虹边框阴影 */
  border-radius: 2px;
  padding: 1.5rem;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.8);
}

/* 4. 终端头部装饰 */
.terminal-header .dots span:nth-child(1) { background: #ff5555; }
.terminal-header .dots span:nth-child(2) { background: #ffbd2e; }
.terminal-header .dots span:nth-child(3) { background: #27c93f; }

.section-title {
  color: #00ff9d; /* 绿色标题，更有终端感 */
  text-transform: uppercase;
  letter-spacing: 2px;
}

/* 5. 搜索栏改色：完全移除白色背景 */
.custom-input :deep(.el-input__wrapper) {
  background-color: rgba(20, 20, 20, 0.6) !important;
  border: 1px solid rgba(0, 255, 157, 0.3) !important;
  box-shadow: none !important;
}

.custom-input :deep(.el-input__inner) {
  color: #00ff9d !important; /* 输入文字改为霓虹绿 */
}

.custom-input :deep(.el-input-group__append) {
  background-color: rgba(0, 255, 157, 0.1); /* 按钮透明绿 */
  color: #00ff9d;
  border: 1px solid rgba(0, 255, 157, 0.3);
  border-left: none;
  font-weight: bold;
  transition: all 0.3s;
}

.custom-input :deep(.el-input-group__append:hover) {
  background-color: #00ff9d;
  color: #000; /* 悬浮时反色 */
}

/* 6. 分类标签：去除白底 */
.cyber-tag {
  background: rgba(255, 255, 255, 0.03) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: #666 !important;
}

.cyber-tag.is-checked {
  background: rgba(0, 255, 157, 0.1) !important;
  color: #00ff9d !important;
  border-color: #00ff9d !important;
  text-shadow: 0 0 5px rgba(0, 255, 157, 0.5);
}

/* 7. 分段控制器（Status）暗化 */
.cyber-segmented {
  --el-segmented-bg-color: rgba(0, 0, 0, 0.4);
  --el-segmented-item-selected-bg-color: rgba(0, 255, 157, 0.2);
  --el-segmented-item-selected-color: #00ff9d;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

/* 8. 电影卡片：暗色呼吸感 */
.movie-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.movie-card:hover {
  background: rgba(0, 255, 157, 0.03);
  border-color: #00ff9d;
  box-shadow: 0 0 15px rgba(0, 255, 157, 0.1);
}

.title {
  color: #d0d0d0;
}

.mini-tag {
  color: #444;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

/* 9. 分页：彻底移除白色 */
.pager :deep(.el-pagination.is-background .el-pager li:not(.is-active)) {
  background-color: rgba(255, 255, 255, 0.02);
  color: #555;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.pager :deep(.el-pagination.is-background .el-pager li.is-active) {
  background-color: rgba(0, 255, 157, 0.2) !important;
  color: #00ff9d !important;
  border: 1px solid #00ff9d;
}

/* 10. 全局滚动条暗化 */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: #050505;
}
::-webkit-scrollbar-thumb {
  background: #222;
}
::-webkit-scrollbar-thumb:hover {
  background: #00ff9d;
}
/* --- 布局优化 --- */
.grid {
  display: grid;
  /* 增加最小宽度约束，让卡片看起来更修长 */
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
}

.movie-card {
  display: flex;
  align-items: flex-start; /* 顶部对齐 */
  gap: 1rem;
  padding: 0.75rem; /* 稍微减小内边距 */
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
  cursor: pointer;
}

/* --- 海报尺寸严格约束 --- */
.poster-wrapper {
  /* 严格控制海报宽度和高度 */
  width: 64px;          /* 宽度缩小 */
  height: 90px;         /* 高度按比例缩小 (约 1:1.4) */
  flex-shrink: 0;       /* 禁止缩小 */
  position: relative;
  overflow: hidden;
  border-radius: 2px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.poster-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;    /* 裁切填充 */
  filter: grayscale(0.2) brightness(0.8); /* 稍微压暗，更符合终端风 */
  transition: transform 0.3s;
}

.movie-card:hover .poster-wrapper img {
  transform: scale(1.1);
  filter: grayscale(0) brightness(1);
}

/* --- 信息区调整 --- */
.info {
  flex: 1;
  min-width: 0; /* 允许文本溢出省略 */
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 4px;
}

.title {
  font-size: 0.95rem; /* 字号微调 */
  font-weight: bold;
  color: #d0d0d0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis; /* 长标题自动省略 */
  margin-right: 8px;
}

.status-indicator {
  font-size: 10px;
  padding: 1px 4px;
  border: 1px solid currentColor;
  border-radius: 2px;
  flex-shrink: 0;
  opacity: 0.8;
}

.sub {
  font-size: 11px; /* 进一步缩小次要信息 */
  color: #666; /* 调暗次要文字 */
  margin: 4px 0 8px 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.cats {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.mini-tag {
  font-size: 10px;
  color: #444;
  background: rgba(255, 255, 255, 0.02);
  padding: 0 4px;
  border: 1px solid rgba(255, 255, 255, 0.03);
}
/* 扩宽整体容器 */
.login-container {
  position: relative;
  z-index: 1;
  max-width: 1400px; /* 从 1100 增加到 1400 */
  margin: 0 auto;
  padding: 2rem;    /* 增加外边距 */
}

.glass-section {
  background: rgba(10, 10, 12, 0.9);
  backdrop-filter: blur(25px);
  border: 1px solid rgba(0, 255, 157, 0.2);
  border-radius: 4px;
  padding: 2.5rem;  /* 增加内边距 */
  box-shadow: 0 0 50px rgba(0, 0, 0, 0.9);
}

/* 增大标题字号 */
.section-title {
  font-size: 1.8rem; /* 更大的标题 */
  margin-bottom: 2rem;
  letter-spacing: 4px;
}
/* 强制覆盖所有 Element 按钮的默认白色 */
:deep(.el-button) {
  background-color: transparent !important;
  border-color: rgba(0, 255, 157, 0.3) !important;
  color: #00ff9d !important;
}

/* 鼠标悬浮时的效果：半透明绿 */
:deep(.el-button:hover) {
  background-color: rgba(0, 255, 157, 0.1) !important;
  border-color: #00ff9d !important;
  box-shadow: 0 0 10px rgba(0, 255, 157, 0.2);
}

/* 针对 link 类型的按钮（如返回按钮） */
:deep(.el-button--text), 
:deep(.el-button.is-link) {
  background-color: transparent !important;
  border: none !important;
  padding: 0;
}

/* 搜索框右侧的 EXECUTE 按钮特殊处理 */
.custom-input :deep(.el-input-group__append) {
  background-color: rgba(0, 255, 157, 0.05) !important; /* 极暗绿 */
  border: 1px solid rgba(0, 255, 157, 0.3) !important;
  border-left: none !important;
}

.custom-input :deep(.el-input-group__append button) {
  border: none !important;
  width: 100%;
  height: 100%;
}
.title {
  font-size: 1.15rem; /* 增大电影标题 */
  margin-bottom: 6px;
}

.sub {
  font-size: 13px;    /* 增大副标题 */
  color: #888;
}

/* 增大海报尺寸 */
.poster-wrapper {
  width: 100px;       /* 从 64px 增大到 100px */
  height: 140px;
}

/* 调整网格间距 */
.grid {
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 2rem;
}
:deep(.el-pagination button),
:deep(.el-pager li) {
  background-color: transparent !important;
  color: #555 !important;
  border: 1px solid rgba(255, 255, 255, 0.05) !important;
}

:deep(.el-pager li.is-active) {
  color: #00ff9d !important;
  border-color: #00ff9d !important;
  background-color: rgba(0, 255, 157, 0.1) !important;
}
</style>
