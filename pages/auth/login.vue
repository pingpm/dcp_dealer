<template>
  <view class="page login-page">
    <view class="login-card">
      <view class="login-card-header">
        <view class="card-title">手机号快捷登录</view>
        <view class="card-subtitle">新手机号首次登录将自动为您注册账号</view>
      </view>

      <view class="field">
        <text class="label">手机号码</text>
        <view class="input-wrapper">
          <text class="phone-prefix">+86</text>
          <input
            class="input phone-input"
            v-model="phone"
            type="number"
            maxlength="11"
            placeholder="请输入您的手机号"
            placeholder-class="placeholder-style"
          />
        </view>
      </view>

      <view class="field">
        <text class="label">验证码</text>
        <view class="input-wrapper code-wrapper">
          <input
            class="input code-input"
            v-model="verificationCode"
            type="number"
            maxlength="6"
            placeholder="请输入验证码"
            placeholder-class="placeholder-style"
          />
          <button class="code-btn" :disabled="codeLoading || countdown > 0" @click="sendCode">
            {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
          </button>
        </view>
        <view class="code-tip">验证码 10 分钟内有效，请注意查收短信</view>
      </view>

      <button class="primary-btn login-btn" :loading="loading" @click="login">
        登录 / 注册
      </button>

      <view class="agreement-wrapper">
        <label class="agreement-checkbox" @click="toggleAgreement">
          <checkbox
            :checked="agreementAccepted"
            color="#ff4d55"
            style="transform: scale(0.7)"
            @click.stop="toggleAgreement"
          />
          <text class="agreement-text">
            我已阅读并同意
            <text class="agreement-link" @click.stop="openAgreement('terms')">《注册协议》</text>与
            <text class="agreement-link" @click.stop="openAgreement('privacy')">《隐私协议》</text>
          </text>
        </label>
      </view>
    </view>
  </view>
</template>

<script>
import { api, miniappLoginCode, setSession } from '../../utils/api.js';
import { goAfterLogin } from '../../utils/navigation.js';

export default {
  data() {
    return {
      phone: '',
      verificationCode: '',
      loading: false,
      codeLoading: false,
      countdown: 0,
      countdownTimer: null,
      agreementAccepted: true,
    };
  },
  onUnload() {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
  },
  methods: {
    validatePhone() {
      if (!/^1\d{10}$/.test(this.phone)) {
        uni.showToast({ title: '请输入 11 位有效手机号', icon: 'none' });
        return false;
      }
      return true;
    },
    validateAgreement() {
      if (!this.agreementAccepted) {
        uni.showToast({ title: '请先勾选注册协议和隐私协议', icon: 'none' });
        return false;
      }
      return true;
    },
    toggleAgreement() {
      this.agreementAccepted = !this.agreementAccepted;
    },
    openAgreement(type) {
      uni.navigateTo({ url: `/pages/agreement/detail?type=${type}` });
    },
    async sendCode() {
      if (!this.validatePhone() || this.countdown > 0) return;
      this.codeLoading = true;
      try {
        const data = await api.sendLoginCode(this.phone);
        let title = '验证码短信已发送';
        if (data.isRegistered === false) {
          title += '（新手机号登录将自动注册）';
        }
        uni.showToast({ title, icon: 'none' });
        this.countdown = 60;
        this.countdownTimer = setInterval(() => {
          this.countdown -= 1;
          if (this.countdown <= 0 && this.countdownTimer) {
            clearInterval(this.countdownTimer);
            this.countdownTimer = null;
          }
        }, 1000);
      } finally {
        this.codeLoading = false;
      }
    },
    async login() {
      if (!this.validateAgreement()) {
        return;
      }
      if (!this.validatePhone()) {
        return;
      }
      if (!/^\d{6}$/.test(this.verificationCode)) {
        uni.showToast({ title: '请输入 6 位验证码', icon: 'none' });
        return;
      }
      this.loading = true;
      try {
        const wxCode = await miniappLoginCode();
        const data = wxCode
          ? await api.loginWithWechatCode(this.phone, this.verificationCode, wxCode)
          : await api.login(this.phone, this.verificationCode);
        setSession(data);
        goAfterLogin(data);
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style>
.login-page {
  padding: 96rpx 44rpx 44rpx;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  background: #f7f8fa;
}

.login-card {
  padding: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  border: 0;
}

.login-card-header {
  margin-bottom: 58rpx;
}

.card-title {
  color: var(--text-main);
  font-size: 44rpx;
  font-weight: 900;
  line-height: 1.25;
}

.card-subtitle {
  color: #777777;
  font-size: 26rpx;
  margin-top: 14rpx;
  line-height: 1.5;
}

.login-page .field {
  margin-bottom: 34rpx;
}

.login-page .label {
  margin-bottom: 16rpx;
  color: #424242;
  font-size: 27rpx;
  font-weight: 800;
}

.input-wrapper {
  display: flex;
  align-items: center;
  min-height: 98rpx;
  border: 0;
  border-radius: 22rpx;
  background: #ffffff;
  overflow: hidden;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 8rpx 24rpx rgba(41, 25, 21, 0.035);
}

.input-wrapper:focus-within {
  background: #ffffff;
  box-shadow: 0 0 0 6rpx var(--primary-glow);
}

.phone-prefix {
  padding: 0 26rpx;
  font-size: 28rpx;
  font-weight: 800;
  color: var(--text-main);
  border-right: 1rpx solid #f0eeee;
  background: #fff8f6;
  height: 98rpx;
  line-height: 98rpx;
}

.phone-input {
  flex: 1;
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
  height: 98rpx;
  padding: 0 26rpx !important;
}

.code-wrapper {
  padding-right: 10rpx;
}

.code-input {
  flex: 1;
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
  height: 98rpx;
  padding: 0 26rpx !important;
}

.code-btn {
  flex-shrink: 0;
  min-width: 178rpx;
  height: 70rpx;
  margin: 0;
  padding: 0 18rpx;
  border: 0;
  border-radius: 36rpx;
  background: var(--primary-light);
  color: var(--primary-color);
  font-size: 24rpx;
  font-weight: 700;
  line-height: 72rpx;
  transition: all 0.2s ease;
}

.code-btn:active {
  background: #ffe7e7;
}

.code-btn[disabled] {
  background: #f2f2f2;
  color: var(--text-weak);
}

.code-tip {
  margin-top: 14rpx;
  color: var(--text-weak);
  font-size: 22rpx;
  padding-left: 6rpx;
}

.placeholder-style {
  color: var(--text-weak);
}

.login-btn {
  margin-top: 52rpx;
  width: 100%;
  height: 94rpx;
  font-size: 30rpx;
  border-radius: 999rpx;
}

.agreement-wrapper {
  margin-top: 34rpx;
  display: flex;
  justify-content: center;
}

.agreement-checkbox {
  display: flex;
  align-items: flex-start;
  gap: 8rpx;
}

.agreement-text {
  font-size: 22rpx;
  color: var(--text-muted);
  line-height: 1.5;
  margin-top: 4rpx;
}

.agreement-link {
  color: var(--primary-color);
  font-weight: bold;
}
</style>
