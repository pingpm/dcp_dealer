"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_miniappLoginPage = require("../../utils/miniapp-login-page.js");
const utils_api = require("../../utils/api.js");
const _sfc_main = {
  mixins: [utils_miniappLoginPage.miniappLoginPageMixin],
  data() {
    return {
      orderId: "",
      cancelReason: "",
      submitting: false
    };
  },
  onLoad(options) {
    if (!utils_api.requireLogin())
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
        await utils_api.api.cancelOrder(this.orderId, this.cancelReason);
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
if (!Array) {
  const _easycom_dealer_icon2 = common_vendor.resolveComponent("dealer-icon");
  const _easycom_miniapp_login_sheet2 = common_vendor.resolveComponent("miniapp-login-sheet");
  (_easycom_dealer_icon2 + _easycom_miniapp_login_sheet2)();
}
const _easycom_dealer_icon = () => "../../components/dealer-icon/dealer-icon.js";
const _easycom_miniapp_login_sheet = () => "../../components/miniapp-login-sheet/miniapp-login-sheet.js";
if (!Math) {
  (_easycom_dealer_icon + _easycom_miniapp_login_sheet)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.p({
      name: "triangle-alert",
      size: "sm",
      color: "#ef4444"
    }),
    b: $data.cancelReason,
    c: common_vendor.o(($event) => $data.cancelReason = $event.detail.value, "e3"),
    d: common_vendor.t($data.cancelReason.length),
    e: $data.submitting,
    f: common_vendor.o((...args) => $options.submit && $options.submit(...args), "59"),
    g: common_vendor.sr("loginSheet", "78d133be-1"),
    h: common_vendor.o(_ctx.handleLoginSuccess, "a4")
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/order/cancel-request.js.map
