<template>
  <view v-if="visible" class="address-picker-layer">
    <view class="address-picker-mask" @click="close"></view>
    <view class="address-picker-panel">
      <view class="address-picker-header">
        <view>
          <view class="address-picker-title">{{ title }}</view>
          <view class="address-picker-city">{{ provinceName }} {{ cityName }}</view>
        </view>
        <view class="address-picker-close" @click="close">×</view>
      </view>

      <view class="address-search-row">
        <view class="address-search-box">
          <input
            class="address-search-input"
            v-model="keyword"
            confirm-type="search"
            :placeholder="placeholder"
            placeholder-style="color:#9ca3af"
            @input="onKeywordInput"
            @confirm="searchAddress"
          />
          <scroll-view v-if="showSuggestions" scroll-y class="address-suggestion-list">
            <view
              v-for="item in results"
              :key="item.id || item.name + item.address"
              class="address-suggestion-item"
              @click.stop="selectAddressResult(item)"
              @tap.stop="selectAddressResult(item)"
            >
              <view class="address-result-name">{{ item.name }}</view>
              <view class="address-result-desc">{{ item.address }}</view>
            </view>
          </scroll-view>
        </view>
        <button class="address-search-btn" :loading="searching" @click="searchAddress">搜索</button>
      </view>

      <map
        class="address-map"
        :latitude="mapState.latitude"
        :longitude="mapState.longitude"
        :scale="mapState.scale"
        :markers="mapMarkers"
        :show-location="false"
        @tap="onMapTap"
      />

      <view class="address-picker-actions">
        <button class="secondary-btn address-action-btn" @click="close">取消</button>
        <button class="primary-btn address-action-btn" @click="confirm">确认地址</button>
      </view>
    </view>
  </view>
</template>

<script>
import { api } from '../../utils/api.js';

export default {
  name: 'AddressMapPicker',
  props: {
    title: {
      type: String,
      default: '选择详细地址',
    },
    placeholder: {
      type: String,
      default: '搜索园区、道路、公司名称',
    },
  },
  data() {
    return {
      visible: false,
      provinceName: '',
      cityName: '',
      keyword: '',
      searching: false,
      results: [],
      showSuggestions: false,
      searchTimer: null,
      reverseSearching: false,
      selectedAddress: this.emptyAddress(),
      mapState: {
        latitude: 39.90923,
        longitude: 116.397428,
        scale: 13,
      },
    };
  },
  computed: {
    mapMarkers() {
      if (!this.selectedAddress.lng || !this.selectedAddress.lat) return [];
      return [
        {
          id: 1,
          longitude: Number(this.selectedAddress.lng),
          latitude: Number(this.selectedAddress.lat),
          iconPath: '/static/map_marker.svg',
          width: 28,
          height: 36,
        },
      ];
    },
  },
  methods: {
    emptyAddress() {
      return {
        id: '',
        name: '',
        address: '',
        provinceName: '',
        cityName: '',
        lng: '',
        lat: '',
        districtName: '',
        districtId: '',
      };
    },
    open(options = {}) {
      this.provinceName = options.provinceName || '';
      this.cityName = options.cityName || '';
      this.keyword = options.keyword || options.name || options.address || '';
      this.results = [];
      this.showSuggestions = false;
      this.selectedAddress = {
        ...this.emptyAddress(),
        id: options.id || '',
        name: options.name || '',
        address: options.address || '',
        provinceName: options.provinceName || '',
        cityName: options.cityName || '',
        lng: options.lng || '',
        lat: options.lat || '',
        districtName: options.districtName || '',
        districtId: options.districtId || '',
      };
      this.visible = true;
      if (this.searchTimer) {
        clearTimeout(this.searchTimer);
        this.searchTimer = null;
      }
      this.$nextTick(() => {
        this.initMap();
      });
    },
    close() {
      this.showSuggestions = false;
      this.visible = false;
    },
    async initMap() {
      if (this.selectedAddress.lng && this.selectedAddress.lat) {
        this.setMapPoint({
          lng: this.selectedAddress.lng,
          lat: this.selectedAddress.lat,
          scale: 16,
        });
        return;
      }
      const cityKeyword = this.cityName || this.provinceName;
      const cityResults = await this.searchPoiAddresses(cityKeyword, { pageSize: 1, silent: true });
      if (cityResults.length) {
        this.setMapPoint({ lng: cityResults[0].lng, lat: cityResults[0].lat, scale: 12 });
      }
    },
    searchPoiAddresses(keyword, options = {}) {
      const normalizedKeyword = (keyword || '').trim();
      if (!normalizedKeyword) return Promise.resolve([]);
      return api
        .amapPoiSearch({
          keywords: normalizedKeyword,
          city: this.cityName || '',
          pageSize: options.pageSize || 10,
        })
        .then((data) => {
          const items = Array.isArray(data.items) ? data.items : [];
          if (!items.length && !options.silent) {
            uni.showToast({ title: '未找到相关地址', icon: 'none' });
          }
          return items.map((item) => this.normalizePoiAddress(item));
        })
        .catch(() => []);
    },
    reverseGeocodeAddress(lng, lat) {
      if (!lng || !lat) return Promise.resolve(null);
      return api
        .amapRegeo({ lng, lat })
        .then((data) => (data.item ? this.normalizePoiAddress(data.item) : null))
        .catch(() => null);
    },
    normalizePoiAddress(item) {
      const provinceName = this.normalizeRegionName(item.provinceName || this.provinceName);
      const cityName = this.normalizeRegionName(item.cityName || this.cityName);
      const districtName = this.normalizeRegionName(item.districtName || '');
      const address = String(item.rawAddress || item.address || '').trim();
      return {
        id: item.id,
        name: item.name || address,
        address,
        provinceName,
        cityName,
        districtName,
        districtId: item.districtId || '',
        lng: item.lng,
        lat: item.lat,
      };
    },
    normalizeRegionName(name) {
      return Array.isArray(name) ? name.filter(Boolean).join('') : String(name || '').trim();
    },
    setMapPoint({ lng, lat, scale = 16 }) {
      if (!lng || !lat) return;
      this.mapState = {
        longitude: Number(lng),
        latitude: Number(lat),
        scale,
      };
    },
    onKeywordInput() {
      if (this.searchTimer) clearTimeout(this.searchTimer);
      const keyword = this.keyword.trim();
      if (!keyword) {
        this.results = [];
        this.showSuggestions = false;
        return;
      }
      this.searchTimer = setTimeout(() => {
        this.searchAddress({ silent: true });
      }, 350);
    },
    async searchAddress(options = {}) {
      const keyword = this.keyword.trim();
      if (!keyword) {
        uni.showToast({ title: '请输入搜索关键词', icon: 'none' });
        return;
      }
      this.searching = true;
      const results = await this.searchPoiAddresses(keyword, options);
      this.searching = false;
      this.results = results;
      this.showSuggestions = results.length > 0;
    },
    selectAddressResult(item) {
      this.selectedAddress = { ...item };
      this.keyword = item.name;
      this.showSuggestions = false;
      this.setMapPoint({ lng: item.lng, lat: item.lat, scale: 16 });
    },
    async onMapTap(e) {
      const lng = e.detail && (e.detail.longitude || e.detail.x);
      const lat = e.detail && (e.detail.latitude || e.detail.y);
      if (!lng || !lat || this.reverseSearching) return;
      this.reverseSearching = true;
      const result = await this.reverseGeocodeAddress(lng, lat);
      this.reverseSearching = false;
      if (!result) {
        uni.showToast({ title: '未解析到当前位置地址', icon: 'none' });
        return;
      }
      this.selectAddressResult(result);
    },
    confirm() {
      const name = (this.selectedAddress.name || '').trim();
      if (!name) {
        uni.showToast({ title: '请选择详细地址', icon: 'none' });
        return;
      }
      this.$emit('select', { ...this.selectedAddress });
      this.close();
    },
  },
};
</script>

