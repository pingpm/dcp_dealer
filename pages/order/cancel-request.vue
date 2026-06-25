<template>
  <view class="page cancel-request-page">
    <!-- Warn card -->
    <view class="cancel-warn-card-modern">
      <view class="warn-header-modern">
        <dealer-icon class="warn-icon-modern" name="triangle-alert" size="sm" color="#ef4444" />
        <text class="warn-title-modern">托运订单取消说明</text>
      </view>
      <view class="warn-body-modern">
        <view class="warn-item-modern">
          <view class="warn-dot-modern"></view>
          <text class="warn-text-modern">
            承运商<text class="highlight-danger">未确认前</text
            >的订单，取消后将直接关闭并退还已收取的全部服务费。
          </text>
        </view>
        <view class="warn-item-modern">
          <view class="warn-dot-modern"></view>
          <text class="warn-text-modern">
            承运商<text class="highlight-danger">确认接单后</text
            >的订单，取消需要双方协商同意。发起后订单状态将变更为“取消中”，若对方拒绝则订单继续履约。
          </text>
        </view>
      </view>
    </view>

    <!-- Form card -->
    <view class="section">
      <view class="section-title">请填写取消原因</view>
      <view class="field">
        <textarea
          class="textarea cancel-textarea"
          v-model="cancelReason"
          maxlength="200"
          placeholder="请详细说明您需要取消该托运订单的具体原因，便于承运商及平台进行审核处理..."
          placeholder-style="color:#9ca3af"
        />
        <view class="word-counter">{{ cancelReason.length }} / 200 字</view>
      </view>
    </view>

    <!-- Fixed Footer -->
    <view class="fixed-footer">
      <button class="danger-btn submit-cancel-btn" :loading="submitting" @click="submit">
        确认并提交取消申请
      </button>
    </view>
    <miniapp-login-sheet ref="loginSheet" @success="handleLoginSuccess" />
  </view>
</template>

<script>
import { miniappLoginPageMixin } from '../../utils/miniapp-login-page.js';
import { api, requireLogin } from '../../utils/api.js';

export default {
  mixins: [miniappLoginPageMixin],
  data() {
    return {
      orderId: '',
      cancelReason: '',
      submitting: false,
    };
  },
  onLoad(options) {
    if (!requireLogin()) return;
    this.orderId = options.orderId;
  },
  methods: {
    async submit() {
      if (!this.cancelReason.trim()) {
        uni.showToast({ title: '请输入取消原因', icon: 'none' });
        return;
      }
      this.submitting = true;
      try {
        await api.cancelOrder(this.orderId, this.cancelReason);
        uni.showToast({ title: '取消申请已提交', icon: 'success' });
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
.cancel-request-page {
  padding: 30rpx;
}

.cancel-warn-card-modern {
  background: var(--danger-light);
  border: 1rpx solid rgba(239, 68, 68, 0.15);
  border-radius: var(--radius-md);
  padding: 30rpx;
  margin-bottom: 28rpx;
  box-shadow: 0 4rpx 12rpx rgba(239, 68, 68, 0.02);
}

.warn-header-modern {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.warn-icon-modern {
  flex-shrink: 0;
}

.warn-title-modern {
  font-size: 28rpx;
  font-weight: bold;
  color: var(--danger-color);
}

.warn-body-modern {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.warn-item-modern {
  display: flex;
  align-items: flex-start;
  gap: 14rpx;
}

.warn-dot-modern {
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
  background-color: var(--danger-color);
  margin-top: 12rpx;
  flex-shrink: 0;
}

.warn-text-modern {
  font-size: 24rpx;
  color: #6b7280;
  line-height: 1.5;
}

.highlight-danger {
  font-weight: bold;
  color: var(--danger-color);
  margin: 0 4rpx;
}

.cancel-textarea {
  font-size: 28rpx;
  line-height: 1.6;
  border-color: var(--border-color);
}

.word-counter {
  text-align: right;
  font-size: 20rpx;
  color: var(--text-weak);
  margin-top: 10rpx;
  padding-right: 10rpx;
}

.submit-cancel-btn {
  width: 100%;
}
</style>
