<template>
  <view class="page order-list-page">
    <!-- Scrolling Tab Bar -->
    <scroll-view scroll-x class="tabs-scroll-container" :show-scrollbar="false">
      <view class="tabs-wrapper-v2">
        <view
          v-for="item in tabs"
          :key="item.value"
          class="tab-item-v2"
          :class="{ active: activeStatus === item.value }"
          @click="changeStatus(item.value)"
        >
          <text class="tab-label-v2">{{ item.label }}</text>
          <view class="tab-underline-v2" v-if="activeStatus === item.value"></view>
        </view>
      </view>
    </scroll-view>

    <view v-if="!isLoggedIn" class="guest-prompt-card order-guest-card">
      <text class="guest-prompt-icon">!</text>
      <view class="guest-prompt-main">
        <view class="guest-prompt-title one-line">当前还未登录</view>
        <view class="guest-prompt-desc one-line">登录后可查看订单和履约进度</view>
      </view>
      <button class="primary-btn guest-prompt-action" @click="goLogin">立即登录</button>
    </view>

    <!-- Empty State -->
    <view v-else-if="!loading && orders.length === 0" class="section empty-orders-card-v2">
      <view class="empty-visual-v2">
        <dealer-icon name="package-open" size="xl" color="#f97316" />
      </view>
      <text class="empty-text-v2">您当前暂无该状态下的订单</text>
      <text class="empty-subtext-v2">前往首页搜索承运商，即可立即发起托运订单</text>
    </view>

    <!-- Order Cards -->
    <block v-else-if="isLoggedIn">
      <view
        v-for="order in orders"
        :key="order.id"
        class="section order-list-card-v2"
        @click="goDetail(order.id)"
      >
        <!-- Card Top Bar: Carrier name and status badge -->
        <view class="order-card-header-v2">
          <view class="carrier-name-block-v2">
            <image class="carrier-icon-v2" src="/static/order_carrier_icon.svg" mode="aspectFit" />
            <text class="carrier-company-name-v2 font-bold">{{
              order.carrierName || '承运商'
            }}</text>
          </view>
          <!-- Status tag -->
          <text class="order-status-badge-v2" :class="statusClass(order.orderStatus)">
            {{ orderStatusText[order.orderStatus] }}
          </text>
        </view>

        <!-- Card details meta: Order no and tags -->
        <view class="order-meta-details-row">
          <text class="order-no-text font-mono">订单号：{{ order.orderNo }}</text>
          <text class="status-tag status-info mini-tag-v2">{{
            transportModeText[order.transportMode] || '运输'
          }}</text>
        </view>

        <!-- Card Route details -->
        <view class="order-card-route-v2">
          <view class="route-connector-line-v2"></view>
          <view class="route-point-block-v2">
            <view class="route-point-row">
              <text class="route-bullet origin">起</text>
              <text class="route-city-lbl">{{ order.originCityName }}</text>
              <text class="subtle-addr">({{ order.originProvinceName }})</text>
            </view>
            <view class="route-service-row">
              <text class="service-tag" :class="{ active: order.hasPickupService }">
                {{ order.hasPickupService ? '需提车' : '不提车' }}
              </text>
              <text class="service-address one-line" v-if="order.hasPickupService">
                {{ formatServiceAddress(order, 'origin') }}
              </text>
            </view>
          </view>
          <view class="route-point-block-v2">
            <view class="route-point-row">
              <text class="route-bullet destination">终</text>
              <text class="route-city-lbl">{{ order.destinationCityName }}</text>
              <text class="subtle-addr">({{ order.destinationProvinceName }})</text>
            </view>
            <view class="route-service-row">
              <text class="service-tag" :class="{ active: order.hasDeliveryService }">
                {{ order.hasDeliveryService ? '需送车' : '不送车' }}
              </text>
              <text class="service-address one-line" v-if="order.hasDeliveryService">
                {{ formatServiceAddress(order, 'destination') }}
              </text>
            </view>
          </view>
        </view>

        <!-- Card Bottom Details: Price and time -->
        <view class="order-card-cost-row">
          <view class="order-time-display"> 创建于：{{ dateText(order.createdAt) }} </view>

          <view class="order-price-display-v2 text-right">
            <view class="price-line-v2">
              <text class="price-symbol-v2">运费：</text>
              <text class="price-val-v2 font-bold">{{ yuanVal(order.orderAmountCent) }}</text>
              <text class="price-unit-v2"> 元</text>
            </view>
          </view>
        </view>

        <view v-if="orderTimingTip(order)" class="order-timing-tip-v2">
          {{ orderTimingTip(order) }}
        </view>

        <!-- Interactive buttons row based on status -->
        <view class="order-card-actions-v2" @click.stop="">
          <!-- Status: PENDING_CONFIRM -->
          <block v-if="order.orderStatus === 'PENDING_CONFIRM'">
            <button class="secondary-btn card-action-btn-v2" @click="contactCarrier(order)">
              联系承运商
            </button>
            <button class="primary-btn card-action-btn-v2" @click="goDetail(order.id)">
              订单信息确认
            </button>
          </block>

          <!-- Status: PENDING_PICKUP -->
          <block v-else-if="order.orderStatus === 'PENDING_PICKUP'">
            <button class="secondary-btn card-action-btn-v2" @click="goDetail(order.id)">
              查看订单详情
            </button>
            <button class="primary-btn card-action-btn-v2" @click="goDrivers(order.id)">
              司机信息
            </button>
          </block>

          <!-- Status: IN_TRANSIT -->
          <block v-else-if="order.orderStatus === 'IN_TRANSIT'">
            <button class="secondary-btn card-action-btn-v2" @click="goTransitTrack(order.id)">
              查看在途位置
            </button>
            <button class="secondary-btn card-action-btn-v2" @click="goDetail(order.id)">
              查看订单详情
            </button>
          </block>

          <!-- Status: PENDING_RECEIPT -->
          <block v-else-if="order.orderStatus === 'PENDING_RECEIPT'">
            <button class="secondary-btn card-action-btn-v2" @click="goDetail(order.id)">
              查看订单详情
            </button>
            <button class="primary-btn card-action-btn-v2" @click="confirmReceipt(order)">
              确认收车
            </button>
          </block>

          <!-- Status: COMPLETED, PENDING_PAYMENT, CANCELED -->
          <block v-else>
            <button class="secondary-btn card-action-btn-v2 width-full" @click="goDetail(order.id)">
              查看订单详情
            </button>
          </block>
        </view>
      </view>
    </block>
    <miniapp-login-sheet ref="loginSheet" @success="handleLoginSuccess" />
  </view>
