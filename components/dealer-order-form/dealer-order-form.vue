<template>
  <view class="dealer-order-form">
    <view class="section clickable-row-card" @click="openDrawer('customer')">
      <view class="section-title">客户</view>
      <view class="customer-card-row">
        <view class="card-display-value">
          <view class="customer-subject-main">
            <text class="customer-subject-name">
              {{ form.customerSubject.subjectName || '请填写客户企业/姓名' }}
            </text>
            <text class="subject-type-tag">{{ customerSubjectTypeText }}</text>
          </view>
          <text class="sub-meta-phone" v-if="form.customerSubject.subjectPhone">
            {{ form.customerSubject.subjectPhone }}
          </text>
        </view>
        <text class="row-arrow">❯</text>
      </view>
      <view class="card-desc-warn">请确保为真实姓名或企业名称，否则无法签署合同</view>
    </view>

    <view class="section">
      <view class="section-title">线路与服务</view>
      <view class="route-service-group">
        <view class="route-node">
          <view class="route-node-marker start">起</view>
          <view class="route-node-body">
            <view class="route-select-card" @click="openRouteCityPicker('origin')">
              <view class="route-select-copy">
                <text class="route-label">起始城市</text>
                <text class="route-value">{{ routeText(form.origin, '请选择起始城市') }}</text>
              </view>
              <text class="row-arrow">❯</text>
            </view>
            <view class="service-switch-row" @click="form.hasPickupService = !form.hasPickupService">
              <view class="service-switch-copy">
                <text class="service-switch-title">提车服务</text>
                <text class="service-switch-desc">
                  {{ form.hasPickupService ? '需要上门提车' : '无需上门提车' }}
                </text>
              </view>
              <view class="service-switch-control">
                <text class="service-switch-state">
                  {{ form.hasPickupService ? '已开启' : '未开启' }}
                </text>
                <view class="service-switch" :class="{ active: form.hasPickupService }">
                  <text class="service-switch-thumb"></text>
                </view>
              </view>
            </view>
            <view
              v-if="form.hasPickupService"
              class="address-select-card"
              @click="openRouteAddressPicker('origin')"
            >
              <text class="address-select-label">
                {{ form.origin.addressDetail || '请选择提车详细位置' }}
              </text>
              <text class="row-arrow">❯</text>
            </view>
          </view>
        </view>

        <view class="route-node">
          <view class="route-node-marker end">终</view>
          <view class="route-node-body">
            <view class="route-select-card" @click="openRouteCityPicker('destination')">
              <view class="route-select-copy">
                <text class="route-label">目的城市</text>
                <text class="route-value">{{ routeText(form.destination, '请选择目的城市') }}</text>
              </view>
              <text class="row-arrow">❯</text>
            </view>
            <view
              class="service-switch-row"
              @click="form.hasDeliveryService = !form.hasDeliveryService"
            >
              <view class="service-switch-copy">
                <text class="service-switch-title">送车服务</text>
                <text class="service-switch-desc">
                  {{ form.hasDeliveryService ? '需要送车到点' : '无需送车到点' }}
                </text>
              </view>
              <view class="service-switch-control">
                <text class="service-switch-state">
                  {{ form.hasDeliveryService ? '已开启' : '未开启' }}
                </text>
                <view class="service-switch" :class="{ active: form.hasDeliveryService }">
                  <text class="service-switch-thumb"></text>
                </view>
              </view>
            </view>
            <view
              v-if="form.hasDeliveryService"
              class="address-select-card"
              @click="openRouteAddressPicker('destination')"
            >
              <text class="address-select-label">
                {{ form.destination.addressDetail || '请选择送车详细位置' }}
              </text>
              <text class="row-arrow">❯</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view class="section">
      <view class="section-title">联系人</view>
      <view class="contact-select-row border-bottom clickable" @click="openDrawer('sender')">
        <view class="contact-lbl-title">发车人</view>
        <view class="contact-val-block">
          <view class="contact-person-name" v-if="form.sender.name">
            {{ form.sender.name }} {{ form.sender.phone }}
          </view>
          <text class="placeholder-val" v-else>请选择/输入发车人信息</text>
        </view>
        <text class="row-arrow">❯</text>
      </view>
      <view class="contact-select-row clickable" @click="openDrawer('receiver')">
        <view class="contact-lbl-title">收车人</view>
        <view class="contact-val-block">
          <view class="contact-person-name" v-if="form.receiver.name">
            {{ form.receiver.name }} {{ form.receiver.phone }}
          </view>
          <text class="placeholder-val" v-else>请选择/输入收车人信息</text>
        </view>
        <text class="row-arrow">❯</text>
      </view>
    </view>

    <view class="section clickable-row-card" @click="openDrawer('vehicle')">
      <view class="vehicle-summary-head">
        <view class="section-title margin-0">车辆信息 ({{ form.vehicles.length }}辆)</view>
        <text class="add-vehicle-link">添加 ❯</text>
      </view>
      <view class="added-vehicles-summary-list" v-if="form.vehicles.length > 0">
        <view v-for="(vehicle, index) in form.vehicles" :key="index" class="added-veh-pill-card">
          <view class="veh-text-meta">
            <view class="veh-full-title">
              {{ vehicleTitle(vehicle) }}
            </view>
            <view class="veh-details-desc">
              <text class="veh-cond-badge">
                {{ vehicle.vehicleConditionType === 'NEW' ? '新车' : '二手车' }}
              </text>
              <text class="veh-plate-vin" v-if="vehicle.vin || vehicle.plateNo">
                {{ vehicle.plateNo || vehicle.vin }}
              </text>
              <text class="veh-valuation-val" v-if="vehicle.valuationTenThousandYuan">
                估值{{ vehicle.valuationTenThousandYuan }}万元
              </text>
            </view>
          </view>
        </view>
      </view>
      <view class="placeholder-val" v-else>点击添加承运车辆品牌、型号、车架号</view>
    </view>

    <view
      class="drawer-mask"
      :class="{ show: activeDrawer === 'vehicle' }"
      @click="closeDrawer"
    ></view>
    <view class="drawer-content" :class="{ show: activeDrawer === 'vehicle' }">
      <view class="drawer-header">
        <text class="drawer-title">车辆信息</text>
        <text class="drawer-close" @click="closeDrawer">×</text>
      </view>
      <view class="drawer-body scrollable-drawer-body">
        <view class="vehicle-editor-list">
          <view v-for="(vehicle, index) in form.vehicles" :key="index" class="vehicle-editor-card">
            <view class="veh-editor-card-header">
              <text class="veh-index-title">车辆 #{{ index + 1 }}</text>
              <text
                class="veh-delete-btn-lbl"
                v-if="form.vehicles.length > 1"
                @click="removeVehicle(index)"
              >
                删除
              </text>
            </view>
            <view class="vehicle-form-panel">
              <view class="vehicle-form-row clickable" @click="openVehiclePicker(index)">
                <text class="vehicle-row-label">车型</text>
                <view class="vehicle-row-value with-arrow">
                  <text v-if="vehicleTitle(vehicle) !== '请选择品牌/车系/车型'" class="vehicle-picked-text">
                    {{ vehicleTitle(vehicle) }}
                  </text>
                  <text v-else class="vehicle-placeholder">请选择品牌/车系/车型</text>
                  <text class="row-arrow">❯</text>
                </view>
              </view>
              <view class="vehicle-form-row">
                <text class="vehicle-row-label">车架号</text>
                <input
                  class="vehicle-row-input"
                  v-model="vehicle.vin"
                  maxlength="17"
                  placeholder="车架号和车牌号至少填写一个"
                />
              </view>
              <view class="vehicle-form-row">
                <text class="vehicle-row-label">车牌号</text>
                <input
                  class="vehicle-row-input"
                  v-model="vehicle.plateNo"
                  placeholder="车架号和车牌号至少填写一个"
                />
              </view>
              <view class="vehicle-form-row">
                <text class="vehicle-row-label">估值</text>
                <view class="vehicle-row-value">
                  <input
                    class="vehicle-row-input text-right"
                    type="digit"
                    v-model="vehicle.valuationTenThousandYuan"
                    placeholder="必填，用于后续购买保险"
                  />
                  <text class="vehicle-value-unit">万元</text>
                </view>
              </view>
              <view class="vehicle-form-row vehicle-condition-row border-none">
                <text class="vehicle-row-label">新车/二手车</text>
                <view class="vehicle-condition-options">
                  <view
                    class="vehicle-condition-option"
                    @click="vehicle.vehicleConditionType = 'USED'"
                  >
                    <text
                      class="vehicle-radio"
                      :class="{ active: vehicle.vehicleConditionType === 'USED' }"
                    ></text>
                    <text>二手车</text>
                  </view>
                  <view
                    class="vehicle-condition-option"
                    @click="vehicle.vehicleConditionType = 'NEW'"
                  >
                    <text
                      class="vehicle-radio"
                      :class="{ active: vehicle.vehicleConditionType === 'NEW' }"
                    ></text>
                    <text>新车</text>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
        <view class="drawer-add-veh-action" @click="addVehicle">增加一项</view>
        <button class="primary-btn drawer-submit-btn" @click="confirmVehicleDrawer">确定</button>
      </view>
    </view>

    <view class="section">
      <view class="section-title">费用与时效</view>
      <view class="form-line">
        <text>运输方式</text>
        <picker :range="transportModes" range-key="label" @change="changeTransportMode">
          <view class="picker-value">{{ transportModeLabel }} ❯</view>
        </picker>
      </view>
      <view class="form-line">
        <text>总运输费（元）</text>
        <input class="line-input" type="digit" v-model="orderAmountYuan" placeholder="请输入" />
      </view>
      <view class="form-line">
        <text>发票</text>
        <view class="inline-options">
          <text :class="{ active: form.hasInvoice }" @click="form.hasInvoice = true">需要</text>
          <text :class="{ active: !form.hasInvoice }" @click="form.hasInvoice = false">不需要</text>
        </view>
      </view>
      <view class="form-line">
        <text>保险</text>
        <view class="inline-options">
          <text :class="{ active: form.hasInsurance }" @click="form.hasInsurance = true">含保险</text>
          <text :class="{ active: !form.hasInsurance }" @click="form.hasInsurance = false">不含保险</text>
        </view>
      </view>
      <view class="form-line" v-if="form.hasInsurance">
        <text>最高保额（元）</text>
        <input
          class="line-input"
          type="digit"
          v-model="insuranceMaxAmountYuan"
          placeholder="请输入最高保额"
        />
      </view>
      <view class="form-line" v-if="form.hasInsurance">
        <text>保险备注</text>
        <input class="line-input" v-model="form.insuranceRemark" placeholder="选填" />
      </view>
      <view class="form-line">
        <text>约定送达时间</text>
        <picker mode="date" :value="agreedDate" :start="todayDate" @change="changeDeliveryDate">
          <view class="picker-value">{{ agreedDate || '请选择' }} ❯</view>
        </picker>
      </view>
    </view>

    <view
      class="drawer-mask"
      :class="{ show: activeDrawer === 'customer' }"
      @click="closeDrawer"
    ></view>
    <view class="drawer-content" :class="{ show: activeDrawer === 'customer' }">
      <view class="drawer-header">
        <text class="drawer-title">客户信息</text>
        <text class="drawer-close" @click="closeDrawer">×</text>
      </view>
      <view class="drawer-body">
      <view class="drawer-tip-notice">姓名/企业名称和手机号将作为订单客户主体信息，请确保正确</view>
        <view class="field">
          <text class="label">类型</text>
          <view class="segmented drawer-segmented">
            <view
              class="segment"
              :class="{ active: form.customerSubject.subjectType === 'ENTERPRISE' }"
              @click="form.customerSubject.subjectType = 'ENTERPRISE'"
            >
              企业
            </view>
            <view
              class="segment"
              :class="{ active: form.customerSubject.subjectType === 'PERSONAL' }"
              @click="form.customerSubject.subjectType = 'PERSONAL'"
            >
              个人
            </view>
          </view>
        </view>
        <view class="field">
          <text class="label">企业/个人真实姓名</text>
          <input
            class="input"
            v-model="form.customerSubject.subjectName"
            placeholder="请输入您的真实姓名"
          />
        </view>
        <view class="field">
          <text class="label">手机号</text>
          <input
            class="input"
            v-model="form.customerSubject.subjectPhone"
            type="number"
            maxlength="11"
            placeholder="请输入您的真实手机号"
          />
        </view>
        <button class="primary-btn drawer-submit-btn" @click="closeDrawer">确定</button>
      </view>
    </view>

    <view
      class="drawer-mask"
      :class="{ show: activeDrawer === 'sender' }"
      @click="closeDrawer"
    ></view>
    <view class="drawer-content" :class="{ show: activeDrawer === 'sender' }">
      <view class="drawer-header">
        <text class="drawer-title">发车人信息</text>
        <text class="drawer-close" @click="closeDrawer">×</text>
      </view>
      <view class="drawer-body">
        <view class="field">
          <text class="label">姓名</text>
          <input class="input" v-model="form.sender.name" placeholder="请填写发车人姓名" />
        </view>
        <view class="field">
          <text class="label">手机号</text>
          <input
            class="input"
            v-model="form.sender.phone"
            type="number"
            maxlength="11"
            placeholder="请填写发车人手机号"
          />
        </view>
        <view class="drawer-link-action" @click="copyCustomerTo('sender')">
          使用当前客户姓名和手机号
        </view>
        <button class="primary-btn drawer-submit-btn" @click="confirmContactDrawer('sender')">
          确定
        </button>
      </view>
    </view>

    <view
      class="drawer-mask"
      :class="{ show: activeDrawer === 'receiver' }"
      @click="closeDrawer"
    ></view>
    <view class="drawer-content" :class="{ show: activeDrawer === 'receiver' }">
      <view class="drawer-header">
        <text class="drawer-title">收车人信息</text>
        <text class="drawer-close" @click="closeDrawer">×</text>
      </view>
      <view class="drawer-body">
        <view class="field">
          <text class="label">姓名</text>
          <input class="input" v-model="form.receiver.name" placeholder="请填写收车人姓名" />
        </view>
        <view class="field">
          <text class="label">手机号</text>
          <input
            class="input"
            v-model="form.receiver.phone"
            type="number"
            maxlength="11"
            placeholder="请填写收车人手机号"
          />
        </view>
        <view class="drawer-link-action" @click="copyCustomerTo('receiver')">
          使用当前客户姓名和手机号
        </view>
        <button class="primary-btn drawer-submit-btn" @click="confirmContactDrawer('receiver')">
          确定
        </button>
      </view>
    </view>

    <view class="drawer-mask" :class="{ show: activeDrawer === 'vehiclePicker' }" @click="closeVehiclePicker"></view>
    <view class="drawer-content" :class="{ show: activeDrawer === 'vehiclePicker' }">
      <view class="drawer-header">
        <text class="drawer-title">选择车型</text>
        <text class="drawer-close" @click="closeVehiclePicker">×</text>
      </view>
      <view class="drawer-body vehicle-picker-body">
        <view class="vehicle-search-box">
          <input
            class="vehicle-search-input"
            v-model="vehicleSearchKeyword"
            placeholder="搜索品牌、车系、车型"
            confirm-type="search"
            @input="onVehicleSearchInput"
            @confirm="searchVehicleModelsNow"
          />
          <text v-if="vehicleSearchKeyword" class="vehicle-search-clear" @click="clearVehicleSearch">×</text>
        </view>
        <view class="vehicle-picker-tabs">
          <view
            class="vehicle-picker-tab"
            :class="{ active: vehiclePickerStep === 'brand' }"
            @click="switchVehiclePickerStep('brand')"
          >
            品牌
          </view>
          <view
            class="vehicle-picker-tab"
            :class="{
              active: vehiclePickerStep === 'series',
              disabled: !pendingVehicleSelection.brandId,
            }"
            @click="switchVehiclePickerStep('series')"
          >
            车系
          </view>
          <view
            class="vehicle-picker-tab"
            :class="{
              active: vehiclePickerStep === 'model',
              disabled: !pendingVehicleSelection.seriesId,
            }"
            @click="switchVehiclePickerStep('model')"
          >
            车型
          </view>
        </view>
        <view v-if="vehiclePickerSummary" class="vehicle-picker-current">{{ vehiclePickerSummary }}</view>
        <scroll-view v-if="vehicleSearchKeyword" scroll-y class="vehicle-picker-list">
          <view
            v-for="item in vehicleSearchResults"
            :key="item.modelId"
            class="vehicle-picker-item"
            @click="selectVehicleSearchResult(item)"
          >
            <view>
              <view>{{ item.modelName }}</view>
              <view class="vehicle-picker-sub">{{ item.brandName }} / {{ item.seriesName }}</view>
            </view>
            <text class="row-arrow">❯</text>
          </view>
          <view v-if="vehiclePickerLoading" class="vehicle-picker-empty">搜索中...</view>
          <view v-else-if="vehicleSearchResults.length === 0" class="vehicle-picker-empty">暂无匹配车型</view>
        </scroll-view>
        <scroll-view v-else scroll-y class="vehicle-picker-list">
          <view
            v-for="item in vehiclePickerItems"
            :key="vehiclePickerItemKey(item)"
            class="vehicle-picker-item"
            @click="selectVehiclePickerItem(item)"
          >
            <view class="vehicle-picker-item-main">
              <image
                v-if="vehiclePickerStep === 'brand' && item.logoUrl"
                class="vehicle-brand-logo"
                :src="item.logoUrl"
                mode="aspectFit"
              />
              <view class="vehicle-picker-item-text">
                <text>{{ vehiclePickerItemName(item) }}</text>
                <text
                  v-if="vehiclePickerStep === 'model' && item.year"
                  class="vehicle-picker-model-year"
                >
                  {{ item.year }}款
                </text>
              </view>
            </view>
            <text class="row-arrow">❯</text>
          </view>
          <view v-if="vehiclePickerLoading" class="vehicle-picker-empty">加载中...</view>
          <view v-else-if="vehiclePickerItems.length === 0" class="vehicle-picker-empty">暂无可选车型</view>
        </scroll-view>
      </view>
    </view>

    <address-map-picker
      ref="routeAddressMapPicker"
      :title="routeAddressPickerTitle"
      placeholder="搜索市场、园区、道路、公司名称"
      :allow-manual-address="false"
      @select="onRouteAddressSelect"
    />
    <region-picker
      ref="routeCityPicker"
      :title="routeCityPickerTitle"
      @select="onRouteCitySelect"
    />
  </view>
