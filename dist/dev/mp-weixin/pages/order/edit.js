"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return { orderId: "" };
  },
  onLoad(options) {
    this.orderId = options.orderId;
  },
  methods: {
    back() {
      common_vendor.index.redirectTo({ url: `/pages/order/detail?orderId=${this.orderId}` });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.o((...args) => $options.back && $options.back(...args), "24")
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
