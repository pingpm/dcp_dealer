<template>
  <view class="page cancel-logs-page">
    <!-- Header banner -->
    <view class="section logs-header-card">
      <view class="logs-header-wrap">
        <view class="logs-header-meta">
          <view class="logs-header-title">协商历史记录</view>
          <view class="logs-header-desc">记录本订单取消协商和逾期赔付处理的历史明细。</view>
        </view>
      </view>
    </view>

    <!-- Empty State -->
    <view v-if="logs.length === 0" class="section empty-logs">
      <view class="empty-visual">空</view>
      <text class="empty-text">暂无任何协商记录</text>
      <text class="empty-subtext">本单尚未发起取消协商或逾期赔付流程。</text>
    </view>

    <!-- Logs List -->
    <block v-else>
      <view class="timeline-logs-wrap">
        <view v-for="(log, idx) in logs" :key="log.id" class="timeline-log-item">
          <!-- Timeline line -->
          <view class="log-indicator">
            <view class="log-dot" :class="{ first: idx === 0 }"></view>
            <view v-if="idx < logs.length - 1" class="log-line"></view>
          </view>

          <!-- Timeline box -->
          <view class="log-card-body">
            <view class="log-card-header">
              <text class="log-action-name">{{ translateAction(log) }}</text>
              <text class="log-type">{{ log.historyType === 'COMPENSATION' ? '赔付' : '取消' }}</text>
              <text class="log-action-date">{{ dateText(log.createdAt) }}</text>
            </view>
            <view class="log-card-reason" v-if="log.claimNo">
              <text class="reason-label">赔付申请：</text>
              <text class="reason-text">{{ log.claimNo }}</text>
            </view>
            <view class="log-card-reason" v-if="log.reason || log.remark">
              <text class="reason-label">事由/说明：</text>
              <text class="reason-text">{{ log.reason || log.remark }}</text>
            </view>
            <view class="log-card-reason" v-if="log.amountCent !== null && log.amountCent !== undefined">
              <text class="reason-label">金额：</text>
              <text class="reason-text">{{ yuanText(log.amountCent) }}</text>
            </view>
          </view>
        </view>
      </view>
    </block>
    <miniapp-login-sheet ref="loginSheet" @success="handleLoginSuccess" />
  </view>
</template>

<script>
import { miniappLoginPageMixin } from '../../utils/miniapp-login-page.js';
import { api, requireLogin } from '../../utils/api.js';
import { dateText, yuanText } from '../../utils/format.js';

export default {
  mixins: [miniappLoginPageMixin],
  data() {
    return {
      orderId: '',
      logs: [],
    };
  },
  onLoad(options) {
    if (!requireLogin()) return;
    this.orderId = options.orderId;
    this.load();
  },
  methods: {
    dateText,
    yuanText,
    async load() {
      const data = await api.negotiationHistory(this.orderId);
      this.logs = data.items || data.logs || [];
    },
    translateAction(log) {
      const actionType = log.actionType;
      if (!actionType) return '';
      if (log.historyType === 'COMPENSATION' && actionType === 'REQUEST') {
        return '车商发起赔付申请';
      }
      const map = {
        REQUEST: '发起取消申请',
        APPROVED: '同意取消申请',
        REJECTED: '拒绝取消申请',
        WITHDRAW: '撤回取消申请',
        WITHDRAWN: '已撤回',
        CLOSED: '关闭取消申请',
        CARRIER_APPROVE: '承运商同意赔付',
        CARRIER_REJECT: '承运商拒绝赔付',
        REQUEST_PLATFORM: '车商申请平台介入',
        PLATFORM_APPROVE: '平台通过赔付',
        PLATFORM_REJECT: '平台驳回赔付',
        MARK_OFFLINE_PAID: '平台标记线下打款',
      };
      const key = String(actionType).toUpperCase();
      return map[key] || actionType;
    },
  },
};
</script>

<style>
.cancel-logs-page {
  padding: 30rpx;
}

.logs-header-card {
  border-left: 8rpx solid var(--primary-color);
}

.logs-header-wrap {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.logs-header-meta {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.logs-header-title {
  font-size: 32rpx;
  font-weight: 800;
  color: #111827;
}

.logs-header-desc {
  font-size: 22rpx;
  color: var(--text-weak);
}

/* Empty logs */
.empty-logs {
  background: #ffffff;
  padding: 120rpx 40rpx;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.empty-visual {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  background: #f3f4f6;
  color: #9ca3af;
  font-size: 30rpx;
  font-weight: 800;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 28rpx;
  font-weight: 750;
  color: #111827;
}

.empty-subtext {
  font-size: 22rpx;
  color: var(--text-weak);
  margin-top: 8rpx;
}

/* Timeline logs container */
.timeline-logs-wrap {
  display: flex;
  flex-direction: column;
  padding: 10rpx;
}

.timeline-log-item {
  display: flex;
  gap: 24rpx;
  position: relative;
  padding-bottom: 40rpx;
}

.timeline-log-item:last-child {
  padding-bottom: 0;
}

.log-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  width: 24rpx;
}

.log-dot {
  width: 18rpx;
  height: 18rpx;
  border-radius: 50%;
  background: #cbd5e1;
  z-index: 2;
  margin-top: 14rpx;
}

.log-dot.first {
  background: var(--primary-color);
  box-shadow: 0 0 0 6rpx rgba(249, 115, 22, 0.2);
}

.log-line {
  position: absolute;
  top: 32rpx;
  bottom: -32rpx;
  width: 2rpx;
  background: #cbd5e1;
  z-index: 1;
}

.log-card-body {
  flex: 1;
  background: #ffffff;
  border-radius: var(--radius-md);
  border: 1rpx solid rgba(229, 231, 235, 0.6);
  padding: 24rpx;
  box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.01);
}

.log-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12rpx;
  border-bottom: 1rpx dashed #f1f5f9;
  padding-bottom: 12rpx;
  margin-bottom: 14rpx;
}

.log-action-name {
  font-size: 28rpx;
  font-weight: 750;
  color: #111827;
  flex: 1;
}

.log-type {
  flex-shrink: 0;
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
  background: #eef2ff;
  color: #3730a3;
  font-size: 22rpx;
  font-weight: 700;
}

.log-action-date {
  font-size: 20rpx;
  color: var(--text-weak);
}

.log-card-reason {
  background: #f8fafc;
  padding: 16rpx;
  border-radius: var(--radius-sm);
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.reason-label {
  font-size: 20rpx;
  color: var(--text-weak);
  font-weight: bold;
}

.reason-text {
  font-size: 24rpx;
  color: var(--text-muted);
  line-height: 1.4;
}
</style>
