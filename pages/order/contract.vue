<template>
  <view class="page contract-page">
    <!-- Contract Header Paper Info -->
    <view class="section contract-header-card">
      <view class="contract-doc-header">
        <view class="doc-meta">
          <view class="doc-title-main">汽车托运模拟合同</view>
          <view class="doc-no-sub">合同编号：{{ contract.contractNo || '-' }}</view>
        </view>
      </view>
    </view>

    <!-- Contract Main Document Paper -->
    <view class="section contract-paper">
      <view class="paper-watermark">CONFIDENTIAL</view>
      <text class="contract-text">{{ contract.contractContent || '合同内容加载中...' }}</text>

      <!-- Signature block inside the paper -->
      <view class="paper-signature-row">
        <!-- Dealer Signature -->
        <view class="signature-box">
          <text class="sig-label">甲方（车商）确认</text>
          <view v-if="contract.dealerConfirmedAt" class="stamp-seal approved">
            <view class="stamp-inner">已确认</view>
            <view class="stamp-date">{{ dateTextDateOnly(contract.dealerConfirmedAt) }}</view>
          </view>
          <view v-else class="stamp-placeholder">等待确认</view>
        </view>

        <!-- Carrier Signature -->
        <view class="signature-box">
          <text class="sig-label">乙方（承运商）确认</text>
          <view v-if="contract.carrierConfirmedAt" class="stamp-seal approved">
            <view class="stamp-inner">已确认</view>
            <view class="stamp-date">{{ dateTextDateOnly(contract.carrierConfirmedAt) }}</view>
          </view>
          <view v-else class="stamp-placeholder">等待确认</view>
        </view>
      </view>
    </view>

    <!-- Details Card -->
    <view class="section">
      <view class="section-title">合同确认进度</view>

      <view class="info-row">
        <text class="sig-flow-label">车商（您）确认状态</text>
        <text
          class="status-tag"
          :class="contract.dealerConfirmedAt ? 'status-success' : 'status-warning'"
        >
          {{ contract.dealerConfirmedAt ? '已确认' : '待您确认' }}
        </text>
      </view>
      <view class="info-row">
        <text class="sig-flow-label">承运商确认状态</text>
        <text
          class="status-tag"
          :class="contract.carrierConfirmedAt ? 'status-success' : 'status-warning'"
        >
          {{ contract.carrierConfirmedAt ? '已确认' : '等待承运商确认' }}
        </text>
      </view>
      <view class="info-row">
        <text class="sig-flow-label">签署截止时间</text>
        <text class="deadline-text" :class="{ 'deadline-expired': contractExpired }">
          {{ deadlineText }}
        </text>
      </view>
      <view v-if="contractExpired && !contract.dealerConfirmedAt" class="deadline-tip">
        合同签署已超时，订单将由系统自动取消。
      </view>
    </view>

    <!-- Fixed Footer -->
    <view class="fixed-footer">
      <button
        v-if="!contract.dealerConfirmedAt"
        class="primary-btn confirm-contract-btn"
        :loading="submitting"
        :disabled="contractExpired"
        @click="confirm"
      >
        {{ contractExpired ? '签署已超时' : '确认模拟合同' }}
      </button>
      <button v-else class="plain-btn confirm-contract-btn" @click="back">返回订单详情</button>
    </view>
  </view>
</template>

<script>
import { api, requireLogin } from '../../utils/api.js';

