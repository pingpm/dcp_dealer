<template>
  <view class="page status-page">
    <!-- Status Header Banner -->
    <view class="status-banner-card" :class="status.reviewStatus.toLowerCase()">
      <view class="status-icon-wrap">
        <dealer-icon :name="statusIconName" size="lg" :color="statusIconColor" />
      </view>
      <view class="status-banner-meta">
        <view class="status-title-text">{{ reviewStatusText[status.reviewStatus] || '-' }}</view>
        <view class="status-subtitle-text">
          <text v-if="status.reviewStatus === 'APPROVED'"
            >恭喜！您的资质已通过审核，可立即找车交易。</text
          >
          <text v-else-if="status.reviewStatus === 'PENDING'"
            >提交成功，客服将在1-2个工作日内完成审核。</text
          >
          <text v-else-if="status.reviewStatus === 'REJECTED'"
            >您的申请未能通过审核，请修改后重新提交。</text
          >
          <text v-else>您还未提交车商身份认证，无法搜索或交易。</text>
        </view>
      </view>
    </view>

    <!-- Reject Reason Card -->
    <view v-if="status.rejectReason" class="section reject-reason-card">
      <view class="reject-title">驳回原因</view>
      <view class="reject-body">{{ status.rejectReason }}</view>
    </view>

    <!-- Information Card -->
    <view class="section info-card" v-if="status.reviewStatus !== 'UNVERIFIED'">
      <view class="section-title">认证材料档案</view>

      <view class="info-list">
        <view class="info-row-item">
          <text class="row-label">企业名称</text>
          <text class="row-value">{{ status.companyName || '未填写' }}</text>
        </view>
        <view class="info-row-item">
          <text class="row-label">联系人姓名</text>
          <text class="row-value">{{ status.contactName || '未填写' }}</text>
        </view>
        <view class="info-row-item" v-if="status.provinceName">
          <text class="row-label">经营地址</text>
          <text class="row-value"
            >{{ status.provinceName }} {{ status.cityName }} {{ status.addressDetail }}</text
          >
        </view>
        <view v-if="status.submittedAt" class="info-row-item">
          <text class="row-label">提交申请时间</text>
          <text class="row-value">{{ dateText(status.submittedAt) }}</text>
        </view>
        <view v-if="status.reviewedAt" class="info-row-item">
          <text class="row-label">最后审核时间</text>
          <text class="row-value">{{ dateText(status.reviewedAt) }}</text>
        </view>

        <!-- Business License Photo -->
        <view class="info-row-item flex-col" v-if="licenseFiles.length">
          <text class="row-label margin-bottom-sm">营业执照</text>
          <view class="image-preview-grid">
            <image
              v-for="file in licenseFiles"
              :key="file.fileId"
              :src="file.fileUrl"
              mode="aspectFill"
              class="preview-img-item"
              @click="previewImg(file.fileUrl)"
            />
          </view>
        </view>

        <!-- Business Site Photos -->
        <view class="info-row-item flex-col" v-if="siteFiles.length">
          <text class="row-label margin-bottom-sm">经营场地照片 ({{ siteFiles.length }}张)</text>
          <view class="image-preview-grid">
            <image
              v-for="file in siteFiles"
              :key="file.fileId"
              :src="file.fileUrl"
              mode="aspectFill"
              class="preview-img-item"
              @click="previewImg(file.fileUrl)"
            />
          </view>
        </view>
      </view>
    </view>

    <!-- Guide Panel -->
    <view class="section guide-card">
      <view class="section-title">认证后享有哪些权益？</view>
      <view class="guide-steps">
        <view class="guide-step">
          <text class="step-num">01</text>
          <view class="step-meta">
            <text class="step-title">承运商直连</text>
            <text class="step-desc">解锁全部真实承运商，支持按价格、时效多维比较。</text>
          </view>
        </view>
        <view class="guide-step">
          <text class="step-num">02</text>
          <view class="step-meta">
            <text class="step-title">担保交易服务</text>
            <text class="step-desc">支持平台担保交易、模拟合同确认和提送车跟踪。</text>
          </view>
        </view>
      </view>
    </view>

    <!-- Fixed Action Footer -->
    <view class="fixed-footer">
      <button v-if="status.reviewStatus === 'APPROVED'" class="primary-btn" @click="goHome">
        进入首页找车
      </button>
      <button v-else-if="status.reviewStatus === 'PENDING'" class="plain-btn" @click="load">
        刷新审核状态
      </button>
      <button v-else class="primary-btn" @click="goForm">
        {{ status.reviewStatus === 'REJECTED' ? '重新提交认证信息' : '立即去认证' }}
      </button>
    </view>
  </view>
</template>

<script>
import { api, requireLogin } from '../../utils/api.js';
import { dateText, reviewStatusText, statusClass } from '../../utils/format.js';

