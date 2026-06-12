<template>
  <view v-if="visible" class="region-picker-wrapper">
    <!-- Mask -->
    <view class="picker-mask" :class="{ 'fade-in': animating }" @click="close"></view>

    <!-- Drawer -->
    <view class="picker-drawer" :class="{ 'slide-up': animating }">
      <!-- Header -->
      <view class="picker-header">
        <text class="picker-title">{{ title }}</text>
        <view class="picker-close" @click="close">×</view>
      </view>

      <view class="picker-search">
        <view class="search-box">
          <view class="search-icon"></view>
          <input
            class="search-input"
            :value="searchKeyword"
            placeholder="搜索省、市名称"
            placeholder-class="search-placeholder"
            confirm-type="search"
            @input="onSearchInput"
          />
          <view v-if="searchKeyword" class="search-clear" @click="clearSearch">×</view>
        </view>
      </view>

      <!-- Nav Tabs -->
      <view v-if="!normalizedKeyword" class="picker-tabs">
        <view
          class="picker-tab"
          :class="{ active: activeTab === 'province' }"
          @click="switchTab('province')"
        >
          {{ selectedProvince ? selectedProvince.regionName : '选择省份' }}
        </view>
        <view
          v-if="selectedProvince"
          class="picker-tab"
          :class="{ active: activeTab === 'city' }"
          @click="switchTab('city')"
        >
          {{ selectedCity ? selectedCity.regionName : '选择城市' }}
        </view>
      </view>

      <!-- List View -->
      <scroll-view scroll-y class="picker-list">
        <view v-if="currentLoading" class="picker-loading">
          <view class="spinner"></view>
          <text>加载中...</text>
        </view>

        <block v-else>
          <view
            v-for="item in currentList"
            :key="item.itemKey"
            class="picker-item"
            :class="{ selected: isSelected(item) }"
            @click="selectItem(item)"
          >
            <view class="picker-item-main">
              <text>{{ item.regionName }}</text>
              <text v-if="item.itemType === 'city'" class="picker-item-desc">
                {{ getProvinceName(item.parentId) }}
              </text>
            </view>
            <text v-if="isSelected(item)" class="check-icon">✓</text>
          </view>
          <view v-if="currentList.length === 0" class="picker-empty">
            {{ normalizedKeyword ? '未找到匹配的省市' : '暂无地区数据' }}
          </view>
        </block>
      </scroll-view>
    </view>
  </view>
</template>

<script>
import { api } from '../../utils/api.js';

export default {
  name: 'RegionPicker',
  props: {
    title: {
      type: String,
      default: '选择地区',
    },
  },
  data() {
    return {
      visible: false,
      animating: false,
      loading: false,
      searchLoading: false,
      activeTab: 'province', // 'province' | 'city'
      searchKeyword: '',
      provinces: [],
      cities: [],
      allCities: [],
      allCitiesLoaded: false,
      selectedProvince: null,
      selectedCity: null,
    };
  },
  computed: {
    normalizedKeyword() {
      return this.normalizeKeyword(this.searchKeyword);
    },
    provinceMap() {
      return this.provinces.reduce((map, province) => {
        map[String(province.id)] = province;
        return map;
      }, {});
    },
    searchResults() {
      const keyword = this.normalizedKeyword;
      if (!keyword) return [];

      const matchedProvinces = this.provinces
        .filter((province) => this.regionMatches(province, keyword))
        .map((province) => this.decorateItem(province, 'province'));
      const matchedCities = this.allCities
        .filter(
          (city) =>
            this.regionMatches(city, keyword) ||
            this.regionMatches(this.provinceMap[String(city.parentId)], keyword),
        )
        .map((city) => this.decorateItem(city, 'city'));

      return [...matchedProvinces, ...matchedCities];
    },
    currentList() {
      if (this.normalizedKeyword) return this.searchResults;
      const list = this.activeTab === 'province' ? this.provinces : this.cities;
      return list.map((item) => this.decorateItem(item, this.activeTab));
    },
    currentLoading() {
      return this.loading || this.searchLoading;
    },
  },
  methods: {
    open() {
      this.activeTab = 'province';
      this.searchKeyword = '';
      this.selectedProvince = null;
      this.selectedCity = null;
      this.cities = [];
      this.visible = true;
      this.$nextTick(() => {
        setTimeout(() => {
          this.animating = true;
        }, 50);
      });
      if (this.provinces.length === 0) {
        this.loadProvinces();
      }
    },
    close() {
      this.animating = false;
      setTimeout(() => {
        this.visible = false;
      }, 300);
    },
    switchTab(tab) {
      if (tab === 'city' && !this.selectedProvince) return;
      this.activeTab = tab;
    },
    async loadProvinces() {
      this.loading = true;
      try {
        const res = await api.regions(null, 'PROVINCE');
        this.provinces = res.items || [];
      } catch (err) {
        this.showRegionLoadError(err, '加载地区失败');
      } finally {
        this.loading = false;
      }
    },
    async loadCities(provinceId) {
      this.loading = true;
      try {
        const res = await api.regions(provinceId, 'CITY');
        this.cities = res.items || [];
      } catch (err) {
        this.showRegionLoadError(err, '加载城市失败');
      } finally {
        this.loading = false;
      }
    },
    async loadAllCities() {
      if (this.allCitiesLoaded) return;
      this.searchLoading = true;
      try {
        if (this.provinces.length === 0) {
          await this.loadProvinces();
        }
        const res = await api.regions(null, 'CITY');
        this.allCities = res.items || [];
        this.allCitiesLoaded = true;
      } catch (err) {
        this.showRegionLoadError(err, '加载城市失败');
      } finally {
        this.searchLoading = false;
      }
    },
    showRegionLoadError(err, fallback) {
      const title = err?.statusCode === 401 ? '请先登录后再选择地区' : err?.message || fallback;
      uni.showToast({ title, icon: 'none' });
    },
    onSearchInput(event) {
      this.searchKeyword = event.detail.value || '';
      if (this.normalizedKeyword && !this.allCitiesLoaded) {
        this.loadAllCities();
      }
    },
    clearSearch() {
      this.searchKeyword = '';
    },
    normalizeKeyword(value) {
      return String(value || '')
        .trim()
        .toLowerCase();
    },
    regionMatches(region, keyword) {
      if (!region) return false;
      return this.normalizeKeyword(region.regionName).includes(keyword);
    },
    decorateItem(item, itemType) {
      return {
        ...item,
        itemType,
        itemKey: `${itemType}-${item.id}`,
      };
    },
    getProvinceName(provinceId) {
      return this.provinceMap[String(provinceId)]?.regionName || '';
    },
    isSelected(item) {
      const type = item.itemType || this.activeTab;
      if (type === 'province') {
        return this.selectedProvince && this.selectedProvince.id === item.id;
      }
      return this.selectedCity && this.selectedCity.id === item.id;
    },
    async selectItem(item) {
      if ((item.itemType || this.activeTab) === 'province') {
        this.selectedProvince = item;
        this.selectedCity = null;
        this.cities = [];
        this.searchKeyword = '';
        this.activeTab = 'city';
        await this.loadCities(item.id);
      } else {
        const province =
          this.selectedProvince?.id === item.parentId
            ? this.selectedProvince
            : this.provinceMap[String(item.parentId)];
        if (!province) {
          uni.showToast({ title: '未找到所属省份', icon: 'none' });
          return;
        }
        this.selectedProvince = province;
        this.selectedCity = item;
        this.$emit('select', {
          provinceId: this.selectedProvince.id,
          provinceName: this.selectedProvince.regionName,
          cityId: item.id,
          cityName: item.regionName,
          longitude: item.longitude || '',
          latitude: item.latitude || '',
        });
        this.close();
      }
    },
  },
};
</script>

