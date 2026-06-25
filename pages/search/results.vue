<template>
  <view class="page results-page">
    <!-- Top Search Header Input -->
    <view class="search-header-wrap">
      <view class="search-input-box">
        <view class="search-glass-icon"></view>
        <input
          class="header-search-input"
          v-model="keywordInput"
          placeholder="输入关键词搜索承运商"
          placeholder-style="color:#94a3b8"
          @confirm="onSearchConfirm"
        />
      </view>
      <button class="primary-btn search-confirm-btn" @click="onSearchConfirm">搜索</button>
    </view>

    <!-- Route summary banner below header -->
    <view class="route-details-banner">
      <view v-if="isKeywordSearch" class="route-text-line">
        <text class="route-point">按承运商关键词查询</text>
      </view>
      <view v-else class="route-text-line">
        <text class="route-point">{{ query.originCityName || '全国' }}</text>
        <text class="route-connector-arrow">⇄</text>
        <text class="route-point">{{ query.destinationCityName || '全国' }}</text>
      </view>
    </view>

    <!-- Pills sub-filters (大板 vs 全程小板) -->
    <view class="sub-filter-pills-row">
      <view
        class="sub-filter-pill"
        :class="{ active: selectedRouteTypes.includes('LARGE_TRUCK') }"
        @click="toggleRouteType('LARGE_TRUCK')"
      >
        <text class="sub-filter-check"></text>
        <text>大板运输</text>
      </view>
      <view
        class="sub-filter-pill"
        :class="{ active: selectedRouteTypes.includes('SMALL_TRUCK') }"
        @click="toggleRouteType('SMALL_TRUCK')"
      >
        <text class="sub-filter-check"></text>
        <text>全程小板</text>
      </view>
      <view
        class="sub-filter-pill"
        :class="{ active: selectedRouteTypes.includes('DRIVING') }"
        @click="toggleRouteType('DRIVING')"
      >
        <text class="sub-filter-check"></text>
        <text>代驾</text>
      </view>
    </view>

    <!-- Carrier count summary -->
    <view class="carrier-count-summary" v-if="!loading && filteredItems.length > 0">
      已筛选出 {{ filteredItems.length }} 家{{ isKeywordSearch ? '承运商' : '承运线路' }}
    </view>

    <!-- Empty State -->
    <view v-if="!loading && filteredItems.length === 0" class="empty-results-v2">
      <view class="empty-content">
        <text class="empty-title">暂无匹配的承运商</text>
        <text class="empty-action-desc">建议更换起始城市、目的地或关键词后重新查询。</text>
      </view>
    </view>

    <!-- Carrier List Cards -->
    <block v-else-if="!loading">
      <view
        v-for="(item, idx) in filteredItems"
        :key="item.carrierRouteId || item.carrierId || idx"
        class="section carrier-card-v2"
      >
        <!-- Top Row: Name, rating, tags -->
        <view class="carrier-card-header">
          <view class="carrier-title-block">
            <view class="carrier-name-title-row">
              <text class="carrier-company-name">{{ item.carrierName }}</text>
              <view class="carrier-badges-row">
                <image
                  class="carrier-verify-icon"
                  src="/static/carrier_verifycation_icon.svg"
                  mode="aspectFit"
                />
                <view class="carrier-service-badge">
                  <image
                    class="carrier-badge-icon"
                    src="/static/carrier_on_time_service_icon.svg"
                    mode="aspectFit"
                  />
                  <text class="carrier-badge-text">限时达</text>
                </view>
                <view class="carrier-service-badge">
                  <image
                    class="carrier-badge-icon"
                    src="/static/carrier_insure_money_icon.svg"
                    mode="aspectFit"
                  />
                  <text class="carrier-badge-text">{{ item.depositText }}</text>
                </view>
              </view>
            </view>
            <view class="carrier-intro-link" @click="showCarrierIntro(item)">
              <text class="carrier-intro-icon">介</text>
              <text class="carrier-intro-text">承运商介绍</text>
              <text class="carrier-intro-arrow">›</text>
            </view>
          </view>
        </view>

        <!-- Detailed services billing rows -->
        <view class="carrier-services-block">
          <view class="service-price-row" v-for="(srv, sIdx) in item.services" :key="sIdx">
            <text class="service-name-label">{{ srv.name }}</text>
            <view class="service-meta-right">
              <text v-if="srv.time" class="service-time-lbl">约最快 {{ srv.time }} 送达</text>
              <text
                v-if="srv.price"
                class="service-price-val"
                :class="{ highlight: srv.price !== '电话议价' }"
              >
                {{ srv.price }}
              </text>
            </view>
          </view>
        </view>

        <view class="carrier-actions-block">
          <button class="secondary-btn contact-action-btn" @click="contact(item)">电话联系</button>
          <button class="primary-btn create-order-action-btn" @click="createOrder(item)">
            发起订单
          </button>
        </view>
      </view>
    </block>

    <view v-if="loading" class="loading-box">
      <dealer-icon class="loading-spinner" name="hourglass" size="lg" color="#f97316" />
      <text class="loading-text">正在全网帮您寻找承运商...</text>
    </view>

    <view v-if="introPanelVisible" class="intro-panel-mask" @click="closeCarrierIntro">
      <view class="intro-panel" @click.stop>
        <view class="intro-panel-handle"></view>
        <view class="intro-panel-header">
          <text class="intro-panel-title">{{ activeCarrierName || '承运商介绍' }}</text>
          <text class="intro-panel-close" @click="closeCarrierIntro">×</text>
        </view>
        <scroll-view scroll-y class="intro-panel-content">
          <view v-if="introLoading" class="intro-loading">加载中...</view>
          <block v-else>
            <view class="intro-block">
              <text class="intro-block-title">介绍说明</text>
              <text class="intro-panel-text">{{ activeCarrierIntro || '暂无' }}</text>
            </view>
            <view class="intro-block">
              <text class="intro-block-title">联系地址</text>
              <view v-if="activeCarrierAddresses.length === 0" class="intro-empty-address">
                该承运商暂未公开联系地址
              </view>
              <view
                v-for="(address, index) in activeCarrierAddresses"
                :key="address.id || index"
                class="intro-address-card"
              >
                <view class="intro-address-head">
                  <text class="intro-address-name">{{ addressName(address, index) }}</text>
                  <text class="intro-address-city">{{ address.cityName || '' }}</text>
                </view>
                <text class="intro-address-detail">{{ address.addressDetail }}</text>
                <text class="intro-address-phone">电话：{{ address.contactPhone }}</text>
                <view class="intro-address-actions">
                  <button class="intro-address-btn" @click="openAddressLocation(address)">
                    地图查看
                  </button>
                  <button class="intro-address-btn" @click="copyAddress(address)">复制地址</button>
                  <button class="intro-address-btn primary" @click="callAddressPhone(address)">
                    拨打电话
                  </button>
                </view>
              </view>
            </view>
          </block>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script>
