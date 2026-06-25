"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_miniappLoginPage = require("../../utils/miniapp-login-page.js");
const utils_api = require("../../utils/api.js");
const utils_orderEditNavigation = require("../../utils/order-edit-navigation.js");
const DealerOrderForm = () => "../../components/dealer-order-form/dealer-order-form.js";
function routeFromOrder(order, prefix) {
  return {
    provinceId: order[`${prefix}ProvinceId`] || "",
    provinceName: order[`${prefix}ProvinceName`] || "",
    cityId: order[`${prefix}CityId`] || "",
    cityName: order[`${prefix}CityName`] || "",
    districtId: order[`${prefix}DistrictId`] || "",
    districtName: order[`${prefix}DistrictName`] || "",
    addressPoiName: "",
    addressDetail: order[`${prefix}AddressDetail`] || "",
    longitude: order[`${prefix}Longitude`] || "",
    latitude: order[`${prefix}Latitude`] || ""
  };
}
function seedFromOrder(order, vehicles) {
  return {
    orderAmountYuan: ((order.orderAmountCent || 0) / 100).toFixed(2),
    insuranceMaxAmountYuan: order.insuranceMaxAmountCent === null || order.insuranceMaxAmountCent === void 0 ? "" : (Number(order.insuranceMaxAmountCent) / 100).toFixed(2),
    agreedDate: order.agreedDeliveryTime ? order.agreedDeliveryTime.slice(0, 10) : "",
    form: {
      transportMode: order.transportMode || "LARGE_TRUCK",
      customerSubject: {
        subjectType: order.customerSubjectType || "ENTERPRISE",
        subjectName: order.customerSubjectName || "",
        subjectPhone: order.customerSubjectPhone || ""
      },
      origin: routeFromOrder(order, "origin"),
      destination: routeFromOrder(order, "destination"),
      hasPickupService: Boolean(order.hasPickupService),
      hasDeliveryService: Boolean(order.hasDeliveryService),
      sender: { name: order.senderName || "", phone: order.senderPhone || "" },
      receiver: { name: order.receiverName || "", phone: order.receiverPhone || "" },
      hasInvoice: Boolean(order.hasInvoice),
      hasInsurance: Boolean(order.hasInsurance),
      insuranceRemark: order.insuranceRemark || "",
      vehicles: vehicles.map((vehicle) => ({
        brandId: vehicle.brandId || "",
        brandName: vehicle.brandName || "",
        seriesId: vehicle.seriesId || "",
        seriesName: vehicle.seriesName || "",
        modelId: vehicle.modelId || "",
        modelName: vehicle.modelName || "",
        vin: vehicle.vin || "",
        plateNo: vehicle.plateNumber || "",
        valuationTenThousandYuan: vehicle.estimatedValueCent === null || vehicle.estimatedValueCent === void 0 ? "" : String(Number(vehicle.estimatedValueCent) / 100 / 1e4),
        vehicleConditionType: vehicle.vehicleConditionType || "USED"
      }))
    }
  };
}
const _sfc_main = {
  mixins: [utils_miniappLoginPage.miniappLoginPageMixin],
  components: { DealerOrderForm },
  data() {
    return {
      orderId: "",
      order: {},
      loading: true,
      submitting: false,
      formSeed: {},
      formSeedVersion: 0
    };
  },
  async onLoad(options) {
    if (!utils_api.requireLogin())
      return;
    this.orderId = options.orderId || options.id || "";
    await this.load();
  },
  methods: {
    async load() {
      this.loading = true;
      try {
        const data = await utils_api.api.orderDetail(this.orderId);
        this.order = data.order || {};
        if (this.order.orderStatus !== "PENDING_CONFIRM") {
          common_vendor.index.showModal({
            title: "无法修改",
            content: "当前订单已不在待承运商确认状态，不能继续修改。",
            confirmColor: "#f97316",
            showCancel: false,
            success: () => this.back()
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
      if (!form || !form.validate())
        return;
      this.submitting = true;
      try {
        await utils_api.api.updateOrder(this.orderId, form.buildPayload());
        common_vendor.index.showToast({ title: "修改成功", icon: "success" });
        setTimeout(() => {
          utils_orderEditNavigation.returnToOrderDetail({ orderId: this.orderId, shouldRefresh: true, uniApi: common_vendor.index });
        }, 500);
      } finally {
        this.submitting = false;
      }
    },
    back() {
      utils_orderEditNavigation.returnToOrderDetail({ orderId: this.orderId, uniApi: common_vendor.index });
    }
  }
};
if (!Array) {
  const _easycom_dealer_order_form2 = common_vendor.resolveComponent("dealer-order-form");
  const _easycom_miniapp_login_sheet2 = common_vendor.resolveComponent("miniapp-login-sheet");
  (_easycom_dealer_order_form2 + _easycom_miniapp_login_sheet2)();
}
const _easycom_dealer_order_form = () => "../../components/dealer-order-form/dealer-order-form.js";
const _easycom_miniapp_login_sheet = () => "../../components/miniapp-login-sheet/miniapp-login-sheet.js";
if (!Math) {
  (_easycom_dealer_order_form + _easycom_miniapp_login_sheet)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.loading
  }, $data.loading ? {} : {
    b: common_vendor.t($data.order.orderNo || "-"),
    c: common_vendor.sr("orderForm", "439f45e8-0"),
    d: common_vendor.p({
      seed: $data.formSeed,
      ["seed-version"]: $data.formSeedVersion
    })
  }, {
    e: common_vendor.o((...args) => $options.back && $options.back(...args), "a1"),
    f: $data.submitting,
    g: common_vendor.o((...args) => $options.save && $options.save(...args), "3f"),
    h: common_vendor.sr("loginSheet", "439f45e8-1"),
    i: common_vendor.o(_ctx.handleLoginSuccess, "f2")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/order/edit.js.map