</template>

<script>
import { api, getToken, openLoginPrompt } from '../../utils/api.js';
import MiniappLoginSheet from '../../components/miniapp-login-sheet/miniapp-login-sheet.vue';
import {
  dateText,
  orderStatusText,
  statusClass,
  transportModeText,
  yuanText,
} from '../../utils/format.js';

const PENDING_ORDER_DETAIL_KEY = 'dealer_pending_order_detail';

export default {
  components: {
    MiniappLoginSheet,
  },
  data() {
    return {
      activeStatus: '',
      isLoggedIn: false,
      loading: false,
      orders: [],
      orderStatusText,
      transportModeText,
      tabs: [
        { label: '全部', value: '' },
        { label: '待支付', value: 'PENDING_PAYMENT' },
        { label: '待确认', value: 'PENDING_CONFIRM' },
        { label: '待提车', value: 'PENDING_PICKUP' },
        { label: '运输中', value: 'IN_TRANSIT' },
        { label: '待收车', value: 'PENDING_RECEIPT' },
        { label: '已完成', value: 'COMPLETED' },
        { label: '取消中', value: 'CANCEL_PENDING' },
        { label: '已取消', value: 'CANCELED' },
      ],
    };
  },
  async onShow() {
    this.isLoggedIn = !!getToken();
    if (this.isLoggedIn) {
      await this.load();
      this.openPendingOrderDetail();
    } else {
      this.orders = [];
      this.loading = false;
    }
  },
  methods: {
    dateText(dateStr) {
      if (!dateStr) return '';
      // Format as YYYY-MM-DD HH:mm
      const d = new Date(dateStr);
      const yr = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const dy = String(d.getDate()).padStart(2, '0');
      const hr = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return `${yr}-${mo}-${dy} ${hr}:${min}`;
    },
    yuanVal(cent) {
      if (!cent && cent !== 0) return '0.00';
      return (cent / 100).toFixed(2);
    },
    yuanText,
    statusClass,
    orderTimingTip(order) {
      if (order.orderStatus === 'PENDING_CONFIRM' && order.carrierConfirmDeadlineAt) {
        return `承运商需在 ${this.dateText(order.carrierConfirmDeadlineAt)} 前确认`;
      }
      if (order.orderStatus === 'PENDING_RECEIPT' && order.autoReceiptAt) {
        return `未主动确认时，系统将在 ${this.dateText(order.autoReceiptAt)} 自动确认收车`;
      }
      return '';
    },
    formatServiceAddress(order, type) {
      const prefix = type === 'origin' ? 'origin' : 'destination';
      return [
        order[`${prefix}ProvinceName`],
        order[`${prefix}CityName`],
        order[`${prefix}DistrictName`],
        order[`${prefix}AddressDetail`],
      ]
        .filter(Boolean)
        .join('');
    },
    async load() {
      if (!this.isLoggedIn) return;
      this.loading = true;
      try {
        const data = await api.orders({ orderStatus: this.activeStatus }, { authRedirect: false });
        const rawOrders = data.orders || data.items || [];
        this.orders = rawOrders;
      } catch (error) {
        if (error?.statusCode === 401) {
          this.isLoggedIn = false;
          this.orders = [];
        }
      } finally {
        this.loading = false;
      }
    },
    changeStatus(status) {
      this.activeStatus = status;
      if (this.isLoggedIn) this.load();
    },
    goLogin() {
      // #ifdef MP-WEIXIN
      this.$refs.loginSheet?.open('查看订单');
      return;
      // #endif
      openLoginPrompt({ actionText: '查看订单' });
    },
    async handleLoginSuccess() {
      this.isLoggedIn = true;
      await this.load();
      this.openPendingOrderDetail();
    },
    goDetail(orderId) {
      uni.navigateTo({ url: `/pages/order/detail?orderId=${orderId}` });
    },
    goTransitTrack(orderId) {
      uni.navigateTo({ url: `/pages/order/transit-track?orderId=${orderId}` });
    },
    openPendingOrderDetail() {
      const rawPending = uni.getStorageSync(PENDING_ORDER_DETAIL_KEY);
      if (!rawPending) return;

      uni.removeStorageSync(PENDING_ORDER_DETAIL_KEY);
      let pending = null;
      try {
        pending = typeof rawPending === 'string' ? JSON.parse(rawPending) : rawPending;
      } catch (error) {
        pending = null;
      }

      if (!pending?.orderId) return;
      const query = pending.paymentSuccess ? '&paymentSuccess=1' : '';
      uni.navigateTo({ url: `/pages/order/detail?orderId=${pending.orderId}${query}` });
    },
    async contactCarrier(order) {
      uni.navigateTo({ url: `/pages/order/detail?orderId=${order.id}` });
    },
    goDrivers(orderId) {
      uni.navigateTo({ url: `/pages/order/drivers?orderId=${orderId}` });
    },
    async confirmReceipt(order) {
      uni.showModal({
        title: '确认收车',
        content: '您确定已经线下支付完运费并安全收到车辆了吗？确认后担保服务将完成结案。',
        confirmColor: '#f97316',
        confirmText: '确认收车',
        cancelText: '再看看',
        success: async (res) => {
          if (res.confirm) {
            await api.confirmReceipt(order.id);
            uni.showToast({ title: '已确认收车', icon: 'success' });
            this.load();
          }
        },
      });
    },
  },
};
</script>

