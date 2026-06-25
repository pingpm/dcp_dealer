<template>
  <view class="transit-track-page" v-if="pageReady">
    <view class="map-panel">
      <map
        class="route-map"
        :latitude="mapCenter.latitude"
        :longitude="mapCenter.longitude"
        :scale="mapScale"
        :markers="markers"
        :polyline="mapPolylines"
        :include-points="includePoints"
      />
      <view class="map-summary">
        <view class="summary-main">
          <text class="summary-title">{{ order.carrierName || '承运商' }}</text>
          <text class="summary-sub"
            >{{ order.originCityName }} → {{ order.destinationCityName }}</text
          >
        </view>
        <view class="summary-status" :class="summaryStatusClass">{{ summaryStatusText }}</view>
      </view>

      <view class="transit-sheet" :class="{ expanded: recordsPanelOpen }">
        <view class="sheet-header">
          <view class="sheet-header-main">
            <view class="sheet-title-row">
              <text class="sheet-title">位置上报</text>
              <text class="sheet-count">{{ timelineLocations.length }}条</text>
            </view>
            <text class="sheet-route">
              {{ routeDistanceText }}
              <text v-if="routeDurationText"> · {{ routeDurationText }}</text>
            </text>
          </view>
          <button v-if="canToggleRecords" class="sheet-toggle-btn" @click="toggleRecordsPanel">
            {{ recordsPanelOpen ? '收起' : '查看全部' }}
          </button>
        </view>

        <view class="legend-row compact-legend">
          <view class="legend-item">
            <text class="legend-line traveled"></text>
            <text>已走路线</text>
          </view>
          <view class="legend-item">
            <text class="legend-line remaining"></text>
            <text>未走路线</text>
          </view>
        </view>

        <view v-if="routeError" class="route-error">{{ routeError }}</view>

        <view
          v-if="timelineLocations.length"
          class="records-scroll"
          :class="{ expanded: recordsPanelOpen }"
        >
          <view class="locations-list records-list">
            <view class="location-row" v-for="(loc, idx) in visibleTimelineLocations" :key="idx">
              <view class="location-index" :class="{ latest: idx === 0 }">
                {{ idx + 1 }}
              </view>
              <view class="location-main">
                <view class="location-top">
                  <text class="location-title">{{ loc.cityName || '在途位置' }}</text>
                  <text class="location-time">{{ dateText(loc.createdAt) }}</text>
                </view>
                <text class="location-address">{{ loc.address || '-' }}</text>
                <text v-if="loc.remark" class="location-remark">备注：{{ loc.remark }}</text>
              </view>
            </view>
          </view>
        </view>
        <view v-else class="empty-location">
          承运商还未上报在途位置，路线将按起始地到目的地展示。
        </view>
      </view>
    </view>
  </view>
  <view class="page transit-track-page loading-page" v-else>
    <view class="section empty-location">正在加载在途位置...</view>
    <miniapp-login-sheet ref="loginSheet" @success="handleLoginSuccess" />
  </view>
</template>

<script>
import { miniappLoginPageMixin } from '../../utils/miniapp-login-page.js';
import { api, requireLogin } from '../../utils/api.js';
import { dateText, orderStatusText, statusClass } from '../../utils/format.js';

const TRAVELED_COLOR = '#f97316';
const REMAINING_COLOR = '#3b82f6';

function pointFrom(longitude, latitude) {
  const lng = Number(longitude);
  const lat = Number(latitude);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  return { longitude: lng, latitude: lat };
}

function coordinateParam(point) {
  return `${Number(point.longitude).toFixed(6)},${Number(point.latitude).toFixed(6)}`;
}

function samePoint(a, b) {
  if (!a || !b) return false;
  return (
    Math.abs(Number(a.longitude) - Number(b.longitude)) < 0.000001 &&
    Math.abs(Number(a.latitude) - Number(b.latitude)) < 0.000001
  );
}

function dedupeContinuousPoints(points) {
  return points.reduce((list, point) => {
    if (!point) return list;
    const prev = list[list.length - 1];
    if (!samePoint(prev, point)) list.push(point);
    return list;
  }, []);
}

function nearestIndex(points, target) {
  if (!points.length || !target) return -1;
  let result = 0;
  let minDistance = Number.POSITIVE_INFINITY;
  points.forEach((point, index) => {
    const distance =
      Math.abs(point.longitude - target.longitude) + Math.abs(point.latitude - target.latitude);
    if (distance < minDistance) {
      minDistance = distance;
      result = index;
    }
  });
  return result;
}

