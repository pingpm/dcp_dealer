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
      selectedRouteTypes: ["LARGE_TRUCK", "SMALL_TRUCK"],
      transportModeText: utils_format.transportModeText,
      introPanelVisible: false,
      activeCarrierName: "",
      activeCarrierIntro: ""
    };
  },
  computed: {
    filteredItems() {
      return this.items.filter((item) => {
        if (this.selectedRouteTypes.length === 0)
          return false;
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
    async load() {
      this.loading = true;
      try {
        const baseParams = {
          ...this.query,
          keyword: this.keywordInput,
          page: 1,
          pageSize: 20
        };
        const requests = this.keywordInput || !this.query.originCityId || !this.query.destinationCityId ? [utils_api.api.searchCarriers(baseParams)] : ["LARGE_TRUCK", "SMALL_TRUCK"].map(
          (transportMode) => utils_api.api.searchCarriers({ ...baseParams, transportMode })
        );
        const results = await Promise.all(requests);
        const seen = /* @__PURE__ */ new Set();
        const rawItems = results.flatMap((data) => data.items || []).filter((item) => {
          const key = item.carrierRouteId || `${item.carrierId}-${item.routeType}`;
          if (seen.has(key))
            return false;
          seen.add(key);
          return true;
        });
        this.items = rawItems.map((item) => {
          const services = [];
          if (item.routeType === "SMALL_TRUCK") {
            services.push({
              name: "全程小板",
              price: item.priceText || "电话议价",
              time: item.durationText || ""
            });
          } else {
            services.push({
              name: "大板运输",
              price: item.priceText || "电话议价",
              time: item.durationText || ""
            });
          }
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
    onSearchConfirm() {
      this.query.keyword = this.keywordInput.trim();
      this.keywordInput = this.query.keyword;
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
    showCarrierIntro(item) {
      this.activeCarrierName = item.carrierName || "承运商介绍";
      const intro = (item.introduction || "").trim();
      this.activeCarrierIntro = intro || "暂无";
      this.introPanelVisible = true;
    },
    closeCarrierIntro() {
      this.introPanelVisible = false;
    },
    async contact(item) {
      const data = await utils_api.api.revealCarrierPhone({
        carrierId: item.carrierId,
        routeId: item.routeId,
        carrierRouteId: item.carrierRouteId,
        searchCondition: this.query
      });
      common_vendor.index.showModal({
        title: "拨打承运商电话",
        content: `承运商电话：${data.phone}
确定立即拨打吗？`,
        confirmColor: "#f97316",
        confirmText: "确定拨打",
        cancelText: "取消",
        success: (res) => {
          if (res.confirm)
            common_vendor.index.makePhoneCall({ phoneNumber: data.phone });
        }
      });
    },
    createOrder(item) {
      const payload = encodeURIComponent(
        JSON.stringify({
          ...item,
          searchCondition: this.query
        })
      );
      common_vendor.index.navigateTo({ url: `/pages/order/create?carrier=${payload}` });
    },
    goHome() {
      common_vendor.index.switchTab({ url: "/pages/home/index" });
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
    a: common_vendor.p({
      name: "search",
      size: "sm",
      color: "#94a3b8"
    }),
    b: common_vendor.o((...args) => $options.onSearchConfirm && $options.onSearchConfirm(...args), "14"),
    c: $data.keywordInput,
    d: common_vendor.o(($event) => $data.keywordInput = $event.detail.value, "7b"),
    e: common_vendor.o((...args) => $options.onSearchConfirm && $options.onSearchConfirm(...args), "a0"),
    f: common_vendor.t($data.query.originCityName || "全国"),
    g: common_vendor.t($data.query.destinationCityName || "全国"),
    h: $data.selectedRouteTypes.includes("LARGE_TRUCK") ? 1 : "",
    i: common_vendor.o(($event) => $options.toggleRouteType("LARGE_TRUCK"), "a6"),
    j: $data.selectedRouteTypes.includes("SMALL_TRUCK") ? 1 : "",
    k: common_vendor.o(($event) => $options.toggleRouteType("SMALL_TRUCK"), "f2"),
    l: !$data.loading && $options.filteredItems.length > 0
  }, !$data.loading && $options.filteredItems.length > 0 ? {
    m: common_vendor.t($options.filteredItems.length)
  } : {}, {
    n: !$data.loading && $options.filteredItems.length === 0
  }, !$data.loading && $options.filteredItems.length === 0 ? {
    o: common_vendor.o((...args) => $options.goHome && $options.goHome(...args), "78")
  } : !$data.loading ? {
    q: common_vendor.f($options.filteredItems, (item, idx, i0) => {
      return {
        a: common_vendor.t(item.carrierName),
        b: common_vendor.t(item.depositText),
        c: common_vendor.o(($event) => $options.showCarrierIntro(item), item.carrierRouteId || idx),
        d: common_vendor.f(item.services, (srv, sIdx, i1) => {
          return common_vendor.e({
            a: common_vendor.t(srv.name),
            b: srv.time
          }, srv.time ? {
            c: common_vendor.t(srv.time)
          } : {}, {
            d: common_vendor.t(srv.price),
            e: srv.price !== "电话议价" ? 1 : "",
            f: sIdx
          });
        }),
        e: common_vendor.o(($event) => $options.contact(item), item.carrierRouteId || idx),
        f: common_vendor.o(($event) => $options.createOrder(item), item.carrierRouteId || idx),
        g: item.carrierRouteId || idx
      };
    }),
    r: common_assets._imports_0$1,
    s: common_assets._imports_1,
    t: common_assets._imports_2
  } : {}, {
    p: !$data.loading,
    v: $data.loading
  }, $data.loading ? {
    w: common_vendor.p({
      name: "hourglass",
      size: "lg",
      color: "#f97316"
    })
  } : {}, {
    x: $data.introPanelVisible
  }, $data.introPanelVisible ? {
    y: common_vendor.t($data.activeCarrierName || "承运商介绍"),
    z: common_vendor.o((...args) => $options.closeCarrierIntro && $options.closeCarrierIntro(...args), "1d"),
    A: common_vendor.t($data.activeCarrierIntro || "暂无"),
    B: common_vendor.o(() => {
    }, "81"),
    C: common_vendor.o((...args) => $options.closeCarrierIntro && $options.closeCarrierIntro(...args), "41")
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/search/results.js.map
