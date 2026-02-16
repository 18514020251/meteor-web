<template>
  <div class="page-container">
    <canvas id="meteor-canvas" class="meteor-bg"></canvas>
    
    <div class="content-wrap">
      <div class="nav-bar">
        <el-button link @click="goBack" class="back-btn">
          <el-icon><ArrowLeft /></el-icon> 返回
        </el-button>
        <div class="nav-title">电影库搜索</div>
        <div class="nav-right">
          <el-button text @click="doSearch(true)">刷新</el-button>
        </div>
      </div>

      <div class="glass-section">
        <div class="search-bar">
          <el-input
            v-model="query.q"
            clearable
            class="custom-search-input"
            placeholder="输入片名 / 别名 / 关键词"
            @keyup.enter="doSearch(true)"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>

        <div class="filter-group">
          <div class="filter-item">
            <span class="filter-label">分类：</span>
            <div class="tag-scroll">
              <el-check-tag
                v-for="c in categories"
                :key="c.id"
                class="glass-tag"
                :checked="selectedCategorySet.has(c.id)"
                @change="onToggleCategory(c.id)"
              >
                {{ c.name }}
              </el-check-tag>
              <el-button
                v-if="selectedCategorySet.size > 0"
                size="small"
                link
                @click="clearCategories"
                style="margin-left: 8px; color: #f56c6c;"
              >重置</el-button>
            </div>
          </div>

          <div class="filter-item">
            <span class="filter-label">状态：</span>
            <el-segmented
              v-model="statusUi"
              class="glass-segmented"
              :options="statusOptions"
              @change="onStatusChange"
            />
          </div>
        </div>

        <div class="result-area" v-loading="loading" element-loading-background="rgba(0, 0, 0, 0.1)">
          <template v-if="list.length > 0">
            <div class="grid">
              <div
                v-for="item in list"
                :key="item.movieId"
                class="movie-card"
                @click="goDetail(item.movieId)"
              >
                <div class="poster-box">
                  <img :src="resolvePoster(item.posterUrl)" alt="poster" />
                </div>

                <div class="movie-info">
                  <div class="title-row">
                    <span class="title">{{ item.title }}</span>
                    <el-tag size="small" :type="statusTagType(item.status)" effect="plain">
                      {{ statusText(item.status) }}
                    </el-tag>
                  </div>

                  <div class="sub-text">
                    {{ item.releaseDate || '待定' }} · {{ item.durationMin || '?' }}min
                  </div>

                  <div class="mini-tags">
                    <span v-for="(c, idx) in (item.categories || [])" :key="idx" class="dot-tag">
                      {{ c }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div class="pager-wrap">
              <el-pagination
                background
                layout="prev, pager, next"
                :total="total"
                :page-size="query.size"
                v-model:current-page="query.page"
                @current-change="onPageChange"
              />
            </div>
          </template>

          <div v-else-if="!loading" class="empty-box">
            <el-empty description="没有找到相关记录" :image-size="80" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ArrowLeft, Search } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { onMounted, reactive, ref, watch, onUnmounted } from 'vue'
import { MovieAPI } from '@/api/movie'

const router = useRouter()
const goBack = () => router.back()

// 状态设置
const statusOptions = [
  { label: '全部', value: 'ALL' },
  { label: '待映', value: 'COMING' },
  { label: '上映中', value: 'SHOWING' }
]
const statusUi = ref('ALL')
const statusToInt = (ui) => {
  if (ui === 'COMING') return 1
  if (ui === 'SHOWING') return 2
  return null
}



// 流星背景（已改为柔和色调）
const initMeteor = () => {
  const canvas = document.getElementById('meteor-canvas')
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  let w = canvas.width = window.innerWidth
  let h = canvas.height = window.innerHeight
  const meteors = []
  const createMeteor = () => ({
    x: Math.random() * w,
    y: Math.random() * h * 0.4,
    len: Math.random() * 60 + 20,
    speed: Math.random() * 6 + 2,
    opacity: Math.random() * 0.5
  })
  for (let i = 0; i < 12; i++) meteors.push(createMeteor())
  const draw = () => {
    ctx.clearRect(0, 0, w, h)
    meteors.forEach(m => {
      m.x -= m.speed; m.y += m.speed
      if (m.x < -100 || m.y > h + 100) Object.assign(m, createMeteor(), { x: w + 100 })
      const grad = ctx.createLinearGradient(m.x, m.y, m.x + m.len, m.y - m.len)
      grad.addColorStop(0, `rgba(255, 255, 255, ${m.opacity})`)
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)')
      ctx.strokeStyle = grad; ctx.lineWidth = 1; ctx.beginPath()
      ctx.moveTo(m.x, m.y); ctx.lineTo(m.x + m.len, m.y - m.len); ctx.stroke()
    })
    requestAnimationFrame(draw)
  }
  draw()
}

// 业务逻辑
const query = reactive({ q: '', categoryIds: [], status: null, page: 1, size: 20 })
const loading = ref(false)
const categories = ref([])
const selectedCategorySet = ref(new Set())
const list = ref([])
const total = ref(0)

const resolvePoster = (p) => {
  if (!p) return ''
  if (p.startsWith('http')) return p
  const base = import.meta.env.VITE_ASSET_BASE || ''
  return `${base.replace(/\/$/, '')}/${p.replace(/^\//, '')}`
}

// 防抖定时器
let searchTimer = null

watch(
  () => query.q,
  () => {
    if (searchTimer) clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
      doSearch(true)
    }, 500)
  }
)