export default {
  mixins: [miniappLoginPageMixin],
  data() {
    return {
      orderId: '',
      order: {},
      loadingRoute: false,
      routeError: '',
      routeDistanceMeter: 0,
      routeDurationSecond: 0,
      routePoints: [],
      traveledPoints: [],
      remainingPoints: [],
      pageReady: false,
      recordsPanelOpen: false,
      mapScale: 6,
      mapCenter: {
        latitude: 39.90923,
        longitude: 116.397428,
      },
    };
  },
  computed: {
    originPoint() {
      return pointFrom(this.order.originLongitude, this.order.originLatitude);
    },
    destinationPoint() {
      return pointFrom(this.order.destinationLongitude, this.order.destinationLatitude);
    },
    timelineLocations() {
      return (this.order.transitLocations || [])
        .map((loc) => ({
          ...loc,
          point: pointFrom(loc.longitude, loc.latitude),
        }))
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    },
    canToggleRecords() {
      return this.timelineLocations.length > 2;
    },
    visibleTimelineLocations() {
      return this.recordsPanelOpen ? this.timelineLocations : this.timelineLocations.slice(0, 2);
    },
    chronologicalLocations() {
      return [...this.timelineLocations].reverse();
    },
    routeLocations() {
      return this.chronologicalLocations.filter((loc) => loc.point);
    },
    latestTransitPoint() {
      const latest = this.routeLocations[this.routeLocations.length - 1];
      return latest?.point || this.originPoint;
    },
    includePoints() {
      return [
        this.originPoint,
        this.destinationPoint,
        ...this.routeLocations.map((loc) => loc.point),
      ].filter(Boolean);
    },
    markers() {
      const markers = [];
      if (this.originPoint) {
        markers.push({
          id: 1,
          ...this.originPoint,
          width: 28,
          height: 28,
          iconPath: '/static/map_marker.svg',
          callout: {
            content: `起点 ${this.order.originCityName || ''}`,
            color: '#0f172a',
            fontSize: 12,
            borderRadius: 6,
            padding: 6,
            display: 'ALWAYS',
          },
        });
      }
      if (this.destinationPoint) {
        markers.push({
          id: 2,
          ...this.destinationPoint,
          width: 28,
          height: 28,
          iconPath: '/static/map_marker.svg',
          callout: {
            content: `终点 ${this.order.destinationCityName || ''}`,
            color: '#0f172a',
            fontSize: 12,
            borderRadius: 6,
            padding: 6,
            display: 'ALWAYS',
          },
        });
      }
      this.routeLocations.forEach((loc, index) => {
        markers.push({
          id: 10 + index,
          ...loc.point,
          width: 22,
          height: 22,
          iconPath: '/static/map_marker.svg',
          callout: {
            content: index === this.routeLocations.length - 1 ? '最新位置' : `途径点${index + 1}`,
            color: '#0f172a',
            fontSize: 12,
            borderRadius: 6,
            padding: 6,
            display: index === this.routeLocations.length - 1 ? 'ALWAYS' : 'BYCLICK',
          },
        });
      });
      return markers;
    },
    mapPolylines() {
      const polylines = [];
      if (this.traveledPoints.length > 1) {
        polylines.push({
          points: this.traveledPoints,
          color: TRAVELED_COLOR,
          width: 7,
          arrowLine: true,
        });
      }
      if (this.remainingPoints.length > 1) {
        polylines.push({
          points: this.remainingPoints,
          color: REMAINING_COLOR,
          width: 7,
          arrowLine: true,
        });
      }
      if (!polylines.length && this.originPoint && this.destinationPoint) {
        polylines.push({
          points: [this.originPoint, this.destinationPoint],
          color: REMAINING_COLOR,
          width: 6,
          dottedLine: true,
        });
      }
      return polylines;
    },
    routeDistanceText() {
      if (!this.routeDistanceMeter) return '等待路线规划';
      if (this.routeDistanceMeter >= 1000)
        return `${(this.routeDistanceMeter / 1000).toFixed(1)}公里`;
      return `${this.routeDistanceMeter}米`;
    },
    routeDurationText() {
      if (!this.routeDurationSecond) return '';
      const hours = Math.floor(this.routeDurationSecond / 3600);
      const minutes = Math.round((this.routeDurationSecond % 3600) / 60);
      if (hours > 0) return `约${hours}小时${minutes ? `${minutes}分钟` : ''}`;
      return `约${minutes}分钟`;
    },
    summaryStatusText() {
      const status = this.order.orderStatus;
      return orderStatusText[status] || '在途位置';
    },
    summaryStatusClass() {
      return statusClass(this.order.orderStatus);
    },
  },
  onLoad(options) {
    if (!requireLogin()) return;
    this.orderId = options.orderId || '';
    this.load();
  },
  methods: {
    dateText,
    async load() {
      const data = await api.orderDetail(this.orderId);
      this.order = data.order || {};
      this.pageReady = true;
      this.updateMapCenter();
      await this.buildRoute();
    },
    updateMapCenter() {
      const center = this.latestTransitPoint || this.originPoint || this.destinationPoint;
      if (center) {
        this.mapCenter = {
          latitude: center.latitude,
          longitude: center.longitude,
        };
      }
    },
    splitRouteByLatest(routePoints) {
      const latest = this.latestTransitPoint;
      if (!latest || samePoint(latest, this.originPoint)) {
        this.traveledPoints = [];
        this.remainingPoints = routePoints;
        return;
      }
      const latestIndex = nearestIndex(routePoints, latest);
      if (latestIndex < 0) {
        this.traveledPoints = [];
        this.remainingPoints = routePoints;
        return;
      }
      this.traveledPoints = dedupeContinuousPoints([
        ...routePoints.slice(0, latestIndex + 1),
        latest,
      ]);
      this.remainingPoints = dedupeContinuousPoints([
        latest,
        ...routePoints.slice(latestIndex + 1),
      ]);
    },
    async buildRoute() {
      this.routeError = '';
      this.routeDistanceMeter = 0;
      this.routeDurationSecond = 0;

      if (!this.originPoint || !this.destinationPoint) {
        this.routePoints = this.includePoints;
        this.traveledPoints = [];
        this.remainingPoints = this.includePoints;
        this.routeError = '订单缺少起始地或目的地坐标，暂时无法规划地图路线。';
        return;
      }

      this.loadingRoute = true;
      try {
        const waypointPoints = this.routeLocations.map((loc) => loc.point);
        const result = await api.amapDrivingRoute({
          origin: coordinateParam(this.originPoint),
          destination: coordinateParam(this.destinationPoint),
          waypoints: waypointPoints.map(coordinateParam).join(';'),
        });
        const route = result.route || {};
        const points = dedupeContinuousPoints(route.polyline || []);
        this.routePoints = points.length ? points : this.includePoints;
        this.routeDistanceMeter = Number(route.distanceMeter || 0);
        this.routeDurationSecond = Number(route.durationSecond || 0);
        this.splitRouteByLatest(this.routePoints);
      } catch (error) {
        this.routePoints = this.includePoints;
        this.splitRouteByLatest(this.routePoints);
        this.routeError = error?.message || '路径规划失败，已使用已知坐标展示直线路线。';
      } finally {
        this.loadingRoute = false;
      }
    },
    toggleRecordsPanel() {
      this.recordsPanelOpen = !this.recordsPanelOpen;
    },
  },
};
</script>

