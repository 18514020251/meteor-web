<template>
  <div class="user-wrapper">
    <div class="login-container">
      <div class="stars"></div>
      <div class="meteor-container">
        <div v-for="n in 6" :key="n" class="meteor"></div>
      </div>

      <!-- 顶部导航（保持不动） -->
      <header class="glass-nav">
        <div v-if="userData" class="nav-content">
          <div class="brand">METEOR <span class="sub">ADMIN</span></div>

          <div class="user-portal">
            <div class="user-text">
              <span class="name">{{ userData.username }}</span>
              <span class="role">ADMIN ID: {{ userData.userId || '000' }}</span>
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

      <!-- 主体：左侧导航 + 右侧内容 -->
      <main class="content-body">
        <div class="admin-layout">
          <!-- 左侧导航栏 -->
          <aside class="side-nav glass-section">
            <div class="side-title">
              <div class="side-title-main">
                <el-icon><Monitor /></el-icon>
                控制台
              </div>
              <div class="side-title-sub">System Overview</div>
            </div>

            <el-input
              v-model="menuKeyword"
              class="side-search"
              placeholder="筛选功能…"
              clearable
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>

            <el-menu
              class="side-menu"
              :default-active="activeMenu"
              @select="handleSelectMenu"
            >
              <el-menu-item
                v-for="item in filteredMenus"
                :key="item.key"
                :index="item.key"
              >
                <el-icon><component :is="item.icon" /></el-icon>
                <span>{{ item.label }}</span>
                <span v-if="item.badge != null" class="menu-badge">{{ item.badge }}</span>
              </el-menu-item>

              <div class="side-divider"></div>

            <a
              :href="MQ_CONSOLE_URL"
              target="_blank"
              class="side-menu-link"
            >
              <div class="el-menu-item">
                <el-icon><Link /></el-icon>
                <span>Rabbti MQ 控制台</span>
              </div>
            </a>
            <a
              :href="NACOS_CONSOLE_URL"
              target="_blank"
              class="side-menu-link"
            >
              <div class="el-menu-item">
                <el-icon><Link /></el-icon>
                <span>Nacos 控制台</span>
              </div>
            </a>
            <a
              :href="MINIO_CONSOLE_URL"
              target="_blank"
              class="side-menu-link"
            >
              <div class="el-menu-item">
                <el-icon><Link /></el-icon>
                <span>MinIO 控制台</span>
              </div>
            </a>
            <a
              :href="JAEGER_CONSOLE_URL"
              target="_blank"
              class="side-menu-link"
            >
              <div class="el-menu-item">
                <el-icon><Link /></el-icon>
                <span>Jaeger 控制台</span>
              </div>
            </a>
            <a
              :href="SONAR_CONSOLE_URL"
              target="_blank"
              class="side-menu-link"
            >
              <div class="el-menu-item">
                <el-icon><Link /></el-icon>
                <span>SonarQube 控制台</span>
              </div>
            </a>

            </el-menu>

          </aside>

          <!-- 右侧内容区 -->
          <section class="main-panel">
            <!-- 头部概览卡片 -->
            <div class="kpi-grid">
              <div class="kpi glass-section kpi-anim" style="--d: 0">
                <div class="kpi-top">
                  <span class="kpi-label">今日注册</span>
                  <el-tag size="small" effect="dark" type="info">Today</el-tag>
                </div>
                <div class="kpi-value">{{ kpi.todayRegister }}</div>
                <div class="kpi-foot">
                  <span class="kpi-sub">近7日均值：{{ kpi.avg7Register }}</span>
                  <span class="kpi-chip" :class="kpi.todayRegister >= kpi.avg7Register ? 'up' : 'down'">
                    {{ kpi.todayRegister >= kpi.avg7Register ? '↑' : '↓' }}
                    {{ Math.abs(kpi.todayRegister - kpi.avg7Register) }}
                  </span>
                </div>
              </div>

              <div class="kpi glass-section kpi-anim" style="--d: 1">
                <div class="kpi-top">
                  <span class="kpi-label">今日订单</span>
                  <el-tag size="small" effect="dark" type="success">Orders</el-tag>
                </div>
                <div class="kpi-value">{{ kpi.todayOrders }}</div>
                <div class="kpi-foot">
                  <span class="kpi-sub">近7日均值：{{ kpi.avg7Orders }}</span>
                  <span class="kpi-chip" :class="kpi.todayOrders >= kpi.avg7Orders ? 'up' : 'down'">
                    {{ kpi.todayOrders >= kpi.avg7Orders ? '↑' : '↓' }}
                    {{ Math.abs(kpi.todayOrders - kpi.avg7Orders) }}
                  </span>
                </div>
              </div>

              <div class="kpi glass-section kpi-anim" style="--d: 2">
                <div class="kpi-top">
                  <span class="kpi-label">成功率</span>
                  <el-tag size="small" effect="dark" type="warning">Success</el-tag>
                </div>
                <div class="kpi-value">{{ kpi.successRate }}%</div>
                <div class="kpi-foot">
                  <span class="kpi-sub">成功/失败：{{ kpi.successCount }}/{{ kpi.failCount }}</span>
                  <span class="kpi-chip warn">SLA</span>
                </div>
              </div>

              <div class="kpi glass-section kpi-anim" style="--d: 3">
                <div class="kpi-top">
                  <span class="kpi-label">待审核商家</span>
                  <el-tag size="small" effect="dark" type="danger">Review</el-tag>
                </div>
                <div class="kpi-value">{{ kpi.pendingMerchants }}</div>
                <div class="kpi-foot">
                  <span class="kpi-sub">MQ 待补发：{{ kpi.mqPending }}</span>
                  <span class="kpi-chip danger">{{ kpi.mqFail }} fail</span>
                </div>
              </div>
            </div>

            <!-- 页面容器：不再 out-in 销毁 DOM，只做淡入 -->
            <transition name="fade-fast">
              <div class="page-wrap">
                <!-- Dashboard：v-show 保留 DOM -->
                <div v-show="activeMenu === 'dashboard'">
                  <div class="grid-2">
                    <div class="glass-section chart-card chart-anim" style="--d: 0">
                      <div class="section-title">
                        <el-icon><TrendCharts /></el-icon> 近7天注册趋势
                      </div>
                      <div ref="regChartRef" class="chart-box"></div>
                    </div>

                    <div class="glass-section chart-card chart-anim" style="--d: 1">
                      <div class="section-title">
                        <el-icon><Histogram /></el-icon> 近7天订单量
                      </div>
                      <div ref="orderChartRef" class="chart-box"></div>
                    </div>
                  </div>

                  <div class="grid-2">
                    <div class="glass-section chart-card chart-anim" style="--d: 2">
                      <div class="section-title">
                        <el-icon><PieChart /></el-icon> 状态分布
                      </div>
                      <div ref="statusChartRef" class="chart-box"></div>
                    </div>

                    <div class="glass-section chart-card chart-anim" style="--d: 3">
                      <div class="section-title">
                        <el-icon><Bell /></el-icon> MQ 失败 / 待补发
                      </div>

                      <div class="mq-list" v-loading="mqLoading">
                        <div v-for="m in mqList" :key="m.id" class="mq-item">
                          <div class="mq-left">
                            <div class="mq-title">
                              <span class="mq-tag" :class="m.level">{{ (m.resendState || 'WAIT').toUpperCase() }}</span>
                              <span class="mq-name">{{ m.name }}</span>
                            </div>
                            <div class="mq-meta">
                              <span>sourceModule: <b class="mono">{{ m.sourceModule || '-' }}</b></span>
                              <span>routingKey: <b class="mono">{{ m.routingKey || '-' }}</b></span>
                              <span>msgId: <b class="mono">{{ m.msgId || '-' }}</b></span>
                            </div>
                          </div>
                          <div class="mq-right">
                            <el-button
                              size="small"
                              type="primary"
                              plain
                              :loading="m.__resending"
                              :disabled="m.__resending || m.resendState === 'DOING' || m.resendState === 'SUCCESS'"
                              @click="resendOne(m)"
                            >
                              补发
                            </el-button>
                          </div>
                        </div>
                      
                        <div v-if="!mqLoading && mqList.length === 0" class="empty-hint">既然没有需要补发的MQ  奇迹发生了</div>
                      </div>
                    </div>
                  </div>

                  <div class="grid-2">
                    <div class="glass-section chart-card chart-anim" style="--d: 4">
                      <div class="section-title">
                        <el-icon><UserFilled /></el-icon> 待审核商家申请
                      </div>

                      <el-table
                         v-loading="loadingPendingMerchant"
                        :data="pendingMerchantMock"
                        height="260"
                        class="dark-table"
                        :header-cell-style="{ background: 'rgba(255,255,255,0.04)', color: '#cfe9ff', borderBottom: '1px solid rgba(255,255,255,0.08)' }"
                        :row-style="{ background: 'transparent', color: '#fff' }"
                      >
                        <el-table-column prop="applyId" label="applyId" width="120" />
                        <el-table-column prop="shopName" label="店铺名" min-width="140" />
                        <el-table-column prop="userId" label="userId" width="90" />
                        <el-table-column prop="reason" label="申请理由" min-width="200" />
                        <el-table-column label="操作" width="160">
                          <template #default="{ row }">
                            <el-button size="small" type="success" plain @click="approveApply(row)">通过</el-button>
                            <el-button size="small" type="danger" plain @click="openRejectDialog(row)">拒绝</el-button>
                          </template>
                        </el-table-column>
                      </el-table>
                    </div>

                    <div class="glass-section chart-card chart-anim" style="--d: 5">
                      <div class="section-title">
                        <el-icon><DataAnalysis /></el-icon> 快捷视图
                      </div>

                      <div class="quick-grid">
                        <div class="quick-card">
                          <p>近7日平均注册</p>
                          <h3>{{ kpi.avg7Register }}</h3>
                        </div>
                        <div class="quick-card">
                          <p>近7日平均订单</p>
                          <h3>{{ kpi.avg7Orders }}</h3>
                        </div>
                        <div class="quick-card">
                          <p>订单成功率</p>
                          <h3 :class="kpi.successRate >= 95 ? 'good' : 'warn'">{{ kpi.successRate }}%</h3>
                        </div>
                        <div class="quick-card">
                          <p>待审核商家</p>
                          <h3 class="warn">{{ kpi.pendingMerchants }}</h3>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                <!-- 注册：v-show -->
                <div v-show="activeMenu === 'register'">
                  <div class="glass-section single-page">
                    <div class="section-title">
                      <el-icon><TrendCharts /></el-icon> 注册分析
                    </div>
                    <div class="single-grid">
                      <div class="glass-section inner-card">
                        <div class="inner-title">今日注册</div>
                        <div class="inner-value">{{ kpi.todayRegister }}</div>
                      </div>
                      <div class="glass-section inner-card">
                        <div class="inner-title">近7日均值</div>
                        <div class="inner-value">{{ kpi.avg7Register }}</div>
                      </div>
                      <div class="glass-section inner-card">
                        <div class="inner-title">趋势图</div>
                        <div ref="regChartRef2" class="chart-box small"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 订单：v-show -->
                <div v-show="activeMenu === 'orders'">
                  <div class="glass-section single-page">
                    <div class="section-title">
                      <el-icon><Histogram /></el-icon> 订单分析
                    </div>
                    <div class="single-grid">
                      <div class="glass-section inner-card">
                        <div class="inner-title">今日订单</div>
                        <div class="inner-value">{{ kpi.todayOrders }}</div>
                      </div>
                      <div class="glass-section inner-card">
                        <div class="inner-title">成功率</div>
                        <div class="inner-value">{{ kpi.successRate }}%</div>
                      </div>
                      <div class="glass-section inner-card">
                        <div class="inner-title">订单量图</div>
                        <div ref="orderChartRef2" class="chart-box small"></div>
                      </div>
                    </div>
                    
                    <!-- 大图表：交易额趋势，独占一行 -->
                    <div class="glass-section-big chart-card-big" style="margin-top: 14px;">
                      <div class="section-title">
                        <el-icon><TrendCharts /></el-icon> 交易额趋势（{{ gmvDays }}日）
                        <div style="margin-left:auto; display:flex; gap:8px;">
                          <el-button size="small" plain @click="gmvDays=7; fetchGmvTrend()">7日</el-button>
                          <el-button size="small" plain @click="gmvDays=30; fetchGmvTrend()">30日</el-button>
                        </div>
                      </div>
                      <div ref="gmvChartRef" class="chart-box"></div>
                    </div>
                  </div>
                </div>

                <div v-show="activeMenu === 'online-users'">
                    <div class="glass-section single-page">
                      <div class="section-title">
                        <el-icon><UserFilled /></el-icon> 在线用户
                        <div style="margin-left:auto; display:flex; gap:10px;">
                          <el-button :icon="Refresh" circle @click="fetchOnlineUsers" :loading="onlineLoading" />
                        </div>
                      </div>
                    
                      <el-table
                        :data="onlineList"
                        v-loading="onlineLoading"
                        class="dark-table"
                        :header-cell-style="darkHeaderStyle"
                        :row-style="darkRowStyle"
                      >
                        <el-table-column prop="userId" label="userId" width="120" />
                        <el-table-column prop="role" label="role" width="120">
                          <template #default="{ row }">
                            <el-tag size="small" effect="plain" :type="roleTagType(row.role)">
                              {{ (row.role || '').toUpperCase() }}
                            </el-tag>
                          </template>
                        </el-table-column>
                      
                        <el-table-column prop="ip" label="ip" min-width="220" />
                      
                        <el-table-column prop="loginTime" label="loginTime" min-width="200">
                          <template #default="{ row }">
                            <span class="mono">{{ fmtMs(row.loginTime) }}</span>
                          </template>
                        </el-table-column>
                        <el-table-column label="操作" width="120" fixed="right">
                          <template #default="{ row }">
                            <el-button
                              size="small"
                              type="danger"
                              plain
                              :disabled="String(row.userId) === String(userData?.userId)"
                              @click="onKick(row)"
                            >
                              下线
                            </el-button>
                          </template>
                        </el-table-column>
                      </el-table>
                    
                      <div style="display:flex; justify-content:flex-end; margin-top: 14px;">
                      <el-pagination
                        class="dark-pagination"
                        layout="prev, pager, next"
                        :total="onlineTotal"
                        :page-size="onlineQuery.pageSize"
                        :current-page="onlineQuery.pageNum"
                        @current-change="onOnlinePageChange"
                        size="small"
                        background
                      />
                      </div>
                    </div>
                  </div>

                <!-- 审核：v-show -->
                <div v-show="activeMenu === 'review'">
                  <div class="glass-section single-page">
                    <div class="section-title">
                      <el-icon><UserFilled /></el-icon> 审核中心（模拟）
                    </div>

                    <div class="review-actions">
                      <el-button
                        type="warning"
                        plain
                        :loading="resendAllLoading"
                        :disabled="resendAllLoading"
                        @click="resendAll"
                      >
                        一键补发 MQ
                      </el-button>
                    </div>

                    <div class="grid-2">
                      <div class="glass-section chart-card">
                        <div class="section-title">
                          <el-icon><PieChart /></el-icon> 状态分布
                        </div>
                        <div ref="statusChartRef2" class="chart-box"></div>
                      </div>

                      <div class="glass-section chart-card">
                        <div class="section-title">
                          <el-icon><Bell /></el-icon> MQ 失败 / 待补发
                        </div>
                        <div class="mq-list" v-loading="mqLoading">
                          <div v-for="m in mqList" :key="m.id" class="mq-item">
                            <div class="mq-left">
                              <div class="mq-title">
                                <span class="mq-tag" :class="m.level">{{ (m.resendState || 'WAIT').toUpperCase() }}</span>
                                <span class="mq-name">{{ m.name }}</span>
                              </div>
                                <div class="mq-meta">
                                  <span>sourceModule: <b class="mono">{{ m.sourceModule || '-' }}</b></span>
                                  <span>routingKey: <b class="mono">{{ m.routingKey || '-' }}</b></span>
                                  <span>msgId: <b class="mono">{{ m.msgId || '-' }}</b></span>
                                </div>
                            </div>
                            <div class="mq-right">
                              <el-button
                                size="small"
                                type="primary"
                                plain
                                :loading="m.__resending"
                                :disabled="m.__resending || m.resendState === 'DOING' || m.resendState === 'SUCCESS'"
                                @click="resendOne(m)"
                              >
                                补发
                              </el-button>
                            </div>
                          </div>
                        
                          <div v-if="!mqLoading && mqList.length === 0" class="empty-hint">既然没有需要补发的MQ  奇迹发生了</div>
                        </div>
                      </div>
                    </div>

                    <div class="glass-section chart-card">
                      <div class="section-title">
                        <el-icon><Document /></el-icon> 待审核商家申请
                      </div>
                      <el-table
                          v-loading="loadingPendingMerchant"
                        :data="pendingMerchantMock"
                        height="320"
                        class="dark-table"
                        :header-cell-style="{ background: 'rgba(255,255,255,0.04)', color: '#cfe9ff', borderBottom: '1px solid rgba(255,255,255,0.08)' }"
                        :row-style="{ background: 'transparent', color: '#fff' }"
                      >
                        <el-table-column prop="applyId" label="applyId" width="120" />
                        <el-table-column prop="shopName" label="店铺名" min-width="140" />
                        <el-table-column prop="userId" label="userId" width="90" />
                        <el-table-column prop="reason" label="申请理由" min-width="280" />
                        <el-table-column label="操作" width="180">
                          <template #default="{ row }">
                            <el-button size="small" type="success" plain @click="mockApprove(row)">通过</el-button>
                            <el-button size="small" type="danger" plain @click="openRejectDialog(row)">拒绝</el-button>
                          </template>
                        </el-table-column>
                      </el-table>
                    </div>
                  </div>
                </div>

                <!-- 嵌入控制台：iframe（保留 v-if） -->
                <div v-if="activeMenu.startsWith('embed-')">
                  <div class="glass-section single-page">
                    <div class="section-title">
                      <el-icon><Link /></el-icon>
                      {{ embedTitle }}
                      <el-tag size="small" effect="dark" type="info">iframe 预留</el-tag>
                    </div>

                    <div class="embed-toolbar">
                      <el-input v-model="embedUrl" placeholder="填入控制台 URL，例如 http://localhost:15672" clearable />
                      <el-button type="primary" plain @click="applyEmbedUrl">加载</el-button>
                      <el-button type="warning" plain @click="resetEmbedUrl">重置</el-button>
                    </div>

                    <div class="embed-box">
                      <iframe
                        v-if="embedUrlApplied"
                        :src="embedUrlApplied"
                        frameborder="0"
                        class="embed-frame"
                      />
                      <div v-else class="embed-empty">
                        <div class="embed-empty-title">还没加载 URL</div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 兜底 -->
                <div v-show="!mainPageKeys.includes(activeMenu) && !activeMenu.startsWith('embed-')" class="glass-section admin-placeholder">
                  <div class="section-title">
                    <el-icon><Monitor /></el-icon> 管理控制台 / System Overview
                  </div>
                  <div class="empty-state">
                    <p>欢迎回来，系统管理员</p>
                    <span>模块 {{ activeMenu }} 正在准备中...</span>
                  </div>
                </div>
              </div>
            </transition>
          </section>
        </div>
      </main>

 <el-dialog
  v-model="rejectDialog.visible"
  title="拒绝申请"
  width="420px"
  :close-on-click-modal="false"
  :destroy-on-close="true"
  class="pure-dark-glass" 