export default {
  data() {
    return {
      orderId: '',
      contract: {},
      submitting: false,
    };
  },
  computed: {
    confirmDeadlineAt() {
      return this.contract.confirmDeadlineAt || this.contract.contractConfirmDeadlineAt || '';
    },
    contractExpired() {
      if (!this.confirmDeadlineAt) return false;
      const deadline = new Date(this.confirmDeadlineAt);
      return !Number.isNaN(deadline.getTime()) && deadline.getTime() <= Date.now();
    },
    deadlineText() {
      return this.confirmDeadlineAt ? this.dateText(this.confirmDeadlineAt) : '未设置';
    },
  },
  onLoad(options) {
    if (!requireLogin()) return;
    this.orderId = options.orderId;
    this.load();
  },
  methods: {
    async load() {
      this.contract = await api.contract(this.orderId);
    },
    dateTextDateOnly(val) {
      if (!val) return '';
      const date = new Date(val);
      if (Number.isNaN(date.getTime())) return '';
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    },
    dateText(val) {
      if (!val) return '';
      const date = new Date(val);
      if (Number.isNaN(date.getTime())) return '';
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    },
    back() {
      uni.redirectTo({ url: `/pages/order/detail?orderId=${this.orderId}` });
    },
    async confirm() {
      if (this.contractExpired) {
        uni.showToast({ title: '合同签署已超时', icon: 'none' });
        return;
      }
      this.submitting = true;
      try {
        const result = await api.confirmContract(this.orderId);
        if (result?.expired || result?.orderStatus === 'CANCELED') {
          uni.showToast({ title: '合同签署已超时，订单已取消', icon: 'none' });
          setTimeout(
            () => uni.redirectTo({ url: `/pages/order/detail?orderId=${this.orderId}` }),
            800,
          );
          return;
        }
        uni.showToast({ title: '合同已确认', icon: 'success' });
        setTimeout(
          () => uni.redirectTo({ url: `/pages/order/detail?orderId=${this.orderId}` }),
          500,
        );
      } finally {
        this.submitting = false;
      }
    },
  },
};
</script>

<style>
.contract-page {
  padding: 30rpx;
  padding-bottom: calc(180rpx + env(safe-area-inset-bottom));
}

.contract-header-card {
  padding: 30rpx 40rpx;
  border-left: 8rpx solid var(--primary-color);
}

.contract-doc-header {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.doc-meta {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.doc-title-main {
  font-size: 32rpx;
  font-weight: 800;
  color: #111827;
}

.doc-no-sub {
  font-size: 22rpx;
  color: var(--text-weak);
  font-family: monospace;
}

/* Document Paper Styling */
.contract-paper {
  position: relative;
  background: #fffdf9; /* Soft cream paper color */
  border: 1rpx solid #e2e8f0;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.02);
  padding: 48rpx 36rpx;
  overflow: hidden;
}

.paper-watermark {
  position: absolute;
  top: 30%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-30deg);
  font-size: 80rpx;
  font-weight: 900;
  color: rgba(0, 0, 0, 0.015);
  pointer-events: none;
  letter-spacing: 10rpx;
  user-select: none;
}

.contract-text {
  display: block;
  white-space: pre-wrap;
  color: #1e293b;
  font-size: 25rpx;
  line-height: 1.8;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  border-bottom: 2rpx dashed #cbd5e1;
  padding-bottom: 40rpx;
  margin-bottom: 40rpx;
}

/* Signature block styling */
.paper-signature-row {
  display: flex;
  justify-content: space-between;
  gap: 24rpx;
}

.signature-box {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.sig-label {
  font-size: 22rpx;
  color: var(--text-weak);
  font-weight: bold;
}

.stamp-placeholder {
  height: 100rpx;
  border: 2rpx dashed #cbd5e1;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22rpx;
  color: var(--text-weak);
}

.stamp-seal {
  position: relative;
  width: 130rpx;
  height: 130rpx;
  border: 4rpx solid #dc2626;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #dc2626;
  transform: rotate(-8deg);
  opacity: 0.85;
  box-shadow: 0 4rpx 10rpx rgba(220, 38, 38, 0.05);
}

.stamp-seal::after {
  content: '';
  position: absolute;
  top: 4rpx;
  bottom: 4rpx;
  left: 4rpx;
  right: 4rpx;
  border: 1rpx dashed #dc2626;
  border-radius: 50%;
}

.stamp-inner {
  font-size: 24rpx;
  font-weight: 900;
  letter-spacing: 4rpx;
}

.stamp-date {
  font-size: 14rpx;
  font-weight: bold;
  margin-top: 4rpx;
}

/* Info rows outside paper */
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f1f5f9;
  font-size: 26rpx;
}

.info-row:last-child {
  border-bottom: 0;
}

.sig-flow-label {
  color: var(--text-muted);
}

.deadline-text {
  color: #111827;
  font-weight: 700;
}

.deadline-expired {
  color: #dc2626;
}

.deadline-tip {
  margin-top: 16rpx;
  padding: 18rpx 20rpx;
  border-radius: var(--radius-sm);
  background: #fef2f2;
  color: #b91c1c;
  font-size: 24rpx;
  line-height: 1.6;
}

.confirm-contract-btn {
  width: 100%;
}
</style>
