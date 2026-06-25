<template>
  <view class="page account-page">
    <view class="profile-panel" @click="handleProfileClick">
      <image class="profile-avatar" src="/static/my_default_profile_icon.svg" mode="aspectFill" />
      <view class="profile-meta">
        <view class="profile-name-row">
          <text class="profile-name">{{ profileDisplayName }}</text>
        </view>
        <view class="profile-sub-row">
          <text class="profile-phone">{{
            isLoggedIn ? maskedPhone : '请点击此处登录您的账户'
          }}</text>
          <text v-if="isLoggedIn" class="mini-verified-badge" :class="reviewStatus.toLowerCase()">
            {{ reviewStatusText[reviewStatus] || '未认证' }}
          </text>
        </view>
      </view>
    </view>

    <view class="section quick-menu-card">
      <view class="quick-menu-grid">
        <view
          v-for="item in menuItems"
          :key="item.key"
          class="quick-menu-item"
          @click="handleMenuClick(item.key)"
        >
          <view class="quick-menu-icon-wrap">
            <image class="quick-menu-icon" :src="item.icon" mode="aspectFit" />
            <text v-if="item.badge" class="quick-menu-badge" :class="item.badgeClass">
              {{ item.badge }}
            </text>
          </view>
          <text class="quick-menu-label">{{ item.label }}</text>
        </view>
      </view>
    </view>
    <miniapp-login-sheet ref="loginSheet" @success="handleLoginSuccess" />
  </view>
</template>

<script>
import { api, clearSession, getSession, openLoginPrompt } from '../../utils/api.js';
import { reviewStatusText, statusClass } from '../../utils/format.js';
import MiniappLoginSheet from '../../components/miniapp-login-sheet/miniapp-login-sheet.vue';

export default {
  components: {
    MiniappLoginSheet,
  },
  data() {
    return {
      user: {},
      profile: {},
      reviewStatus: 'UNVERIFIED',
      dealerVerificationRequired: true,
      isLoggedIn: false,
      reviewStatusText,
    };
  },
  computed: {
    profileDisplayName() {
      if (!this.isLoggedIn) return '立即登录';
      return this.profile.companyName || this.profile.contactName || '车商用户';
    },
    maskedPhone() {
      const phone = this.user.registeredPhone || this.profile.registeredPhone || '';
      if (!phone) return '-';
      if (phone.length < 7) return phone;
      return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
    },
    menuItems() {
      return [
        {
          key: 'dealer-info',
          label: '车商信息',
          icon: '/static/my_dealer_info.svg',
          badge: this.dealerInfoBadge,
          badgeClass: this.reviewStatus.toLowerCase(),
        },
        {
          key: 'express-order',
          label: '快捷下单',
          icon: '/static/my_express_order.svg',
        },
        {
          key: 'search-history',
          label: '查询记录',
          icon: '/static/my_search_history.svg',
        },
        {
          key: 'setting',
          label: '设置',
          icon: '/static/my_setting.svg',
        },
      ];
    },
    dealerInfoBadge() {
      if (!this.isLoggedIn) return '';
      if (!this.dealerVerificationRequired && this.reviewStatus !== 'APPROVED') return '可选完善';
      const badgeMap = {
        UNVERIFIED: '未认证',
        PENDING: '审核中',
        REJECTED: '审核驳回',
      };
      return badgeMap[this.reviewStatus] || '';
    },
  },
  onShow() {
    this.isLoggedIn = !!getSession();
    if (this.isLoggedIn) {
      this.load();
    } else {
      this.user = {};
      this.profile = {};
      this.reviewStatus = 'UNVERIFIED';
      this.dealerVerificationRequired = true;
    }
  },
  methods: {
    statusClass,
    async load() {
      try {
        const data = await api.me({ authRedirect: false });
        this.user = data.user || {};
        this.profile = data.profile || {};
        this.reviewStatus = data.reviewStatus;
        this.dealerVerificationRequired = data.dealerVerificationRequired !== false;
      } catch (error) {
        if (error?.statusCode === 401) {
          this.isLoggedIn = false;
          this.user = {};
          this.profile = {};
          this.reviewStatus = 'UNVERIFIED';
          this.dealerVerificationRequired = true;
        }
      }
    },
    handleMenuClick(key) {
      if (key === 'dealer-info') {
        this.goVerify();
      } else if (key === 'express-order') {
        this.startOrder();
      } else if (key === 'search-history') {
        this.viewOrders();
      } else if (key === 'setting') {
        this.goSettings();
      }
    },
    goVerify() {
      if (!this.ensureLoggedIn('查看车商信息')) return;
      const url =
        this.reviewStatus === 'UNVERIFIED' || this.reviewStatus === 'REJECTED'
          ? '/pages/verification/form'
          : '/pages/verification/status';
      uni.navigateTo({ url });
    },
    goSettings() {
      uni.navigateTo({ url: '/pages/account/settings' });
    },
    goHome() {
      uni.switchTab({ url: '/pages/home/index' });
    },
    goOrders() {
      uni.switchTab({ url: '/pages/order/list' });
    },
    startOrder() {
      if (!this.ensureLoggedIn('快捷下单')) return;
      if (!this.ensureVerified('快捷下单')) return;
      this.goHome();
    },
    viewOrders() {
      if (!this.ensureLoggedIn('查看查询记录')) return;
      this.goOrders();
    },
    goLogin() {
      // #ifdef MP-WEIXIN
      this.$refs.loginSheet?.open('登录账号');
      return;
      // #endif
      openLoginPrompt({ actionText: '登录账号' });
    },
    async handleLoginSuccess() {
      this.isLoggedIn = true;
      await this.load();
    },
    handleProfileClick() {
      if (!this.isLoggedIn) this.promptLogin('登录账号');
    },
    ensureLoggedIn(actionText = '继续操作') {
      if (this.isLoggedIn) return true;
      this.promptLogin(actionText);
      return false;
    },
    ensureVerified(actionText = '继续操作') {
      if (!this.dealerVerificationRequired) return true;
      if (this.reviewStatus === 'APPROVED') return true;
      uni.showModal({
        title: '需要车商认证',
        content: `当前还未进行车商认证，请先进行认证后再${actionText}。`,
        cancelText: '稍后认证',
        confirmText: '立即认证',
        confirmColor: '#f97316',
        success: (res) => {
          if (res.confirm) {
            this.goVerify();
          }
        },
      });
      return false;
    },
    promptLogin(actionText = '继续操作') {
      // #ifdef MP-WEIXIN
      this.$refs.loginSheet?.open(actionText);
      return;
      // #endif
      uni.showModal({
        title: '需要登录',
        content: `当前还未登录，请先登录后再${actionText}。`,
        cancelText: '稍后登录',
        confirmText: '立即登录',
        confirmColor: '#f97316',
        success: (res) => {
          if (res.confirm) this.goLogin();
        },
      });
    },
    logout() {
      uni.showModal({
        title: '退出登录',
        content: '确定要退出当前账号吗？',
        confirmColor: '#f97316',
        success: (res) => {
          if (res.confirm) {
            clearSession();
            this.user = {};
            this.profile = {};
            this.reviewStatus = 'UNVERIFIED';
            this.isLoggedIn = false;
            uni.switchTab({ url: '/pages/home/index' });
          }
        },
      });
    },
  },
};
</script>