>
  <div class="reject-hint">
    请输入拒绝理由（将同步至申请记录）
  </div>

  <el-input
    v-model="rejectDialog.reason"
    type="textarea"
    :rows="4"
    maxlength="200"
    show-word-limit
    placeholder="理由描述..."
    class="dark-input"
  />

  <template #footer>
    <div class="dialog-footer">
      <el-button @click="rejectDialog.visible = false" class="btn-dark-cancel">取消操作</el-button>
      <el-button
        type="danger"
        :loading="rejectDialog.submitting"
        @click="confirmReject"
        class="btn-dark-confirm"
      >
        确认拒绝
      </el-button>
    </div>
  </template>
</el-dialog>

    </div>

    <!-- 个人面板（保持不动） -->
    <transition name="slide-right">
      <div v-if="showProfilePanel" class="profile-panel-overlay" @click.self="showProfilePanel = false">
        <div class="profile-glass-panel">
          <div class="panel-header">
            <h3>管理员中心</h3>
            <el-icon class="close-icon" @click="showProfilePanel = false"><Close /></el-icon>
          </div>

          <div class="profile-content">
            <div class="avatar-edit-section">
              <el-image
                class="avatar-glow preview-avatar"
                :src="userData.avatar"
                :preview-src-list="[userData.avatar]"
                :preview-teleported="true"
                fit="cover"
              />
              <p class="uid-tag">ADMIN ID: {{ userData.userId }}</p>

              <el-upload
                :show-file-list="false"
                :before-upload="beforeAvatarUpload"
                :http-request="uploadAvatar"
              >
                <el-button size="small" type="primary" plain>修改管理员头像</el-button>
              </el-upload>
            </div>

            <el-form label-position="top" class="custom-form">
              <el-form-item label="管理员名称" class="fade-in-item" style="--delay: 1">
                <el-input v-model="profileForm.username" placeholder="请输入名称" :prefix-icon="User" />
              </el-form-item>

              <el-form-item label="绑定手机" class="fade-in-item" style="--delay: 2">
                <el-input v-model="profileForm.phone" placeholder="手机号" :prefix-icon="Iphone" />
              </el-form-item>

              <el-form-item label="安全验证码" class="fade-in-item" style="--delay: 3">
                <div class="code-input-group">
                  <el-input v-model="profileForm.code" placeholder="验证码" :prefix-icon="Lock" />
                  <el-button class="get-code-btn" :disabled="countdown > 0" @click="sendCode">
                    {{ countdown > 0 ? countdown + 's' : '获取' }}
                  </el-button>
                </div>
              </el-form-item>

              <el-button type="primary" class="save-btn fade-in-item" style="--delay: 4" @click="handleUpdate">
                保存管理员资料
              </el-button>
            </el-form>
          </div>
        </div>
      </div>
    </transition>

    <!-- 退出确认  -->
    <transition name="fade">
      <div v-if="showLogoutConfirm" class="logout-overlay">
        <div class="logout-glass-card">
          <div class="logout-icon"><el-icon><Warning /></el-icon></div>
          <h3>确认退出管理系统？</h3>
          <div class="logout-actions">
            <button class="btn-cancel" @click="showLogoutConfirm = false">取消</button>
            <button class="btn-confirm" @click="confirmLogout">安全退出</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>


