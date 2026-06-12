"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const utils_format = require("../../utils/format.js");
const AddressMapPicker = () => "../address-map-picker/address-map-picker.js";
const RegionPicker = () => "../region-picker/region-picker.js";
function blankRoute() {
  return {
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
  };
}
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
  };
}
function blankForm() {
  return {
    transportMode: "LARGE_TRUCK",
    customerSubject: {
      subjectType: "ENTERPRISE",
      subjectName: "",
      subjectPhone: ""
    },
    origin: blankRoute(),
    destination: blankRoute(),
    hasPickupService: false,
    hasDeliveryService: false,
    sender: { name: "", phone: "" },
    receiver: { name: "", phone: "" },
    vehicles: [blankVehicle()],
    hasInvoice: false
  };
}
function clone(value) {
  return JSON.parse(JSON.stringify(value || {}));
}
const _sfc_main = {
  components: { AddressMapPicker, RegionPicker },
  props: {
    seed: {
      type: Object,
      default: () => ({})
    },
    seedVersion: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      activeDrawer: "",
      routeCityTarget: "origin",
      routeAddressTarget: "origin",
      orderAmountYuan: "",
      agreedDate: "",
      transportModes: [
        { label: "大板托运", value: "LARGE_TRUCK" },
        { label: "小板托运", value: "SMALL_TRUCK" }
      ],
      vehiclePickerIndex: -1,
      vehiclePickerStep: "brand",
      vehiclePickerLoading: false,
      vehicleSearchKeyword: "",
      vehicleSearchResults: [],
      vehicleSearchTimer: null,
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
      form: blankForm()
    };
  },
  computed: {
    transportModeLabel() {
      var _a;
      return ((_a = this.transportModes.find((item) => item.value === this.form.transportMode)) == null ? void 0 : _a.label) || "大板托运";
    },
    routeAddressPickerTitle() {
      return this.routeAddressTarget === "origin" ? "选择提车详细位置" : "选择送车详细位置";
    },
    routeCityPickerTitle() {
      return this.routeCityTarget === "origin" ? "选择起始城市" : "选择目的城市";
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
    },
    customerSubjectTypeText() {
      return this.form.customerSubject.subjectType === "PERSONAL" ? "个人" : "企业";
    }
  },
  watch: {
    seedVersion: {
      immediate: true,
      handler() {
        this.applySeed(this.seed);
      }
    }
  },
  methods: {
    applySeed(seed = {}) {
      var _a;
      const next = blankForm();
      const seedForm = clone(seed.form || {});
      const vehicles = ((_a = seedForm.vehicles) == null ? void 0 : _a.length) ? seedForm.vehicles : next.vehicles;
      this.form = {
        ...next,
        ...seedForm,
        customerSubject: {
          ...next.customerSubject,
          ...seedForm.customerSubject || {}
        },
        origin: {
          ...next.origin,
          ...seedForm.origin || {}
        },
        destination: {
          ...next.destination,
          ...seedForm.destination || {}
        },
        sender: {
          ...next.sender,
          ...seedForm.sender || {}
        },
        receiver: {
          ...next.receiver,
          ...seedForm.receiver || {}
        },
        vehicles
      };
      this.orderAmountYuan = seed.orderAmountYuan || "";
      this.agreedDate = seed.agreedDate || "";
    },
    openDrawer(type) {
      this.activeDrawer = type;
    },
    closeDrawer() {
      this.activeDrawer = "";
    },
    routeText(route, placeholder) {
      return [route.provinceName, route.cityName].filter(Boolean).join(" ") || placeholder;
    },
    openRouteCityPicker(target) {
      this.routeCityTarget = target;
      this.$refs.routeCityPicker.open();
    },
    onRouteCitySelect(region) {
      const route = this.form[this.routeCityTarget];
      if (!route)
        return;
      route.provinceId = region.provinceId;
      route.provinceName = region.provinceName;
      route.cityId = region.cityId;
      route.cityName = region.cityName;
      route.districtId = "";
      route.districtName = "";
      route.addressPoiName = "";
      route.addressDetail = "";
      route.longitude = region.longitude || "";
      route.latitude = region.latitude || "";
    },
    openRouteAddressPicker(target) {
      const route = this.form[target];
      if (!route || !route.cityId) {
        common_vendor.index.showToast({ title: "请先选择城市", icon: "none" });
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
      const route = this.form[this.routeAddressTarget] || this.form.origin;
      const name = (address.name || "").trim();
      route.addressPoiName = name;
      route.addressDetail = address.address || name;
      route.longitude = address.lng || "";
      route.latitude = address.lat || "";
      route.districtName = address.districtName || route.districtName || "";
      route.districtId = address.districtId || route.districtId || "";
    },
    changeTransportMode(event) {
      this.form.transportMode = this.transportModes[event.detail.value].value;
    },
    changeDeliveryDate(event) {
      this.agreedDate = event.detail.value;
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
      this.vehicleSearchKeyword = "";
      this.vehicleSearchResults = [];
      if (this.vehicleSearchTimer)
        clearTimeout(this.vehicleSearchTimer);
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
      this.activeDrawer = "";
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
    async loadVehicleBrands() {
      if (this.vehicleBrands.length)
        return;
      this.vehiclePickerLoading = true;
      try {
        const data = await utils_api.api.vehicleBrands();
        this.vehicleBrands = data.items || [];
      } finally {
        this.vehiclePickerLoading = false;
      }
    },
    async loadVehicleSeries(brandId) {
      this.vehiclePickerLoading = true;
      this.vehicleSeriesList = [];
      try {
        const data = await utils_api.api.vehicleSeries(brandId);
        this.vehicleSeriesList = data.items || [];
      } finally {
        this.vehiclePickerLoading = false;
      }
    },
    async loadVehicleModels(seriesId) {
      this.vehiclePickerLoading = true;
      this.vehicleModelList = [];
      try {
        const data = await utils_api.api.vehicleModels(seriesId);
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
    onVehicleSearchInput() {
      if (this.vehicleSearchTimer)
        clearTimeout(this.vehicleSearchTimer);
      this.vehicleSearchTimer = setTimeout(() => this.searchVehicleModelsNow(), 300);
    },
    clearVehicleSearch() {
      this.vehicleSearchKeyword = "";
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
        const data = await utils_api.api.searchVehicleModels({ keyword, page: 1, pageSize: 30 });
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
      return [vehicle.brandName, vehicle.seriesName, vehicle.modelName].filter(Boolean).join(" ") || "请选择品牌/车系/车型";
    },
    validate() {
      if (!this.form.customerSubject.subjectName || !this.form.customerSubject.subjectPhone) {
        common_vendor.index.showToast({ title: "请填写客户主体信息", icon: "none" });
        return false;
      }
      if (!this.form.origin.provinceId || !this.form.origin.cityId) {
        common_vendor.index.showToast({ title: "请选择起始城市", icon: "none" });
        return false;
      }
      if (!this.form.destination.provinceId || !this.form.destination.cityId) {
        common_vendor.index.showToast({ title: "请选择目的城市", icon: "none" });
        return false;
      }
      if (this.form.hasPickupService && !this.form.origin.addressDetail) {
        common_vendor.index.showToast({ title: "请填写提车地址", icon: "none" });
        return false;
      }
      if (this.form.hasDeliveryService && !this.form.destination.addressDetail) {
        common_vendor.index.showToast({ title: "请填写送车地址", icon: "none" });
        return false;
      }
      if (!this.form.sender.name || !this.form.sender.phone) {
        common_vendor.index.showToast({ title: "请填写发车人信息", icon: "none" });
        return false;
      }
      if (!this.form.receiver.name || !this.form.receiver.phone) {
        common_vendor.index.showToast({ title: "请填写收车人信息", icon: "none" });
        return false;
      }
      const invalidVehicle = this.form.vehicles.find(
        (vehicle) => !vehicle.brandName || !vehicle.seriesName || !vehicle.modelName
      );
      if (this.form.vehicles.length === 0 || invalidVehicle) {
        common_vendor.index.showToast({ title: "请完整选择车辆车型", icon: "none" });
        return false;
      }
      if (this.form.vehicles.find((vehicle) => !vehicle.vin && !vehicle.plateNo)) {
        common_vendor.index.showToast({ title: "车架号和车牌号至少填一个", icon: "none" });
        return false;
      }
      if (!this.orderAmountYuan || isNaN(this.orderAmountYuan)) {
        common_vendor.index.showToast({ title: "请输入正确的运输费", icon: "none" });
        return false;
      }
      if (!this.agreedDate) {
        common_vendor.index.showToast({ title: "请选择约定送达时间", icon: "none" });
        return false;
      }
      return true;
    },
    buildPayload(extra = {}) {
      return {
        ...extra,
        ...this.form,
        orderAmountCent: utils_format.yuanToCent(this.orderAmountYuan),
        agreedDeliveryTime: (/* @__PURE__ */ new Date(`${this.agreedDate}T18:00:00`)).toISOString(),
        vehicles: this.form.vehicles.map((vehicle) => ({
          brandId: vehicle.brandId || void 0,
          brandName: vehicle.brandName,
          seriesId: vehicle.seriesId || void 0,
          seriesName: vehicle.seriesName,
          modelId: vehicle.modelId || void 0,
          modelName: vehicle.modelName,
          vin: vehicle.vin || "",
          plateNumber: vehicle.plateNo || "",
          estimatedValueCent: utils_format.yuanToCent(Number(vehicle.valuationTenThousandYuan || 0) * 1e4),
          vehicleConditionType: vehicle.vehicleConditionType || "USED"
        }))
      };
    }
  }
};
if (!Array) {
  const _easycom_address_map_picker2 = common_vendor.resolveComponent("address-map-picker");
  const _easycom_region_picker2 = common_vendor.resolveComponent("region-picker");
  (_easycom_address_map_picker2 + _easycom_region_picker2)();
}
const _easycom_address_map_picker = () => "../address-map-picker/address-map-picker.js";
const _easycom_region_picker = () => "../region-picker/region-picker.js";
if (!Math) {
  (_easycom_address_map_picker + _easycom_region_picker)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.t($data.form.customerSubject.subjectName || "请填写客户企业/姓名"),
    b: common_vendor.t($options.customerSubjectTypeText),
    c: $data.form.customerSubject.subjectPhone
  }, $data.form.customerSubject.subjectPhone ? {
    d: common_vendor.t($data.form.customerSubject.subjectPhone)
  } : {}, {
    e: common_vendor.o(($event) => $options.openDrawer("customer"), "c2"),
    f: common_vendor.t($options.routeText($data.form.origin, "请选择起始城市")),
    g: common_vendor.o(($event) => $options.openRouteCityPicker("origin"), "74"),
    h: common_vendor.t($data.form.hasPickupService ? "需要提车" : "不需要提车"),
    i: $data.form.hasPickupService ? 1 : "",
    j: common_vendor.o(($event) => $data.form.hasPickupService = !$data.form.hasPickupService, "e7"),
    k: $data.form.hasPickupService
  }, $data.form.hasPickupService ? {
    l: common_vendor.t($data.form.origin.addressDetail || "请选择/输入提车详细地址"),
    m: common_vendor.o(($event) => $options.openRouteAddressPicker("origin"), "92")
  } : {}, {
    n: common_vendor.t($options.routeText($data.form.destination, "请选择目的城市")),
    o: common_vendor.o(($event) => $options.openRouteCityPicker("destination"), "0d"),
    p: common_vendor.t($data.form.hasDeliveryService ? "需要送车" : "不需要送车"),
    q: $data.form.hasDeliveryService ? 1 : "",
    r: common_vendor.o(($event) => $data.form.hasDeliveryService = !$data.form.hasDeliveryService, "00"),
    s: $data.form.hasDeliveryService
  }, $data.form.hasDeliveryService ? {
    t: common_vendor.t($data.form.destination.addressDetail || "请选择/输入送车详细地址"),
    v: common_vendor.o(($event) => $options.openRouteAddressPicker("destination"), "ec")
  } : {}, {
    w: $data.form.sender.name
  }, $data.form.sender.name ? {
    x: common_vendor.t($data.form.sender.name),
    y: common_vendor.t($data.form.sender.phone)
  } : {}, {
    z: common_vendor.o(($event) => $options.openDrawer("sender"), "17"),
    A: $data.form.receiver.name
  }, $data.form.receiver.name ? {
    B: common_vendor.t($data.form.receiver.name),
    C: common_vendor.t($data.form.receiver.phone)
  } : {}, {
    D: common_vendor.o(($event) => $options.openDrawer("receiver"), "ed"),
    E: common_vendor.t($data.form.vehicles.length),
    F: $data.form.vehicles.length > 0
  }, $data.form.vehicles.length > 0 ? {
    G: common_vendor.f($data.form.vehicles, (vehicle, index, i0) => {
      return common_vendor.e({
        a: common_vendor.t($options.vehicleTitle(vehicle)),
        b: common_vendor.t(vehicle.vehicleConditionType === "NEW" ? "新车" : "二手车"),
        c: vehicle.vin || vehicle.plateNo
      }, vehicle.vin || vehicle.plateNo ? {
        d: common_vendor.t(vehicle.plateNo || vehicle.vin)
      } : {}, {
        e: vehicle.valuationTenThousandYuan
      }, vehicle.valuationTenThousandYuan ? {
        f: common_vendor.t(vehicle.valuationTenThousandYuan)
      } : {}, {
        g: index
      });
    })
  } : {}, {
    H: common_vendor.o(($event) => $options.openDrawer("vehicle"), "a2"),
    I: $data.activeDrawer === "vehicle" ? 1 : "",
    J: common_vendor.o((...args) => $options.closeDrawer && $options.closeDrawer(...args), "d9"),
    K: common_vendor.o((...args) => $options.closeDrawer && $options.closeDrawer(...args), "e6"),
    L: common_vendor.f($data.form.vehicles, (vehicle, index, i0) => {
      return common_vendor.e({
        a: common_vendor.t(index + 1)
      }, $data.form.vehicles.length > 1 ? {
        b: common_vendor.o(($event) => $options.removeVehicle(index), index)
      } : {}, {
        c: $options.vehicleTitle(vehicle) !== "请选择品牌/车系/车型"
      }, $options.vehicleTitle(vehicle) !== "请选择品牌/车系/车型" ? {
        d: common_vendor.t($options.vehicleTitle(vehicle))
      } : {}, {
        e: common_vendor.o(($event) => $options.openVehiclePicker(index), index),
        f: vehicle.vin,
        g: common_vendor.o(($event) => vehicle.vin = $event.detail.value, index),
        h: vehicle.plateNo,
        i: common_vendor.o(($event) => vehicle.plateNo = $event.detail.value, index),
        j: vehicle.valuationTenThousandYuan,
        k: common_vendor.o(($event) => vehicle.valuationTenThousandYuan = $event.detail.value, index),
        l: vehicle.vehicleConditionType === "USED" ? 1 : "",
        m: common_vendor.o(($event) => vehicle.vehicleConditionType = "USED", index),
        n: vehicle.vehicleConditionType === "NEW" ? 1 : "",
        o: common_vendor.o(($event) => vehicle.vehicleConditionType = "NEW", index),
        p: index
      });
    }),
    M: $data.form.vehicles.length > 1,
    N: common_vendor.o((...args) => $options.addVehicle && $options.addVehicle(...args), "c4"),
    O: common_vendor.o((...args) => $options.closeDrawer && $options.closeDrawer(...args), "35"),
    P: $data.activeDrawer === "vehicle" ? 1 : "",
    Q: common_vendor.t($options.transportModeLabel),
    R: $data.transportModes,
    S: common_vendor.o((...args) => $options.changeTransportMode && $options.changeTransportMode(...args), "95"),
    T: $data.orderAmountYuan,
    U: common_vendor.o(($event) => $data.orderAmountYuan = $event.detail.value, "1d"),
    V: $data.form.hasInvoice ? 1 : "",
    W: common_vendor.o(($event) => $data.form.hasInvoice = true, "f1"),
    X: !$data.form.hasInvoice ? 1 : "",
    Y: common_vendor.o(($event) => $data.form.hasInvoice = false, "c7"),
    Z: common_vendor.t($data.agreedDate || "请选择"),
    aa: $data.agreedDate,
    ab: common_vendor.o((...args) => $options.changeDeliveryDate && $options.changeDeliveryDate(...args), "21"),
    ac: $data.activeDrawer === "customer" ? 1 : "",
    ad: common_vendor.o((...args) => $options.closeDrawer && $options.closeDrawer(...args), "d1"),
    ae: common_vendor.o((...args) => $options.closeDrawer && $options.closeDrawer(...args), "fe"),
    af: $data.form.customerSubject.subjectType === "ENTERPRISE" ? 1 : "",
    ag: common_vendor.o(($event) => $data.form.customerSubject.subjectType = "ENTERPRISE", "2b"),
    ah: $data.form.customerSubject.subjectType === "PERSONAL" ? 1 : "",
    ai: common_vendor.o(($event) => $data.form.customerSubject.subjectType = "PERSONAL", "80"),
    aj: $data.form.customerSubject.subjectName,
    ak: common_vendor.o(($event) => $data.form.customerSubject.subjectName = $event.detail.value, "e0"),
    al: $data.form.customerSubject.subjectPhone,
    am: common_vendor.o(($event) => $data.form.customerSubject.subjectPhone = $event.detail.value, "70"),
    an: common_vendor.o((...args) => $options.closeDrawer && $options.closeDrawer(...args), "0e"),
    ao: $data.activeDrawer === "customer" ? 1 : "",
    ap: $data.activeDrawer === "sender" ? 1 : "",
    aq: common_vendor.o((...args) => $options.closeDrawer && $options.closeDrawer(...args), "d6"),
    ar: common_vendor.o((...args) => $options.closeDrawer && $options.closeDrawer(...args), "cf"),
    as: $data.form.sender.name,
    at: common_vendor.o(($event) => $data.form.sender.name = $event.detail.value, "be"),
    av: $data.form.sender.phone,
    aw: common_vendor.o(($event) => $data.form.sender.phone = $event.detail.value, "bd"),
    ax: common_vendor.o(($event) => $options.copyCustomerTo("sender"), "2a"),
    ay: common_vendor.o((...args) => $options.closeDrawer && $options.closeDrawer(...args), "f3"),
    az: $data.activeDrawer === "sender" ? 1 : "",
    aA: $data.activeDrawer === "receiver" ? 1 : "",
    aB: common_vendor.o((...args) => $options.closeDrawer && $options.closeDrawer(...args), "bd"),
    aC: common_vendor.o((...args) => $options.closeDrawer && $options.closeDrawer(...args), "20"),
    aD: $data.form.receiver.name,
    aE: common_vendor.o(($event) => $data.form.receiver.name = $event.detail.value, "fd"),
    aF: $data.form.receiver.phone,
    aG: common_vendor.o(($event) => $data.form.receiver.phone = $event.detail.value, "1e"),
    aH: common_vendor.o(($event) => $options.copyCustomerTo("receiver"), "92"),
    aI: common_vendor.o((...args) => $options.closeDrawer && $options.closeDrawer(...args), "85"),
    aJ: $data.activeDrawer === "receiver" ? 1 : "",
    aK: $data.activeDrawer === "vehiclePicker" ? 1 : "",
    aL: common_vendor.o((...args) => $options.closeVehiclePicker && $options.closeVehiclePicker(...args), "61"),
    aM: common_vendor.o((...args) => $options.closeVehiclePicker && $options.closeVehiclePicker(...args), "29"),
    aN: common_vendor.o([($event) => $data.vehicleSearchKeyword = $event.detail.value, (...args) => $options.onVehicleSearchInput && $options.onVehicleSearchInput(...args)], "41"),
    aO: common_vendor.o((...args) => $options.searchVehicleModelsNow && $options.searchVehicleModelsNow(...args), "85"),
    aP: $data.vehicleSearchKeyword,
    aQ: $data.vehicleSearchKeyword
  }, $data.vehicleSearchKeyword ? {
    aR: common_vendor.o((...args) => $options.clearVehicleSearch && $options.clearVehicleSearch(...args), "a0")
  } : {}, {
    aS: $data.vehiclePickerStep === "brand" ? 1 : "",
    aT: $data.vehiclePickerStep === "series" ? 1 : "",
    aU: $data.vehiclePickerStep === "model" ? 1 : "",
    aV: $options.vehiclePickerSummary
  }, $options.vehiclePickerSummary ? {
    aW: common_vendor.t($options.vehiclePickerSummary)
  } : {}, {
    aX: $data.vehicleSearchKeyword
  }, $data.vehicleSearchKeyword ? common_vendor.e({
    aY: common_vendor.f($data.vehicleSearchResults, (item, k0, i0) => {
      return {
        a: common_vendor.t(item.modelName),
        b: common_vendor.t(item.brandName),
        c: common_vendor.t(item.seriesName),
        d: item.modelId,
        e: common_vendor.o(($event) => $options.selectVehicleSearchResult(item), item.modelId)
      };
    }),
    aZ: $data.vehiclePickerLoading
  }, $data.vehiclePickerLoading ? {} : $data.vehicleSearchResults.length === 0 ? {} : {}, {
    ba: $data.vehicleSearchResults.length === 0
  }) : common_vendor.e({
    bb: common_vendor.f($options.vehiclePickerItems, (item, k0, i0) => {
      return common_vendor.e({
        a: $data.vehiclePickerStep === "brand" && item.logoUrl
      }, $data.vehiclePickerStep === "brand" && item.logoUrl ? {
        b: item.logoUrl
      } : {}, {
        c: common_vendor.t($options.vehiclePickerItemName(item)),
        d: $data.vehiclePickerStep === "model" && item.year
      }, $data.vehiclePickerStep === "model" && item.year ? {
        e: common_vendor.t(item.year)
      } : {}, {
        f: $options.vehiclePickerItemKey(item),
        g: common_vendor.o(($event) => $options.selectVehiclePickerItem(item), $options.vehiclePickerItemKey(item))
      });
    }),
    bc: $data.vehiclePickerLoading
  }, $data.vehiclePickerLoading ? {} : $options.vehiclePickerItems.length === 0 ? {} : {}, {
    bd: $options.vehiclePickerItems.length === 0
  }), {
    be: $data.activeDrawer === "vehiclePicker" ? 1 : "",
    bf: common_vendor.sr("routeAddressMapPicker", "56ce42dc-0"),
    bg: common_vendor.o($options.onRouteAddressSelect, "b2"),
    bh: common_vendor.p({
      title: $options.routeAddressPickerTitle,
      placeholder: "搜索市场、园区、道路、公司名称"
    }),
    bi: common_vendor.sr("routeCityPicker", "56ce42dc-1"),
    bj: common_vendor.o($options.onRouteCitySelect, "ba"),
    bk: common_vendor.p({
      title: $options.routeCityPickerTitle
    })
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/dealer-order-form/dealer-order-form.js.map