</template>

<script>
import { api } from '../../utils/api.js';
import { yuanToCent } from '../../utils/format.js';
import AddressMapPicker from '../address-map-picker/address-map-picker.vue';
import RegionPicker from '../region-picker/region-picker.vue';

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

function blankVehicle() {
  return {
    brandId: '',
    brandName: '',
    seriesId: '',
    seriesName: '',
    modelId: '',
    modelName: '',
    vin: '',
    plateNo: '',
    valuationTenThousandYuan: '',
    vehicleConditionType: 'USED',
  };
}

function blankForm() {
  return {
    transportMode: 'LARGE_TRUCK',
    customerSubject: {
      subjectType: 'ENTERPRISE',
      subjectName: '',
      subjectPhone: '',
    },
    origin: blankRoute(),
    destination: blankRoute(),
    hasPickupService: false,
    hasDeliveryService: false,
    sender: { name: '', phone: '' },
    receiver: { name: '', phone: '' },
    vehicles: [blankVehicle()],
    hasInvoice: false,
    hasInsurance: false,
    insuranceRemark: '',
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

function formatDateForPicker(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default {
  components: { AddressMapPicker, RegionPicker },
  props: {
    seed: {
      type: Object,
      default: () => ({}),
    },
    seedVersion: {
      type: Number,
      default: 0,
    },
  },
  data() {
    return {
      activeDrawer: '',
      routeCityTarget: 'origin',
      routeAddressTarget: 'origin',
      orderAmountYuan: '',
      insuranceMaxAmountYuan: '',
      agreedDate: '',
      transportModes: [
        { label: '大板托运', value: 'LARGE_TRUCK' },
        { label: '小板托运', value: 'SMALL_TRUCK' },
        { label: '代驾', value: 'DRIVING' },
      ],
      vehiclePickerIndex: -1,
      vehiclePickerStep: 'brand',
      vehiclePickerLoading: false,
      vehicleSearchKeyword: '',
      vehicleSearchResults: [],
      vehicleSearchTimer: null,
      vehicleBrands: [],
      vehicleSeriesList: [],
      vehicleModelList: [],
      pendingVehicleSelection: {
        brandId: '',
        brandName: '',
        seriesId: '',
        seriesName: '',
        modelId: '',
        modelName: '',
      },
      form: blankForm(),
    };
  },
  computed: {
    transportModeLabel() {
      return (
        this.transportModes.find((item) => item.value === this.form.transportMode)?.label ||
        '大板托运'
      );
    },
    routeAddressPickerTitle() {
      return this.routeAddressTarget === 'origin' ? '选择提车详细位置' : '选择送车详细位置';
    },
    routeCityPickerTitle() {
      return this.routeCityTarget === 'origin' ? '选择起始城市' : '选择目的城市';
    },
    vehiclePickerItems() {
      if (this.vehiclePickerStep === 'brand') return this.vehicleBrands;
      if (this.vehiclePickerStep === 'series') return this.vehicleSeriesList;
      return this.vehicleModelList;
    },
    vehiclePickerSummary() {
      return [
        this.pendingVehicleSelection.brandName,
        this.pendingVehicleSelection.seriesName,
        this.pendingVehicleSelection.modelName,
      ]
        .filter(Boolean)
        .join(' ');
    },
    customerSubjectTypeText() {
      return this.form.customerSubject.subjectType === 'PERSONAL' ? '个人' : '企业';
    },
    todayDate() {
      return formatDateForPicker();
    },
  },
  watch: {
    seedVersion: {
      immediate: true,
      handler() {
        this.applySeed(this.seed);
      },
    },
  },
  methods: {
    applySeed(seed = {}) {
      const next = blankForm();
      const seedForm = clone(seed.form || {});
      const vehicles = seedForm.vehicles?.length ? seedForm.vehicles : next.vehicles;
      this.form = {
        ...next,
        ...seedForm,
        customerSubject: {
          ...next.customerSubject,
          ...(seedForm.customerSubject || {}),
        },
        origin: {
          ...next.origin,
          ...(seedForm.origin || {}),
        },
        destination: {
          ...next.destination,
          ...(seedForm.destination || {}),
        },
        sender: {
          ...next.sender,
          ...(seedForm.sender || {}),
        },
        receiver: {
          ...next.receiver,
          ...(seedForm.receiver || {}),
        },
        vehicles,
      };
      this.orderAmountYuan = seed.orderAmountYuan || '';
      this.insuranceMaxAmountYuan = seed.insuranceMaxAmountYuan || '';
      this.agreedDate = seed.agreedDate || '';
    },
    openDrawer(type) {
      this.activeDrawer = type;
    },
    closeDrawer() {
      this.activeDrawer = '';
    },
    confirmContactDrawer(role) {
      const contact = this.form[role];
      if (!contact) return;
      const roleText = role === 'sender' ? '发车人' : '收车人';
      contact.name = (contact.name || '').trim();
      contact.phone = (contact.phone || '').trim();
      if (!contact.name) {
        uni.showToast({ title: `请填写${roleText}姓名`, icon: 'none' });
        return;
      }
      if (!contact.phone) {
        uni.showToast({ title: `请填写${roleText}手机号`, icon: 'none' });
        return;
      }
      this.closeDrawer();
    },
    normalizeVehicle(vehicle) {
      if (!vehicle) return;
      vehicle.vin = (vehicle.vin || '').trim();
      vehicle.plateNo = (vehicle.plateNo || '').trim();
      vehicle.valuationTenThousandYuan = String(vehicle.valuationTenThousandYuan ?? '').trim();
    },
    validateVehicles() {
      if (this.form.vehicles.length === 0) {
        uni.showToast({ title: '请添加车辆信息', icon: 'none' });
        return false;
      }
      for (const vehicle of this.form.vehicles) {
        this.normalizeVehicle(vehicle);
      }
      const invalidVehicle = this.form.vehicles.find(
        (vehicle) => !vehicle.brandName || !vehicle.seriesName || !vehicle.modelName,
      );
      if (invalidVehicle) {
        uni.showToast({ title: '请完整选择车辆车型', icon: 'none' });
        return false;
      }
      if (this.form.vehicles.find((vehicle) => !vehicle.vin && !vehicle.plateNo)) {
        uni.showToast({ title: '车架号和车牌号至少填一个', icon: 'none' });
        return false;
      }
      if (this.form.vehicles.find((vehicle) => String(vehicle.vin || '').length > 17)) {
        uni.showToast({ title: '车架号最多输入17位', icon: 'none' });
        return false;
      }
      if (this.form.vehicles.find((vehicle) => vehicle.valuationTenThousandYuan === '')) {
        uni.showToast({ title: '请填写车辆估值', icon: 'none' });
        return false;
      }
      return true;
    },
    confirmVehicleDrawer() {
      if (!this.validateVehicles()) return;
      this.closeDrawer();
    },
    routeText(route, placeholder) {
      return [route.provinceName, route.cityName].filter(Boolean).join(' ') || placeholder;
    },
    openRouteCityPicker(target) {
      this.routeCityTarget = target;
      this.$refs.routeCityPicker.open();
    },
    onRouteCitySelect(region) {
      const route = this.form[this.routeCityTarget];
      if (!route) return;
      route.provinceId = region.provinceId;
      route.provinceName = region.provinceName;
      route.cityId = region.cityId;
      route.cityName = region.cityName;
      route.districtId = '';
      route.districtName = '';
      route.addressPoiName = '';
      route.addressDetail = '';
      route.longitude = region.longitude || '';
      route.latitude = region.latitude || '';
    },
    openRouteAddressPicker(target) {
      const route = this.form[target];
      if (!route || !route.cityId) {
        uni.showToast({ title: '请先选择城市', icon: 'none' });
        return;
      }
      this.routeAddressTarget = target;
      this.$refs.routeAddressMapPicker.open({
        id: '',
        name: route.addressPoiName || '',
        address: route.addressDetail || '',
        provinceName: route.provinceName || '',
        cityName: route.cityName || '',
        lng: route.longitude || '',
        lat: route.latitude || '',
        districtName: route.districtName || '',
        districtId: route.districtId || '',
      });
    },
    onRouteAddressSelect(address) {
      const route = this.form[this.routeAddressTarget] || this.form.origin;
      const name = (address.name || '').trim();
      route.addressPoiName = name;
      route.addressDetail = address.address || name;
      route.longitude = address.lng || '';
      route.latitude = address.lat || '';
      route.districtName = address.districtName || route.districtName || '';
      route.districtId = address.districtId || route.districtId || '';
    },
    changeTransportMode(event) {
      this.form.transportMode = this.transportModes[event.detail.value].value;
    },
    changeDeliveryDate(event) {
      const selectedDate = event.detail.value;
      if (selectedDate && selectedDate < this.todayDate) {
        uni.showToast({ title: '约定送达时间不能早于今天', icon: 'none' });
        return;
      }
      this.agreedDate = selectedDate;
    },
    getAgreedDeliveryDateText() {
      return this.agreedDate || '';
    },
    addVehicle() {
      this.form.vehicles.push(blankVehicle());
    },
    removeVehicle(index) {
      this.form.vehicles.splice(index, 1);
    },
    async openVehiclePicker(index) {
      const vehicle = this.form.vehicles[index];
      this.vehiclePickerIndex = index;
      this.vehicleSearchKeyword = '';
      this.vehicleSearchResults = [];
      if (this.vehicleSearchTimer) clearTimeout(this.vehicleSearchTimer);
      this.pendingVehicleSelection = {
        brandId: vehicle.brandId || '',
        brandName: vehicle.brandName || '',
        seriesId: vehicle.seriesId || '',
        seriesName: vehicle.seriesName || '',
        modelId: vehicle.modelId || '',
        modelName: vehicle.modelName || '',
      };
      this.vehiclePickerStep = 'brand';
      this.activeDrawer = 'vehiclePicker';
      await this.loadVehicleBrands();
    },
    closeVehiclePicker() {
      this.activeDrawer = 'vehicle';
    },
    copyCustomerTo(role) {
      if (!this.form.customerSubject.subjectName) {
        uni.showToast({ title: '请先填写客户主体信息', icon: 'none' });
        return;
      }
      this.form[role].name = this.form.customerSubject.subjectName.slice(0, 10);
      this.form[role].phone = this.form.customerSubject.subjectPhone;
      uni.showToast({ title: '复制成功', icon: 'none' });
    },
    async loadVehicleBrands() {
      if (this.vehicleBrands.length) return;
      this.vehiclePickerLoading = true;
      try {
        const data = await api.vehicleBrands();
        this.vehicleBrands = data.items || [];
      } finally {
        this.vehiclePickerLoading = false;
      }
    },
    async loadVehicleSeries(brandId) {
      this.vehiclePickerLoading = true;
      this.vehicleSeriesList = [];
      try {
        const data = await api.vehicleSeries(brandId);
        this.vehicleSeriesList = data.items || [];
      } finally {
        this.vehiclePickerLoading = false;
      }
    },
    async loadVehicleModels(seriesId) {
      this.vehiclePickerLoading = true;
      this.vehicleModelList = [];
      try {
        const data = await api.vehicleModels(seriesId);
        this.vehicleModelList = data.items || [];
      } finally {
        this.vehiclePickerLoading = false;
      }
    },
    async switchVehiclePickerStep(step) {
      this.clearVehicleSearch();
      if (step === 'brand') {
        this.vehiclePickerStep = 'brand';
        await this.loadVehicleBrands();
        return;
      }
      if (step === 'series') {
        if (!this.pendingVehicleSelection.brandId) {
          uni.showToast({ title: '请先选择品牌', icon: 'none' });
          return;
        }
        this.pendingVehicleSelection.seriesId = '';
        this.pendingVehicleSelection.seriesName = '';
        this.pendingVehicleSelection.modelId = '';
        this.pendingVehicleSelection.modelName = '';
        this.vehiclePickerStep = 'series';
        await this.loadVehicleSeries(this.pendingVehicleSelection.brandId);
        return;
      }
      if (!this.pendingVehicleSelection.seriesId) {
        uni.showToast({ title: '请先选择车系', icon: 'none' });
        return;
      }
      this.pendingVehicleSelection.modelId = '';
      this.pendingVehicleSelection.modelName = '';
      this.vehiclePickerStep = 'model';
      await this.loadVehicleModels(this.pendingVehicleSelection.seriesId);
    },
    vehiclePickerItemKey(item) {
      return item.id || item.brandName || item.seriesName || item.modelName;
    },
    vehiclePickerItemName(item) {
      return item.brandName || item.seriesName || item.modelName || '';
    },
    onVehicleSearchInput() {
      if (this.vehicleSearchTimer) clearTimeout(this.vehicleSearchTimer);
      this.vehicleSearchTimer = setTimeout(() => this.searchVehicleModelsNow(), 300);
    },
    clearVehicleSearch() {
      this.vehicleSearchKeyword = '';
      this.vehicleSearchResults = [];
      if (this.vehicleSearchTimer) {
        clearTimeout(this.vehicleSearchTimer);
        this.vehicleSearchTimer = null;
      }
    },
    async searchVehicleModelsNow() {
      const keyword = this.vehicleSearchKeyword.trim();
      if (!keyword) {
        this.vehicleSearchResults = [];
        return;
      }
      this.vehiclePickerLoading = true;
      try {
        const data = await api.searchVehicleModels({ keyword, page: 1, pageSize: 30 });
        this.vehicleSearchResults = data.items || [];
      } finally {
        this.vehiclePickerLoading = false;
      }
    },
    selectVehicleSearchResult(item) {
      const vehicle = this.form.vehicles[this.vehiclePickerIndex];
      if (vehicle) {
        vehicle.brandId = item.brandId;
        vehicle.brandName = item.brandName;
        vehicle.seriesId = item.seriesId;
        vehicle.seriesName = item.seriesName;
        vehicle.modelId = item.modelId;
        vehicle.modelName = item.modelName;
      }
      this.clearVehicleSearch();
      this.closeVehiclePicker();
    },
    async selectVehiclePickerItem(item) {
      if (this.vehiclePickerStep === 'brand') {
        this.pendingVehicleSelection = {
          brandId: item.id,
          brandName: item.brandName,
          seriesId: '',
          seriesName: '',
          modelId: '',
          modelName: '',
        };
        this.vehiclePickerStep = 'series';
        await this.loadVehicleSeries(item.id);
        return;
      }
      if (this.vehiclePickerStep === 'series') {
        this.pendingVehicleSelection.seriesId = item.id;
        this.pendingVehicleSelection.seriesName = item.seriesName;
        this.pendingVehicleSelection.modelId = '';
        this.pendingVehicleSelection.modelName = '';
        this.vehiclePickerStep = 'model';
        await this.loadVehicleModels(item.id);
        return;
      }
      const vehicle = this.form.vehicles[this.vehiclePickerIndex];
      if (vehicle) {
        vehicle.brandId = this.pendingVehicleSelection.brandId;
        vehicle.brandName = this.pendingVehicleSelection.brandName;
        vehicle.seriesId = this.pendingVehicleSelection.seriesId;
        vehicle.seriesName = this.pendingVehicleSelection.seriesName;
        vehicle.modelId = item.id;
        vehicle.modelName = item.modelName;
      }
      this.closeVehiclePicker();
    },
    vehicleTitle(vehicle) {
      return (
        [vehicle.brandName, vehicle.seriesName, vehicle.modelName].filter(Boolean).join(' ') ||
        '请选择品牌/车系/车型'
      );
    },
    validate() {
      if (!this.form.customerSubject.subjectName || !this.form.customerSubject.subjectPhone) {
        uni.showToast({ title: '请填写客户主体信息', icon: 'none' });
        return false;
      }
      if (!this.form.origin.provinceId || !this.form.origin.cityId) {
        uni.showToast({ title: '请选择起始城市', icon: 'none' });
        return false;
      }
      if (!this.form.destination.provinceId || !this.form.destination.cityId) {
        uni.showToast({ title: '请选择目的城市', icon: 'none' });
        return false;
      }
      if (
        this.form.hasPickupService &&
        (!this.form.origin.addressDetail || !this.form.origin.longitude || !this.form.origin.latitude)
      ) {
        uni.showToast({ title: '请选择提车位置', icon: 'none' });
        return false;
      }
      if (
        this.form.hasDeliveryService &&
        (
          !this.form.destination.addressDetail ||
          !this.form.destination.longitude ||
          !this.form.destination.latitude
        )
      ) {
        uni.showToast({ title: '请选择送车位置', icon: 'none' });
        return false;
      }
      if (!this.form.sender.name || !this.form.sender.phone) {
        uni.showToast({ title: '请填写发车人信息', icon: 'none' });
        return false;
      }
      if (!this.form.receiver.name || !this.form.receiver.phone) {
        uni.showToast({ title: '请填写收车人信息', icon: 'none' });
        return false;
      }
      if (!this.validateVehicles()) return false;
      if (!this.orderAmountYuan || isNaN(this.orderAmountYuan)) {
        uni.showToast({ title: '请输入正确的运输费', icon: 'none' });
        return false;
      }
      if (this.form.hasInsurance && (!this.insuranceMaxAmountYuan || isNaN(this.insuranceMaxAmountYuan))) {
        uni.showToast({ title: '请输入正确的最高保额', icon: 'none' });
        return false;
      }
      if (!this.agreedDate) {
        uni.showToast({ title: '请选择约定送达时间', icon: 'none' });
        return false;
      }
      if (this.agreedDate < this.todayDate) {
        uni.showToast({ title: '约定送达时间不能早于今天', icon: 'none' });
        return false;
      }
      return true;
    },
    buildPayload(extra = {}) {
      const optionalVehicleEstimatedValueCent = (value) => {
        const text = String(value ?? '').trim();
        return text ? yuanToCent(Number(text) * 10000) : undefined;
      };
      return {
        ...extra,
        ...this.form,
        orderAmountCent: yuanToCent(this.orderAmountYuan),
        hasInsurance: Boolean(this.form.hasInsurance),
        insuranceMaxAmountCent: this.form.hasInsurance
          ? yuanToCent(this.insuranceMaxAmountYuan)
          : undefined,
        insuranceRemark: this.form.hasInsurance ? this.form.insuranceRemark || '' : '',
        agreedDeliveryTime: new Date(`${this.agreedDate}T18:00:00`).toISOString(),
        vehicles: this.form.vehicles.map((vehicle) => ({
          brandId: vehicle.brandId || undefined,
          brandName: vehicle.brandName,
          seriesId: vehicle.seriesId || undefined,
          seriesName: vehicle.seriesName,
          modelId: vehicle.modelId || undefined,
          modelName: vehicle.modelName,
          vin: vehicle.vin || '',
          plateNumber: vehicle.plateNo || '',
          estimatedValueCent: optionalVehicleEstimatedValueCent(vehicle.valuationTenThousandYuan),
          vehicleConditionType: vehicle.vehicleConditionType || 'USED',
        })),
      };
    },
  },
};
</script>

<style>
.dealer-order-form .section {
  margin-bottom: 24rpx;
}

.clickable-row-card:active {
  background-color: #f9fafb;
}

.customer-card-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  margin-top: 10rpx;
}

.card-display-value {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  min-width: 0;
}

.customer-subject-main {
  display: flex;
  align-items: center;
  gap: 12rpx;
  min-width: 0;
}

.customer-subject-name {
  overflow: hidden;
  color: var(--text-main);
  font-size: 30rpx;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
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

.sub-meta-phone {
  color: #9ca3af;
  font-family: monospace;
  font-size: 22rpx;
}

.card-desc-warn {
  margin-top: 16rpx;
  color: #9ca3af;
  font-size: 20rpx;
}

.segmented {
  display: flex;
  gap: 12rpx;
  margin-bottom: 24rpx;
}

.drawer-segmented {
  margin-bottom: 0;
}

.drawer-tip-notice {
  margin-bottom: 24rpx;
  padding: 18rpx 22rpx;
  border-radius: 14rpx;
  background: var(--primary-soft);
  color: var(--text-muted);
  font-size: 24rpx;
  line-height: 1.5;
}

.segment {
  flex: 1;
  height: 64rpx;
  border: 1rpx solid #eeeeee;
  border-radius: 12rpx;
  color: #777777;
  font-size: 26rpx;
  font-weight: 700;
  line-height: 64rpx;
  text-align: center;
  background: #ffffff;
}

.segment.active {
  border-color: var(--primary-color);
  background: var(--primary-light);
  color: var(--primary-color);
}

.small-segmented {
  margin: 18rpx 0 0;
}

.form-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  min-height: 76rpx;
  border-bottom: 1rpx solid #f1f1f1;
}

.route-service-group {
  display: flex;
  flex-direction: column;
  gap: 26rpx;
  margin-top: 12rpx;
}

.route-node {
  position: relative;
  display: flex;
  gap: 18rpx;
}

.route-node:not(:last-child)::after {
  position: absolute;
  top: 56rpx;
  bottom: -22rpx;
  left: 23rpx;
  width: 2rpx;
  background: #ffe1d2;
  content: "";
}

.route-node-marker {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  color: #ffffff;
  font-size: 22rpx;
  font-weight: 800;
  line-height: 48rpx;
  text-align: center;
}

.route-node-marker.start {
  background: var(--primary-color);
}

.route-node-marker.end {
  background: #334155;
}

.route-node-body {
  flex: 1;
  min-width: 0;
}

.route-select-card,
.address-select-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  border: 1rpx solid #eceff3;
  border-radius: 16rpx;
  background: #ffffff;
}

.route-select-card {
  min-height: 92rpx;
  padding: 16rpx 20rpx;
}

.route-select-card:active,
.address-select-card:active,
.service-switch-row:active {
  opacity: 0.74;
}

.route-select-copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6rpx;
  min-width: 0;
}