<script setup>
import { ref, reactive, watchEffect, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import {
  Monitor, SwitchButton, Warning, Close, User, Iphone, Lock, Refresh ,
  Search, TrendCharts, Histogram, PieChart, Bell, UserFilled, DataAnalysis, Link, Document
} from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { storeToRefs } from 'pinia'
import http from '../request/http'
import * as echarts from 'echarts'

/** ========== 基础核心 ========== */
const router = useRouter()
const authStore = useAuthStore()
const { userInfo: userData } = storeToRefs(authStore)

/** ========== UI 状态与倒计时 ========== */
const showLogoutConfirm = ref(false)
const showProfilePanel = ref(false)
const countdown = ref(0)
let countdownTimer = null

// ===== 在线用户（Admin）=====
const onlineLoading = ref(false)
const onlineList = ref([])
const onlineTotal = ref(0)

const onlineQuery = reactive({
  pageNum: 1,
  pageSize: 20 // 固定
})

const darkHeaderStyle = {
  background: 'rgba(255,255,255,0.04)',
  color: '#cfe9ff',
  borderBottom: '1px solid rgba(255,255,255,0.08)'
}

const resendAllLoading = ref(false)

const darkRowStyle = {
  background: 'transparent',
  color: '#ffffff'
}

const profileForm = reactive({ username: '', phone: '', code: '' })

watchEffect(() => {
  if (!userData.value) return
  profileForm.username = userData.value.username || ''
  profileForm.phone = userData.value.phone || ''
})

/** ========== 验证码逻辑 ========== */
const startCountdown = () => {
  countdown.value = 60
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) clearInterval(countdownTimer)
  }, 1000)
}

