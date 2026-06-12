<template>
  <view class="page drivers-page">
    <view class="section order-summary-card">
      <view class="section-title">订单信息</view>
      <view class="summary-route">
        <text class="summary-city">{{ order.originCityName || '-' }}</text>
        <text class="summary-arrow">→</text>
        <text class="summary-city">{{ order.destinationCityName || '-' }}</text>
      </view>
      <view class="summary-no">订单号：{{ order.orderNo || '-' }}</view>
    </view>

    <view v-if="pickupDriver" class="section driver-card">
      <view class="section-title">提车司机</view>
      <view class="driver-info-list">
        <view class="driver-row">
          <text class="driver-label">司机姓名</text>
          <text class="driver-value">{{ pickupDriver.driverName || '-' }}</text>
        </view>
        <view class="driver-row">
          <text class="driver-label">联系电话</text>
          <text class="driver-value font-mono">{{ pickupDriver.driverPhone || '-' }}</text>
        </view>
        <view class="driver-row">
          <text class="driver-label">车辆牌照</text>
          <text class="driver-value font-mono">{{ pickupDriver.licensePlate || '-' }}</text>
        </view>
        <view class="driver-row">
          <text class="driver-label">身份证号</text>
          <text class="driver-value font-mono">{{ pickupDriver.idNumber || '-' }}</text>
        </view>
      </view>
    </view>

    <view v-if="deliveryDriver" class="section driver-card">
      <view class="section-title">交车司机</view>
      <view class="driver-info-list">
        <view class="driver-row">
          <text class="driver-label">司机姓名</text>
          <text class="driver-value">{{ deliveryDriver.driverName || '-' }}</text>
        </view>
        <view class="driver-row">
          <text class="driver-label">联系电话</text>
          <text class="driver-value font-mono">{{ deliveryDriver.driverPhone || '-' }}</text>
        </view>
        <view class="driver-row">
          <text class="driver-label">车辆牌照</text>
          <text class="driver-value font-mono">{{ deliveryDriver.licensePlate || '-' }}</text>
        </view>
        <view class="driver-row">
          <text class="driver-label">身份证号</text>
          <text class="driver-value font-mono">{{ deliveryDriver.idNumber || '-' }}</text>
        </view>
      </view>
    </view>

    <view v-if="pageReady && !pickupDriver && !deliveryDriver" class="section driver-empty-page">
      <text>承运商暂未设置司机信息</text>
    </view>
  </view>
</template>

<script>
import { api, requireLogin } from '../../utils/api.js';

export default {
  data() {
    return {
      orderId: '',
      order: {},
      pageReady: false,
    };
  },
  computed: {
    pickupDriver() {
      return this.order.driverInfo || null;
    },
    deliveryDriver() {
      return this.order.deliveryDriverInfo || null;
    },
  },
  onLoad(options) {
    if (!requireLogin()) return;
    this.orderId = options.orderId;
    this.load();
  },
  methods: {
    async load() {
      const data = await api.orderDetail(this.orderId);
      this.order = data.order || {};
      this.pageReady = true;
    },
  },
};
</script>

<style>
.drivers-page {
  padding: 30rpx;
  background-color: transparent;
}

.order-summary-card,
.driver-card {
  background: #ffffff;
}

.summary-route {
  display: flex;
  align-items: center;
  gap: 18rpx;
  margin-top: 18rpx;
}

.summary-city {
  color: #111827;
  font-size: 30rpx;
  font-weight: 800;
}

.summary-arrow {
  color: var(--primary-color);
  font-size: 28rpx;
  font-weight: 800;
}

.summary-no {
  margin-top: 12rpx;
  color: var(--text-weak);
  font-size: 22rpx;
}

.driver-info-list {
  display: flex;
  flex-direction: column;
  gap: 22rpx;
}

.driver-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24rpx;
  font-size: 26rpx;
}

.driver-label {
  flex-shrink: 0;
  color: #4b5563;
}

.driver-value {
  color: #111827;
  font-weight: 650;
  text-align: right;
  line-height: 1.45;
}

.font-mono {
  font-family: monospace;
}

.driver-empty-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 220rpx;
  color: var(--text-weak);
  font-size: 24rpx;
  background: #ffffff;
}
</style>