watch(
  () => [query.status, JSON.stringify(query.categoryIds)],
  () => {
    if (searchTimer) clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
      doSearch(true)
    }, 300)
  }
)

onUnmounted(() => {
  if (searchTimer) clearTimeout(searchTimer)
})

const statusText = (s) => (s === 'SHOWING' || s === 2 ? '上映中' : '即将上映')
const statusTagType = (s) => (s === 'SHOWING' || s === 2 ? 'success' : 'warning')

const onToggleCategory = (id) => {
  const set = selectedCategorySet.value
  set.has(id) ? set.delete(id) : set.add(id)
  query.categoryIds = Array.from(set)
  doSearch(true)
}

const clearCategories = () => {
  selectedCategorySet.value.clear()
  query.categoryIds = []
  doSearch(true)
}

const onStatusChange = () => {
  query.status = statusToInt(statusUi.value)
  doSearch(true)
}

const onPageChange = (p) => {
  query.page = p
  doSearch(false)
}

const goDetail = (id) => router.push(`/movies/${id}`)

const doSearch = async (reset) => {
  if (reset) query.page = 1
  loading.value = true
  try {
    const res = await MovieAPI.searchMovies({
      ...query,
      q: query.q.trim() || undefined,
      categoryIds: query.categoryIds.length ? query.categoryIds : undefined
    })
    list.value = res.records || []
    total.value = res.total || 0
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  initMeteor()
  categories.value = await MovieAPI.getCategories()
  doSearch(true)
})
</script>

<style scoped>
/* 1. 基础容器：深色背景以衬托玻璃感 */
.page-container {
  min-height: 100vh;
  background: #0a0b10;
  position: relative;
  overflow-x: hidden;
}

.content-wrap {
  position: relative;
  z-index: 1;
  padding: 16px;
  max-width: 1200px;
  margin: 0 auto;
}

/* 2. 流星背景 */
.meteor-bg {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  pointer-events: none;
  opacity: 0.3;
}

/* 3. 导航栏 (同步订单详情) */
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  height: 44px;
}
.nav-title {
  font-weight: 700;
  color: rgba(255, 255, 255, 0.92);
  font-size: 16px;
}
.back-btn { color: rgba(255, 255, 255, 0.8) !important; }

/* 4. 玻璃容器 (同步订单详情 14px 圆角) */
.glass-section {
  padding: 20px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* 5. 搜索框适配 */
.search-bar { 
  margin-bottom: 20px; 
  width: 100%;
  padding: 0 8px;
}
.search-bar .el-input {
  width: 100%;
}
:deep(.custom-search-input .el-input__wrapper) {
  background: rgba(255, 255, 255, 0.08) !important;
  box-shadow: none !important;
  border-radius: 20px;
  padding-left: 16px;
  min-height: 44px;
}
:deep(.custom-search-input .el-input__inner) {
  color: #fff !important;
  height: 44px;
  line-height: 44px;
  font-size: 14px;
}
:deep(.custom-search-input .el-input-group__append) {
  background: rgba(255, 255, 255, 0.15) !important;
  border: none !important;
  border-radius: 0 20px 20px 0;
  padding: 0 !important;

  display: flex;
  align-items: stretch; /* 让里面按钮撑满高度 */
}
:deep(.custom-search-input .el-input-group__append .el-button) {
  color: #fff;
  border: none;
  background: transparent;
  padding: 0 20px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 500;
}
:deep(.custom-search-input .el-input-group__append .el-button:hover) {
  background: rgba(255, 255, 255, 0.2);
}

/* 6. 筛选器 */
.filter-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}
.filter-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.filter-label {
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
  margin-top: 4px;
  white-space: nowrap;
}

/* 分类标签适配 */
.tag-scroll {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.glass-tag {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: rgba(255, 255, 255, 0.7) !important;
  border-radius: 6px;
  font-weight: normal;
}
.glass-tag.is-checked {
  background: rgba(255, 255, 255, 0.2) !important;
  color: #fff !important;
  border-color: rgba(255, 255, 255, 0.4) !important;
}

/* 分段选择器适配 */
.glass-segmented {
  --el-segmented-bg-color: rgba(255, 255, 255, 0.05);
  --el-segmented-item-selected-bg-color: rgba(255, 255, 255, 0.15);
  --el-segmented-item-selected-color: #fff;
  border-radius: 8px;
}

/* 7. 电影卡片 (模仿订单详情的 Card 风格) */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.movie-card {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.2s;
  cursor: pointer;
}
.movie-card:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-2px);
}

.poster-box {
  width: 80px;
  height: 112px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
}
.poster-box img { width: 100%; height: 100%; object-fit: cover; }

.movie-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}
.title {
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
}

.sub-text {
  color: rgba(255, 255, 255, 0.4);
  font-size: 12px;
}

.mini-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.dot-tag {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.06);
  padding: 1px 6px;
  border-radius: 4px;
}

/* 8. 其他适配 */
.pager-wrap {
  margin-top: 30px;
  display: flex;
  justify-content: center;
}
:deep(.el-pagination.is-background .el-pager li) {
  background-color: rgba(255, 255, 255, 0.05) !important;
  color: rgba(255, 255, 255, 0.6) !important;
}
:deep(.el-pagination.is-background .el-pager li.is-active) {
  background-color: rgba(255, 255, 255, 0.2) !important;
  color: #fff !important;
}

.empty-box {
  padding: 60px 0;
}
:deep(.el-empty__description p) {
  color: rgba(255, 255, 255, 0.4) !important;
}
</style>