<style>
.address-picker-layer {
  position: fixed;
  inset: 0;
  z-index: 1200;
}

.address-picker-mask {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.42);
}

.address-picker-panel {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  height: 80vh;
  max-height: 80vh;
  padding: 26rpx 28rpx calc(24rpx + env(safe-area-inset-bottom));
  border-radius: 28rpx 28rpx 0 0;
  background: #ffffff;
  box-sizing: border-box;
}

.address-picker-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24rpx;
  margin-bottom: 20rpx;
}

.address-picker-title {
  color: #111827;
  font-size: 32rpx;
  font-weight: 800;
}

.address-picker-city {
  margin-top: 6rpx;
  color: #6b7280;
  font-size: 23rpx;
}

.address-picker-close {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: #f3f4f6;
  color: #6b7280;
  font-size: 42rpx;
  line-height: 50rpx;
  text-align: center;
}

.address-search-row {
  position: relative;
  z-index: 4;
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 18rpx;
}

.address-search-box {
  position: relative;
  flex: 1;
  min-width: 0;
}

.address-search-input {
  width: 100%;
  height: 72rpx;
  padding: 0 22rpx;
  border: 1rpx solid #e5e7eb;
  border-radius: 12rpx;
  background: #f9fafb;
  color: #111827;
  font-size: 26rpx;
  box-sizing: border-box;
}

.address-suggestion-list {
  position: absolute;
  top: 82rpx;
  left: 0;
  right: 0;
  z-index: 6;
  max-height: 360rpx;
  overflow: hidden;
  border: 1rpx solid #e5e7eb;
  border-radius: 14rpx;
  background: #ffffff;
  box-shadow: 0 18rpx 38rpx rgba(15, 23, 42, 0.12);
}

.address-suggestion-item {
  padding: 18rpx 20rpx;
  border-bottom: 1rpx solid #f1f5f9;
}

.address-suggestion-item:last-child {
  border-bottom: 0;
}

.address-search-btn {
  width: 132rpx;
  height: 72rpx;
  margin: 0;
  padding: 0;
  border-radius: 12rpx;
  background: var(--primary-color);
  color: #ffffff;
  font-size: 25rpx;
  line-height: 72rpx;
}

.address-map {
  width: 100%;
  flex: 1;
  min-height: 430rpx;
  overflow: hidden;
  border-radius: 14rpx;
  background: #e5e7eb;
}

.address-result-name {
  color: #111827;
  font-size: 27rpx;
  font-weight: 700;
  line-height: 1.35;
}

.address-result-desc {
  margin-top: 6rpx;
  color: #6b7280;
  font-size: 22rpx;
  line-height: 1.4;
}

.address-picker-actions {
  display: flex;
  flex-shrink: 0;
  gap: 14rpx;
  margin-top: 22rpx;
}

.address-action-btn {
  flex: 1;
  height: 78rpx;
  margin: 0;
  border-radius: 14rpx;
  font-size: 27rpx;
  line-height: 78rpx;
}
</style>
