"use strict";
const common_vendor = require("../../common/vendor.js");
const AddressMapPicker = () => "../../components/address-map-picker/address-map-picker.js";
function blankVehicle() {
  return {
    brandId: "",
    brandName: "",
    seriesId: "",
    seriesName: "",
    modelId: "",
    modelName: "",
    vin: "",
    plateNo: "",
    valuationTenThousandYuan: "",
    vehicleConditionType: "USED"
    // USED | NEW
  };
}
const _sfc_main = {
  components: {
    AddressMapPicker
  },
  data() {
    const session = common_vendor.getSession();
    const profile = (session == null ? void 0 : session.profile) || {};
    return {
      carrier: {},
      transportModeText: common_vendor.transportModeText,
      activeDrawer: "",
      // 'customer' | 'sender' | 'receiver' | 'vehicle' | 'payment' | ''
      orderAmountYuan: "",
      agreedDate: "",
      submitting: false,
      paymentMethod: "alipay",
      // 'alipay' | 'wechat'
      paymentConsent: true,
      routeAddressTarget: "origin",
      vehiclePickerIndex: -1,
      vehiclePickerStep: "brand",
      vehiclePickerLoading: false,
      vehicleBrands: [],
      vehicleSeriesList: [],
      vehicleModelList: [],
      pendingVehicleSelection: {
        brandId: "",
        brandName: "",
        seriesId: "",
        seriesName: "",
        modelId: "",
        modelName: ""
      },
      platformGuaranteeService: {
        serviceType: "GUARANTEE",
        serviceName: "平台担保交易",
        priceCent: 0
      },
      platformGuaranteeItems: [],
      transportModes: [
        { label: "大板托运", value: "LARGE_TRUCK" },
        { label: "小板托运", value: "SMALL_TRUCK" }
      ],
      form: {
        carrierId: "",
        carrierPhone: "",
        routeId: "",
        carrierRouteId: "",
        transportMode: "LARGE_TRUCK",
        customerSubject: {
          subjectType: "ENTERPRISE",
          subjectName: profile.companyName || "",
          subjectPhone: profile.registeredPhone || ""
        },
        origin: {
          provinceId: "",
          provinceName: "",
          cityId: "",
          cityName: "",
          districtId: "",
          districtName: "",
          addressPoiName: "",
          addressDetail: "",
          longitude: "",
          latitude: ""
        },
        destination: {
          provinceId: "",
          provinceName: "",
          cityId: "",
          cityName: "",
          districtId: "",
          districtName: "",
          addressPoiName: "",
          addressDetail: "",
          longitude: "",
          latitude: ""
        },
        hasPickupService: true,
        hasDeliveryService: false,
        sender: { name: "", phone: "" },
        receiver: { name: "", phone: "" },
        vehicles: [],
        hasInvoice: false,
        buyInsurance: false
      }
    };
  },
  computed: {
    transportModeLabel() {
      var _a;
      return ((_a = this.transportModes.find((item) => item.value === this.form.transportMode)) == null ? void 0 : _a.label) || "大板托运";
    },
    originText() {
      return this.form.origin.cityName || this.form.origin.provinceName || "-";
    },
    destinationText() {
      return this.form.destination.cityName || this.form.destination.provinceName || "-";
    },
    totalPayAmountYuan() {
      return ((this.platformGuaranteeService.priceCent || 0) / 100).toFixed(2);
    },
    routeAddressPickerTitle() {
      return this.routeAddressTarget === "origin" ? "选择提车详细位置" : "选择送车详细位置";
    },
    vehiclePickerItems() {
      if (this.vehiclePickerStep === "brand")
        return this.vehicleBrands;
      if (this.vehiclePickerStep === "series")
        return this.vehicleSeriesList;
      return this.vehicleModelList;
    },
    vehiclePickerSummary() {
      return [
        this.pendingVehicleSelection.brandName,
        this.pendingVehicleSelection.seriesName,
        this.pendingVehicleSelection.modelName
      ].filter(Boolean).join(" ");
    }
  },
  async onLoad(options) {
    if (!await common_vendor.ensureDealerReady())
      return;
    if (options.carrier) {
      this.carrier = JSON.parse(decodeURIComponent(options.carrier));
      const search = this.carrier.searchCondition || {};
      this.form.carrierId = this.carrier.carrierId || "";
      this.form.carrierPhone = this.carrier.phone || "";
      this.form.routeId = this.carrier.routeId || "";
      this.form.carrierRouteId = this.carrier.carrierRouteId || "";
      this.form.transportMode = this.carrier.routeType || search.transportMode || "LARGE_TRUCK";
      if (search.originCityId) {
        this.form.origin.provinceId = search.originProvinceId || "";
        this.form.origin.provinceName = search.originProvinceName || "";
        this.form.origin.cityId = search.originCityId;
        this.form.origin.cityName = search.originCityName;
        this.form.origin.longitude = search.originLongitude || search.originCityLongitude || "";
        this.form.origin.latitude = search.originLatitude || search.originCityLatitude || "";
      }
      if (search.destinationCityId) {
        this.form.destination.provinceId = search.destinationProvinceId || "";
        this.form.destination.provinceName = search.destinationProvinceName || "";
        this.form.destination.cityId = search.destinationCityId;
        this.form.destination.cityName = search.destinationCityName;
        this.form.destination.longitude = search.destinationLongitude || search.destinationCityLongitude || "";
        this.form.destination.latitude = search.destinationLatitude || search.destinationCityLatitude || "";
      }
    }
    if (this.form.vehicles.length === 0) {
      this.addVehicle();
    }
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1e3);
    this.agreedDate = tomorrow.toISOString().slice(0, 10);
    await this.loadPlatformGuaranteeService();
  },
  methods: {
    async loadPlatformGuaranteeService() {
      try {
        const result = await common_vendor.api.platformGuaranteeService();
        this.platformGuaranteeService = result.aggregateService || this.platformGuaranteeService;
        this.platformGuaranteeItems = result.items || [];
      } catch (error) {
        this.platformGuaranteeItems = [];
        common_vendor.index.showToast({ title: error.message || "平台增值服务暂不可用", icon: "none" });
      }
    },
    openDrawer(type) {
      this.activeDrawer = type;
    },
    closeDrawer() {
      this.activeDrawer = "";
    },
    currentRouteAddress() {
      return this.form[this.routeAddressTarget] || this.form.origin;
    },
    openRouteAddressPicker(target) {
      const route = this.form[target];
      if (!route || !route.cityId) {
        common_vendor.index.showToast({ title: "请返回首页重新选择起止城市", icon: "none" });
        return;
      }
      this.routeAddressTarget = target;
      this.$refs.routeAddressMapPicker.open({
        id: "",
        name: route.addressPoiName || "",
        address: route.addressDetail || "",
        provinceName: route.provinceName || "",
        cityName: route.cityName || "",
        lng: route.longitude || "",
        lat: route.latitude || "",
        districtName: route.districtName || "",
        districtId: route.districtId || ""
      });
    },
    onRouteAddressSelect(address) {
      const route = this.currentRouteAddress();
      const name = (address.name || "").trim();
      route.addressPoiName = name;
      route.addressDetail = address.address || name;
      route.longitude = address.lng || "";
      route.latitude = address.lat || "";
      route.districtName = address.districtName || route.districtName || "";
      route.districtId = address.districtId || route.districtId || "";
    },
    changeTransportMode(e) {
      this.form.transportMode = this.transportModes[e.detail.value].value;
    },
    changeDeliveryDate(e) {
      this.agreedDate = e.detail.value;
    },
    addVehicle() {
      this.form.vehicles.push(blankVehicle());
    },
    removeVehicle(idx) {
      this.form.vehicles.splice(idx, 1);
    },
    async openVehiclePicker(index) {
      const vehicle = this.form.vehicles[index];
      this.vehiclePickerIndex = index;
      this.pendingVehicleSelection = {
        brandId: vehicle.brandId || "",
        brandName: vehicle.brandName || "",
        seriesId: vehicle.seriesId || "",
        seriesName: vehicle.seriesName || "",
        modelId: vehicle.modelId || "",
        modelName: vehicle.modelName || ""
      };
      this.vehiclePickerStep = "brand";
      this.activeDrawer = "vehiclePicker";
      await this.loadVehicleBrands();
    },
    closeVehiclePicker() {
      this.activeDrawer = "vehicle";
    },
    async loadVehicleBrands() {
      if (this.vehicleBrands.length)
        return;
      this.vehiclePickerLoading = true;
      try {
        const data = await common_vendor.api.vehicleBrands();
        this.vehicleBrands = data.items || [];
      } finally {
        this.vehiclePickerLoading = false;
      }
    },
    async loadVehicleSeries(brandId) {
      this.vehiclePickerLoading = true;
      this.vehicleSeriesList = [];
      try {
        const data = await common_vendor.api.vehicleSeries(brandId);
        this.vehicleSeriesList = data.items || [];
      } finally {
        this.vehiclePickerLoading = false;
      }
    },
    async loadVehicleModels(seriesId) {
      this.vehiclePickerLoading = true;
      this.vehicleModelList = [];
      try {
        const data = await common_vendor.api.vehicleModels(seriesId);
        this.vehicleModelList = data.items || [];
      } finally {
        this.vehiclePickerLoading = false;
      }
    },
    vehiclePickerItemKey(item) {
      return item.id || item.brandName || item.seriesName || item.modelName;
    },
    vehiclePickerItemName(item) {
      return item.brandName || item.seriesName || item.modelName || "";
    },
    async selectVehiclePickerItem(item) {
      if (this.vehiclePickerStep === "brand") {
        this.pendingVehicleSelection = {
          brandId: item.id,
          brandName: item.brandName,
          seriesId: "",
          seriesName: "",
          modelId: "",
          modelName: ""
        };
        this.vehiclePickerStep = "series";
        await this.loadVehicleSeries(item.id);
        return;
      }
      if (this.vehiclePickerStep === "series") {
        this.pendingVehicleSelection.seriesId = item.id;
        this.pendingVehicleSelection.seriesName = item.seriesName;
        this.pendingVehicleSelection.modelId = "";
        this.pendingVehicleSelection.modelName = "";
        this.vehiclePickerStep = "model";
        await this.loadVehicleModels(item.id);
        return;
      }
      this.pendingVehicleSelection.modelId = item.id;
      this.pendingVehicleSelection.modelName = item.modelName;
      const vehicle = this.form.vehicles[this.vehiclePickerIndex];
      if (vehicle) {
        vehicle.brandId = this.pendingVehicleSelection.brandId;
        vehicle.brandName = this.pendingVehicleSelection.brandName;
        vehicle.seriesId = this.pendingVehicleSelection.seriesId;
        vehicle.seriesName = this.pendingVehicleSelection.seriesName;
        vehicle.modelId = this.pendingVehicleSelection.modelId;
        vehicle.modelName = this.pendingVehicleSelection.modelName;
      }
      this.closeVehiclePicker();
    },
    copyCustomerTo(role) {
      if (!this.form.customerSubject.subjectName) {
        common_vendor.index.showToast({ title: "请先填写客户主体信息", icon: "none" });
        return;
      }
      this.form[role].name = this.form.customerSubject.subjectName.slice(0, 10);
      this.form[role].phone = this.form.customerSubject.subjectPhone;
      common_vendor.index.showToast({ title: "复制成功", icon: "none" });
    },
    selectPaymentMethod(method) {
      this.paymentMethod = method;
    },
    validate() {
      if (!this.form.customerSubject.subjectName || !this.form.customerSubject.subjectPhone) {
        common_vendor.index.showToast({ title: "请填写完整的客户主体信息", icon: "none" });
        return false;
      }
      if (!this.form.origin.provinceId || !this.form.origin.cityId || !this.form.destination.provinceId || !this.form.destination.cityId) {
        common_vendor.index.showToast({ title: "请返回首页重新选择起止城市", icon: "none" });
        return false;
      }
      if (this.form.hasPickupService && !this.form.origin.addressDetail) {
        common_vendor.index.showToast({ title: "请填写详细提车地址", icon: "none" });
        return false;
      }
      if (this.form.hasDeliveryService && !this.form.destination.addressDetail) {
        common_vendor.index.showToast({ title: "请填写详细送车地址", icon: "none" });
        return false;
      }
      if (!this.form.sender.name || !this.form.sender.phone) {
        common_vendor.index.showToast({ title: "请填写完整的发车人信息", icon: "none" });
        return false;
      }
      if (!this.form.receiver.name || !this.form.receiver.phone) {
        common_vendor.index.showToast({ title: "请填写完整的收车人信息", icon: "none" });
        return false;
      }
      const invalidVehicle = this.form.vehicles.find(
        (vehicle) => !vehicle.brandName || !vehicle.seriesName || !vehicle.modelName
      );
      if (this.form.vehicles.length === 0 || invalidVehicle) {
        common_vendor.index.showToast({ title: "请完整选择承运车辆车型", icon: "none" });
        return false;
      }
      const missingVehicleIdentity = this.form.vehicles.find(
        (vehicle) => !vehicle.vin && !vehicle.plateNo
      );
      if (missingVehicleIdentity) {
        common_vendor.index.showToast({ title: "车架号和车牌号至少填写一个", icon: "none" });
        return false;
      }
      if (!this.orderAmountYuan || isNaN(this.orderAmountYuan)) {
        common_vendor.index.showToast({ title: "请输入正确的总运输费", icon: "none" });
        return false;
      }
      if (!this.agreedDate) {
        common_vendor.index.showToast({ title: "请选择约定送达时间", icon: "none" });
        return false;
      }
      return true;
    },
    onNextStep() {
      if (!this.validate())
        return;
      if (!this.platformGuaranteeService.priceCent || this.platformGuaranteeItems.length === 0) {
        common_vendor.index.showToast({ title: "平台担保交易服务暂不可用", icon: "none" });
        this.loadPlatformGuaranteeService();
        return;
      }
      this.openDrawer("payment");
    },
    async executeOrderPayment() {
      if (!this.paymentConsent) {
        common_vendor.index.showToast({ title: "请同意担保交易服务协议", icon: "none" });
        return;
      }
      this.submitting = true;
      try {
        const payloadVehicles = this.form.vehicles.map((v) => ({
          brandId: v.brandId || void 0,
          brandName: v.brandName,
          seriesId: v.seriesId || void 0,
          seriesName: v.seriesName,
          modelId: v.modelId || void 0,
          modelName: v.modelName,
          vin: v.vin || "",
          plateNumber: v.plateNo || "",
          estimatedValueCent: common_vendor.yuanToCent(Number(v.valuationTenThousandYuan || 0) * 1e4),
          vehicleConditionType: v.vehicleConditionType || "USED"
        }));
        const amountCent = common_vendor.yuanToCent(this.orderAmountYuan);
        const deliveryISO = (/* @__PURE__ */ new Date(this.agreedDate + "T18:00:00")).toISOString();
        const order = await common_vendor.api.createOrder({
          ...this.form,
          vehicles: payloadVehicles,
          orderAmountCent: amountCent,
          agreedDeliveryTime: deliveryISO
        });
        const payment = await common_vendor.api.createGuaranteePayment(order.orderId);
        await common_vendor.api.simulatePaymentSuccess(payment.paymentId);
        this.closeDrawer();
        common_vendor.index.setStorageSync(
          "dealer_pending_order_detail",
          JSON.stringify({ orderId: order.orderId, paymentSuccess: true })
        );
        common_vendor.index.switchTab({ url: "/pages/order/list" });
      } catch (err) {
        common_vendor.index.showToast({ title: "订单创建失败：" + (err.message || "网络错误"), icon: "none" });
      } finally {
        this.submitting = false;
      }
    },
    vehicleTitle(vehicle) {
      return [vehicle.brandName, vehicle.seriesName, vehicle.modelName].filter(Boolean).join(" ") || "待完善车辆信息";
    }
  }
};
if (!Array) {
  const _easycom_address_map_picker2 = common_vendor.resolveComponent("address-map-picker");
  _easycom_address_map_picker2();
}
const _easycom_address_map_picker = () => "../../components/address-map-picker/address-map-picker.js";
if (!Math) {
  _easycom_address_map_picker();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.t($data.form.carrierId ? $data.carrier.carrierName : "未入驻承运商 " + $data.form.carrierPhone),
    b: common_vendor.t($data.form.customerSubject.subjectName || "请填写客户企业/姓名"),
    c: $data.form.customerSubject.subjectPhone
  }, $data.form.customerSubject.subjectPhone ? {
    d: common_vendor.t($data.form.customerSubject.subjectPhone)
  } : {}, {
    e: common_vendor.o(($event) => $options.openDrawer("customer"), "08"),
    f: common_vendor.t($options.originText),
    g: $data.form.hasPickupService ? 1 : "",
    h: common_vendor.o(($event) => $data.form.hasPickupService = !$data.form.hasPickupService, "8d"),
    i: $data.form.hasPickupService
  }, $data.form.hasPickupService ? common_vendor.e({
    j: $data.form.origin.addressPoiName || $data.form.origin.addressDetail
  }, $data.form.origin.addressPoiName || $data.form.origin.addressDetail ? common_vendor.e({
    k: common_vendor.t($data.form.origin.addressPoiName || $data.form.origin.addressDetail),
    l: $data.form.origin.addressDetail
  }, $data.form.origin.addressDetail ? {
    m: common_vendor.t($data.form.origin.addressDetail)
  } : {}) : {}, {
    n: common_vendor.o(($event) => $options.openRouteAddressPicker("origin"), "28")
  }) : {}, {
    o: common_vendor.t($options.destinationText),
    p: $data.form.hasDeliveryService ? 1 : "",
    q: common_vendor.o(($event) => $data.form.hasDeliveryService = !$data.form.hasDeliveryService, "57"),
    r: $data.form.hasDeliveryService
  }, $data.form.hasDeliveryService ? common_vendor.e({
    s: $data.form.destination.addressPoiName || $data.form.destination.addressDetail
  }, $data.form.destination.addressPoiName || $data.form.destination.addressDetail ? common_vendor.e({
    t: common_vendor.t($data.form.destination.addressPoiName || $data.form.destination.addressDetail),
    v: $data.form.destination.addressDetail
  }, $data.form.destination.addressDetail ? {
    w: common_vendor.t($data.form.destination.addressDetail)
  } : {}) : {}, {
    x: common_vendor.o(($event) => $options.openRouteAddressPicker("destination"), "d5")
  }) : {}, {
    y: $data.form.sender.name
  }, $data.form.sender.name ? {
    z: common_vendor.t($data.form.sender.name),
    A: common_vendor.t($data.form.sender.phone)
  } : {}, {
    B: common_vendor.o(($event) => $options.openDrawer("sender"), "4c"),
    C: $data.form.receiver.name
  }, $data.form.receiver.name ? {
    D: common_vendor.t($data.form.receiver.name),
    E: common_vendor.t($data.form.receiver.phone)
  } : {}, {
    F: common_vendor.o(($event) => $options.openDrawer("receiver"), "f4"),
    G: common_vendor.t($data.form.vehicles.length),
    H: $data.form.vehicles.length > 0
  }, $data.form.vehicles.length > 0 ? {
    I: common_vendor.f($data.form.vehicles, (v, idx, i0) => {
      return common_vendor.e({
        a: common_vendor.t($options.vehicleTitle(v)),
        b: common_vendor.t(v.vehicleConditionType === "NEW" ? "新车" : "二手车"),
        c: v.vin || v.plateNo
      }, v.vin || v.plateNo ? {
        d: common_vendor.t(v.plateNo || v.vin)
      } : {}, {
        e: v.valuationTenThousandYuan
      }, v.valuationTenThousandYuan ? {
        f: common_vendor.t(v.valuationTenThousandYuan)
      } : {}, {
        g: idx
      });
    })
  } : {}, {
    J: common_vendor.o(($event) => $options.openDrawer("vehicle"), "9f"),
    K: common_vendor.t($options.transportModeLabel),
    L: $data.transportModes,
    M: common_vendor.o((...args) => $options.changeTransportMode && $options.changeTransportMode(...args), "56"),
    N: $data.orderAmountYuan,
    O: common_vendor.o(($event) => $data.orderAmountYuan = $event.detail.value, "2e"),
    P: $data.form.hasInvoice === true ? 1 : "",
    Q: common_vendor.o(($event) => $data.form.hasInvoice = true, "4a"),
    R: $data.form.hasInvoice === false ? 1 : "",
    S: common_vendor.o(($event) => $data.form.hasInvoice = false, "f0"),
    T: common_vendor.t($data.agreedDate || "请选择"),
    U: common_vendor.o((...args) => $options.changeDeliveryDate && $options.changeDeliveryDate(...args), "e1"),
    V: $data.submitting,
    W: common_vendor.o((...args) => $options.onNextStep && $options.onNextStep(...args), "b9"),
    X: $data.activeDrawer === "customer" ? 1 : "",
    Y: common_vendor.o((...args) => $options.closeDrawer && $options.closeDrawer(...args), "7b"),
    Z: common_vendor.o((...args) => $options.closeDrawer && $options.closeDrawer(...args), "0f"),
    aa: $data.form.customerSubject.subjectType === "ENTERPRISE" ? 1 : "",
    ab: common_vendor.o(($event) => $data.form.customerSubject.subjectType = "ENTERPRISE", "af"),
    ac: $data.form.customerSubject.subjectType === "PERSONAL" ? 1 : "",
    ad: common_vendor.o(($event) => $data.form.customerSubject.subjectType = "PERSONAL", "6e"),
    ae: $data.form.customerSubject.subjectName,
    af: common_vendor.o(($event) => $data.form.customerSubject.subjectName = $event.detail.value, "f3"),
    ag: $data.form.customerSubject.subjectPhone,
    ah: common_vendor.o(($event) => $data.form.customerSubject.subjectPhone = $event.detail.value, "cb"),
    ai: common_vendor.o((...args) => $options.closeDrawer && $options.closeDrawer(...args), "5e"),
    aj: $data.activeDrawer === "customer" ? 1 : "",
    ak: $data.activeDrawer === "sender" ? 1 : "",
    al: common_vendor.o((...args) => $options.closeDrawer && $options.closeDrawer(...args), "0d"),
    am: common_vendor.o((...args) => $options.closeDrawer && $options.closeDrawer(...args), "f7"),
    an: $data.form.sender.name,
    ao: common_vendor.o(($event) => $data.form.sender.name = $event.detail.value, "56"),
    ap: $data.form.sender.phone,
    aq: common_vendor.o(($event) => $data.form.sender.phone = $event.detail.value, "11"),
    ar: common_vendor.o(($event) => $options.copyCustomerTo("sender"), "ca"),
    as: common_vendor.o((...args) => $options.closeDrawer && $options.closeDrawer(...args), "df"),
    at: $data.activeDrawer === "sender" ? 1 : "",
    av: $data.activeDrawer === "receiver" ? 1 : "",
    aw: common_vendor.o((...args) => $options.closeDrawer && $options.closeDrawer(...args), "f7"),
    ax: common_vendor.o((...args) => $options.closeDrawer && $options.closeDrawer(...args), "89"),
    ay: $data.form.receiver.name,
    az: common_vendor.o(($event) => $data.form.receiver.name = $event.detail.value, "1f"),
    aA: $data.form.receiver.phone,
    aB: common_vendor.o(($event) => $data.form.receiver.phone = $event.detail.value, "cf"),
    aC: common_vendor.o(($event) => $options.copyCustomerTo("receiver"), "09"),
    aD: common_vendor.o((...args) => $options.closeDrawer && $options.closeDrawer(...args), "7b"),
    aE: $data.activeDrawer === "receiver" ? 1 : "",
    aF: $data.activeDrawer === "vehicle" ? 1 : "",
    aG: common_vendor.o((...args) => $options.closeDrawer && $options.closeDrawer(...args), "b4"),
    aH: common_vendor.o((...args) => $options.closeDrawer && $options.closeDrawer(...args), "9e"),
    aI: common_vendor.f($data.form.vehicles, (v, index, i0) => {
      return common_vendor.e({
        a: common_vendor.t(index + 1)
      }, $data.form.vehicles.length > 1 ? {
        b: common_vendor.o(($event) => $options.removeVehicle(index), index)
      } : {}, {
        c: $options.vehicleTitle(v) !== "待完善车辆信息"
      }, $options.vehicleTitle(v) !== "待完善车辆信息" ? {
        d: common_vendor.t($options.vehicleTitle(v))
      } : {}, {
        e: common_vendor.o(($event) => $options.openVehiclePicker(index), index),
        f: v.vin,
        g: common_vendor.o(($event) => v.vin = $event.detail.value, index),
        h: v.plateNo,
        i: common_vendor.o(($event) => v.plateNo = $event.detail.value, index),
        j: v.valuationTenThousandYuan,
        k: common_vendor.o(($event) => v.valuationTenThousandYuan = $event.detail.value, index),
        l: v.vehicleConditionType === "USED" ? 1 : "",
        m: common_vendor.o(($event) => v.vehicleConditionType = "USED", index),
        n: v.vehicleConditionType === "NEW" ? 1 : "",
        o: common_vendor.o(($event) => v.vehicleConditionType = "NEW", index),
        p: index
      });
    }),
    aJ: $data.form.vehicles.length > 1,
    aK: common_vendor.o((...args) => $options.addVehicle && $options.addVehicle(...args), "8c"),
    aL: common_vendor.o((...args) => $options.closeDrawer && $options.closeDrawer(...args), "9e"),
    aM: $data.activeDrawer === "vehicle" ? 1 : "",
    aN: $data.activeDrawer === "vehiclePicker" ? 1 : "",
    aO: common_vendor.o((...args) => $options.closeVehiclePicker && $options.closeVehiclePicker(...args), "8e"),
    aP: common_vendor.o((...args) => $options.closeVehiclePicker && $options.closeVehiclePicker(...args), "ce"),
    aQ: $data.vehiclePickerStep === "brand" ? 1 : "",
    aR: $data.vehiclePickerStep === "series" ? 1 : "",
    aS: $data.vehiclePickerStep === "model" ? 1 : "",
    aT: $options.vehiclePickerSummary
  }, $options.vehiclePickerSummary ? {
    aU: common_vendor.t($options.vehiclePickerSummary)
  } : {}, {
    aV: common_vendor.f($options.vehiclePickerItems, (item, k0, i0) => {
      return {
        a: common_vendor.t($options.vehiclePickerItemName(item)),
        b: $options.vehiclePickerItemKey(item),
        c: common_vendor.o(($event) => $options.selectVehiclePickerItem(item), $options.vehiclePickerItemKey(item))
      };
    }),
    aW: $data.vehiclePickerLoading
  }, $data.vehiclePickerLoading ? {} : $options.vehiclePickerItems.length === 0 ? {} : {}, {
    aX: $options.vehiclePickerItems.length === 0,
    aY: $data.activeDrawer === "vehiclePicker" ? 1 : "",
    aZ: $data.activeDrawer === "payment" ? 1 : "",
    ba: common_vendor.o((...args) => $options.closeDrawer && $options.closeDrawer(...args), "11"),
    bb: common_vendor.o((...args) => $options.closeDrawer && $options.closeDrawer(...args), "26"),
    bc: common_vendor.t($options.totalPayAmountYuan),
    bd: common_vendor.f($data.platformGuaranteeItems, (item, k0, i0) => {
      return common_vendor.e({
        a: common_vendor.t(item.serviceName),
        b: item.description
      }, item.description ? {
        c: common_vendor.t(item.description)
      } : {}, {
        d: item.serviceType
      });
    }),
    be: $data.agreedDate
  }, $data.agreedDate ? {
    bf: common_vendor.t($data.agreedDate)
  } : {}, {
    bg: $data.paymentMethod === "alipay"
  }, $data.paymentMethod === "alipay" ? {} : {}, {
    bh: $data.paymentMethod === "alipay" ? 1 : "",
    bi: common_vendor.o(($event) => $options.selectPaymentMethod("alipay"), "44"),
    bj: $data.paymentMethod === "wechat"
  }, $data.paymentMethod === "wechat" ? {} : {}, {
    bk: $data.paymentMethod === "wechat" ? 1 : "",
    bl: common_vendor.o(($event) => $options.selectPaymentMethod("wechat"), "fd"),
    bm: $data.paymentConsent ? 1 : "",
    bn: common_vendor.o(($event) => $data.paymentConsent = !$data.paymentConsent, "f1"),
    bo: common_vendor.t($options.totalPayAmountYuan),
    bp: $data.submitting,
    bq: common_vendor.o((...args) => $options.executeOrderPayment && $options.executeOrderPayment(...args), "e6"),
    br: $data.activeDrawer === "payment" ? 1 : "",
    bs: common_vendor.sr("routeAddressMapPicker", "3081147e-0"),
    bt: common_vendor.o($options.onRouteAddressSelect, "b0"),
    bv: common_vendor.p({
      title: $options.routeAddressPickerTitle,
      placeholder: "搜索市场、园区、道路、公司名称"
    })
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
