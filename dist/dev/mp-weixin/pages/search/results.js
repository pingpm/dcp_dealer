"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      query: {},
      keywordInput: "",
      items: [],
      loading: false,
      selectedRouteTypes: ["LARGE_TRUCK", "SMALL_TRUCK"],
      transportModeText: common_vendor.transportModeText
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
    this.query = options || {};
    this.keywordInput = this.query.keyword || "";
    if (await common_vendor.ensureDealerReady()) {
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
        const requests = this.keywordInput || !this.query.originCityId || !this.query.destinationCityId ? [common_vendor.api.searchCarriers(baseParams)] : ["LARGE_TRUCK", "SMALL_TRUCK"].map(
          (transportMode) => common_vendor.api.searchCarriers({ ...baseParams, transportMode })
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
            services
          };
        });
      } finally {
        this.loading = false;
      }
    },
    onSearchConfirm() {
      this.query.keyword = this.keywordInput;
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
    async contact(item) {
      const data = await common_vendor.api.revealCarrierPhone({
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
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.o((...args) => $options.onSearchConfirm && $options.onSearchConfirm(...args), "0f"),
    b: $data.keywordInput,
    c: common_vendor.o(($event) => $data.keywordInput = $event.detail.value, "fc"),
    d: common_vendor.o((...args) => $options.onSearchConfirm && $options.onSearchConfirm(...args), "b1"),
    e: common_vendor.t($data.query.originCityName || "全国"),
    f: common_vendor.t($data.query.destinationCityName || "全国"),
    g: $data.selectedRouteTypes.includes("LARGE_TRUCK") ? 1 : "",
    h: common_vendor.o(($event) => $options.toggleRouteType("LARGE_TRUCK"), "b2"),
    i: $data.selectedRouteTypes.includes("SMALL_TRUCK") ? 1 : "",
    j: common_vendor.o(($event) => $options.toggleRouteType("SMALL_TRUCK"), "89"),
    k: !$data.loading && $options.filteredItems.length > 0
  }, !$data.loading && $options.filteredItems.length > 0 ? {
    l: common_vendor.t($options.filteredItems.length)
  } : {}, {
    m: !$data.loading && $options.filteredItems.length === 0
  }, !$data.loading && $options.filteredItems.length === 0 ? {
    n: common_vendor.o((...args) => $options.goHome && $options.goHome(...args), "91")
  } : !$data.loading ? {
    p: common_vendor.f($options.filteredItems, (item, idx, i0) => {
      return {
        a: common_vendor.t(item.carrierName),
        b: common_vendor.t($data.transportModeText[item.routeType] || "线路"),
        c: common_vendor.f(item.services, (srv, sIdx, i1) => {
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
        d: common_vendor.o(($event) => $options.contact(item), item.carrierRouteId || idx),
        e: common_vendor.o(($event) => $options.createOrder(item), item.carrierRouteId || idx),
        f: item.carrierRouteId || idx
      };
    })
  } : {}, {
    o: !$data.loading,
    q: $data.loading
  }, $data.loading ? {} : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