const sendCode = async () => {
  if (countdown.value > 0) return
  const phone = String(profileForm.phone || '').trim()
  if (!/^1[3-9]\d{9}$/.test(phone)) return ElMessage.warning('手机号格式不正确')
  try {
    await http.post('/user/phone/code', { phone, scene: 'BIND_PHONE' })
    ElMessage.success('验证码已发送至管理员手机')
    startCountdown()
  } catch (e) {}
}

/** ========== 资料更新逻辑 ========== */
const handleUpdate = async () => {
  const oldU = String(userData.value?.username || '').trim()
  const oldP = String(userData.value?.phone || '').trim()
  const newU = String(profileForm.username || '').trim()
  const newP = String(profileForm.phone || '').trim()

  if (newU === oldU && newP === oldP) return ElMessage.info('未做任何修改')

  const payload = {}
  if (newU !== oldU) payload.username = newU
  if (newP !== oldP) {
    if (!profileForm.code) return ElMessage.warning('更换手机号需填写验证码')
    payload.phone = newP
    payload.phoneCode = profileForm.code
  }

  try {
    await http.put('/user/profile', payload)
    ElMessage.success('管理员资料更新成功')
    await authStore.fetchUserInfoFromServer()
    showProfilePanel.value = false
  } catch (e) {}
}

/** ========== 头像上传 ========== */
const beforeAvatarUpload = (file) => {
  const isImg = file.type.startsWith('image/') && file.size / 1024 / 1024 <= 5
  if (!isImg) ElMessage.warning('请上传5MB以内的图片')
  return isImg
}

