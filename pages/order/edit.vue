<template>
  <view class="page edit-order-page">
    <view v-if="loading" class="section loading-card">加载中...</view>

    <block v-else>
      <view class="section edit-status-card">
        <view class="section-title">修改订单信息</view>
        <view class="subtle edit-tip">承运商确认前可修改，保存后将提醒承运商重新查看订单。</view>
        <view class="order-no">订单号：{{ order.orderNo || '-' }}</view>
      </view>

      <dealer-order-form ref="orderForm" :seed="formSeed" :seed-version="formSeedVersion" />
    </block>

    <view class="fixed-footer edit-footer">
      <button class="secondary-btn footer-btn" @click="back">取消</button>
      <button class="primary-btn footer-btn" :loading="submitting" @click="save">保存修改</button>
    </view>
    <miniapp-login-sheet ref="loginSheet" @success="handleLoginSuccess" />
  </view>
</template>

<script>
import { miniappLoginPageMixin } from '../../utils/miniapp-login-page.js';
import DealerOrderForm from '../../components/dealer-order-form/dealer-order-form.vue';
import { api, requireLogin } from '../../utils/api.js';
import { returnToOrderDetail } from '../../utils/order-edit-navigation.js';

function routeFromOrder(order, prefix) {
  return {
    provinceId: order[`${prefix}ProvinceId`] || '',
    provinceName: order[`${prefix}ProvinceName`] || '',
    cityId: order[`${prefix}CityId`] || '',
    cityName: order[`${prefix}CityName`] || '',
    districtId: order[`${prefix}DistrictId`] || '',
    districtName: order[`${prefix}DistrictName`] || '',
    addressPoiName: '',
    addressDetail: order[`${prefix}AddressDetail`] || '',
    longitude: order[`${prefix}Longitude`] || '',
    latitude: order[`${prefix}Latitude`] || '',
  };
}

function seedFromOrder(order, vehicles) {
  return {
    orderAmountYuan: ((order.orderAmountCent || 0) / 100).toFixed(2),
    insuranceMaxAmountYuan:
      order.insuranceMaxAmountCent === null || order.insuranceMaxAmountCent === undefined
        ? ''
        : (Number(order.insuranceMaxAmountCent) / 100).toFixed(2),
    agreedDate: order.agreedDeliveryTime ? order.agreedDeliveryTime.slice(0, 10) : '',
    form: {
      transportMode: order.transportMode || 'LARGE_TRUCK',
      customerSubject: {
        subjectType: order.customerSubjectType || 'ENTERPRISE',
        subjectName: order.customerSubjectName || '',
        subjectPhone: order.customerSubjectPhone || '',
      },
      origin: routeFromOrder(order, 'origin'),
      destination: routeFromOrder(order, 'destination'),
      hasPickupService: Boolean(order.hasPickupService),
      hasDeliveryService: Boolean(order.hasDeliveryService),
      sender: { name: order.senderName || '', phone: order.senderPhone || '' },
      receiver: { name: order.receiverName || '', phone: order.receiverPhone || '' },
      hasInvoice: Boolean(order.hasInvoice),
      hasInsurance: Boolean(order.hasInsurance),
      insuranceRemark: order.insuranceRemark || '',
      vehicles: vehicles.map((vehicle) => ({
        brandId: vehicle.brandId || '',
        brandName: vehicle.brandName || '',
        seriesId: vehicle.seriesId || '',
        seriesName: vehicle.seriesName || '',
        modelId: vehicle.modelId || '',
        modelName: vehicle.modelName || '',
        vin: vehicle.vin || '',
        plateNo: vehicle.plateNumber || '',
        valuationTenThousandYuan:
          vehicle.estimatedValueCent === null || vehicle.estimatedValueCent === undefined
            ? ''
            : String(Number(vehicle.estimatedValueCent) / 100 / 10000),
        vehicleConditionType: vehicle.vehicleConditionType || 'USED',
      })),
    },
  };
}

export default {
  mixins: [miniappLoginPageMixin],
  components: { DealerOrderForm },
  data() {
    return {
      orderId: '',
      order: {},
      loading: true,
      submitting: false,
      formSeed: {},
      formSeedVersion: 0,
    };
  },
  async onLoad(options) {
    if (!requireLogin()) return;
    this.orderId = options.orderId || options.id || '';
    await this.load();
  },
  methods: {
    async load() {
      this.loading = true;
      try {
        const data = await api.orderDetail(this.orderId);
        this.order = data.order || {};
        if (this.order.orderStatus !== 'PENDING_CONFIRM') {
          uni.showModal({
            title: '无法修改',
            content: '当前订单已不在待承运商确认状态，不能继续修改。',
            confirmColor: '#f97316',
            showCancel: false,
            success: () => this.back(),
          });
          return;
        }
        this.formSeed = seedFromOrder(this.order, data.vehicles || []);
        this.formSeedVersion += 1;
      } finally {
        this.loading = false;
      }
    },
    async save() {
      const form = this.$refs.orderForm;
      if (!form || !form.validate()) return;
      this.submitting = true;
      try {
        await api.updateOrder(this.orderId, form.buildPayload());
        uni.showToast({ title: '修改成功', icon: 'success' });
        setTimeout(() => {
          returnToOrderDetail({ orderId: this.orderId, shouldRefresh: true, uniApi: uni });
        }, 500);
      } finally {
        this.submitting = false;
      }
    },
    back() {
      returnToOrderDetail({ orderId: this.orderId, uniApi: uni });
    },
  },
};
</script>

<style>
.edit-order-page {
  padding: 24rpx 22rpx calc(150rpx + env(safe-area-inset-bottom));
}

.loading-card {
  text-align: center;
  color: var(--text-muted);
}

.edit-status-card {
  background: linear-gradient(135deg, #ffffff 0%, #fff7f5 100%);
}

.edit-tip {
  font-size: 24rpx;
  line-height: 1.5;
}

.order-no {
  margin-top: 16rpx;
  color: var(--text-weak);
  font-size: 24rpx;
}

.edit-footer {
  display: flex;
  gap: 18rpx;
}

.footer-btn {
  flex: 1;
}
</style>