.route-label {
  color: var(--text-weak);
  font-size: 22rpx;
}

.route-value {
  overflow: hidden;
  color: var(--text-main);
  font-size: 30rpx;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.route-action,
.picker-value,
.add-vehicle-link,
.delete-text {
  color: var(--primary-color);
  font-weight: 700;
}

.service-switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  min-height: 76rpx;
  margin-top: 14rpx;
  padding: 0 18rpx;
  border: 1rpx solid #edf0f4;
  border-radius: 16rpx;
  background: #fafafa;
}

.service-switch-copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4rpx;
  min-width: 0;
}

.service-switch-title {
  color: var(--text-main);
  font-size: 26rpx;
  font-weight: 700;
}

.service-switch-desc {
  color: var(--text-weak);
  font-size: 22rpx;
}

.service-switch-control {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-shrink: 0;
}

.service-switch-state {
  color: #9ca3af;
  font-size: 22rpx;
  font-weight: 700;
}

.service-switch {
  position: relative;
  width: 76rpx;
  height: 44rpx;
  border-radius: 999rpx;
  background: #d1d5db;
  transition: background 0.2s ease;
}

.service-switch.active {
  background: var(--primary-color);
}

.service-switch-thumb {
  position: absolute;
  top: 4rpx;
  left: 4rpx;
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 3rpx 8rpx rgba(15, 23, 42, 0.16);
  transition: transform 0.2s ease;
}