<style>
.order-list-page {
  padding: 96rpx 0 0;
  background-color: transparent;
}

/* #ifdef H5 */
.order-list-page {
  padding-top: calc(96rpx + env(safe-area-inset-top));
}
/* #endif */

.order-guest-card {
  position: fixed;
  left: 24rpx;
  right: 24rpx;
  top: 120rpx;
  z-index: 120;
  margin: 0;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

/* #ifdef H5 */
.order-guest-card {
  top: calc(208rpx + env(safe-area-inset-top));
}
/* #endif */

.order-guest-card .guest-prompt-main {
  min-width: 0;
}

.order-guest-card .one-line {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Custom scrolling tab bar V2 styles */
.tabs-scroll-container {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  z-index: 110;
  background: #ffffff;
  border-bottom: 1rpx solid #f1f5f9;
  box-shadow: 0 4rpx 16rpx rgba(31, 35, 41, 0.03);
  white-space: nowrap;
}

/* #ifdef H5 */
.tabs-scroll-container {
  top: calc(88rpx + env(safe-area-inset-top));
}
/* #endif */

.tabs-wrapper-v2 {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  height: 96rpx;
  min-width: 100%;
  padding: 0 18rpx;
  box-sizing: border-box;
}

.tab-item-v2 {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  min-width: 116rpx;
  height: 100%;
  position: relative;
  padding: 0 10rpx;
  box-sizing: border-box;
  cursor: pointer;
}

.tab-label-v2 {
  font-size: 26rpx;
  color: var(--text-weak);
  font-weight: 700;
  white-space: nowrap;
  transition: all 0.25s ease;
}

.tab-underline-v2 {
  position: absolute;
  bottom: 0;
  width: 44rpx;
  height: 6rpx;
  background-color: var(--primary-color);
  border-radius: 4rpx;
}

.tab-item-v2.active .tab-label-v2 {
  color: var(--text-main);
  font-size: 28rpx;
}

/* Empty State V2 */
.empty-orders-card-v2 {
  padding: 140rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  border-radius: var(--radius-lg);
  border: 1rpx solid var(--border-color);
}

.empty-visual-v2 {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 140rpx;
  height: 140rpx;
  border-radius: 70rpx;
  background: #f1f5f9;
  color: var(--text-weak);
  font-size: 54rpx;
  margin-bottom: 24rpx;
}

.empty-text-v2 {
  font-size: 28rpx;
  font-weight: 800;
  color: var(--text-weak);
}

.empty-subtext-v2 {
  font-size: 22rpx;
  color: var(--text-weak);
  margin-top: 10rpx;
}

/* V2 Order List Card layout */
.order-list-card-v2 {
  padding: 32rpx;
  margin: 24rpx;
  box-shadow: var(--shadow-sm);
  border: 1rpx solid rgba(226, 232, 240, 0.7);
  position: relative;
  background: #ffffff;
  border-radius: var(--radius-lg);
  transition: all 0.2s ease;
}

.order-list-card-v2:active {
  background-color: #f8fafc;
}

.order-card-header-v2 {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.carrier-name-block-v2 {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.carrier-icon-v2 {
  width: 34rpx;
  height: 34rpx;
  flex-shrink: 0;
}

.carrier-company-name-v2 {
  font-size: 28rpx;
  color: var(--text-main);
}

.order-status-badge-v2 {
  font-size: 24rpx;
  font-weight: 800;
  color: var(--primary-color);
}

/* Status colors map */
.order-status-badge-v2.warning {
  color: var(--warning-color);
}
.order-status-badge-v2.info {
  color: var(--info-color);
}
.order-status-badge-v2.success {
  color: var(--success-color);
}
.order-status-badge-v2.danger {
  color: var(--danger-color);
}

.order-meta-details-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-top: 12rpx;
  border-bottom: 1rpx solid #f1f5f9;
  padding-bottom: 16rpx;
}

.order-no-text {
  font-size: 20rpx;
  color: var(--text-weak);
}

.mini-tag-v2 {
  min-height: 36rpx !important;
  font-size: 16rpx !important;
  padding: 0 10rpx !important;
  border-radius: 6rpx !important;
  line-height: 1.4;
}

/* Route details */
.order-card-route-v2 {
  padding: 28rpx 0;
  display: flex;
  flex-direction: column;
  gap: 0;
  position: relative;
  border-bottom: 1rpx dashed #f1f5f9;
}

.route-point-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.route-point-block-v2 {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.route-point-block-v2 + .route-point-block-v2 {
  margin-top: 28rpx;
}

.route-bullet {
  width: 36rpx;
  height: 36rpx;
  border-radius: 8rpx;
  color: #ffffff;
  font-size: 20rpx;
  font-weight: 800;
  line-height: 36rpx;
  text-align: center;
  flex-shrink: 0;
  position: relative;
  z-index: 2;
}

.route-bullet.origin {
  background: linear-gradient(135deg, #fb923c, var(--primary-color));
}

.route-bullet.destination {
  background: linear-gradient(135deg, #fb7185, #ef4444);
}

.route-city-lbl {
  font-size: 28rpx;
  font-weight: 800;
  color: var(--text-main);
}

.subtle-addr {
  color: var(--text-weak);
  font-size: 24rpx;
}

.route-connector-line-v2 {
  width: 2rpx;
  position: absolute;
  left: 17rpx;
  top: 62rpx;
  height: 78rpx;
  background: #fed7aa;
  border-radius: 2rpx;
  z-index: 1;
}

.route-service-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  min-width: 0;
  padding-left: 48rpx;
}

.service-tag {
  flex-shrink: 0;
  min-width: 86rpx;
  padding: 4rpx 10rpx;
  border-radius: 6rpx;
  background: #f3f4f6;
  color: #9ca3af;
  font-size: 20rpx;
  font-weight: 750;
  text-align: center;
}

.service-tag.active {
  background: var(--primary-light);
  color: var(--primary-color);
}

.service-address {
  flex: 1;
  min-width: 0;
  color: #4b5563;
  font-size: 22rpx;
}

.one-line {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Cost & details bottom row */
.order-card-cost-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 24rpx 0;
}

.order-time-display {
  font-size: 22rpx;
  color: var(--text-weak);
}

.price-line-v2 {
  display: flex;
  align-items: baseline;
  justify-content: flex-end;
}

.price-symbol-v2 {
  font-size: 22rpx;
  color: var(--text-main);
  font-weight: 600;
}

.price-val-v2 {
  font-size: 34rpx;
  color: var(--text-main);
}

.price-unit-v2 {
  color: var(--text-main);
  font-size: 24rpx;
  font-weight: 700;
}

.price-subtext-v2 {
  font-size: 20rpx;
  color: var(--text-weak);
  margin-top: 4rpx;
}

.order-timing-tip-v2 {
  margin: 0 0 22rpx;
  padding: 14rpx 18rpx;
  border-radius: 8rpx;
  background: #fff7ed;
  color: #c2410c;
  font-size: 22rpx;
  line-height: 1.45;
  word-break: break-all;
}

/* Card Actions button block */
.order-card-actions-v2 {
  display: flex;
  justify-content: flex-end;
  gap: 16rpx;
}

.card-action-btn-v2 {
  min-height: 68rpx !important;
  font-size: 24rpx !important;
  padding: 0 32rpx !important;
  border-radius: 34rpx !important;
  font-weight: 800 !important;
  margin: 0 !important;
  box-shadow: none !important;
  border-width: 1.5rpx !important;
}

.secondary-btn.card-action-btn-v2 {
  border-color: var(--primary-color) !important;
  color: var(--primary-color) !important;
  background: #ffffff !important;
}

.secondary-btn.card-action-btn-v2:active {
  background: var(--primary-light) !important;
}

.primary-btn.card-action-btn-v2 {
  background: var(--primary-gradient) !important;
  color: #ffffff !important;
}

.primary-btn.card-action-btn-v2:active {
  box-shadow: 0 2rpx 8rpx rgba(249, 115, 22, 0.15) !important;
}

.width-full {
  width: 100%;
}
</style>