const uploadAvatar = async ({ file }) => {
  try {
    const formData = new FormData()
    formData.append('file', file)
    await http.put('/user/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    ElMessage.success('头像更新成功')
    await authStore.fetchUserInfoFromServer()
  } catch (e) {}
}

/** ========== 退出登录 ========== */
const handleLogout = () => { showLogoutConfirm.value = true }
const confirmLogout = () => {
  authStore.logout()
  router.push('/login')
  showLogoutConfirm.value = false
}

const resendAll = async () => {
  if (resendAllLoading.value) return
  resendAllLoading.value = true

  try {
    const res = await http.post('/op-analytics/mqfail/resend/all')
    const data = unwrap(res)                 // 兼容你项目的 unwrap
    const payload = data?.data ?? data        // 兼容后端包了一层 data 的情况

    const ok = payload?.requestId && (data?.code === 200 || payload?.success != null)
    if (!ok) {
      ElMessage.error(data?.msg || '一键补发失败')
      return
    }

    // 你返回示例字段
    const total = Number(payload.totalCandidates ?? 0)
    const locked = Number(payload.locked ?? 0)
    const success = Number(payload.success ?? 0)
    const failed = Number(payload.failed ?? 0)

    ElMessage.success(
      `已触发一键补发：total=${total}, locked=${locked}, success=${success}, failed=${failed}`
    )

    await fetchMqPending()
    await fetchResendStateStats()
  } catch (e) {
    console.error('[mqfail/resend/all] failed=', e)
    ElMessage.error('一键补发失败（网络或后端异常）')
  } finally {
    resendAllLoading.value = false
  }
}


/** ========== 左侧菜单与页面状态 ========== */
const activeMenu = ref('dashboard')
const menuKeyword = ref('')
const mainPageKeys = ['dashboard', 'register', 'orders', 'review']

const gmvDays = ref(7)           // 7 or 30
const gmvSeries = ref([])        // 单位：元（用于图表展示）
const gmvChartRef = ref(null)
let gmvChart = null


const menus = [
  { key: 'dashboard', label: '仪表盘', icon: Monitor },
  { key: 'register', label: '注册分析', icon: TrendCharts },
  { key: 'orders', label: '订单分析', icon: Histogram },
  { key: 'review', label: '审核中心', icon: UserFilled },
  { key: 'online-users', label: '在线用户', icon: UserFilled, badge: null }
]

const filteredMenus = computed(() => {
  const kw = String(menuKeyword.value || '').trim().toLowerCase()
  const base = kw ? menus.filter(m => m.label.toLowerCase().includes(kw)) : menus
  return base.map(m => (m.key === 'review' ? { ...m, badge: kpi.value.pendingMerchants } : { ...m, badge: null }))
})

const fetchOnlineUsers = async () => {
  onlineLoading.value = true
  try {
    const res = await http.get('/admin/online-user', {
      params: { pageNum: onlineQuery.pageNum }
    })

    // 打印一下你真实拿到的结构（只看一次就行）
    console.log('[admin/online-user] raw =', res)

    const data = res?.records ? res : (res?.data ?? res)

    onlineList.value = Array.isArray(data?.records) ? data.records : []
    onlineTotal.value = Number(data?.total || 0)

  } catch (e) {
    console.error('[admin/online-user] failed =', e)
    onlineList.value = []
    onlineTotal.value = 0
    ElMessage.error('在线用户获取失败')
  } finally {
    onlineLoading.value = false
  }
}



const onOnlinePageChange = async (p) => {
  onlineQuery.pageNum = p
  await fetchOnlineUsers()
}

// 切到菜单时自动拉一次（避免你每次手动点刷新）
watch(
  () => activeMenu.value,
  async (k) => {
    if (k === 'online-users') {
      onlineQuery.pageNum = 1
      await fetchOnlineUsers()
    }
  }
)

// role tag 的颜色（按你返回的 admin/user/merchant）
const roleTagType = (role) => {
  const r = String(role || '').toLowerCase()
  if (r === 'admin') return 'danger'
  if (r === 'merchant') return 'warning'
  return 'info'
}

// 时间格式化：毫秒 -> yyyy-MM-dd HH:mm:ss
const fmtMs = (ms) => {
  const n = Number(ms)
  if (!Number.isFinite(n) || n <= 0) return '--'
  const d = new Date(n)
  const pad = (x) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}


const handleSelectMenu = (key) => {
  if (key === 'embed-minio') {
    window.open(MINIO_CONSOLE_URL, '_blank')
    return
  }
  activeMenu.value = key
}

/** ========== 模拟数据 ========== */
const days = ref([])
const regSeries = ref([82, 96, 105, 91, 120, 112, 128])
const orderSeries = ref([210, 260, 230, 280, 310, 295, 330])
const successSeries = ref({ attempt: 0, success: 0 })

const statusDist = ref([]) 

const fetchRegisterTrend7d = async () => {
  try {
    const res = await http.get('/op-analytics/register/trend7d')

    const data = res?.data ?? res

    if (Array.isArray(data?.dates) && Array.isArray(data?.values)) {
      days.value = data.dates
      regSeries.value = data.values
      await nextTick()
      renderAllCharts()
      handleResize()
    }
  } catch (e) {
    console.error('[op-analytics/register/trend7d] failed =', e)
  }
}

const fetchDealOrderTrend7d = async () => {
  try {
    const res = await http.get('/op-analytics/register/trend7d-pay')
    const data = unwrap(res)

    if (Array.isArray(data?.dates)) days.value = data.dates
    orderSeries.value = Array.isArray(data?.values) ? data.values.map(n => Number(n || 0)) : []

    await nextTick()
    renderAllCharts()
    requestAnimationFrame(() => handleResize())

  } catch (e) {
    console.error('[trend7d-pay] failed=', e)
    ElMessage.error('订单趋势获取失败')
  }
}

const fetchPayToday = async () => {
  try {
    const res = await http.get('/op-analytics/register/today')
    const data = unwrap(res)

    const attempt = Number(data?.payAttemptCnt || 0)
    const success = Number(data?.paySuccessCnt || 0)

    successSeries.value = {
      attempt,
      success
    }
  } catch (e) {
    console.error('[pay/today] failed=', e)
    ElMessage.error('交易汇总获取失败')
    successSeries.value = { attempt: 0, success: 0 }
  }
}

const fetchGmvTrend = async () => {
  try {
    const res = await http.get('/op-analytics/register/trend', { params: { days: gmvDays.value } })
    const data = unwrap(res)

    if (Array.isArray(data?.dates)) days.value = data.dates

    const cents = Array.isArray(data?.values) ? data.values : []
    gmvSeries.value = cents.map(x => Number(x || 0) / 100)

    await nextTick()
    renderGmvChart()
    requestAnimationFrame(() => handleResize())
  } catch (e) {
    console.error('[gmv/trend] failed=', e)
    ElMessage.error('交易额趋势获取失败')
  }
}

const renderGmvChart = () => {
  gmvChart = safeInit(gmvChartRef, gmvChart)
  gmvChart?.setOption(buildLineOption('交易额(元)', days.value, gmvSeries.value), true)
  gmvChart?.resize()
}



const pendingMerchantMock = ref([])  // 先别改模板变量名，少动
const pendingMerchantTotal = ref(0)
const loadingPendingMerchant = ref(false)

const MerchantApplyStatus = {
  PENDING: 0,
  APPROVED: 1,
  REJECTED: 2
}

const unwrap = (res) => res?.data?.data ?? res?.data ?? res

const fetchPendingMerchantApplies = async () => {
  loadingPendingMerchant.value = true
  try {
    const params = {
      status: MerchantApplyStatus.PENDING,
      pageNum: 1,
      pageSize: 20
    }
    const res = await http.get('/admin/merchant-apply', { params })
    const page = unwrap(res)

    pendingMerchantMock.value = (page?.records || []).map(r => ({
      applyId: r.applyId,
      shopName: r.shopName,
      userId: r.userId,
      reason: r.applyReason
    }))
    

    pendingMerchantTotal.value = page?.total ?? 0

    console.log('page=', page)
    console.log('pendingMerchantMock=', pendingMerchantMock.value)
  } finally {
    loadingPendingMerchant.value = false
  }
}




const mqLoading = ref(false)
const mqList = ref([]) 

const kpi = computed(() => {
  const todayRegister = regSeries.value[regSeries.value.length - 1]
  const avg7Register = Math.round(regSeries.value.reduce((a, b) => a + b, 0) / regSeries.value.length)
  const todayOrders = orderSeries.value[orderSeries.value.length - 1]
  const avg7Orders = Math.round(orderSeries.value.reduce((a, b) => a + b, 0) / orderSeries.value.length)

  const successCount = Number(successSeries.value.success || 0)
  const attemptCount = Number(successSeries.value.attempt || 0)
  const failCount = Math.max(0, attemptCount - successCount)
  const successRate = attemptCount <= 0 ? 0 : Math.round((successCount / attemptCount) * 100)


  const pendingMerchants = pendingMerchantMock.value.length
  const mqPending = mqList.value.filter(
    x => x.resendState === 'WAIT' || x.resendState === 'DOING'
  ).length

  const mqFail = mqList.value.filter(
    x => x.resendState === 'FAILED'
  ).length

  return { todayRegister, avg7Register, todayOrders, avg7Orders, successCount, failCount, successRate, pendingMerchants, mqPending, mqFail }
})

/** ========== 预留：iframe 嵌入控制台 ========== */
const MINIO_CONSOLE_URL = 'http://localhost:9001/browser'
const NACOS_CONSOLE_URL = 'http://localhost:8848/nacos'
const MQ_CONSOLE_URL = 'http://localhost:15672/'
const JAEGER_CONSOLE_URL = 'http://localhost:16686'
const SONAR_CONSOLE_URL = 'http://localhost:9003'
const embedUrl = ref('')
const embedUrlApplied = ref('')
const embedTitle = computed(() => {
  if (activeMenu.value === 'embed-nacos') return 'Nacos 控制台'
  if (activeMenu.value === 'embed-mq') return 'RabbitMQ 控制台'
  if (activeMenu.value === 'embed-minio') return 'MinIO 控制台'
  return '控制台嵌入'
})


const applyEmbedUrl = () => {
  const u = String(embedUrl.value || '').trim()
  if (!u) return ElMessage.warning('先填 URL')
  embedUrlApplied.value = u
  ElMessage.success('已加载 iframe（如果没显示，多半是被 X-Frame-Options 拒了）')
}
const resetEmbedUrl = () => {
  embedUrl.value = ''
  embedUrlApplied.value = ''
}

const fetchResendStateStats = async () => {
  try {
    const res = await http.get('/op-analytics/register/resend-state-stats')

    const root = res?.data ?? res
    const arr = Array.isArray(root?.data) ? root.data : (Array.isArray(root) ? root : [])

    const SHOW_ZERO = false

    const list = (SHOW_ZERO ? arr : arr.filter(x => Number(x?.count || 0) > 0))
      .map(x => ({
        name: x.resendStateDesc || `STATE_${x.resendState}`,
        value: Number(x.count || 0)
      }))

    statusDist.value = list

    await nextTick()
    renderAllCharts()
    requestAnimationFrame(() => handleResize())
  } catch (e) {
    console.error('[resend-state-stats] failed=', e)
  }
}

const fetchMqPending = async () => {
  mqLoading.value = true
  try {
    const res = await http.get('/op-analytics/mqfail/fail-msg/pending')
    const data = unwrap(res) // 你已有 unwrap：res?.data?.data ?? res?.data ?? res

    const arr = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : [])
    mqList.value = arr.map(x => ({
      id: x.id,
      msgId: x.msgId,
      routingKey: x.routingKey,
      exchangeName: x.exchangeName,
      topic: x.topic,
      sourceModule: x.sourceModule,
      bizId: x.bizId,
      resendState: x.resendState,     // WAIT/FAILED/DOING/SUCCESS
      lastError: x.lastError,
      resendLastError: x.resendLastError,
      resendAttemptCnt: x.resendAttemptCnt,
      // 给 UI 用的字段（保持你原来那套渲染不大改）
      name: x.topic || x.routingKey,
      status: x.resendState,          // 直接显示 resendState
      level: (x.resendState === 'FAILED') ? 'error' : 'warn'
    }))
  } catch (e) {
    console.error('[mqfail/pending] failed=', e)
    mqList.value = []
    ElMessage.error('MQ 待补发列表获取失败')
  } finally {
    mqLoading.value = false
  }
}