.service-switch.active .service-switch-thumb {
  transform: translateX(32rpx);
}

.address-select-card {
  min-height: 72rpx;
  margin-top: 14rpx;
  padding: 0 18rpx;
  background: #f8fafc;
}

.address-select-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: var(--text-main);
  font-size: 26rpx;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row-arrow {
  flex-shrink: 0;
  color: #c7c7c7;
}

.contact-select-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  padding: 24rpx 0;
}

.contact-select-row.clickable:active {
  opacity: 0.72;
}

.contact-lbl-title {
  flex-shrink: 0;
  color: #4d4d4d;
  font-size: 28rpx;
  font-weight: 800;
}

.contact-val-block {
  flex: 1;
  min-width: 0;
  text-align: right;
}

.contact-person-name {
  overflow: hidden;
  color: var(--text-main);
  font-size: 28rpx;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.placeholder-val {
  color: #b8bbc2;
  font-size: 26rpx;
}

.drawer-link-action {
  margin: 10rpx 0 28rpx;
  color: var(--primary-color);
  font-size: 25rpx;
  font-weight: 800;
  text-align: right;
}

.drawer-submit-btn {
  width: 100%;
}

.vehicle-summary-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
}

.margin-0 {
  margin-bottom: 0;
}

.added-vehicles-summary-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-top: 24rpx;
}