export default {
  data() {
    return {
      status: {
        reviewStatus: 'UNVERIFIED',
        mediaFiles: [],
      },
      reviewStatusText,
    };
  },
  computed: {
    statusIconName() {
      const map = {
        APPROVED: 'circle-check',
        PENDING: 'hourglass',
        REJECTED: 'triangle-alert',
      };
      return map[this.status.reviewStatus] || 'user-round';
    },
    statusIconColor() {
      const map = {
        APPROVED: '#16a34a',
        PENDING: '#d97706',
        REJECTED: '#dc2626',
      };
      return map[this.status.reviewStatus] || '#64748b';
    },
    licenseFiles() {
      return (this.status.mediaFiles || []).filter((f) => f.usageScene === 'BUSINESS_LICENSE');
    },
    siteFiles() {
      return (this.status.mediaFiles || []).filter((f) => f.usageScene === 'BUSINESS_SITE');
    },
  },
  onShow() {
    if (requireLogin()) this.load();
  },
  methods: {
    dateText,
    statusClass,
    async load() {
      const res = await api.verificationStatus();
      this.status = res;
      if (res.reviewStatus !== 'UNVERIFIED') {
        try {
          const detail = await api.verificationDetail();
          if (detail && detail.version) {
            this.status = {
              ...this.status,
              provinceName: detail.version.provinceName,
              cityName: detail.version.cityName,
              addressDetail: detail.version.addressDetail,
              mediaFiles: detail.version.mediaFiles || [],
            };
          }
        } catch (e) {}
      }
    },
    previewImg(url) {
      uni.previewImage({
        urls: [url],
      });
    },
    goHome() {
      uni.switchTab({ url: '/pages/home/index' });
    },
    goForm() {
      uni.navigateTo({ url: '/pages/verification/form' });
    },
  },
};
</script>

<style>
.status-page {
  padding: 30rpx;
}

.status-banner-card {
  display: flex;
  align-items: center;
  gap: 28rpx;
  padding: 48rpx 36rpx;
  border-radius: var(--radius-lg);
  margin-bottom: 28rpx;
  border: 1rpx solid rgba(229, 231, 235, 0.5);
  box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.02);
  background: #ffffff;
}

.status-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 90rpx;
  height: 90rpx;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-banner-meta {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.status-title-text {
  font-size: 34rpx;
  font-weight: 800;
  color: #111827;
}

.status-subtitle-text {
  font-size: 24rpx;
  color: #6b7280;
  line-height: 1.4;
}

/* Status variants */
.status-banner-card.approved {
  background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
  border-color: #bbf7d0;
}
.status-banner-card.approved .status-icon-wrap {
  background: #eaf7ee;
  color: #16a34a;
}
.status-banner-card.approved .status-title-text {
  color: #16a34a;
}

.status-banner-card.pending {
  background: linear-gradient(135deg, #fffbeb 0%, #ffffff 100%);
  border-color: #fde68a;
}
.status-banner-card.pending .status-icon-wrap {
  background: #fef3c7;
  color: #d97706;
}
.status-banner-card.pending .status-title-text {
  color: #d97706;
}

.status-banner-card.rejected {
  background: linear-gradient(135deg, #fef2f2 0%, #ffffff 100%);
  border-color: #fecaca;
}
.status-banner-card.rejected .status-icon-wrap {
  background: #feecec;
  color: #dc2626;
}
.status-banner-card.rejected .status-title-text {
  color: #dc2626;
}

.status-banner-card.unverified {
  background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
  border-color: #e2e8f0;
}
.status-banner-card.unverified .status-icon-wrap {
  background: #e2e8f0;
  color: #64748b;
}

.reject-reason-card {
  border-left: 8rpx solid var(--danger-color);
  background: #fff8f8;
}

.reject-title {
  color: var(--danger-color);
  font-size: 28rpx;
  font-weight: 700;
  margin-bottom: 8rpx;
}

.reject-body {
  color: #4b5563;
  font-size: 26rpx;
  line-height: 1.5;
}

.info-card {
  padding-bottom: 12rpx;
}

.info-list {
  display: flex;
  flex-direction: column;
}

.info-row-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f1f5f9;
  font-size: 26rpx;
}

.info-row-item:last-child {
  border-bottom: 0;
}

.row-label {
  color: var(--text-muted);
}

.row-value {
  color: var(--text-main);
  font-weight: 700;
}

.guide-steps {
  display: flex;
  flex-direction: column;
  gap: 28rpx;
  margin-top: 12rpx;
}

.guide-step {
  display: flex;
  gap: 24rpx;
  align-items: flex-start;
}

.step-num {
  font-size: 36rpx;
  font-weight: 900;
  color: #fdba74;
  line-height: 1;
}

.step-meta {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.step-title {
  font-size: 28rpx;
  font-weight: 700;
  color: var(--text-main);
}

.guide-desc {
  font-size: 24rpx;
  color: var(--text-muted);
  line-height: 1.5;
}

.flex-col {
  flex-direction: column !important;
  align-items: flex-start !important;
}

.margin-bottom-sm {
  margin-bottom: 16rpx;
}

.image-preview-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  width: 100%;
}

.preview-img-item {
  width: 160rpx;
  height: 160rpx;
  border-radius: var(--radius-sm);
  border: 1rpx solid #e5e7eb;
}
</style>