const resendOne = async (m) => {
  const id = m?.id
  if (!id) return ElMessage.warning('消息 id 不存在')

  // 防抖：避免重复点
  if (m.__resending) return
  m.__resending = true

  try {
    const res = await http.post(`/op-analytics/mqfail/resend/${id}`)

    const data = unwrap(res)

    const ok = data?.success === true || data?.data?.success === true
    const payload = data?.data ?? data

    if (ok) {
      ElMessage.success(`补发已触发：id=${payload?.id ?? id}`)
      m.resendState = 'DOING'
      await fetchMqPending()
      await fetchResendStateStats()
    } else {
      const errMsg = payload?.error || data?.msg || '补发失败'
      ElMessage.error(errMsg)
    }
  } catch (e) {
    console.error('[mqfail/resend] failed=', e)
    ElMessage.error('补发失败（网络或后端异常）')
  } finally {
    m.__resending = false
  }
}

const approveApply = async (row) => {
  const applyId = row?.applyId
  if (!applyId) return ElMessage.warning('applyId 不存在')

  try {
    await http.post(`/admin/merchant-apply/${applyId}/approve`)
    ElMessage.success(`已通过：${row.shopName || applyId}`)

    pendingMerchantMock.value = pendingMerchantMock.value.filter(x => x.applyId !== applyId)

    pendingMerchantTotal.value = Math.max(0, (pendingMerchantTotal.value || 0) - 1)

  } catch (e) {}
}

const rejectDialog = reactive({
  visible: false,
  reason: '',
  submitting: false,
  row: null
})

const openRejectDialog = (row) => {
  if (!row?.applyId) return ElMessage.warning('applyId 不存在')
  rejectDialog.row = row
  rejectDialog.reason = ''
  rejectDialog.visible = true
}

const confirmReject = async () => {
  const row = rejectDialog.row
  const applyId = row?.applyId
  const reason = String(rejectDialog.reason || '').trim()

  if (!applyId) return ElMessage.warning('applyId 不存在')
  if (!reason) return ElMessage.warning('请填写拒绝理由')
  if (reason.length > 200) return ElMessage.warning('拒绝理由最多 200 字')

  rejectDialog.submitting = true
  try {
    await http.post(`/admin/merchant-apply/${applyId}/reject`, {
      rejectReason: reason
    })

    ElMessage.success(`已拒绝：${row.shopName || applyId}`)

    pendingMerchantMock.value = pendingMerchantMock.value.filter(x => x.applyId !== applyId)
    pendingMerchantTotal.value = Math.max(0, (pendingMerchantTotal.value || 0) - 1)

    rejectDialog.visible = false
  } catch (e) {
  } finally {
    rejectDialog.submitting = false
  }
}


const onKick = async (row) => {
  const { userId } = row; 
  if (!userId) {
    ElMessage.warning('用户ID不存在');
    return;
  }

  try {
    await http.post('/admin/online-user/kick', { userId: userId }); 

    ElMessage.success(`已成功踢出用户：${userId}`);

    // 操作成功，刷新在线用户列表
    await fetchOnlineUsers();
  } catch (error) {
    console.error('踢人失败:', error);
    ElMessage.error(attemptToExtractErrorMessage(error, '踢出用户失败，请重试'));
  }
};


/** ========== ECharts ========== */
const regChartRef = ref(null)
const orderChartRef = ref(null)
const statusChartRef = ref(null)
const regChartRef2 = ref(null)
const orderChartRef2 = ref(null)
const statusChartRef2 = ref(null)

let regChart, orderChart, statusChart
let regChart2, orderChart2, statusChart2

const buildLineOption = (title, x, y) => ({
  tooltip: { trigger: 'axis' },
  grid: { left: 40, right: 20, top: 30, bottom: 30 },
  xAxis: {
    type: 'category',
    data: x,
    axisLine: { lineStyle: { color: 'rgba(255,255,255,0.25)' } },
    axisLabel: { color: 'rgba(255,255,255,0.7)' }
  },
  yAxis: {
    type: 'value',
    axisLine: { show: false },
    splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
    axisLabel: { color: 'rgba(255,255,255,0.7)' }
  },
  series: [{ name: title, type: 'line', smooth: true, data: y, symbolSize: 7, areaStyle: { opacity: 0.12 } }]
})

const buildBarOption = (title, x, y) => ({
  tooltip: { trigger: 'axis' },
  grid: { left: 40, right: 20, top: 30, bottom: 30 },
  xAxis: {
    type: 'category',
    data: x,
    axisLine: { lineStyle: { color: 'rgba(255,255,255,0.25)' } },
    axisLabel: { color: 'rgba(255,255,255,0.7)' }
  },
  yAxis: {
    type: 'value',
    axisLine: { show: false },
    splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
    axisLabel: { color: 'rgba(255,255,255,0.7)' }
  },
  series: [{ name: title, type: 'bar', data: y, barWidth: 18, itemStyle: { borderRadius: [8, 8, 0, 0], opacity: 0.9 } }]
})

const buildPieOption = (data) => ({
  tooltip: { trigger: 'item' },
  legend: { top: 10, textStyle: { color: 'rgba(255,255,255,0.75)' } },
  series: [{
    name: '状态',
    type: 'pie',
    radius: ['35%', '65%'],
    center: ['50%', '58%'],
    data,
    label: { color: 'rgba(255,255,255,0.8)' },
    labelLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } }
  }]
})

const safeInit = (domRef, oldChart) => {
  if (!domRef?.value) return null
  if (oldChart) return oldChart
  return echarts.init(domRef.value)
}

const renderAllCharts = () => {
  regChart = safeInit(regChartRef, regChart)
  orderChart = safeInit(orderChartRef, orderChart)
  statusChart = safeInit(statusChartRef, statusChart)
  regChart?.setOption(buildLineOption('注册', days.value, regSeries.value), true)
  orderChart?.setOption(buildBarOption('订单', days.value, orderSeries.value), true)
  statusChart?.setOption(buildPieOption(statusDist.value), true)

  regChart2 = safeInit(regChartRef2, regChart2)
  regChart2?.setOption(buildLineOption('注册', days.value, regSeries.value), true)

  orderChart2 = safeInit(orderChartRef2, orderChart2)
  orderChart2?.setOption(buildBarOption('订单', days, orderSeries.value), true)

  statusChart2 = safeInit(statusChartRef2, statusChart2)
  statusChart2?.setOption(buildPieOption(statusDist.value), true)
}

const handleResize = () => {
  ;[regChart, orderChart, statusChart, regChart2, orderChart2, statusChart2, gmvChart].forEach(c => c?.resize())
}

watch(activeMenu, async () => {
  if (activeMenu.value === 'embed-minio') {
    embedUrl.value = MINIO_CONSOLE_URL
    embedUrlApplied.value = MINIO_CONSOLE_URL
  }

  await nextTick()
  requestAnimationFrame(() => handleResize())
})

onMounted(async () => {
  await nextTick()
  renderAllCharts()
  handleResize()
  window.addEventListener('resize', handleResize)

  try {
    await fetchPendingMerchantApplies()
    await Promise.all([
      fetchRegisterTrend7d(),
      fetchDealOrderTrend7d(),
      fetchPayToday(),
      fetchGmvTrend(),
      fetchResendStateStats()
    ])
    await fetchMqPending()
  } catch (e) {
    // 静默兜底
  }
})


onBeforeUnmount(() => {
  clearInterval(countdownTimer)
  window.removeEventListener('resize', handleResize)
  ;[regChart, orderChart, statusChart, regChart2, orderChart2, statusChart2].forEach(c => c?.dispose())
})
</script>


