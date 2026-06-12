"use strict";
const utils_api = require("../../utils/api.js");
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      orderId: "",
      order: {},
      pageReady: false
    };
  },
  computed: {
    pickupDriver() {
      return this.order.driverInfo || null;
    },
    deliveryDriver() {
      return this.order.deliveryDriverInfo || null;
    }
  },
  onLoad(options) {
    if (!utils_api.requireLogin())
      return;
    this.orderId = options.orderId;
    this.load();
  },
  methods: {
    async load() {
      const data = await utils_api.api.orderDetail(this.orderId);
      this.order = data.order || {};
      this.pageReady = true;
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.t($data.order.originCityName || "-"),
    b: common_vendor.t($data.order.destinationCityName || "-"),
    c: common_vendor.t($data.order.orderNo || "-"),
    d: $options.pickupDriver
  }, $options.pickupDriver ? {
    e: common_vendor.t($options.pickupDriver.driverName || "-"),
    f: common_vendor.t($options.pickupDriver.driverPhone || "-"),
    g: common_vendor.t($options.pickupDriver.licensePlate || "-"),
    h: common_vendor.t($options.pickupDriver.idNumber || "-")
  } : {}, {
    i: $options.deliveryDriver
  }, $options.deliveryDriver ? {
    j: common_vendor.t($options.deliveryDriver.driverName || "-"),
    k: common_vendor.t($options.deliveryDriver.driverPhone || "-"),
    l: common_vendor.t($options.deliveryDriver.licensePlate || "-"),
    m: common_vendor.t($options.deliveryDriver.idNumber || "-")
  } : {}, {
    n: $data.pageReady && !$options.pickupDriver && !$options.deliveryDriver
  }, $data.pageReady && !$options.pickupDriver && !$options.deliveryDriver ? {} : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/order/drivers.js.map