<style>
.transit-track-page {
  position: relative;
  height: calc(100vh - var(--window-top, 0px));
  min-height: calc(100vh - var(--window-top, 0px));
  overflow: hidden;
  background: #e5e7eb;
}

.loading-page {
  display: flex;
  align-items: center;
  justify-content: center;
}

.map-panel {
  position: relative;
  height: 100%;
  overflow: hidden;
  background: #e5e7eb;
}

.route-map {
  width: 100%;
  height: 100%;
}

.map-summary {
  position: absolute;
  left: 24rpx;
  right: 24rpx;
  top: 24rpx;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  padding: 22rpx 24rpx;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 8rpx 24rpx rgba(15, 23, 42, 0.08);
}

.summary-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.summary-title {
  color: #0f172a;
  font-size: 30rpx;
  font-weight: 800;
}

.summary-sub {
  color: #64748b;
  font-size: 23rpx;
}

.summary-status {
  flex-shrink: 0;
  padding: 10rpx 16rpx;
  border-radius: 10rpx;
  background: #eff6ff;
  color: #2563eb;
  font-size: 24rpx;
  font-weight: 800;
}

.summary-status.status-success {
  background: #ecfdf5;
  color: #059669;
}

.summary-status.status-warning {
  background: #fffbeb;
  color: #d97706;
}

