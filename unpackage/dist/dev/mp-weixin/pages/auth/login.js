"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const utils_navigation = require("../../utils/navigation.js");
const _sfc_main = {
  data() {
    return {
      phone: "",
      verificationCode: "",
      loading: false,
      codeLoading: false,
      countdown: 0,
      countdownTimer: null,
      agreementAccepted: true
    };
  },
  onUnload() {
    if (this.countdownTimer)
      clearInterval(this.countdownTimer);
  },
  methods: {
    validatePhone() {
      if (!/^1\d{10}$/.test(this.phone)) {
        common_vendor.index.showToast({ title: "请输入 11 位有效手机号", icon: "none" });
        return false;
      }
      return true;
    },
    validateAgreement() {
      if (!this.agreementAccepted) {
        common_vendor.index.showToast({ title: "请先勾选注册协议和隐私协议", icon: "none" });
        return false;
      }
      return true;
    },
    toggleAgreement() {
      this.agreementAccepted = !this.agreementAccepted;
    },
    openAgreement(type) {
      common_vendor.index.navigateTo({ url: `/pages/agreement/detail?type=${type}` });
    },
    async sendCode() {
      if (!this.validatePhone() || this.countdown > 0)
        return;
      this.codeLoading = true;
      try {
        const data = await utils_api.api.sendLoginCode(this.phone);
        let title = "验证码短信已发送";
        if (data.isRegistered === false) {
          title += "（新手机号登录将自动注册）";
        }
        common_vendor.index.showToast({ title, icon: "none" });
        this.countdown = 60;
        this.countdownTimer = setInterval(() => {
          this.countdown -= 1;
          if (this.countdown <= 0 && this.countdownTimer) {
            clearInterval(this.countdownTimer);
            this.countdownTimer = null;
          }
        }, 1e3);
      } finally {
        this.codeLoading = false;
      }
    },
    async login() {
      if (!this.validateAgreement()) {
        return;
      }
      if (!this.validatePhone()) {
        return;
      }
      if (!/^\d{6}$/.test(this.verificationCode)) {
        common_vendor.index.showToast({ title: "请输入 6 位验证码", icon: "none" });
        return;
      }
      this.loading = true;
      try {
        const wxCode = await utils_api.miniappLoginCode();
        const data = wxCode ? await utils_api.api.loginWithWechatCode(this.phone, this.verificationCode, wxCode) : await utils_api.api.login(this.phone, this.verificationCode);
        utils_api.setSession(data);
        utils_navigation.goAfterLogin(data);
      } finally {
        this.loading = false;
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: $data.phone,
    b: common_vendor.o(($event) => $data.phone = $event.detail.value, "c0"),
    c: $data.verificationCode,
    d: common_vendor.o(($event) => $data.verificationCode = $event.detail.value, "b5"),
    e: common_vendor.t($data.countdown > 0 ? `${$data.countdown}s` : "获取验证码"),
    f: $data.codeLoading || $data.countdown > 0,
    g: common_vendor.o((...args) => $options.sendCode && $options.sendCode(...args), "35"),
    h: $data.loading,
    i: common_vendor.o((...args) => $options.login && $options.login(...args), "b8"),
    j: $data.agreementAccepted,
    k: common_vendor.o((...args) => $options.toggleAgreement && $options.toggleAgreement(...args), "e8"),
    l: common_vendor.o(($event) => $options.openAgreement("terms"), "c0"),
    m: common_vendor.o(($event) => $options.openAgreement("privacy"), "d3"),
    n: common_vendor.o((...args) => $options.toggleAgreement && $options.toggleAgreement(...args), "1f")
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/auth/login.js.map
