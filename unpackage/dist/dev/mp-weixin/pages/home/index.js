"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const utils_format = require("../../utils/format.js");
const common_assets = require("../../common/assets.js");
const RegionPicker = () => "../../components/region-picker/region-picker.js";
const _sfc_main = {
  components: {
    RegionPicker
  },
  data() {
    return {
      status: { reviewStatus: "UNVERIFIED" },
      reviewStatusText: utils_format.reviewStatusText,
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
        this.status = await utils_api.api.verificationStatus({ authRedirect: false, silent: true });
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
      common_vendor.index.showModal({
        title: "还未完成认证",
        content: "完成车商认证后，您可以搜索承运商、联系承运商并发起托运订单。",
        confirmText: "立即认证",
        cancelText: "稍后认证",
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
      common_vendor.index.navigateTo({ url: "/pages/auth/login" });
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
      if (this.status.reviewStatus !== "APPROVED") {
        common_vendor.index.showToast({ title: "请先完成车商认证", icon: "none" });
        this.goVerify();
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
        const query = utils_api.toQuery(this.form);
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
  const _easycom_dealer_icon2 = common_vendor.resolveComponent("dealer-icon");
  const _easycom_region_picker2 = common_vendor.resolveComponent("region-picker");
  (_easycom_dealer_icon2 + _easycom_region_picker2)();
}
const _easycom_dealer_icon = () => "../../components/dealer-icon/dealer-icon.js";
const _easycom_region_picker = () => "../../components/region-picker/region-picker.js";
if (!Math) {
  (_easycom_dealer_icon + _easycom_region_picker)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: !$data.isLoggedIn || $data.status.reviewStatus !== "APPROVED"
  }, !$data.isLoggedIn || $data.status.reviewStatus !== "APPROVED" ? {
    b: common_vendor.t($options.floatNoticeText),
    c: common_vendor.t($options.floatNoticeDesc),
    d: common_vendor.t($options.floatButtonText),
    e: common_vendor.o((...args) => $options.handleAccountNotice && $options.handleAccountNotice(...args), "78"),
    f: common_vendor.o((...args) => $options.handleAccountNotice && $options.handleAccountNotice(...args), "fc")
  } : {}, {
    g: common_assets._imports_0,
    h: $data.searchType === "route" ? 1 : "",
    i: common_vendor.o(($event) => $data.searchType = "route", "d9"),
    j: $data.searchType === "carrier" ? 1 : "",
    k: common_vendor.o(($event) => $data.searchType = "carrier", "6e"),
    l: $data.searchType === "route"
  }, $data.searchType === "route" ? {
    m: common_vendor.t($data.form.originCityName || "请选择出发地"),
    n: !$data.form.originCityName ? 1 : "",
    o: common_vendor.o(($event) => $options.triggerCityPicker("origin"), "11"),
    p: common_vendor.o((...args) => $options.swapCities && $options.swapCities(...args), "43"),
    q: common_vendor.t($data.form.destinationCityName || "请选择目的地"),
    r: !$data.form.destinationCityName ? 1 : "",
    s: common_vendor.o(($event) => $options.triggerCityPicker("destination"), "48"),
    t: $data.searching,
    v: common_vendor.o((...args) => $options.search && $options.search(...args), "24")
  } : {
    w: common_vendor.p({
      name: "search",
      size: "sm",
      color: "#a3a3a3"
    }),
    x: $data.form.keyword,
    y: common_vendor.o(($event) => $data.form.keyword = $event.detail.value, "9b"),
    z: $data.searching,
    A: common_vendor.o((...args) => $options.search && $options.search(...args), "a3")
  }, {
    B: $data.searchType === "route"
  }, $data.searchType === "route" ? common_vendor.e({
    C: $data.recentRoutes.length
  }, $data.recentRoutes.length ? {
    D: common_vendor.f($data.recentRoutes, (r, idx, i0) => {
      return {
        a: common_vendor.t(r.origin),
        b: common_vendor.t(r.destination),
        c: common_vendor.t(r.timeText),
        d: idx,
        e: common_vendor.o(($event) => $options.onRecentRouteClick(r), idx)
      };
    })
  } : {}) : {}, {
    E: common_vendor.sr("regionPicker", "736db103-1"),
    F: common_vendor.o($options.onRegionSelect, "80"),
    G: common_vendor.p({
      title: $options.pickerTitle
    })
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/home/index.js.map
