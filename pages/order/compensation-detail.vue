<template>
  <view class="page compensation-page">
    <view class="section detail-section-card" v-if="claim.id">
      <view class="section-title">赔付申请</view>
      <view class="detail-grid-info">
        <view class="detail-row">
          <text class="detail-label">申请编号</text>
          <text class="detail-value">{{ claim.claimNo }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">状态</text>
          <text class="detail-value">{{ statusText(claim.claimStatus) }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">约定送达</text>
          <text class="detail-value">{{ dateText(claim.agreedDeliveryTime) }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">承运商交车</text>
          <text class="detail-value">{{ dateText(claim.carrierHandoverTime) }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">逾期天数</text>
          <text class="detail-value">{{ claim.overdueDays }} 天</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">申请金额</text>
          <text class="detail-value price-highlight">{{ yuanText(claim.requestedCompensationCent) }}</text>
        </view>
        <view class="detail-row" v-if="claim.finalCompensationCent !== null">
          <text class="detail-label">最终金额</text>
          <text class="detail-value price-highlight">{{ yuanText(claim.finalCompensationCent) }}</text>
        </view>
      </view>
    </view>

    <view class="section detail-section-card" v-if="claim.id">
      <view class="section-title">双方记录</view>
      <view class="history-item" v-for="log in logs" :key="log.id">
        <text class="history-title">{{ actionText(log.actionType) }}</text>
        <text class="history-desc" v-if="log.reason">{{ log.reason }}</text>
        <text class="history-desc" v-if="log.remark">{{ log.remark }}</text>
        <text class="history-time">{{ dateText(log.createdAt) }}</text>
      </view>
    </view>

    <view class="section detail-section-card" v-if="claim.claimStatus === 'CARRIER_REJECTED'">
      <view class="section-title">申请平台介入</view>
      <textarea
        class="textarea"
        v-model="interventionReason"
        maxlength="500"
        placeholder="请说明需要平台介入的原因"
      />
      <button class="primary-btn w-full" style="margin-top: 20rpx" @click="requestPlatform">
        申请平台介入
      </button>
    </view>
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
      claimId: '',
      claim: {},
      logs: [],
      interventionReason: '',
    };
  },
  onLoad(options) {
    if (!requireLogin()) return;
    this.claimId = options.claimId;
    this.load();
  },
  methods: {
    dateText,
    yuanText,
    async load() {
      const data = await api.compensationClaim(this.claimId);
      this.claim = data.claim || {};
      this.logs = data.logs || [];
    },
    statusText(status) {
      const map = {
        PENDING_CARRIER: '待承运商处理',
        CARRIER_APPROVED: '承运商已同意',
        CARRIER_REJECTED: '承运商已拒绝',
        PLATFORM_PENDING: '平台介入中',
        PLATFORM_APPROVED: '平台已通过',
        PLATFORM_REJECTED: '平台已驳回',
        CANCELED: '已撤销',
      };
      return map[status] || status || '-';
    },
    actionText(action) {
      const map = {
        REQUEST: '车商发起赔付申请',
        CARRIER_APPROVE: '承运商同意赔付',
        CARRIER_REJECT: '承运商拒绝赔付',
        REQUEST_PLATFORM: '车商申请平台介入',
        PLATFORM_APPROVE: '平台通过赔付',
        PLATFORM_REJECT: '平台驳回赔付',
        MARK_OFFLINE_PAID: '平台标记线下打款',
      };
      return map[action] || action;
    },
    async requestPlatform() {
      if (!this.interventionReason.trim()) {
        uni.showToast({ title: '请填写介入原因', icon: 'none' });
        return;
      }
      await api.requestCompensationPlatformIntervention(this.claimId, this.interventionReason);
      uni.showToast({ title: '已申请平台介入', icon: 'success' });
      this.load();
    },
  },
};
</script>

<style scoped>
.compensation-page {
  padding-bottom: 40rpx;
}
.history-item {
  padding: 20rpx 0;
  border-bottom: 1rpx solid #eef2f7;
}
.history-title,
.history-desc,
.history-time {
  display: block;
}
.history-title {
  font-weight: 700;
}
.history-desc {
  margin-top: 8rpx;
  color: #475569;
}
.history-time {
  margin-top: 8rpx;
  color: #94a3b8;
  font-size: 24rpx;
}
.textarea {
  min-height: 180rpx;
  width: 100%;
  box-sizing: border-box;
  padding: 20rpx;
  border-radius: 8rpx;
  background: #f8fafc;
}
</style>
