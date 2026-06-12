"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      user: {},
      profile: {},
      reviewStatus: "UNVERIFIED",
      isLoggedIn: false,
      reviewStatusText: common_vendor.reviewStatusText
    };
  },
  onShow() {
    this.isLoggedIn = !!common_vendor.getSession();
    if (this.isLoggedIn) {
      this.load();
    } else {
      this.user = {};
      this.profile = {};
      this.reviewStatus = "UNVERIFIED";
    }
  },
  methods: {
    statusClass: common_vendor.statusClass,
    async load() {
      try {
        const data = await common_vendor.api.me({ authRedirect: false });
        this.user = data.user || {};
        this.profile = data.profile || {};
        this.reviewStatus = data.reviewStatus;
      } catch (error) {
        if ((error == null ? void 0 : error.statusCode) === 401) {
          this.isLoggedIn = false;
          this.user = {};
          this.profile = {};
          this.reviewStatus = "UNVERIFIED";
        }
      }
    },
    goVerify() {
      if (!this.ensureLoggedIn("查看车商信息"))
        return;
      const url = this.reviewStatus === "UNVERIFIED" || this.reviewStatus === "REJECTED" ? "/pages/verification/form" : "/pages/verification/status";
      common_vendor.index.navigateTo({ url });
    },
    goSettings() {
      common_vendor.index.navigateTo({ url: "/pages/account/settings" });
    },
    goHome() {
      common_vendor.index.switchTab({ url: "/pages/home/index" });
    },
    goOrders() {
      common_vendor.index.switchTab({ url: "/pages/order/list" });
    },
    startOrder() {
      if (!this.ensureLoggedIn("快捷下单"))
        return;
      if (!this.ensureVerified("快捷下单"))
        return;
      this.goHome();
    },
    viewOrders() {
      if (!this.ensureLoggedIn("查看查询记录"))
        return;
      this.goOrders();
    },
    goLogin() {
      common_vendor.index.navigateTo({ url: "/pages/auth/login" });
    },
    handleProfileClick() {
      if (!this.isLoggedIn)
        this.promptLogin("登录账号");
    },
    ensureLoggedIn(actionText = "继续操作") {
      if (this.isLoggedIn)
        return true;
      this.promptLogin(actionText);
      return false;
    },
    ensureVerified(actionText = "继续操作") {
      if (this.reviewStatus === "APPROVED")
        return true;
      common_vendor.index.showModal({
        title: "需要车商认证",
        content: `当前还未进行车商认证，请先进行认证后再${actionText}。`,
        cancelText: "稍后认证",
        confirmText: "立即认证",
        confirmColor: "#f97316",
        success: (res) => {
          if (res.confirm) {
            this.goVerify();
          }
        }
      });
      return false;
    },
    promptLogin(actionText = "继续操作") {
      common_vendor.index.showModal({
        title: "需要登录",
        content: `当前还未登录，请先登录后再${actionText}。`,
        cancelText: "稍后登录",
        confirmText: "立即登录",
        confirmColor: "#f97316",
        success: (res) => {
          if (res.confirm)
            this.goLogin();
        }
      });
    },
    logout() {
      common_vendor.index.showModal({
        title: "退出登录",
        content: "确定要退出当前账号吗？",
        confirmColor: "#f97316",
        success: (res) => {
          if (res.confirm) {
            common_vendor.clearSession();
            this.user = {};
            this.profile = {};
            this.reviewStatus = "UNVERIFIED";
            this.isLoggedIn = false;
            common_vendor.index.switchTab({ url: "/pages/home/index" });
          }
        }
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: !$data.isLoggedIn
  }, !$data.isLoggedIn ? {
    b: common_vendor.o((...args) => $options.goLogin && $options.goLogin(...args), "c2"),
    c: common_vendor.o((...args) => $options.goLogin && $options.goLogin(...args), "1f")
  } : {}, {
    d: common_vendor.t($data.isLoggedIn ? $data.profile.companyName || "未认证车商" : "立即登录"),
    e: $data.isLoggedIn
  }, $data.isLoggedIn ? {
    f: common_vendor.t($data.reviewStatusText[$data.reviewStatus] || "未认证"),
    g: common_vendor.n($data.reviewStatus.toLowerCase())
  } : {}, {
    h: common_vendor.t($data.isLoggedIn ? $data.user.registeredPhone || "-" : "请点击此处登录您的账户"),
    i: common_vendor.o((...args) => $options.handleProfileClick && $options.handleProfileClick(...args), "ef"),
    j: common_vendor.o((...args) => $options.goVerify && $options.goVerify(...args), "e1"),
    k: common_vendor.o((...args) => $options.startOrder && $options.startOrder(...args), "ba"),
    l: common_vendor.o((...args) => $options.viewOrders && $options.viewOrders(...args), "c1"),
    m: common_vendor.o((...args) => $options.goSettings && $options.goSettings(...args), "8d")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
