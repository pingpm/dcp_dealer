<template>
  <view class="page create-order-page">
    <view class="steps-progress-row">
      <view class="step-item active">
        <text class="step-num">1</text>
        <text class="step-lbl">发起订单</text>
      </view>
      <view class="step-line"></view>
      <view class="step-item">
        <text class="step-num">2</text>
        <text class="step-lbl">承运商确认</text>
      </view>
      <view class="step-line"></view>
      <view class="step-item">
        <text class="step-num">3</text>
        <text class="step-lbl">签署合同</text>
      </view>
    </view>

    <view class="section carrier-card">
      <view class="section-title">承运商</view>
      <view class="carrier-name-row">
        <text class="carrier-name">{{ carrierDisplayName }}</text>
        <text v-if="carrierMeta.carrierId" class="subject-type-tag">企业</text>
      </view>
      <view class="subtle">填写订单信息并支付担保交易费后，订单将发送给承运商确认。</view>
    </view>

    <dealer-order-form ref="orderForm" :seed="formSeed" :seed-version="formSeedVersion" />

    <view class="fixed-footer create-footer-bar">
      <button class="primary-btn footer-next-step-btn" :loading="submitting" @click="onNextStep">
        下一步
      </button>
    </view>

    <view
      class="drawer-mask"
      :class="{ show: activeDrawer === 'payment' }"
      @click="closeDrawer"
    ></view>
    <view class="drawer-content" :class="{ show: activeDrawer === 'payment' }">
      <view class="drawer-header">
        <text class="drawer-title">平台增值服务</text>
        <text class="drawer-close" @click="closeDrawer">×</text>
      </view>
      <view class="drawer-body">
        <view class="pay-service-card active">
          <view class="service-card-head">
            <view class="service-title-check">
              <view class="custom-check-box checked">✓</view>
              <text class="service-name-title">平台担保交易</text>
            </view>
            <text class="service-price-yuan">¥{{ totalPayAmountYuan }}</text>
          </view>
          <view class="service-card-details">
            <view
              v-for="item in platformGuaranteeItems"
              :key="item.serviceType"
              class="service-detail-bullet"
            >
              <text class="service-detail-name">{{ item.serviceName }}</text>
              <text v-if="item.description"> {{ item.description }}</text>
              <text
                v-if="item.serviceType === 'LIMITED_TIME_DELIVERY' && agreedDeliveryDateText"
                class="service-date-text"
              >
                约定送达日期：{{ agreedDeliveryDateText }}
              </text>
            </view>
          </view>
        </view>

        <view class="payment-methods-block">
          <view class="payment-section-title">支付方式</view>
          <view class="pay-method-item selected">
            <image class="method-icon" src="/static/wxpay_icon.svg" mode="aspectFit" />
            <view class="method-copy">
              <text class="method-lbl">微信支付</text>
              <text class="method-desc">推荐使用微信收银台完成担保交易服务费支付</text>
            </view>
            <text class="method-selected-badge">已选</text>
          </view>
        </view>

        <view class="payment-agreement-row">
          <view
            class="custom-check-box"
            :class="{ checked: paymentConsent }"
            @click="paymentConsent = !paymentConsent"
          >
            ✓
          </view>
          <text class="agreement-lbl" @click="paymentConsent = !paymentConsent">阅读并同意</text>
          <text class="agreement-link" @click="openGuaranteeAgreement">《担保交易服务协议》</text>
        </view>

        <view class="drawer-action-pay-row">
          <view class="pay-amount-total-block">
            <text class="total-symbol">¥</text>
            <text class="total-val">{{ totalPayAmountYuan }}</text>
          </view>
          <button
            class="primary-btn pay-submit-btn"
            :loading="submitting"
            @click="executeOrderPayment"
          >
            预支付并提交承运商确认
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import DealerOrderForm from '../../components/dealer-order-form/dealer-order-form.vue';
import { api, getSession, requestWechatPayment, setSession } from '../../utils/api.js';
import { ensureDealerReady } from '../../utils/navigation.js';