.summary-status.status-info {
  background: #eff6ff;
  color: #2563eb;
}

.summary-status.status-danger {
  background: #fef2f2;
  color: #dc2626;
}

.transit-sheet {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 3;
  max-height: 46vh;
  display: flex;
  flex-direction: column;
  padding: 26rpx 28rpx calc(20rpx + env(safe-area-inset-bottom));
  border-radius: 34rpx 34rpx 0 0;
  background: rgba(255, 255, 255, 0.97);
  box-shadow: 0 -18rpx 42rpx rgba(15, 23, 42, 0.13);
  transition: max-height 0.24s ease;
}

.transit-sheet.expanded {
  max-height: 72vh;
}

.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.sheet-header-main {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.sheet-title-row {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.sheet-title {
  color: #0f172a;
  font-size: 32rpx;
  font-weight: 900;
}

.sheet-count {
  padding: 4rpx 10rpx;
  border-radius: 999rpx;
  background: #fff7ed;
  color: var(--primary-color);
  font-size: 20rpx;
  font-weight: 800;
}

.sheet-route {
  color: #64748b;
  font-size: 24rpx;
}

.sheet-toggle-btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  height: 58rpx;
  min-height: 58rpx;
  margin: 0;
  padding: 0 22rpx;
  border-radius: 999rpx;
  border: 1rpx solid #fed7aa;
  background: #fff7ed;
  color: var(--primary-color);
  font-size: 24rpx;
  font-weight: 800;
  line-height: 1;
}

.sheet-toggle-btn::after {
  border: 0;
}

.legend-row {
  display: flex;
  gap: 28rpx;
  margin-top: 20rpx;
}

.compact-legend {
  margin-top: 18rpx;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
  color: #475569;
  font-size: 24rpx;
}

.legend-line {
  width: 44rpx;
  height: 8rpx;
  border-radius: 4rpx;
}

.legend-line.traveled {
  background: #f97316;
}

.legend-line.remaining {
  background: #3b82f6;
}

.route-error {
  flex-shrink: 0;
  margin-top: 18rpx;
  padding: 14rpx 18rpx;
  border-radius: var(--radius-sm);
  background: #fffbeb;
  color: #b45309;
  font-size: 24rpx;
  line-height: 1.5;
}

.locations-list {
  display: flex;
  flex-direction: column;
  padding-bottom: 8rpx;
}

.location-row {
  display: flex;
  gap: 18rpx;
  padding-top: 20rpx;
}

.location-index {
  flex-shrink: 0;
  width: 42rpx;
  height: 42rpx;
  border-radius: 50%;
  background: #e2e8f0;
  color: #475569;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22rpx;
  font-weight: 800;
}

.location-index.latest {
  background: var(--primary-color);
  color: #ffffff;
}

.location-main {
  flex: 1;
  min-width: 0;
  padding-bottom: 22rpx;
  border-bottom: 1rpx solid #f1f5f9;
}

.location-main.compact {
  padding-bottom: 0;
  border-bottom: none;
}

.location-row:last-child .location-main {
  padding-bottom: 4rpx;
  border-bottom: none;
}

.location-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.location-title {
  color: #0f172a;
  font-size: 28rpx;
  font-weight: 800;
}

.location-time {
  flex-shrink: 0;
  color: #94a3b8;
  font-size: 22rpx;
}

.location-address {
  display: block;
  margin-top: 8rpx;
  color: #475569;
  font-size: 25rpx;
  line-height: 1.5;
}

.location-remark {
  display: block;
  margin-top: 8rpx;
  color: #64748b;
  font-size: 24rpx;
  line-height: 1.5;
}

.records-scroll {
  flex: 1;
  min-height: 0;
  max-height: 220rpx;
  margin-top: 18rpx;
  padding-top: 2rpx;
  border-top: 1rpx solid #f1f5f9;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.records-scroll.expanded {
  max-height: none;
}

.records-list {
  padding-bottom: 18rpx;
}

.empty-location {
  flex-shrink: 0;
  padding: 36rpx 20rpx 18rpx;
  text-align: center;
  color: #94a3b8;
  font-size: 25rpx;
  line-height: 1.5;
}
</style>
