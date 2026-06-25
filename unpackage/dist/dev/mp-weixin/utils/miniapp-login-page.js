"use strict";
const common_vendor = require("../common/vendor.js");
const utils_api = require("./api.js");
const _sfc_main = {
  emits: ["success"],
  data() {
    return {
      visible: false,
      loading: false,
      agreementAccepted: true,
      actionText: "继续操作"
    };
  },
  mounted() {
    common_vendor.index.$on("open-miniapp-login-sheet", this.handleOpenEvent);
    const pending = utils_api.consumePendingLoginPrompt();
    if (pending) {
      this.handleOpenEvent(pending);
    }
  },
  beforeUnmount() {
    common_vendor.index.$off("open-miniapp-login-sheet", this.handleOpenEvent);
  },
  methods: {
    handleOpenEvent(payload = {}) {
      this.open(payload.actionText || "继续操作");
    },
    open(actionText = "继续操作") {
      this.actionText = actionText;
      this.visible = true;
    },
    close() {
      if (this.loading)
        return;
      this.visible = false;
    },
    toggleAgreement() {
      this.agreementAccepted = !this.agreementAccepted;
    },
    openAgreement(type) {
      common_vendor.index.navigateTo({ url: `/pages/agreement/detail?type=${type}` });
    },
    validateAgreement() {
      if (!this.agreementAccepted) {
        common_vendor.index.showToast({ title: "请先勾选注册协议和隐私协议", icon: "none" });
        return false;
      }
      return true;
    },
    async handleGetPhoneNumber(event) {
      if (!this.validateAgreement())
        return;
      const detail = event.detail || {};
      if (detail.errMsg && !detail.errMsg.includes("ok")) {
        common_vendor.index.showToast({ title: "请授权手机号后登录", icon: "none" });
        return;
      }
      if (!detail.code) {
        common_vendor.index.showToast({ title: "微信未返回手机号授权凭证", icon: "none" });
        return;
      }
      this.loading = true;
      try {
        const wxCode = await utils_api.miniappLoginCode();
        const data = await utils_api.api.wechatPhoneLogin(detail.code, wxCode);
        utils_api.setSession(data);
        if (data == null ? void 0 : data.needVerificationPrompt) {
          common_vendor.index.setStorageSync("dealer_need_verification_prompt", "1");
        }
        this.visible = false;
        this.$emit("success", data);
        common_vendor.index.showToast({ title: "登录成功", icon: "success" });
      } finally {
        this.loading = false;
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.visible
  }, $data.visible ? {
    b: common_vendor.o((...args) => $options.close && $options.close(...args), "82"),
    c: common_vendor.o((...args) => $options.close && $options.close(...args), "fe"),
    d: $data.loading,
    e: $data.loading,
    f: common_vendor.o((...args) => $options.handleGetPhoneNumber && $options.handleGetPhoneNumber(...args), "fa"),
    g: $data.agreementAccepted,
    h: common_vendor.o((...args) => $options.toggleAgreement && $options.toggleAgreement(...args), "47"),
    i: common_vendor.o(($event) => $options.openAgreement("terms"), "86"),
    j: common_vendor.o(($event) => $options.openAgreement("privacy"), "75"),
    k: common_vendor.o((...args) => $options.toggleAgreement && $options.toggleAgreement(...args), "d9")
  } : {});
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
function currentPageOptions() {
  var _a;
  const pages = getCurrentPages();
  const current = pages[pages.length - 1] || {};
  return current.options || ((_a = current.$page) == null ? void 0 : _a.options) || {};
}
const miniappLoginPageMixin = {
  components: {
    MiniappLoginSheet: Component
  },
  methods: {
    handleLoginSuccess() {
      const options = currentPageOptions();
      if (typeof this.onLoad === "function") {
        this.onLoad(options);
        return;
      }
      if (typeof this.onShow === "function") {
        this.onShow();
      }
    }
  }
};
exports.Component = Component;
exports.miniappLoginPageMixin = miniappLoginPageMixin;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/miniapp-login-page.js.map
