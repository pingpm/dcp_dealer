<template>
  <view class="page settings-page">
    <view class="section settings-list-card">
      <view class="setting-row">
        <text class="setting-lbl">当前版本</text>
        <text class="setting-val font-mono">v1.2.0</text>
      </view>
    </view>

    <view class="logout-container" v-if="isLoggedIn">
      <button class="logout-btn" @click="logout">退出当前登录</button>
    </view>
  </view>
</template>

<script>
import { clearSession, getSession } from '../../utils/api.js';

export default {
  data() {
    return {
      isLoggedIn: false,
    };
  },
  onShow() {
    this.isLoggedIn = !!getSession();
  },
  methods: {
    logout() {
      uni.showModal({
        title: '退出登录',
        content: '确定要退出当前账号吗？',
        confirmColor: '#f97316',
        success: (res) => {
          if (res.confirm) {
            clearSession();
            uni.showToast({
              title: '已退出登录',
              icon: 'success',
            });
            setTimeout(() => {
              uni.switchTab({ url: '/pages/home/index' });
            }, 600);
          }
        },
      });
    },
  },
};
</script>

<style>
.settings-page {
  padding: 30rpx;
}

.settings-list-card {
  padding: 10rpx 30rpx;
  border-radius: var(--radius-lg);
  border: 1rpx solid rgba(226, 232, 240, 0.7);
  box-shadow: var(--shadow-sm);
  background: #ffffff;
}

.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx 0;
  font-size: 28rpx;
}

.setting-lbl {
  color: var(--text-main);
  font-weight: bold;
}

.setting-val {
  color: var(--text-weak);
  font-weight: 600;
}

.logout-container {
  margin-top: 60rpx;
  padding: 0 10rpx;
}

.logout-btn {
  width: 100%;
  height: 92rpx;
  line-height: 92rpx;
  text-align: center;
  font-size: 28rpx;
  color: var(--danger-color) !important;
  border: 1.5rpx solid #fca5a5 !important;
  background: #ffffff !important;
  font-weight: 800 !important;
  border-radius: 46rpx !important;
  box-shadow: 0 4rpx 12rpx rgba(239, 68, 68, 0.05) !important;
}

.logout-btn:active {
  background: var(--danger-light) !important;
}
</style>
