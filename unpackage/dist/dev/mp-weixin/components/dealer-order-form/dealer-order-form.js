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
    hasInvoice: false,
    hasInsurance: false,
    insuranceRemark: ""
  };
}
function clone(value) {
  return JSON.parse(JSON.stringify(value || {}));
}
function formatDateForPicker(date = /* @__PURE__ */ new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
      insuranceMaxAmountYuan: "",
      agreedDate: "",
      transportModes: [
        { label: "大板托运", value: "LARGE_TRUCK" },
        { label: "小板托运", value: "SMALL_TRUCK" },
        { label: "代驾", value: "DRIVING" }
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
    },
    todayDate() {
      return formatDateForPicker();
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
      this.insuranceMaxAmountYuan = seed.insuranceMaxAmountYuan || "";
      this.agreedDate = seed.agreedDate || "";
    },
    openDrawer(type) {
      this.activeDrawer = type;
    },
    closeDrawer() {
      this.activeDrawer = "";
    },
    confirmContactDrawer(role) {
      const contact = this.form[role];
      if (!contact)
        return;
      const roleText = role === "sender" ? "发车人" : "收车人";
      contact.name = (contact.name || "").trim();
      contact.phone = (contact.phone || "").trim();
      if (!contact.name) {
        common_vendor.index.showToast({ title: `请填写${roleText}姓名`, icon: "none" });
        return;
      }
      if (!contact.phone) {
        common_vendor.index.showToast({ title: `请填写${roleText}手机号`, icon: "none" });
        return;
      }
      this.closeDrawer();
    },
    normalizeVehicle(vehicle) {
      if (!vehicle)
        return;
      vehicle.vin = (vehicle.vin || "").trim();
      vehicle.plateNo = (vehicle.plateNo || "").trim();
      vehicle.valuationTenThousandYuan = String(vehicle.valuationTenThousandYuan ?? "").trim();
    },
    validateVehicles() {
      if (this.form.vehicles.length === 0) {
        common_vendor.index.showToast({ title: "请添加车辆信息", icon: "none" });
        return false;
      }
      for (const vehicle of this.form.vehicles) {
        this.normalizeVehicle(vehicle);
      }
      const invalidVehicle = this.form.vehicles.find(
        (vehicle) => !vehicle.brandName || !vehicle.seriesName || !vehicle.modelName
      );
      if (invalidVehicle) {
        common_vendor.index.showToast({ title: "请完整选择车辆车型", icon: "none" });
        return false;
      }
      if (this.form.vehicles.find((vehicle) => !vehicle.vin && !vehicle.plateNo)) {
        common_vendor.index.showToast({ title: "车架号和车牌号至少填一个", icon: "none" });
        return false;
      }
      if (this.form.vehicles.find((vehicle) => String(vehicle.vin || "").length > 17)) {
        common_vendor.index.showToast({ title: "车架号最多输入17位", icon: "none" });
        return false;
      }
      if (this.form.vehicles.find((vehicle) => vehicle.valuationTenThousandYuan === "")) {
        common_vendor.index.showToast({ title: "请填写车辆估值", icon: "none" });
        return false;
      }
      return true;
    },
    confirmVehicleDrawer() {
      if (!this.validateVehicles())
        return;
      this.closeDrawer();
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
      const selectedDate = event.detail.value;
      if (selectedDate && selectedDate < this.todayDate) {
        common_vendor.index.showToast({ title: "约定送达时间不能早于今天", icon: "none" });
        return;
      }
      this.agreedDate = selectedDate;
    },
    getAgreedDeliveryDateText() {
      return this.agreedDate || "";
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
      this.activeDrawer = "vehicle";
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
    async switchVehiclePickerStep(step) {
      this.clearVehicleSearch();
      if (step === "brand") {
        this.vehiclePickerStep = "brand";
        await this.loadVehicleBrands();
        return;
      }
      if (step === "series") {
        if (!this.pendingVehicleSelection.brandId) {
          common_vendor.index.showToast({ title: "请先选择品牌", icon: "none" });
          return;
        }
        this.pendingVehicleSelection.seriesId = "";
        this.pendingVehicleSelection.seriesName = "";
        this.pendingVehicleSelection.modelId = "";
        this.pendingVehicleSelection.modelName = "";
        this.vehiclePickerStep = "series";
        await this.loadVehicleSeries(this.pendingVehicleSelection.brandId);
        return;
      }
      if (!this.pendingVehicleSelection.seriesId) {
        common_vendor.index.showToast({ title: "请先选择车系", icon: "none" });
        return;
      }
      this.pendingVehicleSelection.modelId = "";
      this.pendingVehicleSelection.modelName = "";
      this.vehiclePickerStep = "model";
      await this.loadVehicleModels(this.pendingVehicleSelection.seriesId);
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
      if (this.form.hasPickupService && (!this.form.origin.addressDetail || !this.form.origin.longitude || !this.form.origin.latitude)) {
        common_vendor.index.showToast({ title: "请选择提车位置", icon: "none" });
        return false;
      }
      if (this.form.hasDeliveryService && (!this.form.destination.addressDetail || !this.form.destination.longitude || !this.form.destination.latitude)) {
        common_vendor.index.showToast({ title: "请选择送车位置", icon: "none" });
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
      if (!this.validateVehicles())
        return false;
      if (!this.orderAmountYuan || isNaN(this.orderAmountYuan)) {
        common_vendor.index.showToast({ title: "请输入正确的运输费", icon: "none" });
        return false;
      }
      if (this.form.hasInsurance && (!this.insuranceMaxAmountYuan || isNaN(this.insuranceMaxAmountYuan))) {
        common_vendor.index.showToast({ title: "请输入正确的最高保额", icon: "none" });
        return false;
      }
      if (!this.agreedDate) {
        common_vendor.index.showToast({ title: "请选择约定送达时间", icon: "none" });
        return false;
      }
      if (this.agreedDate < this.todayDate) {
        common_vendor.index.showToast({ title: "约定送达时间不能早于今天", icon: "none" });
        return false;
      }
      return true;
    },
    buildPayload(extra = {}) {
      const optionalVehicleEstimatedValueCent = (value) => {
        const text = String(value ?? "").trim();
        return text ? utils_format.yuanToCent(Number(text) * 1e4) : void 0;
      };
      return {
        ...extra,
        ...this.form,
        orderAmountCent: utils_format.yuanToCent(this.orderAmountYuan),
        hasInsurance: Boolean(this.form.hasInsurance),
        insuranceMaxAmountCent: this.form.hasInsurance ? utils_format.yuanToCent(this.insuranceMaxAmountYuan) : void 0,
        insuranceRemark: this.form.hasInsurance ? this.form.insuranceRemark || "" : "",
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
          estimatedValueCent: optionalVehicleEstimatedValueCent(vehicle.valuationTenThousandYuan),
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
    g: common_vendor.o(($event) => $options.openRouteCityPicker("origin"), "13"),
    h: common_vendor.t($data.form.hasPickupService ? "需要上门提车" : "无需上门提车"),
    i: common_vendor.t($data.form.hasPickupService ? "已开启" : "未开启"),
    j: $data.form.hasPickupService ? 1 : "",
    k: common_vendor.o(($event) => $data.form.hasPickupService = !$data.form.hasPickupService, "8c"),
    l: $data.form.hasPickupService
  }, $data.form.hasPickupService ? {
    m: common_vendor.t($data.form.origin.addressDetail || "请选择提车详细位置"),
    n: common_vendor.o(($event) => $options.openRouteAddressPicker("origin"), "b3")
  } : {}, {
    o: common_vendor.t($options.routeText($data.form.destination, "请选择目的城市")),
    p: common_vendor.o(($event) => $options.openRouteCityPicker("destination"), "2c"),
    q: common_vendor.t($data.form.hasDeliveryService ? "需要送车到点" : "无需送车到点"),
    r: common_vendor.t($data.form.hasDeliveryService ? "已开启" : "未开启"),
    s: $data.form.hasDeliveryService ? 1 : "",
    t: common_vendor.o(($event) => $data.form.hasDeliveryService = !$data.form.hasDeliveryService, "1a"),
    v: $data.form.hasDeliveryService
  }, $data.form.hasDeliveryService ? {
    w: common_vendor.t($data.form.destination.addressDetail || "请选择送车详细位置"),
    x: common_vendor.o(($event) => $options.openRouteAddressPicker("destination"), "26")
  } : {}, {
    y: $data.form.sender.name
  }, $data.form.sender.name ? {
    z: common_vendor.t($data.form.sender.name),
    A: common_vendor.t($data.form.sender.phone)
  } : {}, {
    B: common_vendor.o(($event) => $options.openDrawer("sender"), "0b"),
    C: $data.form.receiver.name
  }, $data.form.receiver.name ? {
    D: common_vendor.t($data.form.receiver.name),
    E: common_vendor.t($data.form.receiver.phone)
  } : {}, {
    F: common_vendor.o(($event) => $options.openDrawer("receiver"), "ad"),
    G: common_vendor.t($data.form.vehicles.length),
    H: $data.form.vehicles.length > 0
  }, $data.form.vehicles.length > 0 ? {
    I: common_vendor.f($data.form.vehicles, (vehicle, index, i0) => {
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
    J: common_vendor.o(($event) => $options.openDrawer("vehicle"), "c5"),
    K: $data.activeDrawer === "vehicle" ? 1 : "",
    L: common_vendor.o((...args) => $options.closeDrawer && $options.closeDrawer(...args), "79"),
    M: common_vendor.o((...args) => $options.closeDrawer && $options.closeDrawer(...args), "ef"),
    N: common_vendor.f($data.form.vehicles, (vehicle, index, i0) => {
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
    O: $data.form.vehicles.length > 1,
    P: common_vendor.o((...args) => $options.addVehicle && $options.addVehicle(...args), "3a"),
    Q: common_vendor.o((...args) => $options.confirmVehicleDrawer && $options.confirmVehicleDrawer(...args), "99"),
    R: $data.activeDrawer === "vehicle" ? 1 : "",
    S: common_vendor.t($options.transportModeLabel),
    T: $data.transportModes,
    U: common_vendor.o((...args) => $options.changeTransportMode && $options.changeTransportMode(...args), "f5"),
    V: $data.orderAmountYuan,
    W: common_vendor.o(($event) => $data.orderAmountYuan = $event.detail.value, "4d"),
    X: $data.form.hasInvoice ? 1 : "",
    Y: common_vendor.o(($event) => $data.form.hasInvoice = true, "b3"),
    Z: !$data.form.hasInvoice ? 1 : "",
    aa: common_vendor.o(($event) => $data.form.hasInvoice = false, "40"),
    ab: $data.form.hasInsurance ? 1 : "",
    ac: common_vendor.o(($event) => $data.form.hasInsurance = true, "d2"),
    ad: !$data.form.hasInsurance ? 1 : "",
    ae: common_vendor.o(($event) => $data.form.hasInsurance = false, "74"),
    af: $data.form.hasInsurance
  }, $data.form.hasInsurance ? {
    ag: $data.insuranceMaxAmountYuan,
    ah: common_vendor.o(($event) => $data.insuranceMaxAmountYuan = $event.detail.value, "66")
  } : {}, {
    ai: $data.form.hasInsurance
  }, $data.form.hasInsurance ? {
    aj: $data.form.insuranceRemark,
    ak: common_vendor.o(($event) => $data.form.insuranceRemark = $event.detail.value, "06")
  } : {}, {
    al: common_vendor.t($data.agreedDate || "请选择"),
    am: $data.agreedDate,
    an: $options.todayDate,
    ao: common_vendor.o((...args) => $options.changeDeliveryDate && $options.changeDeliveryDate(...args), "09"),
    ap: $data.activeDrawer === "customer" ? 1 : "",
    aq: common_vendor.o((...args) => $options.closeDrawer && $options.closeDrawer(...args), "64"),
    ar: common_vendor.o((...args) => $options.closeDrawer && $options.closeDrawer(...args), "cf"),
    as: $data.form.customerSubject.subjectType === "ENTERPRISE" ? 1 : "",
    at: common_vendor.o(($event) => $data.form.customerSubject.subjectType = "ENTERPRISE", "62"),
    av: $data.form.customerSubject.subjectType === "PERSONAL" ? 1 : "",
    aw: common_vendor.o(($event) => $data.form.customerSubject.subjectType = "PERSONAL", "c1"),
    ax: $data.form.customerSubject.subjectName,
    ay: common_vendor.o(($event) => $data.form.customerSubject.subjectName = $event.detail.value, "a3"),
    az: $data.form.customerSubject.subjectPhone,
    aA: common_vendor.o(($event) => $data.form.customerSubject.subjectPhone = $event.detail.value, "af"),
    aB: common_vendor.o((...args) => $options.closeDrawer && $options.closeDrawer(...args), "be"),
    aC: $data.activeDrawer === "customer" ? 1 : "",
    aD: $data.activeDrawer === "sender" ? 1 : "",
    aE: common_vendor.o((...args) => $options.closeDrawer && $options.closeDrawer(...args), "06"),
    aF: common_vendor.o((...args) => $options.closeDrawer && $options.closeDrawer(...args), "43"),
    aG: $data.form.sender.name,
    aH: common_vendor.o(($event) => $data.form.sender.name = $event.detail.value, "82"),
    aI: $data.form.sender.phone,
    aJ: common_vendor.o(($event) => $data.form.sender.phone = $event.detail.value, "1d"),
    aK: common_vendor.o(($event) => $options.copyCustomerTo("sender"), "b1"),
    aL: common_vendor.o(($event) => $options.confirmContactDrawer("sender"), "51"),
    aM: $data.activeDrawer === "sender" ? 1 : "",
    aN: $data.activeDrawer === "receiver" ? 1 : "",
    aO: common_vendor.o((...args) => $options.closeDrawer && $options.closeDrawer(...args), "db"),
    aP: common_vendor.o((...args) => $options.closeDrawer && $options.closeDrawer(...args), "ab"),
    aQ: $data.form.receiver.name,
    aR: common_vendor.o(($event) => $data.form.receiver.name = $event.detail.value, "3a"),
    aS: $data.form.receiver.phone,
    aT: common_vendor.o(($event) => $data.form.receiver.phone = $event.detail.value, "96"),
    aU: common_vendor.o(($event) => $options.copyCustomerTo("receiver"), "04"),
    aV: common_vendor.o(($event) => $options.confirmContactDrawer("receiver"), "6e"),
    aW: $data.activeDrawer === "receiver" ? 1 : "",
    aX: $data.activeDrawer === "vehiclePicker" ? 1 : "",
    aY: common_vendor.o((...args) => $options.closeVehiclePicker && $options.closeVehiclePicker(...args), "ba"),
    aZ: common_vendor.o((...args) => $options.closeVehiclePicker && $options.closeVehiclePicker(...args), "12"),
    ba: common_vendor.o([($event) => $data.vehicleSearchKeyword = $event.detail.value, (...args) => $options.onVehicleSearchInput && $options.onVehicleSearchInput(...args)], "41"),
    bb: common_vendor.o((...args) => $options.searchVehicleModelsNow && $options.searchVehicleModelsNow(...args), "6b"),
    bc: $data.vehicleSearchKeyword,
    bd: $data.vehicleSearchKeyword
  }, $data.vehicleSearchKeyword ? {
    be: common_vendor.o((...args) => $options.clearVehicleSearch && $options.clearVehicleSearch(...args), "18")
  } : {}, {
    bf: $data.vehiclePickerStep === "brand" ? 1 : "",
    bg: common_vendor.o(($event) => $options.switchVehiclePickerStep("brand"), "39"),
    bh: $data.vehiclePickerStep === "series" ? 1 : "",
    bi: !$data.pendingVehicleSelection.brandId ? 1 : "",
    bj: common_vendor.o(($event) => $options.switchVehiclePickerStep("series"), "b6"),
    bk: $data.vehiclePickerStep === "model" ? 1 : "",
    bl: !$data.pendingVehicleSelection.seriesId ? 1 : "",
    bm: common_vendor.o(($event) => $options.switchVehiclePickerStep("model"), "3c"),
    bn: $options.vehiclePickerSummary
  }, $options.vehiclePickerSummary ? {
    bo: common_vendor.t($options.vehiclePickerSummary)
  } : {}, {
    bp: $data.vehicleSearchKeyword
  }, $data.vehicleSearchKeyword ? common_vendor.e({
    bq: common_vendor.f($data.vehicleSearchResults, (item, k0, i0) => {
      return {
        a: common_vendor.t(item.modelName),
        b: common_vendor.t(item.brandName),
        c: common_vendor.t(item.seriesName),
        d: item.modelId,
        e: common_vendor.o(($event) => $options.selectVehicleSearchResult(item), item.modelId)
      };
    }),
    br: $data.vehiclePickerLoading
  }, $data.vehiclePickerLoading ? {} : $data.vehicleSearchResults.length === 0 ? {} : {}, {
    bs: $data.vehicleSearchResults.length === 0
  }) : common_vendor.e({
    bt: common_vendor.f($options.vehiclePickerItems, (item, k0, i0) => {
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
    bv: $data.vehiclePickerLoading
  }, $data.vehiclePickerLoading ? {} : $options.vehiclePickerItems.length === 0 ? {} : {}, {
    bw: $options.vehiclePickerItems.length === 0
  }), {
    bx: $data.activeDrawer === "vehiclePicker" ? 1 : "",
    by: common_vendor.sr("routeAddressMapPicker", "56ce42dc-0"),
    bz: common_vendor.o($options.onRouteAddressSelect, "a4"),
    bA: common_vendor.p({
      title: $options.routeAddressPickerTitle,
      placeholder: "搜索市场、园区、道路、公司名称",
      ["allow-manual-address"]: false
    }),
    bB: common_vendor.sr("routeCityPicker", "56ce42dc-1"),
    bC: common_vendor.o($options.onRouteCitySelect, "cc"),
    bD: common_vendor.p({
      title: $options.routeCityPickerTitle
    })
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/dealer-order-form/dealer-order-form.js.map