function blankRoute() {
  return {
    provinceId: '',
    provinceName: '',
    cityId: '',
    cityName: '',
    districtId: '',
    districtName: '',
    addressPoiName: '',
    addressDetail: '',
    longitude: '',
    latitude: '',
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function seedFromProfile(profile = {}, user = {}) {
  return {
    orderAmountYuan: '',
    agreedDate: '',
    form: {
      transportMode: 'LARGE_TRUCK',
      customerSubject: {
        subjectType: 'ENTERPRISE',
        subjectName: profile.companyName || '',
        subjectPhone: profile.registeredPhone || user.registeredPhone || '',
      },
      origin: blankRoute(),
      destination: blankRoute(),
      hasPickupService: true,
      hasDeliveryService: false,
      sender: { name: '', phone: '' },
      receiver: { name: '', phone: '' },
      vehicles: [],
      hasInvoice: false,
      hasInsurance: false,
      insuranceRemark: '',
    },
  };
}

export default {
  components: { DealerOrderForm },
  data() {
    const session = getSession();
    return {
      activeDrawer: '',
      carrier: {},
      carrierMeta: {
        carrierId: '',
        carrierPhone: '',
        routeId: '',
        carrierRouteId: '',
      },
      formSeed: seedFromProfile(session?.profile || {}, session?.user || {}),
      formSeedVersion: 0,
      platformGuaranteeService: {
        serviceType: 'GUARANTEE',
        serviceName: '平台担保交易',
        priceCent: 0,
      },
      platformGuaranteeItems: [],
      submitting: false,
      paymentConsent: true,
      agreedDeliveryDateText: '',
    };
  },
  computed: {
    carrierDisplayName() {
      if (this.carrierMeta.carrierId) return this.carrier.carrierName || '承运商';
      if (this.carrierMeta.carrierPhone) return `未入驻承运商 ${this.carrierMeta.carrierPhone}`;
      return '待选择承运商';
    },
    totalPayAmountYuan() {
      return ((this.platformGuaranteeService.priceCent || 0) / 100).toFixed(2);
    },
  },
  async onLoad(options) {
    if (!(await ensureDealerReady())) return;
    await this.loadLatestDealerProfile();
    this.applyCarrierSeed(options);
    await this.loadPlatformGuaranteeService();
  },
  methods: {
    async loadLatestDealerProfile() {
      try {
        const latestSession = await api.me({ authRedirect: false });
        const currentSession = getSession() || {};
        if (latestSession.user) {
          setSession({
            ...currentSession,
            ...latestSession,
            token: currentSession.token,
          });
        }
        this.formSeed = seedFromProfile(latestSession.profile || {}, latestSession.user || {});
        this.formSeedVersion += 1;
      } catch (error) {}
    },
    applyCarrierSeed(options = {}) {
      if (!options.carrier) return;
      this.carrier = JSON.parse(decodeURIComponent(options.carrier));
      const search = this.carrier.searchCondition || {};
      const seed = JSON.parse(JSON.stringify(this.formSeed));

      this.carrierMeta = {
        carrierId: this.carrier.carrierId || '',
        carrierPhone: this.carrier.phone || '',
        routeId: this.carrier.routeId || '',
        carrierRouteId: this.carrier.carrierRouteId || '',
      };
      seed.form.transportMode = this.carrier.routeType || search.transportMode || 'LARGE_TRUCK';

      if (search.originCityId) {
        seed.form.origin = {
          ...seed.form.origin,
          provinceId: search.originProvinceId || '',
          provinceName: search.originProvinceName || '',
          cityId: search.originCityId,
          cityName: search.originCityName,
          longitude: search.originLongitude || search.originCityLongitude || '',
          latitude: search.originLatitude || search.originCityLatitude || '',
        };
      }
      if (search.destinationCityId) {
        seed.form.destination = {
          ...seed.form.destination,
          provinceId: search.destinationProvinceId || '',
          provinceName: search.destinationProvinceName || '',
          cityId: search.destinationCityId,
          cityName: search.destinationCityName,
          longitude: search.destinationLongitude || search.destinationCityLongitude || '',
          latitude: search.destinationLatitude || search.destinationCityLatitude || '',
        };
      }

      this.formSeed = seed;
      this.formSeedVersion += 1;
    },
    async loadPlatformGuaranteeService() {
      try {
        const result = await api.platformGuaranteeService();
        this.platformGuaranteeService = result.aggregateService || this.platformGuaranteeService;
        this.platformGuaranteeItems = result.items || [];
      } catch (error) {
        this.platformGuaranteeItems = [];
        uni.showToast({ title: error.message || '平台增值服务暂不可用', icon: 'none' });
      }
    },
    closeDrawer() {
      this.activeDrawer = '';
    },
    onNextStep() {
      const form = this.$refs.orderForm;
      if (!form || !form.validate()) return;
      if (!this.platformGuaranteeService.priceCent || this.platformGuaranteeItems.length === 0) {
        uni.showToast({ title: '平台担保交易服务暂不可用', icon: 'none' });
        this.loadPlatformGuaranteeService();
        return;
      }
      this.syncAgreedDeliveryDateText();
      this.activeDrawer = 'payment';
    },
    syncAgreedDeliveryDateText() {
      const form = this.$refs.orderForm;
      this.agreedDeliveryDateText = form?.getAgreedDeliveryDateText?.() || '';
    },
    openGuaranteeAgreement() {
      uni.navigateTo({ url: '/pages/agreement/detail?type=guarantee' });
    },
    async executeOrderPayment() {
      if (!this.paymentConsent) {
        uni.showToast({ title: '请同意担保交易服务协议', icon: 'none' });
        return;
      }

      this.submitting = true;
      try {
        let order = null;
        try {
          order = await this.createOrderPayload();
        } catch (err) {
          uni.showToast({ title: `订单创建失败：${err.message || '网络错误'}`, icon: 'none' });
          return;
        }

        let payment = null;
        try {
          payment = await api.createGuaranteePayment(order.orderId);
        } catch (err) {
          this.closeDrawer();
          this.openCreatedOrderDetail(order.orderId);
          uni.showToast({ title: '订单已创建，发起支付失败', icon: 'none' });
          return;
        }

        const pollPaymentSuccess = this.waitForPaymentSuccess(payment.paymentId);
        pollPaymentSuccess.catch(() => {});
        const payResult = await Promise.race([
          requestWechatPayment(payment.paymentParams)
            .then(() => ({ source: 'client' }))
            .catch((error) => ({ source: 'client', error })),
          pollPaymentSuccess.then(() => ({ source: 'server' })),
        ]);

        if (payResult.error) {
          const paid = await this.checkPaymentSuccess(payment.paymentId);
          if (!paid) {
            this.closeDrawer();
            this.openCreatedOrderDetail(order.orderId);
            uni.showToast({ title: '订单已创建，待支付担保费', icon: 'none' });
            return;
          }
        }

        try {
          await pollPaymentSuccess;
        } catch (error) {
          this.closeDrawer();
          this.openCreatedOrderDetail(order.orderId);
          uni.showToast({ title: '支付已完成，正在等待确认', icon: 'none' });
          return;
        }

        this.closeDrawer();
        this.openCreatedOrderDetail(order.orderId, true);
      } finally {
        this.submitting = false;
      }
    },
    createOrderPayload() {
      const form = this.$refs.orderForm;
      return api.createOrder(form.buildPayload(this.carrierMeta));
    },
    async checkPaymentSuccess(paymentId) {
      if (!paymentId) return true;
      try {
        const syncResult = await api.syncWechatPayment(paymentId, { silent: true });
        if (syncResult?.payment?.paymentStatus === 'SUCCESS') return true;
      } catch (error) {}
      try {
        const payment = await api.payment(paymentId, { silent: true });
        return payment?.paymentStatus === 'SUCCESS';
      } catch (error) {
        return false;
      }
    },
    async waitForPaymentSuccess(paymentId) {
      if (!paymentId) return true;
      for (let index = 0; index < 15; index += 1) {
        if (await this.checkPaymentSuccess(paymentId)) return true;
        await sleep(index < 5 ? 1000 : 2000);
      }
      throw new Error('支付结果确认超时');
    },
    openCreatedOrderDetail(orderId, paymentSuccess = false) {
      uni.setStorageSync(
        'dealer_pending_order_detail',
        JSON.stringify({ orderId, paymentSuccess }),
      );
      uni.switchTab({ url: '/pages/order/list' });
    },
  },
};
</script>

<style>
.create-order-page {
  padding: 22rpx 20rpx calc(160rpx + env(safe-area-inset-bottom));
}

.steps-progress-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 32rpx;
  background: #ffffff;
  border-radius: var(--radius-lg);
  margin-bottom: 24rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.9);
  box-shadow: var(--shadow-sm);
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.step-num {
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  background: #f3f4f6;
  color: #9ca3af;
  font-size: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
}

.step-lbl {
  font-size: 22rpx;
  color: #9ca3af;
  font-weight: 700;
}

.step-item.active .step-num {
  background: var(--primary-color);
  color: #ffffff;
}

.step-item.active .step-lbl {
  color: var(--primary-color);
}

.step-line {
  flex: 1;
  height: 2rpx;
  background: #e5e7eb;
  margin: -30rpx 20rpx 0;
}

.carrier-card {
  margin-bottom: 24rpx;
}

.carrier-name-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 10rpx;
}

