"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      orderId: "",
      cancelReason: "",
      submitting: false
    };
  },
  onLoad(options) {
    if (!common_vendor.requireLogin())
      return;
    this.orderId = options.orderId;
  },
  methods: {
    async submit() {
      if (!this.cancelReason.trim()) {
        common_vendor.index.showToast({ title: "请输入取消原因", icon: "none" });
        return;
      }
      this.submitting = true;
      try {
        await common_vendor.api.cancelOrder(this.orderId, this.cancelReason);
        common_vendor.index.showToast({ title: "取消申请已提交", icon: "success" });
        setTimeout(
          () => common_vendor.index.redirectTo({ url: `/pages/order/detail?orderId=${this.orderId}` }),
          500
        );
      } finally {
        this.submitting = false;
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: $data.cancelReason,
    b: common_vendor.o(($event) => $data.cancelReason = $event.detail.value, "7f"),
    c: common_vendor.t($data.cancelReason.length),
    d: $data.submitting,
    e: common_vendor.o((...args) => $options.submit && $options.submit(...args), "91")
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
