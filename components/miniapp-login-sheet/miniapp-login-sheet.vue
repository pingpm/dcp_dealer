<template>
  <!-- #ifdef MP-WEIXIN -->
  <view v-if="visible" class="login-sheet">
    <view class="login-sheet-mask" @click="close"></view>
    <view class="login-sheet-panel">
      <view class="login-sheet-handle"></view>
      <view class="login-sheet-head">
        <view>
          <view class="login-sheet-title">登录后继续使用</view>
          <view class="login-sheet-subtitle">
            授权微信手机号后，可搜索承运商、联系承运商并发起订单
          </view>
        </view>
        <button class="login-sheet-close" @click="close">×</button>
      </view>

      <button
        class="primary-btn login-sheet-btn"
        open-type="getPhoneNumber"
        :loading="loading"
        :disabled="loading"
        @getphonenumber="handleGetPhoneNumber"
      >
        微信手机号一键登录
      </button>

      <view class="login-sheet-agreement">
        <label class="login-sheet-checkbox" @click="toggleAgreement">
          <checkbox
            :checked="agreementAccepted"
            color="#f97316"
            style="transform: scale(0.72)"
            @click.stop="toggleAgreement"
          />
          <text class="login-sheet-agreement-text">
            我已阅读并同意
            <text class="login-sheet-link" @click.stop="openAgreement('terms')">《注册协议》</text>
            与
            <text class="login-sheet-link" @click.stop="openAgreement('privacy')">《隐私协议》</text>
          </text>
        </label>
      </view>
    </view>
  </view>
  <!-- #endif -->
</template>

<script>
import { api, consumePendingLoginPrompt, miniappLoginCode, setSession } from '../../utils/api.js';

export default {
  emits: ['success'],
  data() {
    return {
      visible: false,
      loading: false,
      agreementAccepted: true,
      actionText: '继续操作',
    };
  },
  mounted() {
    // #ifdef MP-WEIXIN
    uni.$on('open-miniapp-login-sheet', this.handleOpenEvent);
    const pending = consumePendingLoginPrompt();
    if (pending) {
      this.handleOpenEvent(pending);
    }
    // #endif
  },
  beforeUnmount() {
    // #ifdef MP-WEIXIN
    uni.$off('open-miniapp-login-sheet', this.handleOpenEvent);
    // #endif
  },
  methods: {
    handleOpenEvent(payload = {}) {
      this.open(payload.actionText || '继续操作');
    },
    open(actionText = '继续操作') {
      this.actionText = actionText;
      this.visible = true;
    },
    close() {
      if (this.loading) return;
      this.visible = false;
    },
    toggleAgreement() {
      this.agreementAccepted = !this.agreementAccepted;
    },
    openAgreement(type) {
      uni.navigateTo({ url: `/pages/agreement/detail?type=${type}` });
    },
    validateAgreement() {
      if (!this.agreementAccepted) {
        uni.showToast({ title: '请先勾选注册协议和隐私协议', icon: 'none' });
        return false;
      }
      return true;
    },
    async handleGetPhoneNumber(event) {
      if (!this.validateAgreement()) return;
      const detail = event.detail || {};
      if (detail.errMsg && !detail.errMsg.includes('ok')) {
        uni.showToast({ title: '请授权手机号后登录', icon: 'none' });
        return;
      }
      if (!detail.code) {
        uni.showToast({ title: '微信未返回手机号授权凭证', icon: 'none' });
        return;
      }
      this.loading = true;
      try {
        const wxCode = await miniappLoginCode();
        const data = await api.wechatPhoneLogin(detail.code, wxCode);
        setSession(data);
        if (data?.needVerificationPrompt) {
          uni.setStorageSync('dealer_need_verification_prompt', '1');
        }
        this.visible = false;
        this.$emit('success', data);
        uni.showToast({ title: '登录成功', icon: 'success' });
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style>
.login-sheet {
  position: fixed;
  inset: 0;
  z-index: 9999;
}

.login-sheet-mask {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.46);
}

.login-sheet-panel {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 18rpx 36rpx calc(40rpx + env(safe-area-inset-bottom));
  border-radius: 32rpx 32rpx 0 0;
  background: #ffffff;
  box-shadow: 0 -20rpx 48rpx rgba(15, 23, 42, 0.14);
}

.login-sheet-handle {
  width: 68rpx;
  height: 8rpx;
  margin: 0 auto 28rpx;
  border-radius: 999rpx;
  background: #e5e7eb;
}

.login-sheet-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 28rpx;
  margin-bottom: 34rpx;
}

.login-sheet-title {
  color: #1f2937;
  font-size: 38rpx;
  font-weight: 900;
  line-height: 1.25;
}

.login-sheet-subtitle {
  margin-top: 12rpx;
  color: #6b7280;
  font-size: 26rpx;
  line-height: 1.55;
}

.login-sheet-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56rpx;
  height: 56rpx;
  min-height: 56rpx;
  margin: 0;
  padding: 0;
  border-radius: 999rpx;
  background: #f3f4f6;
  color: #6b7280;
  font-size: 38rpx;
  line-height: 1;
}

.login-sheet-btn {
  width: 100%;
  min-height: 92rpx;
  border-radius: 999rpx;
  background: linear-gradient(90deg, #ff7a57 0%, #ff3854 100%);
  color: #ffffff;
  font-size: 30rpx;
  font-weight: 900;
}

.login-sheet-agreement {
  margin-top: 24rpx;
}

.login-sheet-checkbox {
  display: flex;
  align-items: flex-start;
  gap: 8rpx;
}

.login-sheet-agreement-text {
  flex: 1;
  color: #6b7280;
  font-size: 24rpx;
  line-height: 1.6;
}

.login-sheet-link {
  color: #f97316;
  font-weight: 700;
}
</style>
