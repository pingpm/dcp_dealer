"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const utils_navigation = require("../../utils/navigation.js");
const utils_format = require("../../utils/format.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      query: {},
      keywordInput: "",
      items: [],
      loading: false,
      selectedRouteTypes: ["LARGE_TRUCK", "SMALL_TRUCK", "DRIVING"],
      transportModeText: utils_format.transportModeText,
      introPanelVisible: false,
      introLoading: false,
      activeCarrierName: "",
      activeCarrierIntro: "",
      activeCarrierAddresses: []
    };
  },
  computed: {
    isKeywordSearch() {
      return Boolean((this.query.keyword || "").trim());
    },
    filteredItems() {
      return this.items.filter((item) => {
        if (this.selectedRouteTypes.length === 0)
          return false;
        if (this.isCarrierOnlyResult(item)) {
          return (item.routeTypes || []).some((routeType) => this.selectedRouteTypes.includes(routeType));
        }
        return this.selectedRouteTypes.includes(item.routeType);
      });
    }
  },
  async onLoad(options) {
    this.query = utils_api.decodeQuery(options);
    this.keywordInput = this.query.keyword || "";
    if (await utils_navigation.ensureDealerReady()) {
      this.load();
    }
  },
  methods: {
    hasRouteSearchParams() {
      return Boolean(this.query.originCityId && this.query.destinationCityId);
    },
    async load() {
      const keyword = this.keywordInput.trim();
      if (!keyword && !this.hasRouteSearchParams()) {
        common_vendor.index.showToast({ title: "关键词不能为空", icon: "none" });
        return;
      }
      this.keywordInput = keyword;
      this.loading = true;
      try {
        const baseParams = {
          ...this.query,
          keyword,
          page: 1,
          pageSize: 20
        };
        const requests = keyword || !this.hasRouteSearchParams() ? [utils_api.api.searchCarriers(baseParams)] : ["LARGE_TRUCK", "SMALL_TRUCK", "DRIVING"].map(
          (transportMode) => utils_api.api.searchCarriers({ ...baseParams, transportMode })
        );
        const results = await Promise.all(requests);
        const seen = /* @__PURE__ */ new Set();
        const rawItems = results.flatMap((data) => data.items || []).filter((item) => {
          const key = this.isCarrierOnlyResult(item) ? `carrier-${item.carrierId}` : item.carrierRouteId || `${item.carrierId}-${item.routeType}`;
          if (seen.has(key))
            return false;
          seen.add(key);
          return true;
        });
        this.items = rawItems.map((item) => {
          const routeTypeNames = {
            LARGE_TRUCK: "大板运输",
            SMALL_TRUCK: "全程小板",
            DRIVING: "代驾"
          };
          const isCarrierOnly = this.isCarrierOnlyResult(item);
          const services = isCarrierOnly ? [
            {
              name: "可承运",
              price: (item.routeTypes || []).map((routeType) => routeTypeNames[routeType] || routeType).filter(Boolean).join("、"),
              time: ""
            }
          ] : [
            {
              name: routeTypeNames[item.routeType] || "承运服务",
              price: item.priceText || "电话议价",
              time: item.durationText || ""
            }
          ];
          return {
            ...item,
            services,
            depositText: this.formatDepositText(item.depositBalanceCent)
          };
        });
      } finally {
        this.loading = false;
      }
    },
    isCarrierOnlyResult(item) {
      return (item == null ? void 0 : item.resultType) === "CARRIER" || !(item == null ? void 0 : item.carrierRouteId) && Array.isArray(item == null ? void 0 : item.routeTypes);
    },
    onSearchConfirm() {
      const keyword = this.keywordInput.trim();
      if (!keyword && !this.hasRouteSearchParams()) {
        this.keywordInput = "";
        common_vendor.index.showToast({ title: "关键词不能为空", icon: "none" });
        return;
      }
      if (keyword) {
        this.query = { keyword };
      } else {
        this.query.keyword = "";
      }
      this.keywordInput = keyword;
      this.load();
    },
    toggleRouteType(routeType) {
      if (this.selectedRouteTypes.includes(routeType)) {
        if (this.selectedRouteTypes.length === 1) {
          common_vendor.index.showToast({ title: "至少选择一种运输方式", icon: "none" });
          return;
        }
        this.selectedRouteTypes = this.selectedRouteTypes.filter((item) => item !== routeType);
        return;
      }
      this.selectedRouteTypes = [...this.selectedRouteTypes, routeType];
    },
    formatDepositText(depositBalanceCent) {
      const yuan = Math.floor(Number(depositBalanceCent || 0) / 100);
      if (yuan <= 0)
        return "0k";
      const thousands = Math.floor(yuan / 1e3);
      if (thousands <= 0)
        return "<1k";
      return `${thousands}k+`;
    },
    async showCarrierIntro(item) {
      this.activeCarrierName = item.carrierName || "承运商介绍";
      const intro = (item.introduction || "").trim();
      this.activeCarrierIntro = intro || "暂无";
      this.activeCarrierAddresses = [];
      this.introPanelVisible = true;
      this.introLoading = true;
      try {
        const profile = await utils_api.api.carrierPublicProfile(item.carrierId);
        this.activeCarrierName = profile.carrierName || this.activeCarrierName;
        this.activeCarrierIntro = (profile.introduction || "").trim() || "暂无";
        this.activeCarrierAddresses = profile.contactAddresses || [];
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/search/results.vue:359", "获取承运商介绍失败:", error);
      } finally {
        this.introLoading = false;
      }
    },
    closeCarrierIntro() {
      this.introPanelVisible = false;
      this.introLoading = false;
    },
    addressName(address, index) {
      return address.addressName || address.addressPoiName || `联系地址 ${index + 1}`;
    },
    openAddressLocation(address) {
      if (!address.longitude || !address.latitude) {
        common_vendor.index.showToast({ title: "该地址缺少地图坐标", icon: "none" });
        return;
      }
      common_vendor.index.openLocation({
        latitude: Number(address.latitude),
        longitude: Number(address.longitude),
        name: this.addressName(address, 0),
        address: address.addressDetail || address.addressPoiName || ""
      });
    },
    copyAddress(address) {
      const text = [address.provinceName, address.cityName, address.districtName, address.addressDetail].filter(Boolean).join("");
      common_vendor.index.setClipboardData({ data: text || address.addressDetail || "" });
    },
    callAddressPhone(address) {
      if (!address.contactPhone) {
        common_vendor.index.showToast({ title: "该地址未填写联系电话", icon: "none" });
        return;
      }
      common_vendor.index.makePhoneCall({ phoneNumber: address.contactPhone });
    },
    async contact(item) {
      const data = await utils_api.api.revealCarrierPhone({
        carrierId: item.carrierId,
        routeId: item.routeId,
        carrierRouteId: item.carrierRouteId,
        searchCondition: this.query
      });
      common_vendor.index.makePhoneCall({ phoneNumber: data.phone });
    },
    createOrder(item) {
      var _a;
      const defaultRouteType = this.isCarrierOnlyResult(item) ? (item.routeTypes || []).find((routeType) => this.selectedRouteTypes.includes(routeType)) || ((_a = item.routeTypes) == null ? void 0 : _a[0]) || "" : item.routeType;
      const payload = encodeURIComponent(
        JSON.stringify({
          ...item,
          routeType: defaultRouteType,
          searchCondition: this.query
        })
      );
      common_vendor.index.navigateTo({ url: `/pages/order/create?carrier=${payload}` });
    }
  }
};
if (!Array) {
  const _easycom_dealer_icon2 = common_vendor.resolveComponent("dealer-icon");
  _easycom_dealer_icon2();
}
const _easycom_dealer_icon = () => "../../components/dealer-icon/dealer-icon.js";
if (!Math) {
  _easycom_dealer_icon();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.o((...args) => $options.onSearchConfirm && $options.onSearchConfirm(...args), "bf"),
    b: $data.keywordInput,
    c: common_vendor.o(($event) => $data.keywordInput = $event.detail.value, "4e"),
    d: common_vendor.o((...args) => $options.onSearchConfirm && $options.onSearchConfirm(...args), "6d"),
    e: $options.isKeywordSearch
  }, $options.isKeywordSearch ? {} : {
    f: common_vendor.t($data.query.originCityName || "全国"),
    g: common_vendor.t($data.query.destinationCityName || "全国")
  }, {
    h: $data.selectedRouteTypes.includes("LARGE_TRUCK") ? 1 : "",
    i: common_vendor.o(($event) => $options.toggleRouteType("LARGE_TRUCK"), "32"),
    j: $data.selectedRouteTypes.includes("SMALL_TRUCK") ? 1 : "",
    k: common_vendor.o(($event) => $options.toggleRouteType("SMALL_TRUCK"), "ce"),
    l: $data.selectedRouteTypes.includes("DRIVING") ? 1 : "",
    m: common_vendor.o(($event) => $options.toggleRouteType("DRIVING"), "ee"),
    n: !$data.loading && $options.filteredItems.length > 0
  }, !$data.loading && $options.filteredItems.length > 0 ? {
    o: common_vendor.t($options.filteredItems.length),
    p: common_vendor.t($options.isKeywordSearch ? "承运商" : "承运线路")
  } : {}, {
    q: !$data.loading && $options.filteredItems.length === 0
  }, !$data.loading && $options.filteredItems.length === 0 ? {} : !$data.loading ? {
    s: common_vendor.f($options.filteredItems, (item, idx, i0) => {
      return {
        a: common_vendor.t(item.carrierName),
        b: common_vendor.t(item.depositText),
        c: common_vendor.o(($event) => $options.showCarrierIntro(item), item.carrierRouteId || item.carrierId || idx),
        d: common_vendor.f(item.services, (srv, sIdx, i1) => {
          return common_vendor.e({
            a: common_vendor.t(srv.name),
            b: srv.time
          }, srv.time ? {
            c: common_vendor.t(srv.time)
          } : {}, {
            d: srv.price
          }, srv.price ? {
            e: common_vendor.t(srv.price),
            f: srv.price !== "电话议价" ? 1 : ""
          } : {}, {
            g: sIdx
          });
        }),
        e: common_vendor.o(($event) => $options.contact(item), item.carrierRouteId || item.carrierId || idx),
        f: common_vendor.o(($event) => $options.createOrder(item), item.carrierRouteId || item.carrierId || idx),
        g: item.carrierRouteId || item.carrierId || idx
      };
    }),
    t: common_assets._imports_0$1,
    v: common_assets._imports_1,
    w: common_assets._imports_2
  } : {}, {
    r: !$data.loading,
    x: $data.loading
  }, $data.loading ? {
    y: common_vendor.p({
      name: "hourglass",
      size: "lg",
      color: "#f97316"
    })
  } : {}, {
    z: $data.introPanelVisible
  }, $data.introPanelVisible ? common_vendor.e({
    A: common_vendor.t($data.activeCarrierName || "承运商介绍"),
    B: common_vendor.o((...args) => $options.closeCarrierIntro && $options.closeCarrierIntro(...args), "dc"),
    C: $data.introLoading
  }, $data.introLoading ? {} : common_vendor.e({
    D: common_vendor.t($data.activeCarrierIntro || "暂无"),
    E: $data.activeCarrierAddresses.length === 0
  }, $data.activeCarrierAddresses.length === 0 ? {} : {}, {
    F: common_vendor.f($data.activeCarrierAddresses, (address, index, i0) => {
      return {
        a: common_vendor.t($options.addressName(address, index)),
        b: common_vendor.t(address.cityName || ""),
        c: common_vendor.t(address.addressDetail),
        d: common_vendor.t(address.contactPhone),
        e: common_vendor.o(($event) => $options.openAddressLocation(address), address.id || index),
        f: common_vendor.o(($event) => $options.copyAddress(address), address.id || index),
        g: common_vendor.o(($event) => $options.callAddressPhone(address), address.id || index),
        h: address.id || index
      };
    })
  }), {
    G: common_vendor.o(() => {
    }, "fa"),
    H: common_vendor.o((...args) => $options.closeCarrierIntro && $options.closeCarrierIntro(...args), "83")
  }) : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/search/results.js.map
