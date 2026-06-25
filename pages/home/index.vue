<template>
  <view class="page home-page">
    <view
      v-if="!isLoggedIn || needsVerification"
      class="home-account-tip"
      @click="handleAccountNotice"
    >
      <text class="guest-prompt-icon">!</text>
      <view class="guest-prompt-main">
        <view class="guest-prompt-title one-line">{{ floatNoticeText }}</view>
        <view class="guest-prompt-desc one-line">{{ floatNoticeDesc }}</view>
      </view>
      <button class="primary-btn guest-prompt-action" @click.stop="handleAccountNotice">
        {{ floatButtonText }}
      </button>
    </view>

    <view class="home-hero">
      <image class="hero-image" src="/static/index_top_bg.jpg" mode="widthFix" />
    </view>

    <view class="main-search-card">
      <view class="search-mode-tabs">
        <view
          class="search-mode-tab"
          :class="{ active: searchType === 'route' }"
          @click="switchSearchType('route')"
        >
          <text class="tab-text">按线路</text>
          <view class="tab-active-bar"></view>
        </view>
        <view
          class="search-mode-tab"
          :class="{ active: searchType === 'carrier' }"
          @click="switchSearchType('carrier')"
        >
          <text class="tab-text">按承运商</text>
          <view class="tab-active-bar"></view>
        </view>
      </view>

      <view v-if="searchType === 'route'" class="tab-form-content">
        <view class="route-select-row">
          <view class="route-city-btn" @click="triggerCityPicker('origin')">
            <text class="route-city-name" :class="{ 'placeholder-txt': !form.originCityName }">
              {{ form.originCityName || '请选择出发地' }}
            </text>
          </view>

          <view class="route-swap-btn" @click="swapCities">
            <text class="swap-arrows">⇄</text>
          </view>

          <view class="route-city-btn" @click="triggerCityPicker('destination')">
            <text class="route-city-name" :class="{ 'placeholder-txt': !form.destinationCityName }">
              {{ form.destinationCityName || '请选择目的地' }}
            </text>
          </view>
        </view>

        <button class="primary-btn submit-search-btn" :loading="searching" @click="search">
          查询
        </button>
      </view>

      <view v-else class="tab-form-content">
        <view class="keyword-search-wrap">
          <view class="search-icon-glass"></view>
          <input
            class="keyword-input"
            v-model="form.keyword"
            placeholder="请输入承运商名称关键词搜索"
            placeholder-style="color:#94a3b8"
          />
        </view>

        <button class="primary-btn submit-search-btn" :loading="searching" @click="search">
          查询
        </button>
      </view>
    </view>

    <view v-if="searchType === 'route'" class="home-bottom-list">
      <view class="bottom-section-title">最近查询线路</view>

      <view v-if="recentRoutes.length" class="recent-routes-list">
        <view
          v-for="(r, idx) in recentRoutes"
          :key="idx"
          class="recent-route-card"
          @click="onRecentRouteClick(r)"
        >
          <view class="route-card-left">
            <view class="route-cities-title">{{ r.origin }}-{{ r.destination }}</view>
            <view class="route-card-time">{{ r.timeText }}</view>
          </view>
          <view class="route-card-right">
            <text class="route-contact-count">重新查询</text>
            <text class="arrow-right">❯</text>
          </view>
        </view>
      </view>
      <view v-else class="empty-state-card">
        <view class="empty-title">暂无查询历史</view>
        <view class="empty-desc">选择起始地和目的地后，系统将自动记录并保留您的查询足迹。</view>
      </view>
    </view>

    <view v-else class="home-bottom-list">
      <view class="empty-state-card">
        <view class="empty-title">按商家名称查询</view>
        <view class="empty-desc">输入承运商公司关键词，匹配经平台认证的承运商。</view>
      </view>
    </view>

    <region-picker ref="regionPicker" :title="pickerTitle" @select="onRegionSelect" />
    <miniapp-login-sheet ref="loginSheet" @success="handleLoginSuccess" />
  </view>
</template>

<script>
import { api, toQuery, getSession, openLoginPrompt } from '../../utils/api.js';
import { reviewStatusText } from '../../utils/format.js';
import MiniappLoginSheet from '../../components/miniapp-login-sheet/miniapp-login-sheet.vue';
import RegionPicker from '../../components/region-picker/region-picker.vue';