.carrier-name {
  color: var(--text-main);
  font-size: 30rpx;
  font-weight: 800;
}

.subject-type-tag {
  flex-shrink: 0;
  height: 32rpx;
  padding: 0 12rpx;
  border-radius: 8rpx;
  background: var(--primary-light);
  color: var(--primary-color);
  border: 1rpx solid #ffd3d6;
  font-size: 20rpx;
  font-weight: 700;
  line-height: 32rpx;
}

.create-footer-bar {
  display: flex;
}

.footer-next-step-btn {
  width: 100%;
}

.pay-service-card,
.pay-method-item {
  border-radius: var(--radius-md);
  border: 1rpx solid #f0eeee;
  background: #ffffff;
}

.pay-service-card {
  padding: 28rpx;
  margin-bottom: 24rpx;
}

.pay-service-card.active {
  border-color: #ffd3d6;
  background: var(--primary-soft);
}

.service-card-head,
.service-title-check,
.pay-method-item,
.payment-agreement-row,
.drawer-action-pay-row {
  display: flex;
  align-items: center;
}

.service-card-head,
.drawer-action-pay-row {
  justify-content: space-between;
}

.service-title-check {
  gap: 12rpx;
}

.service-name-title,
.payment-section-title,
.total-val {
  font-weight: 800;
}