.added-veh-pill-card {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 20rpx 24rpx;
  border: 1rpx solid #efeff1;
  border-radius: var(--radius-md);
  background: #f8f8f8;
}

.veh-text-meta {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  min-width: 0;
}

.veh-full-title {
  overflow: hidden;
  color: var(--text-main);
  font-size: 27rpx;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.veh-details-desc {
  display: flex;
  align-items: center;
  gap: 12rpx;
  color: var(--text-weak);
  font-size: 22rpx;
}

.veh-cond-badge {
  flex-shrink: 0;
  padding: 4rpx 10rpx;
  border-radius: 8rpx;
  background: #ffffff;
  color: #777777;
  font-size: 20rpx;
  font-weight: 700;
}

.veh-plate-vin,
.veh-valuation-val {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scrollable-drawer-body {
  max-height: 60vh;
}

.vehicle-editor-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.vehicle-editor-card {
  overflow: hidden;
  padding: 0 28rpx;
  border: 1rpx solid #eef0f3;
  border-radius: 28rpx;
  background: #ffffff;
}

.veh-editor-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22rpx 0;
  border-bottom: 1rpx solid #f1f2f4;
}

.veh-index-title {
  color: #111827;
  font-size: 26rpx;
  font-weight: 800;
}

.veh-delete-btn-lbl {
  padding: 4rpx 12rpx;
  color: #dc2626;
  font-size: 24rpx;
  font-weight: 800;
}

.vehicle-form-panel {
  display: flex;
  flex-direction: column;
}

.vehicle-form-row {
  display: flex;
  align-items: center;
  min-height: 96rpx;
  border-bottom: 1rpx solid #f1f2f4;
}

.vehicle-form-row.clickable:active {
  opacity: 0.75;
}

.vehicle-row-label {
  flex-shrink: 0;
  width: 150rpx;
  color: #5f636b;
  font-size: 28rpx;
  font-weight: 700;
}

.vehicle-row-value {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12rpx;
}

.vehicle-row-value.with-arrow {
  justify-content: space-between;
}

.vehicle-picked-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: #2f3135;
  font-size: 28rpx;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vehicle-placeholder {
  flex: 1;
  min-width: 0;
  color: #b8bbc2;
  font-size: 27rpx;
  font-weight: 600;
}

.vehicle-row-input {
  flex: 1;
  min-width: 0;
  height: 88rpx;
  color: #2f3135;
  font-size: 27rpx;
}

.vehicle-value-unit {
  flex-shrink: 0;
  color: #2f3135;
  font-size: 28rpx;
  font-weight: 700;
}

.vehicle-condition-row {
  min-height: 100rpx;
}

.vehicle-condition-options {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 44rpx;
}

.vehicle-condition-option {
  display: flex;
  align-items: center;
  gap: 12rpx;
  color: #2f3135;
  font-size: 28rpx;
  font-weight: 700;
}

.vehicle-radio {
  width: 30rpx;
  height: 30rpx;
  border-radius: 50%;
  border: 3rpx solid #c4c7cc;
  background: #ffffff;
}

.vehicle-radio.active {
  border-color: var(--primary-color);
  background: radial-gradient(circle, var(--primary-color) 0 42%, transparent 46%);
}

.drawer-add-veh-action {
  margin: 28rpx 0;
  height: 72rpx;
  border: 1rpx dashed var(--primary-color);
  border-radius: 14rpx;
  color: var(--primary-color);
  font-size: 27rpx;
  font-weight: 800;
  line-height: 72rpx;
  text-align: center;
}

.form-line {
  min-height: 88rpx;
  font-size: 28rpx;
}

.line-input {
  flex: 1;
  text-align: right;
  color: var(--primary-color);
  font-weight: 800;
}

.inline-options {
  display: flex;
  gap: 14rpx;
}

.inline-options text {
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  background: #f5f5f5;
  color: #777777;
  font-size: 24rpx;
}

.inline-options text.active {
  background: var(--primary-light);
  color: var(--primary-color);
  font-weight: 700;
}

.vehicle-picker-body {
  max-height: 70vh;
}

.vehicle-search-box {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 0 20rpx;
  border-radius: 16rpx;
  background: #f6f6f6;
  margin-bottom: 20rpx;
}

.vehicle-search-input {
  flex: 1;
  height: 76rpx;
  font-size: 26rpx;
}

.vehicle-search-clear {
  color: #9ca3af;
  font-size: 34rpx;
}

.vehicle-picker-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10rpx;
  margin-bottom: 14rpx;
}