<style scoped>
.side-link {
  text-decoration: none;
  color: inherit;
  display: block;
}

.side-menu-link {
  text-decoration: none;
  display: block;
}

.side-menu-link .el-menu-item {
  cursor: pointer;
}
/* ================== 1. 布局与背景 ================== */
.user-wrapper { width: 100vw; height: 100vh; overflow: hidden; position: relative; }
.login-container { width: 100%; height: 100%; background: radial-gradient(ellipse at bottom, #1B2735 0%, #090A0F 100%); overflow-y: auto; }
.stars { position: fixed; inset: 0; background: url('https://s3-us-west-2.amazonaws.com/s.cdpn.io/123163/stars.png'); opacity: 0.4; pointer-events: none; }

/* 导航栏 */
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

/* ================== 2. 主体布局（新增 admin layout） ================== */
.content-body { max-width: 1400px; margin: 24px auto; padding: 0 20px; }
.admin-layout { display: flex; gap: 18px; align-items: flex-start; }

/* 左侧栏 */
.side-nav {
  width: 270px;
  position: sticky;
  top: 90px;
  padding: 18px;
  overflow: hidden;
}
.side-title { margin-bottom: 14px; }
.side-title-main { display: flex; align-items: center; gap: 8px; color: #fff; font-weight: 700; }
.side-title-sub { color: rgba(255,255,255,0.5); font-size: 12px; margin-top: 6px; }
.side-search { margin: 12px 0 10px; }
.side-menu {
  background: transparent !important;
  border-right: none !important;
}
.menu-badge {
  margin-left: auto;
  font-size: 12px;
  padding: 1px 8px;
  border-radius: 999px;
  color: #fff;
  background: rgba(245, 108, 108, 0.45);
  border: 1px solid rgba(245, 108, 108, 0.35);
}
.side-divider { height: 1px; background: rgba(255,255,255,0.08); margin: 10px 0; }
.side-footer { margin-top: 14px; }
.side-tip { color: rgba(255,255,255,0.55); font-size: 12px; display: flex; align-items: center; gap: 8px; }
.dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(64, 158, 255, 0.9); box-shadow: 0 0 10px rgba(64, 158, 255, 0.6); }

/* 右侧主面板 */
.main-panel { flex: 1; min-width: 0; }

/* ================== 3. KPI 卡片 ================== */
.kpi-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin-bottom: 14px; }
.kpi { padding: 16px; position: relative; overflow: hidden; }
.kpi::before {
  content: "";
  position: absolute;
  inset: -1px;
  background: radial-gradient(circle at 20% 10%, rgba(64,158,255,0.18), transparent 45%);
  pointer-events: none;
}
.kpi-top { display: flex; align-items: center; justify-content: space-between; }
.kpi-label { color: rgba(255,255,255,0.75); font-size: 12px; letter-spacing: 1px; }
.kpi-value { color: #fff; font-size: 34px; font-weight: 800; margin-top: 10px; }
.kpi-foot { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; }
.kpi-sub { color: rgba(255,255,255,0.45); font-size: 12px; }
.kpi-chip {
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.14);
  color: rgba(255,255,255,0.75);
  background: rgba(255,255,255,0.06);
}
.kpi-chip.up { border-color: rgba(103,194,58,0.35); background: rgba(103,194,58,0.10); }
.kpi-chip.down { border-color: rgba(245,108,108,0.35); background: rgba(245,108,108,0.10); }
.kpi-chip.warn { border-color: rgba(230,162,60,0.35); background: rgba(230,162,60,0.10); }
.kpi-chip.danger { border-color: rgba(245,108,108,0.35); background: rgba(245,108,108,0.10); }

/* ================== 4. 图表区 ================== */
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
.chart-card { padding: 16px; }
.chart-card-big { padding: 18px }
.chart-box { width: 100%; height: 280px; }
.chart-box.small { height: 220px; }

.mq-list { display: flex; flex-direction: column; gap: 10px; }
.mq-item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  transition: 0.25s;
}
.mq-item:hover { transform: translateY(-2px); border-color: rgba(64,158,255,0.25); }
.mq-title { display: flex; align-items: center; gap: 10px; }
.mq-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.14);
  color: rgba(255,255,255,0.8);
  background: rgba(255,255,255,0.05);
}
.mq-tag.warn { border-color: rgba(230,162,60,0.35); background: rgba(230,162,60,0.10); }
.mq-tag.error { border-color: rgba(245,108,108,0.35); background: rgba(245,108,108,0.10); }
.mq-name { color: #fff; font-weight: 650; }
.mq-meta { margin-top: 6px; display: flex; gap: 14px; color: rgba(255,255,255,0.45); font-size: 12px; flex-wrap: wrap; }
.mq-right { display: flex; align-items: center; gap: 10px; }
.empty-hint { color: rgba(255,255,255,0.55); font-size: 13px; padding: 10px 4px; }

/* table dark */
.dark-table { background: transparent; }
:deep(.el-table) { background: transparent; }
:deep(.el-table__inner-wrapper::before) { background: rgba(255,255,255,0.08); }
:deep(.el-table tr) { background: transparent !important; }
:deep(.el-table td.el-table__cell) { border-bottom: 1px solid rgba(255,255,255,0.06); }
:deep(.el-table th.el-table__cell) { border-bottom: 1px solid rgba(255,255,255,0.08); }
:deep(.el-table__body-wrapper) { background: transparent; }
:deep(.el-table__body) { background: transparent; }

/* 单页 */
.single-page { padding: 18px; }
.single-grid { display: grid; grid-template-columns: 1fr 1fr 1.6fr; gap: 14px; margin-top: 12px; }
.inner-card { padding: 14px; }
.inner-title { color: rgba(255,255,255,0.6); font-size: 12px; }
.inner-value { color: #fff; font-size: 30px; font-weight: 800; margin-top: 10px; }

/* 快捷卡 */
.quick-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 8px; }
.quick-card {
  padding: 12px;
  border-radius: 12px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
}
.quick-card p { font-size: 12px; color: rgba(255,255,255,0.55); margin: 0; }
.quick-card h3 { margin: 8px 0 0; color: #fff; font-size: 24px; }
.quick-card h3.good { color: rgba(103,194,58,0.9); }
.quick-card h3.warn { color: rgba(245,108,108,0.9); }
.mini-note { margin-top: 12px; color: rgba(255,255,255,0.45); font-size: 12px; line-height: 1.6; }

/* 审核页工具条 */
.review-actions { display: flex; gap: 10px; margin: 12px 0 14px; flex-wrap: wrap; }

/* iframe 嵌入 */
.embed-toolbar { display: flex; gap: 10px; margin-top: 12px; }
.embed-box {
  margin-top: 14px;
  height: 70vh;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.10);
  background: rgba(0,0,0,0.25);
}
.embed-frame { width: 100%; height: 100%; }
.embed-empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 24px;
  text-align: center;
}
.embed-empty-title { color: #fff; font-size: 18px; font-weight: 800; }
.embed-empty-sub { margin-top: 12px; color: rgba(255,255,255,0.55); max-width: 720px; line-height: 1.7; }

/* ================== 5. 你原来的“玻璃块/占位”样式（保留） ================== */
.glass-section { background: rgba(255, 255, 255, 0.04); backdrop-filter: blur(10px); border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1); padding: 20px; margin-bottom: 0; }
.glass-section-big { background: rgba(255, 255, 255, 0.04); backdrop-filter: blur(40px); border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1); padding: 40px; margin-bottom: 0; }
.section-title { color: #fff; display: flex; align-items: center; gap: 8px; margin-bottom: 12px; font-weight: 650; }
.admin-placeholder .empty-state { color: rgba(255,255,255,0.75); text-align: center; padding: 40px 0; }
.admin-placeholder .empty-state span { display: inline-block; margin-top: 8px; color: rgba(255,255,255,0.5); }

/* ================== 6. 退出弹窗（保留） ================== */
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

/* ================== 7. 个人面板（保留） ================== */
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
:deep(.el-form-item) { margin-bottom: 22px !important; }

.preview-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 2px solid #409eff;
  box-shadow: 0 0 15px rgba(64, 158, 255, 0.5);
  cursor: zoom-in;
  transition: 0.3s;
  overflow: hidden;
}
.preview-avatar :deep(img) { border-radius: 50%; }
.preview-avatar:hover { transform: scale(1.05); box-shadow: 0 0 25px rgba(64, 158, 255, 0.8); }
:deep(.el-image-viewer__mask) { background: rgba(0, 0, 0, 0.8) !important; backdrop-filter: blur(10px); }

