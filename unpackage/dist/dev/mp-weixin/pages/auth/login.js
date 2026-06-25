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
      wechatLoading: false,
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
    },
    async wechatPhoneLogin(event) {
      if (!this.validateAgreement()) {
        return;
      }
      const detail = event.detail || {};
      if (detail.errMsg && !detail.errMsg.includes("ok")) {
        common_vendor.index.showToast({ title: "请授权手机号后登录", icon: "none" });
        return;
      }
      if (!detail.code) {
        common_vendor.index.showToast({ title: "微信未返回手机号授权凭证", icon: "none" });
        return;
      }
      this.wechatLoading = true;
      try {
        const wxCode = await utils_api.miniappLoginCode();
        const data = await utils_api.api.wechatPhoneLogin(detail.code, wxCode);
        utils_api.setSession(data);
        utils_navigation.goAfterLogin(data);
      } finally {
        this.wechatLoading = false;
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: $data.wechatLoading,
    b: $data.wechatLoading || $data.loading,
    c: common_vendor.o((...args) => $options.wechatPhoneLogin && $options.wechatPhoneLogin(...args), "b4"),
    d: $data.agreementAccepted,
    e: common_vendor.o((...args) => $options.toggleAgreement && $options.toggleAgreement(...args), "94"),
    f: common_vendor.o(($event) => $options.openAgreement("terms"), "9e"),
    g: common_vendor.o(($event) => $options.openAgreement("privacy"), "09"),
    h: common_vendor.o((...args) => $options.toggleAgreement && $options.toggleAgreement(...args), "22")
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/auth/login.js.map