.vehicle-picker-tab {
  height: 56rpx;
  border-radius: 12rpx;
  background: #f5f5f5;
  color: #777777;
  font-size: 24rpx;
  line-height: 56rpx;
  text-align: center;
  transition: all 0.2s ease;
}

.vehicle-picker-tab.active {
  background: var(--primary-light);
  color: var(--primary-color);
  font-weight: 700;
}

.vehicle-picker-tab.disabled {
  color: #c7cbd1;
}

.vehicle-picker-current,
.vehicle-picker-sub {
  color: var(--text-weak);
  font-size: 22rpx;
}

.vehicle-picker-current {
  margin-bottom: 10rpx;
}

.vehicle-picker-list {
  height: 680rpx;
}

.vehicle-picker-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 84rpx;
  border-bottom: 1rpx solid #f3f3f3;
  font-size: 26rpx;
}

.vehicle-picker-item-main {
  display: flex;
  align-items: center;
  gap: 18rpx;
  min-width: 0;
}

.vehicle-brand-logo {
  flex-shrink: 0;
  width: 48rpx;
  height: 48rpx;
  border-radius: 10rpx;
  background: #f7f7f8;
}

.vehicle-picker-item-text {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  min-width: 0;
}

.vehicle-picker-model-year {
  color: var(--text-weak);
  font-size: 22rpx;
}

.vehicle-picker-empty {
  padding: 48rpx 0;
  text-align: center;
  color: var(--text-weak);
}
</style>