.service-price-yuan,
.total-symbol,
.total-val {
  color: var(--primary-color);
}

.service-price-yuan {
  font-size: 34rpx;
  font-weight: 900;
}

.service-card-details {
  margin-top: 18rpx;
  color: var(--text-muted);
  font-size: 24rpx;
  line-height: 1.6;
}

.service-detail-name {
  font-weight: 800;
  color: var(--text-main);
}

.service-date-text {
  display: block;
  margin-top: 4rpx;
  color: var(--text-main);
  font-weight: 700;
}

.payment-methods-block {
  margin-bottom: 24rpx;
}

.payment-section-title {
  margin-bottom: 14rpx;
}

.pay-method-item {
  gap: 18rpx;
  padding: 22rpx;
}

.method-icon {
  width: 48rpx;
  height: 48rpx;
}

.method-copy {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.method-lbl {
  font-size: 27rpx;
  font-weight: 800;
}

.method-desc {
  color: var(--text-weak);
  font-size: 22rpx;
}

.method-selected-badge {
  color: var(--primary-color);
  font-weight: 800;
}

.payment-agreement-row {
  gap: 12rpx;
  margin-bottom: 24rpx;
  color: var(--text-muted);
  font-size: 24rpx;
  flex-wrap: wrap;
}

.agreement-link {
  color: var(--primary-color);
  font-weight: 700;
}

.custom-check-box {
  width: 34rpx;
  height: 34rpx;
  border-radius: 8rpx;
  border: 2rpx solid #d1d5db;
  color: transparent;
  text-align: center;
  line-height: 30rpx;
  font-size: 22rpx;
}

.custom-check-box.checked {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: #ffffff;
}

.pay-amount-total-block {
  min-width: 180rpx;
}

.total-symbol {
  font-size: 24rpx;
  font-weight: 800;
}

.total-val {
  font-size: 40rpx;
}

.pay-submit-btn {
  flex: 1;
  margin-left: 18rpx;
}
</style>