import { api, decodeQuery } from '../../utils/api.js';
import { ensureDealerReady } from '../../utils/navigation.js';
import { transportModeText } from '../../utils/format.js';

export default {
  data() {
    return {
      query: {},
      keywordInput: '',
      items: [],
      loading: false,
      selectedRouteTypes: ['LARGE_TRUCK', 'SMALL_TRUCK', 'DRIVING'],
      transportModeText,
      introPanelVisible: false,
      introLoading: false,
      activeCarrierName: '',
      activeCarrierIntro: '',
      activeCarrierAddresses: [],
    };
  },
  computed: {
    isKeywordSearch() {
      return Boolean((this.query.keyword || '').trim());
    },
    filteredItems() {
      return this.items.filter((item) => {
        if (this.selectedRouteTypes.length === 0) return false;
        if (this.isCarrierOnlyResult(item)) {
          return (item.routeTypes || []).some((routeType) => this.selectedRouteTypes.includes(routeType));
        }
        return this.selectedRouteTypes.includes(item.routeType);
      });
    },
  },
  async onLoad(options) {
    this.query = decodeQuery(options);
    this.keywordInput = this.query.keyword || '';
    if (await ensureDealerReady()) {
      this.load();
    }
  },
  methods: {
    hasRouteSearchParams() {
      return Boolean(this.query.originCityId && this.query.destinationCityId);
    },
    async load() {
      const keyword = this.keywordInput.trim();
      if (!keyword && !this.hasRouteSearchParams()) {
        uni.showToast({ title: '关键词不能为空', icon: 'none' });
        return;
      }
      this.keywordInput = keyword;
      this.loading = true;
      try {
        const baseParams = {
          ...this.query,
          keyword,
          page: 1,
          pageSize: 20,
        };
        const requests =
          keyword || !this.hasRouteSearchParams()
            ? [api.searchCarriers(baseParams)]
            : ['LARGE_TRUCK', 'SMALL_TRUCK', 'DRIVING'].map((transportMode) =>
                api.searchCarriers({ ...baseParams, transportMode }),
              );
        const results = await Promise.all(requests);

        const seen = new Set();
        const rawItems = results
          .flatMap((data) => data.items || [])
          .filter((item) => {
            const key = this.isCarrierOnlyResult(item)
              ? `carrier-${item.carrierId}`
              : item.carrierRouteId || `${item.carrierId}-${item.routeType}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        this.items = rawItems.map((item) => {
          const routeTypeNames = {
            LARGE_TRUCK: '大板运输',
            SMALL_TRUCK: '全程小板',
            DRIVING: '代驾',
          };
          const isCarrierOnly = this.isCarrierOnlyResult(item);
          const services = isCarrierOnly
            ? [
                {
                  name: '可承运',
                  price: (item.routeTypes || [])
                    .map((routeType) => routeTypeNames[routeType] || routeType)
                    .filter(Boolean)
                    .join('、'),
                  time: '',
                },
              ]
            : [
                {
                  name: routeTypeNames[item.routeType] || '承运服务',
                  price: item.priceText || '电话议价',
                  time: item.durationText || '',
                },
              ];

          return {
            ...item,
            services,
            depositText: this.formatDepositText(item.depositBalanceCent),
          };
        });
      } finally {
        this.loading = false;
      }
    },
    isCarrierOnlyResult(item) {
      return item?.resultType === 'CARRIER' || (!item?.carrierRouteId && Array.isArray(item?.routeTypes));
    },
    onSearchConfirm() {
      const keyword = this.keywordInput.trim();
      if (!keyword && !this.hasRouteSearchParams()) {
        this.keywordInput = '';
        uni.showToast({ title: '关键词不能为空', icon: 'none' });
        return;
      }
      if (keyword) {
        this.query = { keyword };
      } else {
        this.query.keyword = '';
      }
      this.keywordInput = keyword;
      this.load();
    },
    toggleRouteType(routeType) {
      if (this.selectedRouteTypes.includes(routeType)) {
        if (this.selectedRouteTypes.length === 1) {
          uni.showToast({ title: '至少选择一种运输方式', icon: 'none' });
          return;
        }
        this.selectedRouteTypes = this.selectedRouteTypes.filter((item) => item !== routeType);
        return;
      }
      this.selectedRouteTypes = [...this.selectedRouteTypes, routeType];
    },
    formatDepositText(depositBalanceCent) {
      const yuan = Math.floor(Number(depositBalanceCent || 0) / 100);
      if (yuan <= 0) return '0k';
      const thousands = Math.floor(yuan / 1000);
      if (thousands <= 0) return '<1k';
      return `${thousands}k+`;
    },
    async showCarrierIntro(item) {
      this.activeCarrierName = item.carrierName || '承运商介绍';
      const intro = (item.introduction || '').trim();
      this.activeCarrierIntro = intro || '暂无';
      this.activeCarrierAddresses = [];
      this.introPanelVisible = true;
      this.introLoading = true;
      try {
        const profile = await api.carrierPublicProfile(item.carrierId);
        this.activeCarrierName = profile.carrierName || this.activeCarrierName;
        this.activeCarrierIntro = (profile.introduction || '').trim() || '暂无';
        this.activeCarrierAddresses = profile.contactAddresses || [];
      } catch (error) {
        console.error('获取承运商介绍失败:', error);
      } finally {
        this.introLoading = false;
      }
    },
    closeCarrierIntro() {
      this.introPanelVisible = false;
      this.introLoading = false;
    },
    addressName(address, index) {
      return address.addressName || address.addressPoiName || `联系地址 ${index + 1}`;
    },
    openAddressLocation(address) {
      if (!address.longitude || !address.latitude) {
        uni.showToast({ title: '该地址缺少地图坐标', icon: 'none' });
        return;
      }
      uni.openLocation({
        latitude: Number(address.latitude),
        longitude: Number(address.longitude),
        name: this.addressName(address, 0),
        address: address.addressDetail || address.addressPoiName || '',
      });
    },
    copyAddress(address) {
      const text = [address.provinceName, address.cityName, address.districtName, address.addressDetail]
        .filter(Boolean)
        .join('');
      uni.setClipboardData({ data: text || address.addressDetail || '' });
    },
    callAddressPhone(address) {
      if (!address.contactPhone) {
        uni.showToast({ title: '该地址未填写联系电话', icon: 'none' });
        return;
      }
      uni.makePhoneCall({ phoneNumber: address.contactPhone });
    },
    async contact(item) {
      const data = await api.revealCarrierPhone({
        carrierId: item.carrierId,
        routeId: item.routeId,
        carrierRouteId: item.carrierRouteId,
        searchCondition: this.query,
      });
      uni.makePhoneCall({ phoneNumber: data.phone });
    },
    createOrder(item) {
      const defaultRouteType = this.isCarrierOnlyResult(item)
        ? (item.routeTypes || []).find((routeType) => this.selectedRouteTypes.includes(routeType)) ||
          item.routeTypes?.[0] ||
          ''
        : item.routeType;
      const payload = encodeURIComponent(
        JSON.stringify({
          ...item,
          routeType: defaultRouteType,
          searchCondition: this.query,
        }),
      );
      uni.navigateTo({ url: `/pages/order/create?carrier=${payload}` });
    },
  },
};
</script>

<style>
.results-page {
  padding: 0rpx;
  background-color: transparent;
}

/* Header search row */
.search-header-wrap {
  display: flex;
  align-items: center;
  gap: 14rpx;
  padding: 22rpx 24rpx;
  background: #ffffff;
  border-bottom: 0;
}

.search-input-box {
  flex: 1;
  height: 76rpx;
  border-radius: 999rpx;
  border: 1rpx solid #efeff1;
  background: #f8f8f8;
  display: flex;
  align-items: center;
  padding: 0 24rpx;
  gap: 12rpx;
}

.search-glass-icon {
  flex-shrink: 0;
  position: relative;
  width: 26rpx;
  height: 26rpx;
  border: 4rpx solid #94a3b8;
  border-radius: 50%;
}

.search-glass-icon::after {
  content: '';
  position: absolute;
  right: -10rpx;
  bottom: -7rpx;
  width: 14rpx;
  height: 4rpx;
  border-radius: 999rpx;
  background: #94a3b8;
  transform: rotate(45deg);
}

.header-search-input {
  width: 100%;
  height: 100%;
  font-size: 26rpx;
  color: var(--text-main);
}

.search-confirm-btn {
  min-width: 126rpx !important;
  min-height: 76rpx !important;
  font-size: 26rpx !important;
  padding: 0 28rpx !important;
  border-radius: 999rpx !important;
  background: var(--primary-gradient) !important;
  color: #ffffff !important;
  box-shadow: 0 4rpx 10rpx rgba(249, 115, 22, 0.15) !important;
}

/* Route Details filter title bar */
.route-details-banner {
  padding: 22rpx 28rpx;
  background: #ffffff;
  display: flex;
  align-items: center;
  border-top: 1rpx solid #f1f2f4;
  border-bottom: 1rpx solid #f1f2f4;
}

.route-text-line {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.route-point {
  font-size: 27rpx;
  font-weight: 800;
  color: var(--primary-color);
}

.route-connector-arrow {
  font-size: 24rpx;
  color: var(--primary-color);
  font-weight: 800;
}

/* Sub-filter options */
.sub-filter-pills-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 20rpx 24rpx 12rpx;
  background: #f7f8fa;
}

.sub-filter-pill {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 24rpx;
  font-weight: 800;
  line-height: 1;
  color: #5f6673;
  background: #ffffff;
  padding: 13rpx 22rpx;
  border-radius: 999rpx;
  border: 1rpx solid #e5e7eb;
  transition: all 0.2s ease;
  cursor: pointer;
}

.sub-filter-pill.active {
  color: var(--primary-color);
  background: #fff4f2;
  border-color: var(--primary-color);
}

.sub-filter-check {
  position: relative;
  width: 18rpx;
  height: 18rpx;
  box-sizing: border-box;
  border-radius: 50%;
  border: 2rpx solid #c4c9d2;
  background: #ffffff;
  flex-shrink: 0;
}

.sub-filter-pill.active .sub-filter-check {
  border-color: var(--primary-color);
  background: var(--primary-color);
}

.sub-filter-pill.active .sub-filter-check::after {
  content: '';
  position: absolute;
  left: 4rpx;
  top: 2rpx;
  width: 6rpx;
  height: 9rpx;
  border-right: 2rpx solid #ffffff;
  border-bottom: 2rpx solid #ffffff;
  transform: rotate(45deg);
}

/* Counts */
.carrier-count-summary {
  font-size: 23rpx;
  color: var(--text-weak);
  padding: 10rpx 28rpx 16rpx;
  font-weight: 800;
  background: #f7f8fa;
}

/* Empty state styling */
.empty-results-v2 {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  min-height: 420rpx;
  padding: 112rpx 40rpx 0;
}

.empty-visual {
  display: none;
  align-items: center;
  justify-content: center;
  width: 160rpx;
  height: 160rpx;
  border-radius: 80rpx;
  margin-bottom: 24rpx;
  background: #f1f5f9;
  color: var(--text-weak);
  font-size: 54rpx;
}

.empty-title {
  font-size: 30rpx;
  font-weight: 800;
  color: var(--text-main);
  margin-bottom: 8rpx;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18rpx;
  text-align: center;
}

.empty-action-desc {
  font-size: 22rpx;
  color: var(--text-weak);
}

/* Premium V2 Carrier Card */
.carrier-card-v2 {
  padding: 0rpx;
  overflow: hidden;
  margin: 0 20rpx 24rpx;
  border-radius: var(--radius-lg);
  box-shadow: 0 10rpx 28rpx rgba(41, 25, 21, 0.045);
  border: 1rpx solid rgba(255, 255, 255, 0.9);
}

.carrier-card-header {
  padding: 28rpx 28rpx 20rpx;
  border-bottom: 0;
  background: #ffffff;
}

.carrier-title-block {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.carrier-name-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
}

.carrier-company-name {
  flex: 1;
  min-width: 0;
  font-size: 31rpx;
  font-weight: 900;
  color: var(--text-main);
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.carrier-badges-row {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8rpx;
  max-width: 280rpx;
}

.carrier-verify-icon {
  width: 38rpx;
  height: 38rpx;
  flex-shrink: 0;
}

.carrier-service-badge {
  height: 38rpx;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 0 10rpx 0 8rpx;
  border-radius: 999rpx;
  border: 1rpx solid #e5e7eb;
  background: #ffffff;
}

.carrier-badge-icon {
  width: 26rpx;
  height: 26rpx;
  flex-shrink: 0;
}

.carrier-badge-text {
  color: #30343b;
  font-size: 19rpx;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
}

.carrier-intro-link {
  align-self: flex-start;
  min-height: 46rpx;
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 0 18rpx;
  border-radius: 24rpx;
  background: #f8f8f8;
  color: #666666;
}

.carrier-intro-link:active {
  background: #eef2f7;
}

.carrier-intro-icon {
  width: 28rpx;
  height: 28rpx;
  border-radius: 6rpx;
  border: 1.5rpx solid #ff4d4f;
  color: #ff4d4f;
  font-size: 18rpx;
  font-weight: 800;
  line-height: 28rpx;
  text-align: center;
}

.carrier-intro-text {
  color: #5b6472;
  font-size: 24rpx;
  font-weight: 700;
  line-height: 1;
}

.carrier-intro-arrow {
  color: #9ca3af;
  font-size: 34rpx;
  line-height: 1;
}

.mini-tag {
  min-height: 36rpx !important;
  font-size: 18rpx !important;
  padding: 0 10rpx !important;
  border-radius: 6rpx !important;
  line-height: 1.5;
}

/* Services rows block */
.carrier-services-block {
  padding: 22rpx 28rpx;
  background: #f8f9fb;
  border-top: 1rpx solid #f5f5f5;
  border-bottom: 1rpx solid #f5f5f5;
}

.service-price-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 26rpx;
}

.service-name-label {
  color: #4d4d4d;
  font-weight: 900;
}

.service-meta-right {
  display: flex;
  align-items: center;
  gap: 18rpx;
  min-width: 0;
}

.service-time-lbl {
  font-size: 22rpx;
  color: var(--text-weak);
  font-weight: 500;
  white-space: nowrap;
}

.service-price-val {
  font-size: 26rpx;
  font-weight: 800;
  color: var(--text-weak);
  white-space: nowrap;
}

.service-price-val.highlight {
  color: var(--primary-color);
  font-size: 30rpx;
}

/* Actions block - split grid layout */
.carrier-actions-block {
  display: flex;
  justify-content: flex-end;
  gap: 16rpx;
  padding: 22rpx 28rpx 26rpx;
  background: #ffffff;
}

.contact-action-btn {
  min-width: 156rpx !important;
  min-height: 64rpx !important;
  line-height: 64rpx !important;
  font-size: 24rpx !important;
  border-radius: 999rpx !important;
  border: 0 !important;
  color: var(--primary-color) !important;
  background: var(--primary-light) !important;
  box-shadow: none !important;
  font-weight: 800 !important;
  padding: 0 24rpx !important;
}

.contact-action-btn:active {
  background: #ffedd5 !important;
}

.create-order-action-btn {
  min-width: 170rpx !important;
  min-height: 64rpx !important;
  line-height: 64rpx !important;
  font-size: 24rpx !important;
  border-radius: 999rpx !important;
  background: var(--primary-gradient) !important;
  color: #ffffff !important;
  box-shadow: 0 8rpx 16rpx rgba(255, 77, 85, 0.15) !important;
  font-weight: 800 !important;
  padding: 0 26rpx !important;
}

.create-order-action-btn:active {
  box-shadow: 0 2rpx 8rpx rgba(249, 115, 22, 0.1) !important;
}

/* Loading box styling */
.loading-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 140rpx 40rpx;
  color: var(--text-weak);
  gap: 24rpx;
}

.loading-spinner {
  animation: bounce 1.2s infinite ease-in-out;
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-16rpx);
  }
}

.loading-text {
  font-size: 24rpx;
  font-weight: 600;
}

.intro-panel-mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  background: rgba(15, 23, 42, 0.42);
}

.intro-panel {
  width: 100%;
  max-height: 72vh;
  box-sizing: border-box;
  padding: 16rpx 32rpx 40rpx;
  border-radius: 28rpx 28rpx 0 0;
  background: #ffffff;
}

.intro-panel-handle {
  width: 72rpx;
  height: 8rpx;
  margin: 0 auto 22rpx;
  border-radius: 4rpx;
  background: #e5e7eb;
}

.intro-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #f1f5f9;
}

.intro-panel-title {
  flex: 1;
  min-width: 0;
  color: var(--text-main);
  font-size: 30rpx;
  font-weight: 800;
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.intro-panel-close {
  width: 54rpx;
  height: 54rpx;
  border-radius: 27rpx;
  background: #f8fafc;
  color: #64748b;
  font-size: 40rpx;
  line-height: 50rpx;
  text-align: center;
}

.intro-panel-content {
  max-height: 52vh;
  padding-top: 24rpx;
}

.intro-loading {
  padding: 48rpx 0;
  color: #64748b;
  font-size: 25rpx;
  text-align: center;
}

.intro-block + .intro-block {
  margin-top: 28rpx;
}

.intro-block-title {
  display: block;
  margin-bottom: 14rpx;
  color: #111827;
  font-size: 26rpx;
  font-weight: 900;
}

.intro-panel-text {
  display: block;
  color: #374151;
  font-size: 26rpx;
  line-height: 1.75;
  white-space: pre-wrap;
}

.intro-empty-address {
  padding: 24rpx;
  border-radius: 12rpx;
  background: #f8fafc;
  color: #64748b;
  font-size: 24rpx;
}

.intro-address-card {
  padding: 22rpx;
  border: 1rpx solid #eef2f7;
  border-radius: 12rpx;
  background: #ffffff;
  box-shadow: 0 4rpx 14rpx rgba(15, 23, 42, 0.04);
}

.intro-address-card + .intro-address-card {
  margin-top: 18rpx;
}

.intro-address-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 8rpx;
}

.intro-address-name {
  flex: 1;
  min-width: 0;
  color: #111827;
  font-size: 27rpx;
  font-weight: 900;
  line-height: 1.35;
}

.intro-address-city {
  flex-shrink: 0;
  color: var(--primary-color);
  font-size: 23rpx;
}

.intro-address-detail,
.intro-address-phone {
  display: block;
  color: #64748b;
  font-size: 24rpx;
  line-height: 1.55;
}

.intro-address-actions {
  display: flex;
  gap: 12rpx;
  margin-top: 18rpx;
}

.intro-address-btn {
  flex: 1;
  min-width: 0;
  height: 58rpx;
  margin: 0;
  padding: 0 8rpx;
  border: 1rpx solid #fed7aa;
  border-radius: 999rpx;
  background: #fff7ed;
  color: var(--primary-color);
  font-size: 22rpx;
  font-weight: 800;
  line-height: 58rpx;
}

.intro-address-btn.primary {
  border-color: var(--primary-color);
  background: var(--primary-gradient);
  color: #ffffff;
}
</style>