<style>
.account-page {
  position: relative;
  overflow: hidden;
  min-height: 100vh;
  padding: 56rpx 24rpx 240rpx;
  background: linear-gradient(180deg, #fff4e8 0%, #f8f5f2 340rpx, #f7f7f7 100%);
}

.profile-panel {
  display: flex;
  align-items: center;
  gap: 24rpx;
  min-height: 220rpx;
  padding: 44rpx 24rpx 46rpx;
  background: transparent;
  cursor: pointer;
}

.profile-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  flex-shrink: 0;
  box-shadow: 0 12rpx 28rpx rgba(249, 115, 22, 0.1);
}

.profile-meta {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  min-width: 0;
}

.profile-name-row {
  display: flex;
  align-items: center;
  min-width: 0;
}

.profile-name {
  max-width: 450rpx;
  overflow: hidden;
  color: #242424;
  font-size: 42rpx;
  font-weight: 800;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-sub-row {
  display: flex;
  align-items: center;
  gap: 14rpx;
  min-width: 0;
}

.mini-verified-badge {
  display: inline-flex;
  align-items: center;
  height: 36rpx;
  padding: 0 14rpx;
  border-radius: 10rpx;
  color: #f97316;
  font-size: 24rpx;
  font-weight: 500;
  line-height: 36rpx;
  border: 1.5rpx solid #f97316;
  background: rgba(255, 247, 237, 0.82);
}

.mini-verified-badge.approved {
  color: var(--success-color);
  border-color: var(--success-color);
  background: rgba(236, 253, 245, 0.85);
}

.mini-verified-badge.pending {
  color: var(--warning-color);
  border-color: var(--warning-color);
  background: rgba(255, 251, 235, 0.86);
}

.mini-verified-badge.rejected {
  color: var(--danger-color);
  border-color: var(--danger-color);
  background: rgba(254, 242, 242, 0.88);
}

.profile-phone {
  color: #303030;
  font-size: 30rpx;
  line-height: 1.25;
}

.quick-menu-card {
  margin: 6rpx 0 0;
  padding: 30rpx 24rpx 28rpx;
  border: 0;
  border-radius: 34rpx;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: none;
}

.quick-menu-card:active {
  transform: none;
  box-shadow: none;
}

.quick-menu-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  row-gap: 28rpx;
}

.quick-menu-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 148rpx;
  min-width: 0;
  cursor: pointer;
}

.quick-menu-item:active {
  transform: scale(0.95);
}

.quick-menu-icon-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
  margin-bottom: 16rpx;
}

.quick-menu-icon {
  width: 72rpx;
  height: 72rpx;
}

.quick-menu-badge {
  position: absolute;
  top: -20rpx;
  right: -50rpx;
  max-width: 128rpx;
  height: 38rpx;
  padding: 0 12rpx;
  overflow: hidden;
  border-radius: 10rpx;
  background: #ff4d4f;
  color: #ffffff;
  font-size: 24rpx;
  font-weight: 500;
  line-height: 38rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quick-menu-badge.pending {
  background: #f59e0b;
}

.quick-menu-badge.rejected {
  background: #ef4444;
}

.quick-menu-label {
  color: #2f2f2f;
  font-size: 30rpx;
  font-weight: 700;
  line-height: 1.3;
}

/* Version card */
.version-card {
  padding: 28rpx 36rpx;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1rpx solid rgba(226, 232, 240, 0.7);
}

.version-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 24rpx;
}

.version-lbl {
  color: var(--text-weak);
  font-weight: 600;
}

.version-val {
  color: var(--text-muted);
  font-weight: 700;
}

.logout-action-btn {
  width: 100%;
  margin-top: 48rpx;
  height: 92rpx;
  font-size: 28rpx;
  color: var(--danger-color) !important;
  border: 1.5rpx solid #fca5a5 !important;
  background: #ffffff !important;
  font-weight: 800 !important;
  border-radius: 46rpx !important;
  box-shadow: 0 4rpx 12rpx rgba(239, 68, 68, 0.05) !important;
}

.logout-action-btn:active {
  background: var(--danger-light) !important;
}

</style>