.custom-form { margin-top: 30px; padding: 0 5px; }
:deep(.el-form-item__label) {
  color: #70c0ff !important;
  font-weight: 500;
  letter-spacing: 1.5px;
  font-size: 13px;
  margin-bottom: 8px !important;
  text-transform: uppercase;
}
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

/* ================== 8. 动画（新增一点克制的） ================== */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(18px); filter: blur(4px); }
  to { opacity: 1; transform: translateY(0); filter: blur(0); }
}
.kpi-anim { opacity: 0; animation: fadeInUp 0.55s cubic-bezier(0.23, 1, 0.32, 1) forwards; animation-delay: calc(var(--d) * 0.07s); }
.chart-anim { opacity: 0; animation: fadeInUp 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards; animation-delay: calc(var(--d) * 0.06s); }

.slide-right-enter-active, .slide-right-leave-active { transition: all 0.4s ease; }
.slide-right-enter-from, .slide-right-leave-to { transform: translateX(100%); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.fade-fast-enter-active, .fade-fast-leave-active { transition: opacity 0.18s ease; }
.fade-fast-enter-from, .fade-fast-leave-to { opacity: 0; }

/* ================== 9. 流星背景（保留） ================== */
.meteor-container {
  position: fixed;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}
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

/* ================== 10. 适配 ================== */
@media (max-width: 1200px) {
  .kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .grid-2 { grid-template-columns: 1fr; }
  .single-grid { grid-template-columns: 1fr; }
  .side-nav { display: none; } /* 小屏直接隐藏侧栏，省得你又来问为什么挤爆了 */
}

/* ========== Reject Dialog (Glass) ========== */
:deep(.reject-dialog) {
  --rd-bg: rgba(12, 18, 28, 0.72);
  --rd-bd: rgba(255, 255, 255, 0.10);
  --rd-tx: rgba(255, 255, 255, 0.88);
  --rd-sub: rgba(255, 255, 255, 0.55);
}

:deep(.reject-dialog .el-dialog) {
  background: var(--rd-bg) !important;
  border: 1px solid var(--rd-bd) !important;
  border-radius: 18px !important;
  box-shadow: 0 30px 80px rgba(0,0,0,0.55) !important;
  backdrop-filter: blur(16px) !important;
  overflow: hidden;
}

:deep(.reject-dialog .el-dialog__header),
:deep(.reject-dialog .el-dialog__footer) {
  padding: 14px 16px !important;
  border-color: rgba(255,255,255,0.08) !important;
}

:deep(.reject-dialog .el-dialog__body) {
  padding: 14px 16px 6px !important;
}

.reject-hd {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.reject-title {
  color: var(--rd-tx);
  font-weight: 850;
  letter-spacing: 1px;
  font-size: 16px;
}
.reject-sub {
  margin-top: 4px;
  color: var(--rd-sub);
  font-size: 12px;
}

.reject-x {
  color: rgba(255,255,255,0.65) !important;
  border-radius: 10px;
  padding: 6px 10px;
  transition: 0.2s;
}
.reject-x:hover {
  background: rgba(255,255,255,0.06) !important;
  color: #fff !important;
}

.reject-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
.pill {
  font-size: 12px;
  color: rgba(255,255,255,0.75);
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.04);
}

/* 弹窗整体容器 */
:deep(.glass-dark-dialog) {
  background: rgba(30, 30, 35, 0.75) !important; /* 深色半透明 */
  backdrop-filter: blur(12px); /* 毛玻璃核心 */
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1); /* 极细边框线 */
  border-radius: 16px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.6);
}

/* 标题样式 */
:deep(.glass-dark-dialog .el-dialog__title) {
  color: #ffffff;
  font-weight: 600;
  letter-spacing: 1px;
}

/* 关闭按钮颜色 */
:deep(.glass-dark-dialog .el-dialog__headerbtn .el-dialog__close) {
  color: #ffffff;
}

/* 1. 弹窗本体：极致深黑透明 */
:deep(.pure-dark-glass) {
  background: rgba(10, 25, 47, 0.6) !important; /* 接近纯黑，保持90%不透明度 */
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.05); /* 极暗的边框，仅作勾勒 */
  border-radius: 12px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);
}

/* 2. 标题：改为银灰色，告别纯白 */
:deep(.pure-dark-glass .el-dialog__title) {
  color: #999; 
  font-size: 16px;
}

/* 3. 关闭按钮：暗灰色 */
:deep(.pure-dark-glass .el-dialog__close) {
  color: #666 !important;
}
:deep(.pure-dark-glass .el-dialog__close:hover) {
  color: #f56c6c !important; /* 悬浮变红 */
}

/* 4. 提示文字：深灰色 */
.reject-hint {
  color: #666;
  font-size: 13px;
  margin-bottom: 15px;
}

/* 5. 输入框：全黑背景 */
:deep(.dark-input .el-textarea__inner) {
  background-color: rgba(0, 0, 0, 0.4) !important;
  border: 1px solid #333 !important; /* 深焦炭色边框 */
  color: #bbb !important; /* 文字为中灰色 */
  box-shadow: none !important;
}

:deep(.dark-input .el-textarea__inner:focus) {
  border-color: #444 !important;
  background-color: rgba(0, 0, 0, 0.6) !important;
}

/* 6. 字数统计：暗度调高 */
:deep(.dark-input .el-input__count) {
  background: transparent !important;
  color: #444 !important;
}

/* 7. 取消按钮：深色系 */
.btn-dark-cancel {
  background: #222 !important;
  border: 1px solid #333 !important;
  color: #888 !important;
}
.btn-dark-cancel:hover {
  background: #333 !important;
  color: #aaa !important;
}

.btn-dark-confirm {
  background: #842020 !important; /* 降低亮度的暗红 */
  border: none !important;
  color: #ccc !important;
}
.btn-dark-confirm:hover {
  background: #a82525 !important;
  color: #fff !important;
}

/* 9. 全局遮罩层（可选）：让背景更暗 */
:deep(.el-overlay) {
  background-color: rgba(0, 0, 0, 0.3) !important;
}

/* ========== ElementPlus 深色适配 ========== */

.dark-table {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-row-hover-bg-color: rgba(255,255,255,0.06);
  --el-table-border-color: rgba(255,255,255,0.08);
  --el-table-header-bg-color: rgba(255,255,255,0.04);
  --el-table-header-text-color: #cfe9ff;
  --el-table-text-color: #ffffff;
}

.dark-pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

/* 分页按钮 */
.dark-pagination .el-pager li,
.dark-pagination .btn-prev,
.dark-pagination .btn-next {
  background: rgba(255,255,255,0.05);
  color: #cfe9ff;
  border-radius: 8px;
}

.dark-pagination .is-active {
  background: #409eff !important;
  color: #fff !important;
}
.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  letter-spacing: 0.2px;
}


</style>
