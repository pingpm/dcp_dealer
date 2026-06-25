"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const utils_format = require("../../utils/format.js");
const common_assets = require("../../common/assets.js");
const MiniappLoginSheet = () => "../../components/miniapp-login-sheet/miniapp-login-sheet.js";
const _sfc_main = {
  components: {
    MiniappLoginSheet
  },
  data() {
    return {
      user: {},
      profile: {},
      reviewStatus: "UNVERIFIED",
      dealerVerificationRequired: true,
      isLoggedIn: false,
      reviewStatusText: utils_format.reviewStatusText
    };
  },
  computed: {
    profileDisplayName() {
      if (!this.isLoggedIn)
        return "立即登录";
      return this.profile.companyName || this.profile.contactName || "车商用户";
    },
    maskedPhone() {
      const phone = this.user.registeredPhone || this.profile.registeredPhone || "";
      if (!phone)
        return "-";
      if (phone.length < 7)
        return phone;
      return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
    },
    menuItems() {
      return [
        {
          key: "dealer-info",
          label: "车商信息",
          icon: "/static/my_dealer_info.svg",
          badge: this.dealerInfoBadge,
          badgeClass: this.reviewStatus.toLowerCase()
        },
        {
          key: "express-order",
          label: "快捷下单",
          icon: "/static/my_express_order.svg"
        },
        {
          key: "search-history",
          label: "查询记录",
          icon: "/static/my_search_history.svg"
        },
        {
          key: "setting",
          label: "设置",
          icon: "/static/my_setting.svg"
        }
      ];
    },
    dealerInfoBadge() {
      if (!this.isLoggedIn)
        return "";
      if (!this.dealerVerificationRequired && this.reviewStatus !== "APPROVED")
        return "可选完善";
      const badgeMap = {
        UNVERIFIED: "未认证",
        PENDING: "审核中",
        REJECTED: "审核驳回"
      };
      return badgeMap[this.reviewStatus] || "";
    }
  },
  onShow() {
    this.isLoggedIn = !!utils_api.getSession();
    if (this.isLoggedIn) {
      this.load();
    } else {
      this.user = {};
      this.profile = {};
      this.reviewStatus = "UNVERIFIED";
      this.dealerVerificationRequired = true;
    }
  },
  methods: {
    statusClass: utils_format.statusClass,
    async load() {
      try {
        const data = await utils_api.api.me({ authRedirect: false });
        this.user = data.user || {};
        this.profile = data.profile || {};
        this.reviewStatus = data.reviewStatus;
        this.dealerVerificationRequired = data.dealerVerificationRequired !== false;
      } catch (error) {
        if ((error == null ? void 0 : error.statusCode) === 401) {
          this.isLoggedIn = false;
          this.user = {};
          this.profile = {};
          this.reviewStatus = "UNVERIFIED";
          this.dealerVerificationRequired = true;
        }
      }
    },
    handleMenuClick(key) {
      if (key === "dealer-info") {
        this.goVerify();
      } else if (key === "express-order") {
        this.startOrder();
      } else if (key === "search-history") {
        this.viewOrders();
      } else if (key === "setting") {
        this.goSettings();
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
      var _a;
      (_a = this.$refs.loginSheet) == null ? void 0 : _a.open("登录账号");
      return;
    },
    async handleLoginSuccess() {
      this.isLoggedIn = true;
      await this.load();
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
      if (!this.dealerVerificationRequired)
        return true;
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
      var _a;
      (_a = this.$refs.loginSheet) == null ? void 0 : _a.open(actionText);
      return;
    },
    logout() {
      common_vendor.index.showModal({
        title: "退出登录",
        content: "确定要退出当前账号吗？",
        confirmColor: "#f97316",
        success: (res) => {
          if (res.confirm) {
            utils_api.clearSession();
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
if (!Array) {
  const _easycom_miniapp_login_sheet2 = common_vendor.resolveComponent("miniapp-login-sheet");
  _easycom_miniapp_login_sheet2();
}
const _easycom_miniapp_login_sheet = () => "../../components/miniapp-login-sheet/miniapp-login-sheet.js";
if (!Math) {
  _easycom_miniapp_login_sheet();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_assets._imports_0$4,
    b: common_vendor.t($options.profileDisplayName),
    c: common_vendor.t($data.isLoggedIn ? $options.maskedPhone : "请点击此处登录您的账户"),
    d: $data.isLoggedIn
  }, $data.isLoggedIn ? {
    e: common_vendor.t($data.reviewStatusText[$data.reviewStatus] || "未认证"),
    f: common_vendor.n($data.reviewStatus.toLowerCase())
  } : {}, {
    g: common_vendor.o((...args) => $options.handleProfileClick && $options.handleProfileClick(...args), "c7"),
    h: common_vendor.f($options.menuItems, (item, k0, i0) => {
      return common_vendor.e({
        a: item.icon,
        b: item.badge
      }, item.badge ? {
        c: common_vendor.t(item.badge),
        d: common_vendor.n(item.badgeClass)
      } : {}, {
        e: common_vendor.t(item.label),
        f: item.key,
        g: common_vendor.o(($event) => $options.handleMenuClick(item.key), item.key)
      });
    }),
    i: common_vendor.sr("loginSheet", "ae3d86c2-0"),
    j: common_vendor.o($options.handleLoginSuccess, "00")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/account/index.js.map
