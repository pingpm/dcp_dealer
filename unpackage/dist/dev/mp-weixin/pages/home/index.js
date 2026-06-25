"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const utils_format = require("../../utils/format.js");
const common_assets = require("../../common/assets.js");
const MiniappLoginSheet = () => "../../components/miniapp-login-sheet/miniapp-login-sheet.js";
const RegionPicker = () => "../../components/region-picker/region-picker.js";
const _sfc_main = {
  components: {
    MiniappLoginSheet,
    RegionPicker
  },
  data() {
    return {
      status: { reviewStatus: "UNVERIFIED" },
      reviewStatusText: utils_format.reviewStatusText,
      dealerVerificationRequired: true,
      searching: false,
      isLoggedIn: false,
      searchType: "route",
      // 'route' | 'carrier'
      activePicker: "origin",
      // 'origin' | 'destination'
      form: {
        originProvinceId: "",
        originProvinceName: "",
        originCityId: "",
        originCityName: "",
        destinationProvinceId: "",
        destinationProvinceName: "",
        destinationCityId: "",
        destinationCityName: "",
        transportMode: "LARGE_TRUCK",
        keyword: ""
      },
      recentRoutes: []
    };
  },
  computed: {
    pickerTitle() {
      return this.activePicker === "origin" ? "选择出发地城市" : "选择目的地城市";
    },
    floatNoticeText() {
      if (!this.isLoggedIn)
        return "当前还未登录";
      if (this.status.reviewStatus === "PENDING")
        return "车商认证审核中";
      if (this.status.reviewStatus === "REJECTED")
        return "车商认证已驳回";
      return "当前还未认证";
    },
    floatNoticeDesc() {
      if (!this.isLoggedIn)
        return "登录后可搜索承运商并发起订单";
      if (this.status.reviewStatus === "PENDING")
        return "审核通过后即可搜索和下单";
      if (this.status.reviewStatus === "REJECTED")
        return "请重新提交车商认证资料";
      return "认证后可联系承运商并下单";
    },
    floatButtonText() {
      if (!this.isLoggedIn)
        return "立即登录";
      if (this.status.reviewStatus === "PENDING")
        return "查看进度";
      return "立即认证";
    },
    needsVerification() {
      return this.dealerVerificationRequired && this.status.reviewStatus !== "APPROVED";
    }
  },
  onShow() {
    this.isLoggedIn = !!utils_api.getSession();
    if (this.isLoggedIn) {
      this.loadStatus();
    }
    this.loadRecentRoutes();
  },
  methods: {
    async loadStatus() {
      try {
        const session = utils_api.getSession() || {};
        this.dealerVerificationRequired = session.dealerVerificationRequired !== false;
        this.status = await utils_api.api.verificationStatus({ authRedirect: false, silent: true });
        if (this.status.dealerVerificationRequired !== void 0) {
          this.dealerVerificationRequired = this.status.dealerVerificationRequired !== false;
        }
        this.showVerificationPromptIfNeeded(this.status.reviewStatus);
      } catch (error) {
        if ((error == null ? void 0 : error.statusCode) === 401) {
          this.isLoggedIn = false;
          this.status = { reviewStatus: "UNVERIFIED" };
        }
      }
    },
    showVerificationPromptIfNeeded(reviewStatus) {
      const shouldPrompt = common_vendor.index.getStorageSync("dealer_need_verification_prompt") === "1";
      if (!shouldPrompt || reviewStatus === "APPROVED") {
        return;
      }
      common_vendor.index.removeStorageSync("dealer_need_verification_prompt");
      const prompt = this.loginVerificationPrompt(reviewStatus);
      common_vendor.index.showModal({
        title: prompt.title,
        content: prompt.content,
        confirmText: "立即认证",
        cancelText: this.dealerVerificationRequired ? "稍后认证" : "暂不认证",
        success: (res) => {
          if (res.confirm) {
            this.goVerify();
          }
        }
      });
    },
    loginVerificationPrompt(reviewStatus) {
      if (this.dealerVerificationRequired) {
        if (reviewStatus === "PENDING") {
          return {
            title: "认证审核中",
            content: "您的车商认证正在审核中，审核通过后即可搜索承运商、联系承运商并发起托运订单。"
          };
        }
        if (reviewStatus === "REJECTED") {
          return {
            title: "认证未通过",
            content: "您的车商认证未通过，请重新提交认证资料。认证通过后即可搜索承运商、联系承运商并发起托运订单。"
          };
        }
        return {
          title: "请先完成车商认证",
          content: "完成车商认证后，您可以搜索承运商、联系承运商并发起托运订单。"
        };
      }
      if (reviewStatus === "PENDING") {
        return {
          title: "认证资料审核中",
          content: "您已提交车商认证资料，平台会尽快审核。审核期间不影响您搜索承运商、联系承运商和发起订单。"
        };
      }
      if (reviewStatus === "REJECTED") {
        return {
          title: "完善车商资料",
          content: "您的认证资料暂未通过。完善真实车商资料后，平台可以更准确地识别您的企业身份，帮助承运商更快确认订单并提供更匹配的服务。"
        };
      }
      return {
        title: "完善车商资料",
        content: "您现在已经可以搜索承运商、联系承运商和发起订单。建议完善车商认证资料，便于平台更好地服务您的企业，提升承运商接单确认效率。"
      };
    },
    showSearchVerificationPrompt() {
      let title = "还未完成认证";
      let content = "完成车商认证后，您可以搜索承运商、联系承运商并发起托运订单。";
      if (this.status.reviewStatus === "PENDING") {
        title = "认证审核中";
        content = "您的车商认证正在审核中，审核通过后即可搜索承运商并发起订单。";
      } else if (this.status.reviewStatus === "REJECTED") {
        title = "认证未通过";
        content = "您的车商认证未通过，请重新提交认证资料后再搜索承运商。";
      }
      common_vendor.index.showModal({
        title,
        content,
        confirmText: this.status.reviewStatus === "PENDING" ? "查看进度" : "立即认证",
        cancelText: "稍后认证",
        confirmColor: "#f97316",
        success: (res) => {
          if (res.confirm) {
            this.goVerify();
          }
        }
      });
    },
    handleAccountNotice() {
      if (!this.isLoggedIn) {
        this.goLogin();
        return;
      }
      this.goVerify();
    },
    goVerify() {
      const url = this.status.reviewStatus === "PENDING" ? "/pages/verification/status" : "/pages/verification/form";
      common_vendor.index.navigateTo({ url });
    },
    goLogin() {
      var _a;
      (_a = this.$refs.loginSheet) == null ? void 0 : _a.open("搜索承运商");
      return;
    },
    handleLoginSuccess() {
      this.isLoggedIn = true;
      this.loadStatus();
    },
    clearRouteSearchFields() {
      this.form.originProvinceId = "";
      this.form.originProvinceName = "";
      this.form.originCityId = "";
      this.form.originCityName = "";
      this.form.destinationProvinceId = "";
      this.form.destinationProvinceName = "";
      this.form.destinationCityId = "";
      this.form.destinationCityName = "";
    },
    switchSearchType(type) {
      if (this.searchType === type)
        return;
      this.searchType = type;
      if (type === "route") {
        this.form.keyword = "";
        return;
      }
      this.clearRouteSearchFields();
    },
    triggerCityPicker(type) {
      this.activePicker = type;
      this.$refs.regionPicker.open();
    },
    onRegionSelect(region) {
      if (this.activePicker === "origin") {
        this.form.originProvinceId = region.provinceId;
        this.form.originProvinceName = region.provinceName;
        this.form.originCityId = region.cityId;
        this.form.originCityName = region.cityName;
      } else {
        this.form.destinationProvinceId = region.provinceId;
        this.form.destinationProvinceName = region.provinceName;
        this.form.destinationCityId = region.cityId;
        this.form.destinationCityName = region.cityName;
      }
    },
    swapCities() {
      const tempProvinceId = this.form.originProvinceId;
      const tempProvinceName = this.form.originProvinceName;
      const tempCityId = this.form.originCityId;
      const tempCityName = this.form.originCityName;
      this.form.originProvinceId = this.form.destinationProvinceId;
      this.form.originProvinceName = this.form.destinationProvinceName;
      this.form.originCityId = this.form.destinationCityId;
      this.form.originCityName = this.form.destinationCityName;
      this.form.destinationProvinceId = tempProvinceId;
      this.form.destinationProvinceName = tempProvinceName;
      this.form.destinationCityId = tempCityId;
      this.form.destinationCityName = tempCityName;
    },
    search() {
      if (!this.isLoggedIn) {
        this.goLogin();
        return;
      }
      if (this.needsVerification) {
        this.showSearchVerificationPrompt();
        return;
      }
      if (this.searchType === "route") {
        if (!this.form.originCityId || !this.form.destinationCityId) {
          common_vendor.index.showToast({ title: "请选择出发地和目的地", icon: "none" });
          return;
        }
        this.saveRecentRoute({
          origin: this.form.originCityName,
          destination: this.form.destinationCityName,
          originProvinceId: this.form.originProvinceId || "",
          originProvinceName: this.form.originProvinceName || "",
          originCityId: this.form.originCityId,
          destinationProvinceId: this.form.destinationProvinceId || "",
          destinationProvinceName: this.form.destinationProvinceName || "",
          destinationCityId: this.form.destinationCityId,
          timeText: this.getFormattedTime()
        });
        const query = utils_api.toQuery({
          originProvinceId: this.form.originProvinceId,
          originProvinceName: this.form.originProvinceName,
          originCityId: this.form.originCityId,
          originCityName: this.form.originCityName,
          destinationProvinceId: this.form.destinationProvinceId,
          destinationProvinceName: this.form.destinationProvinceName,
          destinationCityId: this.form.destinationCityId,
          destinationCityName: this.form.destinationCityName,
          transportMode: this.form.transportMode
        });
        common_vendor.index.navigateTo({ url: `/pages/search/results?${query}` });
      } else {
        if (!this.form.keyword) {
          common_vendor.index.showToast({ title: "请输入承运商名称", icon: "none" });
          return;
        }
        const query = utils_api.toQuery({
          keyword: this.form.keyword
        });
        common_vendor.index.navigateTo({ url: `/pages/search/results?${query}` });
      }
    },
    onRecentRouteClick(r) {
      this.searchType = "route";
      this.form.keyword = "";
      this.form.originCityName = r.origin;
      this.form.destinationCityName = r.destination;
      this.form.originProvinceId = r.originProvinceId || "";
      this.form.originProvinceName = r.originProvinceName || "";
      this.form.originCityId = r.originCityId;
      this.form.destinationProvinceId = r.destinationProvinceId || "";
      this.form.destinationProvinceName = r.destinationProvinceName || "";
      this.form.destinationCityId = r.destinationCityId;
      this.search();
    },
    getFormattedTime() {
      const date = /* @__PURE__ */ new Date();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hour = String(date.getHours()).padStart(2, "0");
      const minute = String(date.getMinutes()).padStart(2, "0");
      return `${month}-${day} ${hour}:${minute}`;
    },
    saveRecentRoute(route) {
      let list = [];
      try {
        list = common_vendor.index.getStorageSync("recent_routes") || [];
        if (!Array.isArray(list))
          list = [];
      } catch (e) {
        list = [];
      }
      list = list.filter(
        (item) => !(item.originCityId === route.originCityId && item.destinationCityId === route.destinationCityId)
      );
      list.unshift(route);
      list = list.slice(0, 5);
      this.recentRoutes = list;
      try {
        common_vendor.index.setStorageSync("recent_routes", list);
      } catch (e) {
      }
    },
    loadRecentRoutes() {
      try {
        const list = common_vendor.index.getStorageSync("recent_routes");
        if (Array.isArray(list)) {
          this.recentRoutes = list;
        }
      } catch (e) {
      }
    }
  }
};
if (!Array) {
  const _easycom_region_picker2 = common_vendor.resolveComponent("region-picker");
  const _easycom_miniapp_login_sheet2 = common_vendor.resolveComponent("miniapp-login-sheet");
  (_easycom_region_picker2 + _easycom_miniapp_login_sheet2)();
}
const _easycom_region_picker = () => "../../components/region-picker/region-picker.js";
const _easycom_miniapp_login_sheet = () => "../../components/miniapp-login-sheet/miniapp-login-sheet.js";
if (!Math) {
  (_easycom_region_picker + _easycom_miniapp_login_sheet)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: !$data.isLoggedIn || $options.needsVerification
  }, !$data.isLoggedIn || $options.needsVerification ? {
    b: common_vendor.t($options.floatNoticeText),
    c: common_vendor.t($options.floatNoticeDesc),
    d: common_vendor.t($options.floatButtonText),
    e: common_vendor.o((...args) => $options.handleAccountNotice && $options.handleAccountNotice(...args), "62"),
    f: common_vendor.o((...args) => $options.handleAccountNotice && $options.handleAccountNotice(...args), "18")
  } : {}, {
    g: common_assets._imports_0,
    h: $data.searchType === "route" ? 1 : "",
    i: common_vendor.o(($event) => $options.switchSearchType("route"), "3f"),
    j: $data.searchType === "carrier" ? 1 : "",
    k: common_vendor.o(($event) => $options.switchSearchType("carrier"), "07"),
    l: $data.searchType === "route"
  }, $data.searchType === "route" ? {
    m: common_vendor.t($data.form.originCityName || "请选择出发地"),
    n: !$data.form.originCityName ? 1 : "",
    o: common_vendor.o(($event) => $options.triggerCityPicker("origin"), "ac"),
    p: common_vendor.o((...args) => $options.swapCities && $options.swapCities(...args), "34"),
    q: common_vendor.t($data.form.destinationCityName || "请选择目的地"),
    r: !$data.form.destinationCityName ? 1 : "",
    s: common_vendor.o(($event) => $options.triggerCityPicker("destination"), "c9"),
    t: $data.searching,
    v: common_vendor.o((...args) => $options.search && $options.search(...args), "1b")
  } : {
    w: $data.form.keyword,
    x: common_vendor.o(($event) => $data.form.keyword = $event.detail.value, "d1"),
    y: $data.searching,
    z: common_vendor.o((...args) => $options.search && $options.search(...args), "2c")
  }, {
    A: $data.searchType === "route"
  }, $data.searchType === "route" ? common_vendor.e({
    B: $data.recentRoutes.length
  }, $data.recentRoutes.length ? {
    C: common_vendor.f($data.recentRoutes, (r, idx, i0) => {
      return {
        a: common_vendor.t(r.origin),
        b: common_vendor.t(r.destination),
        c: common_vendor.t(r.timeText),
        d: idx,
        e: common_vendor.o(($event) => $options.onRecentRouteClick(r), idx)
      };
    })
  } : {}) : {}, {
    D: common_vendor.sr("regionPicker", "736db103-0"),
    E: common_vendor.o($options.onRegionSelect, "8d"),
    F: common_vendor.p({
      title: $options.pickerTitle
    }),
    G: common_vendor.sr("loginSheet", "736db103-1"),
    H: common_vendor.o($options.handleLoginSuccess, "09")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/home/index.js.map