export default {
  components: {
    MiniappLoginSheet,
    RegionPicker,
  },
  data() {
    return {
      status: { reviewStatus: 'UNVERIFIED' },
      reviewStatusText,
      dealerVerificationRequired: true,
      searching: false,
      isLoggedIn: false,
      searchType: 'route', // 'route' | 'carrier'
      activePicker: 'origin', // 'origin' | 'destination'
      form: {
        originProvinceId: '',
        originProvinceName: '',
        originCityId: '',
        originCityName: '',
        destinationProvinceId: '',
        destinationProvinceName: '',
        destinationCityId: '',
        destinationCityName: '',
        transportMode: 'LARGE_TRUCK',
        keyword: '',
      },
      recentRoutes: [],
    };
  },
  computed: {
    pickerTitle() {
      return this.activePicker === 'origin' ? '选择出发地城市' : '选择目的地城市';
    },
    floatNoticeText() {
      if (!this.isLoggedIn) return '当前还未登录';
      if (this.status.reviewStatus === 'PENDING') return '车商认证审核中';
      if (this.status.reviewStatus === 'REJECTED') return '车商认证已驳回';
      return '当前还未认证';
    },
    floatNoticeDesc() {
      if (!this.isLoggedIn) return '登录后可搜索承运商并发起订单';
      if (this.status.reviewStatus === 'PENDING') return '审核通过后即可搜索和下单';
      if (this.status.reviewStatus === 'REJECTED') return '请重新提交车商认证资料';
      return '认证后可联系承运商并下单';
    },
    floatButtonText() {
      if (!this.isLoggedIn) return '立即登录';
      if (this.status.reviewStatus === 'PENDING') return '查看进度';
      return '立即认证';
    },
    needsVerification() {
      return this.dealerVerificationRequired && this.status.reviewStatus !== 'APPROVED';
    },
  },
  onShow() {
    this.isLoggedIn = !!getSession();
    if (this.isLoggedIn) {
      this.loadStatus();
    }
    this.loadRecentRoutes();
  },
  methods: {
    async loadStatus() {
      try {
        const session = getSession() || {};
        this.dealerVerificationRequired = session.dealerVerificationRequired !== false;
        this.status = await api.verificationStatus({ authRedirect: false, silent: true });
        if (this.status.dealerVerificationRequired !== undefined) {
          this.dealerVerificationRequired = this.status.dealerVerificationRequired !== false;
        }
        this.showVerificationPromptIfNeeded(this.status.reviewStatus);
      } catch (error) {
        if (error?.statusCode === 401) {
          this.isLoggedIn = false;
          this.status = { reviewStatus: 'UNVERIFIED' };
        }
      }
    },
    showVerificationPromptIfNeeded(reviewStatus) {
      const shouldPrompt = uni.getStorageSync('dealer_need_verification_prompt') === '1';
      if (!shouldPrompt || reviewStatus === 'APPROVED') {
        return;
      }
      uni.removeStorageSync('dealer_need_verification_prompt');
      const prompt = this.loginVerificationPrompt(reviewStatus);
      uni.showModal({
        title: prompt.title,
        content: prompt.content,
        confirmText: '立即认证',
        cancelText: this.dealerVerificationRequired ? '稍后认证' : '暂不认证',
        success: (res) => {
          if (res.confirm) {
            this.goVerify();
          }
        },
      });
    },
    loginVerificationPrompt(reviewStatus) {
      if (this.dealerVerificationRequired) {
        if (reviewStatus === 'PENDING') {
          return {
            title: '认证审核中',
            content: '您的车商认证正在审核中，审核通过后即可搜索承运商、联系承运商并发起托运订单。',
          };
        }
        if (reviewStatus === 'REJECTED') {
          return {
            title: '认证未通过',
            content: '您的车商认证未通过，请重新提交认证资料。认证通过后即可搜索承运商、联系承运商并发起托运订单。',
          };
        }
        return {
          title: '请先完成车商认证',
          content: '完成车商认证后，您可以搜索承运商、联系承运商并发起托运订单。',
        };
      }
      if (reviewStatus === 'PENDING') {
        return {
          title: '认证资料审核中',
          content: '您已提交车商认证资料，平台会尽快审核。审核期间不影响您搜索承运商、联系承运商和发起订单。',
        };
      }
      if (reviewStatus === 'REJECTED') {
        return {
          title: '完善车商资料',
          content: '您的认证资料暂未通过。完善真实车商资料后，平台可以更准确地识别您的企业身份，帮助承运商更快确认订单并提供更匹配的服务。',
        };
      }
      return {
        title: '完善车商资料',
        content: '您现在已经可以搜索承运商、联系承运商和发起订单。建议完善车商认证资料，便于平台更好地服务您的企业，提升承运商接单确认效率。',
      };
    },
    showSearchVerificationPrompt() {
      let title = '还未完成认证';
      let content = '完成车商认证后，您可以搜索承运商、联系承运商并发起托运订单。';

      if (this.status.reviewStatus === 'PENDING') {
        title = '认证审核中';
        content = '您的车商认证正在审核中，审核通过后即可搜索承运商并发起订单。';
      } else if (this.status.reviewStatus === 'REJECTED') {
        title = '认证未通过';
        content = '您的车商认证未通过，请重新提交认证资料后再搜索承运商。';
      }

      uni.showModal({
        title,
        content,
        confirmText: this.status.reviewStatus === 'PENDING' ? '查看进度' : '立即认证',
        cancelText: '稍后认证',
        confirmColor: '#f97316',
        success: (res) => {
          if (res.confirm) {
            this.goVerify();
          }
        },
      });
    },
    handleAccountNotice() {
      if (!this.isLoggedIn) {
        this.goLogin();
        return;
      }
      this.goVerify();
    },
    goVerify() {
      const url =
        this.status.reviewStatus === 'PENDING'
          ? '/pages/verification/status'
          : '/pages/verification/form';
      uni.navigateTo({ url });
    },
    goLogin() {
      // #ifdef MP-WEIXIN
      this.$refs.loginSheet?.open('搜索承运商');
      return;
      // #endif
      openLoginPrompt({ actionText: '搜索承运商' });
    },
    handleLoginSuccess() {
      this.isLoggedIn = true;
      this.loadStatus();
    },
    clearRouteSearchFields() {
      this.form.originProvinceId = '';
      this.form.originProvinceName = '';
      this.form.originCityId = '';
      this.form.originCityName = '';
      this.form.destinationProvinceId = '';
      this.form.destinationProvinceName = '';
      this.form.destinationCityId = '';
      this.form.destinationCityName = '';
    },
    switchSearchType(type) {
      if (this.searchType === type) return;
      this.searchType = type;
      if (type === 'route') {
        this.form.keyword = '';
        return;
      }
      this.clearRouteSearchFields();
    },
    triggerCityPicker(type) {
      this.activePicker = type;
      this.$refs.regionPicker.open();
    },
    onRegionSelect(region) {
      if (this.activePicker === 'origin') {
        this.form.originProvinceId = region.provinceId;
        this.form.originProvinceName = region.provinceName;
        this.form.originCityId = region.cityId;
        this.form.originCityName = region.cityName;
      } else {
        this.form.destinationProvinceId = region.provinceId;
        this.form.destinationProvinceName = region.provinceName;
        this.form.destinationCityId = region.cityId;
        this.form.destinationCityName = region.cityName;
      }
    },
    swapCities() {
      const tempProvinceId = this.form.originProvinceId;
      const tempProvinceName = this.form.originProvinceName;
      const tempCityId = this.form.originCityId;
      const tempCityName = this.form.originCityName;
      this.form.originProvinceId = this.form.destinationProvinceId;
      this.form.originProvinceName = this.form.destinationProvinceName;
      this.form.originCityId = this.form.destinationCityId;
      this.form.originCityName = this.form.destinationCityName;
      this.form.destinationProvinceId = tempProvinceId;
      this.form.destinationProvinceName = tempProvinceName;
      this.form.destinationCityId = tempCityId;
      this.form.destinationCityName = tempCityName;
    },
    search() {
      if (!this.isLoggedIn) {
        this.goLogin();
        return;
      }
      if (this.needsVerification) {
        this.showSearchVerificationPrompt();
        return;
      }

      if (this.searchType === 'route') {
        if (!this.form.originCityId || !this.form.destinationCityId) {
          uni.showToast({ title: '请选择出发地和目的地', icon: 'none' });
          return;
        }
        // Save to recent search history
        this.saveRecentRoute({
          origin: this.form.originCityName,
          destination: this.form.destinationCityName,
          originProvinceId: this.form.originProvinceId || '',
          originProvinceName: this.form.originProvinceName || '',
          originCityId: this.form.originCityId,
          destinationProvinceId: this.form.destinationProvinceId || '',
          destinationProvinceName: this.form.destinationProvinceName || '',
          destinationCityId: this.form.destinationCityId,
          timeText: this.getFormattedTime(),
        });
        const query = toQuery({
          originProvinceId: this.form.originProvinceId,
          originProvinceName: this.form.originProvinceName,
          originCityId: this.form.originCityId,
          originCityName: this.form.originCityName,
          destinationProvinceId: this.form.destinationProvinceId,
          destinationProvinceName: this.form.destinationProvinceName,
          destinationCityId: this.form.destinationCityId,
          destinationCityName: this.form.destinationCityName,
          transportMode: this.form.transportMode,
        });
        uni.navigateTo({ url: `/pages/search/results?${query}` });
      } else {
        if (!this.form.keyword) {
          uni.showToast({ title: '请输入承运商名称', icon: 'none' });
          return;
        }
        const query = toQuery({
          keyword: this.form.keyword,
        });
        uni.navigateTo({ url: `/pages/search/results?${query}` });
      }
    },
    onRecentRouteClick(r) {
      this.searchType = 'route';
      this.form.keyword = '';
      this.form.originCityName = r.origin;
      this.form.destinationCityName = r.destination;
      this.form.originProvinceId = r.originProvinceId || '';
      this.form.originProvinceName = r.originProvinceName || '';
      this.form.originCityId = r.originCityId;
      this.form.destinationProvinceId = r.destinationProvinceId || '';
      this.form.destinationProvinceName = r.destinationProvinceName || '';
      this.form.destinationCityId = r.destinationCityId;
      this.search();
    },
    getFormattedTime() {
      const date = new Date();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hour = String(date.getHours()).padStart(2, '0');
      const minute = String(date.getMinutes()).padStart(2, '0');
      return `${month}-${day} ${hour}:${minute}`;
    },
    saveRecentRoute(route) {
      let list = [];
      try {
        list = uni.getStorageSync('recent_routes') || [];
        if (!Array.isArray(list)) list = [];
      } catch (e) {
        list = [];
      }
      list = list.filter(
        (item) =>
          !(item.originCityId === route.originCityId && item.destinationCityId === route.destinationCityId)
      );
      list.unshift(route);
      list = list.slice(0, 5);
      this.recentRoutes = list;
      try {
        uni.setStorageSync('recent_routes', list);
      } catch (e) {}
    },
    loadRecentRoutes() {
      try {
        const list = uni.getStorageSync('recent_routes');
        if (Array.isArray(list)) {
          this.recentRoutes = list;
        }
      } catch (e) {}
    },
  },
};
</script>

