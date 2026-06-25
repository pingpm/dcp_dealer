<template>
  <view class="page compensation-page">
    <view class="section detail-section-card" v-if="eligibility.order">
      <view class="section-title">逾期赔付信息</view>
      <view class="detail-grid-info">
        <view class="detail-row">
          <text class="detail-label">订单编号</text>
          <text class="detail-value">{{ eligibility.order.orderNo }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">约定送达</text>
          <text class="detail-value">{{ dateText(eligibility.order.agreedDeliveryTime) }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">承运商交车</text>
          <text class="detail-value">{{ dateText(eligibility.order.carrierHandoverTime) }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">约定运费</text>
          <text class="detail-value price-highlight">{{ yuanText(eligibility.order.orderAmountCent) }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">赔付标准</text>
          <text class="detail-value">
            逾期 {{ rule.overdueDays || 0 }} 天，{{ yuanText(rule.compensationPerDayCent) }}/天
          </text>
        </view>
        <view class="detail-row">
          <text class="detail-label">建议赔付</text>
          <text class="detail-value price-highlight">{{ yuanText(rule.suggestedCompensationCent) }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">申请截止</text>
          <text class="detail-value">{{ dateText(rule.applyDeadlineAt) }}</text>
        </view>
      </view>
    </view>

    <view class="section detail-section-card">
      <view class="section-title">申请内容</view>
      <textarea
        class="textarea"
        v-model="dealerClaimText"
        maxlength="500"
        placeholder="请描述逾期情况、沟通经过或其他证据说明"
      />
      <view class="word-counter">{{ dealerClaimText.length }} / 500 字</view>
      <view class="detail-row">
        <text class="detail-label">申请金额</text>
        <input class="input" type="number" v-model="requestedYuan" placeholder="默认使用建议金额" />
      </view>
    </view>

    <view class="section detail-section-card">
      <view class="section-title">证据图片</view>
      <view class="upload-grid">
        <view class="upload-preview" v-for="(file, index) in evidenceFiles" :key="file.fileId">
          <image :src="file.fileUrl" class="upload-img" mode="aspectFill" />
          <text class="remove-img" @click="removeEvidence(index)">×</text>
        </view>
        <view v-if="evidenceFiles.length < 9" class="upload-add" @click="chooseEvidence">
          <text class="upload-plus">+</text>
          <text class="upload-add-text">上传</text>
        </view>
      </view>
      <text class="hint-text">最多 9 张</text>
    </view>

    <view class="fixed-footer">
      <button class="primary-btn w-full" :loading="submitting" @click="submit">提交赔付申请</button>
    </view>
    <miniapp-login-sheet ref="loginSheet" @success="handleLoginSuccess" />
  </view>
</template>

<script>
import { miniappLoginPageMixin } from '../../utils/miniapp-login-page.js';
import { api, requireLogin, uploadFile } from '../../utils/api.js';
import { dateText, yuanText } from '../../utils/format.js';

export default {
  mixins: [miniappLoginPageMixin],
  data() {
    return {
      orderId: '',
      eligibility: {},
      dealerClaimText: '',
      requestedYuan: '',
      evidenceFiles: [],
      submitting: false,
    };
  },
  computed: {
    rule() {
      return this.eligibility.ruleSnapshot || {};
    },
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
      this.eligibility = await api.compensationEligibility(this.orderId);
      if (!this.eligibility.eligible) {
        uni.showModal({
          title: '暂不可申请',
          content: '当前订单不满足赔付申请条件，或已存在赔付申请。',
          showCancel: false,
          confirmColor: '#f97316',
          success: () => uni.navigateBack(),
        });
      }
    },
    chooseEvidence() {
      uni.chooseImage({
        count: 9 - this.evidenceFiles.length,
        sizeType: ['compressed'],
        success: async (res) => {
          for (const path of res.tempFilePaths || []) {
            const file = await uploadFile(path, 'IMAGE', 'COMPENSATION_EVIDENCE');
            this.evidenceFiles.push(file);
          }
        },
      });
    },
    removeEvidence(index) {
      this.evidenceFiles.splice(index, 1);
    },
    async submit() {
      if (!this.dealerClaimText.trim()) {
        uni.showToast({ title: '请填写申请说明', icon: 'none' });
        return;
      }
      const requestedCompensationCent = this.requestedYuan
        ? Math.round(Number(this.requestedYuan) * 100)
        : undefined;
      if (this.requestedYuan && (!Number.isFinite(requestedCompensationCent) || requestedCompensationCent <= 0)) {
        uni.showToast({ title: '申请金额不正确', icon: 'none' });
        return;
      }
      this.submitting = true;
      try {
        await api.createCompensationClaim(this.orderId, {
          dealerClaimText: this.dealerClaimText,
          requestedCompensationCent,
          evidenceFileIds: this.evidenceFiles.map((file) => file.fileId || file.id),
        });
        uni.showToast({ title: '已提交赔付申请', icon: 'success' });
        setTimeout(() => uni.navigateBack(), 600);
      } finally {
        this.submitting = false;
      }
    },
  },
};
</script>

<style scoped>
.compensation-page {
  padding-bottom: 180rpx;
}
.textarea {
  min-height: 220rpx;
  width: 100%;
  box-sizing: border-box;
  padding: 20rpx;
  border-radius: 8rpx;
  background: #f8fafc;
}
.word-counter,
.hint-text {
  display: block;
  margin-top: 12rpx;
  color: #94a3b8;
  font-size: 24rpx;
  text-align: right;
}
.input {
  flex: 1;
  text-align: right;
}
.upload-add,
.upload-preview {
  position: relative;
}
.remove-img {
  position: absolute;
  right: -8rpx;
  top: -8rpx;
  width: 36rpx;
  height: 36rpx;
  border-radius: 18rpx;
  background: #ef4444;
  color: #fff;
  text-align: center;
  line-height: 36rpx;
}
</style>