<style>
.region-picker-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
}

.picker-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.picker-mask.fade-in {
  opacity: 1;
}

.picker-drawer {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 60vh;
  background: #ffffff;
  border-radius: 32rpx 32rpx 0 0;
  display: flex;
  flex-direction: column;
  transform: translateY(100%);
  transition: transform 0.3s cubic-bezier(0.1, 0.76, 0.55, 0.94);
  box-shadow: 0 -8rpx 30rpx rgba(0, 0, 0, 0.08);
}

.picker-drawer.slide-up {
  transform: translateY(0);
}

.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx 40rpx;
  border-bottom: 1rpx solid #f3f4f6;
}

.picker-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #111827;
}

.picker-close {
  font-size: 48rpx;
  color: #9ca3af;
  line-height: 1;
  padding: 10rpx;
}

.picker-search {
  padding: 20rpx 40rpx;
  border-bottom: 1rpx solid #f3f4f6;
}

.search-box {
  display: flex;
  align-items: center;
  min-height: 72rpx;
  padding: 0 24rpx;
  border-radius: 12rpx;
  background: #f8fafc;
  border: 1rpx solid #e5e7eb;
}

.search-icon {
  flex-shrink: 0;
  position: relative;
  width: 24rpx;
  height: 24rpx;
  margin-right: 12rpx;
  border: 3rpx solid #9ca3af;
  border-radius: 50%;
}

.search-icon::after {
  content: '';
  position: absolute;
  right: -9rpx;
  bottom: -7rpx;
  width: 12rpx;
  height: 3rpx;
  border-radius: 2rpx;
  background: #9ca3af;
  transform: rotate(45deg);
}

.search-input {
  flex: 1;
  min-width: 0;
  height: 72rpx;
  color: #111827;
  font-size: 26rpx;
  line-height: 72rpx;
}

.search-placeholder {
  color: #9ca3af;
}

.search-clear {
  flex-shrink: 0;
  width: 44rpx;
  height: 44rpx;
  margin-left: 12rpx;
  border-radius: 50%;
  background: #e5e7eb;
  color: #6b7280;
  font-size: 34rpx;
  line-height: 40rpx;
  text-align: center;
}

.picker-tabs {
  display: flex;
  gap: 40rpx;
  padding: 0 40rpx;
  border-bottom: 1rpx solid #f3f4f6;
}

.picker-tab {
  padding: 24rpx 0;
  font-size: 28rpx;
  color: #4b5563;
  font-weight: 500;
  position: relative;
}

.picker-tab.active {
  color: #f97316;
  font-weight: bold;
}

.picker-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4rpx;
  background: #f97316;
  border-radius: 2rpx;
}

.picker-list {
  flex: 1;
  overflow: hidden;
  padding: 16rpx 0;
}

.picker-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 40rpx;
  font-size: 28rpx;
  color: #111827;
  transition: background-color 0.2s ease;
}

.picker-item:active {
  background-color: #f9fafb;
}

.picker-item.selected {
  color: #f97316;
  font-weight: 600;
}

.picker-item-main {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 8rpx;
}

.picker-item-desc {
  color: #9ca3af;
  font-size: 22rpx;
  font-weight: 400;
}

.check-icon {
  color: #f97316;
  font-weight: bold;
}

.picker-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
  color: #9ca3af;
  gap: 16rpx;
  font-size: 26rpx;
}

.spinner {
  width: 48rpx;
  height: 48rpx;
  border: 4rpx solid #f3f4f6;
  border-top-color: #f97316;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.picker-empty {
  padding: 80rpx;
  text-align: center;
  color: #9ca3af;
  font-size: 26rpx;
}
</style>