<style>
.home-page {
  min-height: 100vh;
  padding: 0 32rpx calc(180rpx + env(safe-area-inset-bottom));
  background: #f6f6f6;
}

.home-account-tip {
  position: fixed;
  left: 24rpx;
  right: 24rpx;
  top: 24rpx;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 18rpx;
  margin: 0;
  padding: 22rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 12rpx 32rpx rgba(31, 35, 41, 0.06);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

/* #ifdef H5 */
.home-account-tip {
  top: calc(112rpx + env(safe-area-inset-top));
}
/* #endif */

.home-account-tip .guest-prompt-main {
  min-width: 0;
}

.home-account-tip .one-line {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.home-hero {
  position: relative;
  height: 442rpx;
  margin: 0 -32rpx;
  background: #f6f6f6;
  overflow: visible;
}

.hero-image {
  display: block;
  width: 100%;
}

.main-search-card {
  position: relative;
  z-index: 2;
  margin-top: -36rpx;
  overflow: hidden;
  border-radius: 30rpx;
  background: #ffffff;
  box-shadow: 0 16rpx 36rpx rgba(31, 41, 55, 0.05);
}

.search-mode-tabs {
  position: relative;
  display: flex;
  height: 120rpx;
  background: #fff3ed;
}

.search-mode-tab {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-top-left-radius: 30rpx;
  border-top-right-radius: 30rpx;
}

.search-mode-tab.active {
  z-index: 2;
  background: #ffffff;
  border-top-left-radius: 30rpx;
  border-top-right-radius: 30rpx;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.search-mode-tab.active::before,
.search-mode-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  width: 44rpx;
  height: 44rpx;
  background: #fff3ed;
}

.search-mode-tab.active::before {
  left: -44rpx;
  border-bottom-right-radius: 30rpx;
  box-shadow: 18rpx 18rpx 0 18rpx #ffffff;
}

.search-mode-tab.active::after {
  right: -44rpx;
  border-bottom-left-radius: 30rpx;
  box-shadow: -18rpx 18rpx 0 18rpx #ffffff;
}

.search-mode-tab:first-child.active::before {
  display: none;
}

.search-mode-tab:last-child.active::after {
  display: none;
}

.search-mode-tab .tab-text {
  color: #777777;
  font-size: 34rpx;
  font-weight: 800;
  line-height: 1;
}

.search-mode-tab.active .tab-text {
  color: #3d3d3d;
}

.tab-active-bar {
  position: absolute;
  bottom: 24rpx;
  left: 50%;
  width: 0;
  height: 6rpx;
  border-radius: 999rpx;
  background: transparent;
  transform: translateX(-50%);
}

.search-mode-tab.active .tab-active-bar {
  width: 80rpx;
  background: linear-gradient(90deg, #ff6b62 0%, #ff3b52 100%);
}

.tab-form-content {
  padding: 34rpx 32rpx 34rpx;
}

.route-select-row {
  display: flex;
  align-items: center;
  gap: 22rpx;
  margin-bottom: 56rpx;
}

.route-city-btn {
  flex: 1;
  min-width: 0;
  height: 92rpx;
  padding: 0 24rpx;
  border-radius: 22rpx;
  background: #f8f8f8;
  display: flex;
  align-items: center;
  justify-content: center;
}

.route-city-name {
  max-width: 100%;
  overflow: hidden;
  color: #3e3e3e;
  font-size: 32rpx;
  font-weight: 800;
  line-height: 1.2;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.route-city-name.placeholder-txt {
  color: #c5c5c5;
  font-weight: 700;
}

.route-swap-btn {
  flex: 0 0 34rpx;
  height: 92rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.route-swap-btn:active {
  transform: scale(0.92);
}

.swap-arrows {
  color: #ff4c59;
  font-size: 36rpx;
  font-weight: 800;
  line-height: 1;
}

.submit-search-btn {
  width: 100%;
  height: 92rpx;
  border-radius: 999rpx;
  background: linear-gradient(90deg, #ff6258 0%, #ff3450 100%);
  color: #ffffff;
  font-size: 32rpx;
  font-weight: 800;
  line-height: 92rpx;
  box-shadow: none;
}

.submit-search-btn:active {
  transform: scale(0.98);
}

.keyword-search-wrap {
  height: 92rpx;
  margin-bottom: 56rpx;
  padding: 0 28rpx;
  border-radius: 22rpx;
  background: #f8f8f8;
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.search-icon-glass {
  flex-shrink: 0;
  position: relative;
  width: 28rpx;
  height: 28rpx;
  border: 4rpx solid #a3a3a3;
  border-radius: 50%;
}

.search-icon-glass::after {
  content: '';
  position: absolute;
  right: -10rpx;
  bottom: -7rpx;
  width: 14rpx;
  height: 4rpx;
  border-radius: 999rpx;
  background: #a3a3a3;
  transform: rotate(45deg);
}

.keyword-input {
  flex: 1;
  height: 92rpx;
  color: #3e3e3e;
  font-size: 28rpx;
}

.home-bottom-list {
  padding-top: 34rpx;
}

.bottom-section-title {
  margin-bottom: 22rpx;
  color: #333333;
  font-size: 32rpx;
  font-weight: 900;
}

.recent-route-card {
  min-height: 142rpx;
  padding: 26rpx 30rpx;
  border-bottom: 1rpx solid #efefef;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.recent-route-card:first-child {
  border-top-left-radius: 22rpx;
  border-top-right-radius: 22rpx;
}

.recent-route-card:last-child {
  border-bottom: 0;
  border-bottom-left-radius: 22rpx;
  border-bottom-right-radius: 22rpx;
}

.recent-route-card:active {
  background: #fafafa;
}

.route-card-left {
  min-width: 0;
  flex: 1;
}

.route-cities-title {
  overflow: hidden;
  color: #333333;
  font-size: 32rpx;
  font-weight: 800;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.route-card-time {
  margin-top: 10rpx;
  color: #9b9b9b;
  font-size: 26rpx;
  line-height: 1.25;
}

.route-card-right {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.route-contact-count {
  color: #6f6f6f;
  font-size: 26rpx;
  font-weight: 600;
}

.arrow-right {
  color: #c6c6c6;
  font-size: 34rpx;
  font-weight: 800;
  line-height: 1;
}

.empty-state-card {
  padding: 40rpx 34rpx;
  border-radius: 22rpx;
  background: #ffffff;
  text-align: center;
}

.empty-title {
  color: #3e3e3e;
  font-size: 30rpx;
  font-weight: 800;
}

.empty-desc {
  margin-top: 12rpx;
  color: #999999;
  font-size: 24rpx;
  line-height: 1.6;
}
</style>
