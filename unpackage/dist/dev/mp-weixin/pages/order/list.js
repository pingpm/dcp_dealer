"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const utils_format = require("../../utils/format.js");
const common_assets = require("../../common/assets.js");
const PENDING_ORDER_DETAIL_KEY = "dealer_pending_order_detail";
const _sfc_main = {
  data() {
    return {
      activeStatus: "",
      isLoggedIn: false,
      loading: false,
      orders: [],
      orderStatusText: utils_format.orderStatusText,
      transportModeText: utils_format.transportModeText,
      tabs: [
        { label: "全部", value: "" },
        { label: "待确认", value: "PENDING_CONFIRM" },
        { label: "待提车", value: "PENDING_PICKUP" },
        { label: "运输中", value: "IN_TRANSIT" },
        { label: "待收车", value: "PENDING_RECEIPT" },
        { label: "已完成", value: "COMPLETED" }
      ]
    };
  },
  async onShow() {
    this.isLoggedIn = !!utils_api.getToken();
    if (this.isLoggedIn) {
      await this.load();
      this.openPendingOrderDetail();
    } else {
      this.orders = [];
      this.loading = false;
    }
  },
  methods: {
    dateText(dateStr) {
      if (!dateStr)
        return "";
      const d = new Date(dateStr);
      const yr = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, "0");
      const dy = String(d.getDate()).padStart(2, "0");
      const hr = String(d.getHours()).padStart(2, "0");
      const min = String(d.getMinutes()).padStart(2, "0");
      return `${yr}-${mo}-${dy} ${hr}:${min}`;
    },
    yuanVal(cent) {
      if (!cent && cent !== 0)
        return "0.00";
      return (cent / 100).toFixed(2);
    },
    yuanText: utils_format.yuanText,
    statusClass: utils_format.statusClass,
    orderTimingTip(order) {
      if (order.orderStatus === "PENDING_CONFIRM" && order.carrierConfirmDeadlineAt) {
        return `承运商需在 ${this.dateText(order.carrierConfirmDeadlineAt)} 前确认`;
      }
      if (order.orderStatus === "PENDING_RECEIPT" && order.autoReceiptAt) {
        return `未主动确认时，系统将在 ${this.dateText(order.autoReceiptAt)} 自动确认收车`;
      }
      return "";
    },
    formatServiceAddress(order, type) {
      const prefix = type === "origin" ? "origin" : "destination";
      return [
        order[`${prefix}ProvinceName`],
        order[`${prefix}CityName`],
        order[`${prefix}DistrictName`],
        order[`${prefix}AddressDetail`]
      ].filter(Boolean).join("");
    },
    async load() {
      if (!this.isLoggedIn)
        return;
      this.loading = true;
      try {
        const data = await utils_api.api.orders({ orderStatus: this.activeStatus }, { authRedirect: false });
        const rawOrders = data.orders || data.items || [];
        this.orders = rawOrders;
      } catch (error) {
        if ((error == null ? void 0 : error.statusCode) === 401) {
          this.isLoggedIn = false;
          this.orders = [];
        }
      } finally {
        this.loading = false;
      }
    },
    changeStatus(status) {
      this.activeStatus = status;
      if (this.isLoggedIn)
        this.load();
    },
    goLogin() {
      common_vendor.index.navigateTo({ url: "/pages/auth/login" });
    },
    goDetail(orderId) {
      common_vendor.index.navigateTo({ url: `/pages/order/detail?orderId=${orderId}` });
    },
    goTransitTrack(orderId) {
      common_vendor.index.navigateTo({ url: `/pages/order/transit-track?orderId=${orderId}` });
    },
    openPendingOrderDetail() {
      const rawPending = common_vendor.index.getStorageSync(PENDING_ORDER_DETAIL_KEY);
      if (!rawPending)
        return;
      common_vendor.index.removeStorageSync(PENDING_ORDER_DETAIL_KEY);
      let pending = null;
      try {
        pending = typeof rawPending === "string" ? JSON.parse(rawPending) : rawPending;
      } catch (error) {
        pending = null;
      }
      if (!(pending == null ? void 0 : pending.orderId))
        return;
      const query = pending.paymentSuccess ? "&paymentSuccess=1" : "";
      common_vendor.index.navigateTo({ url: `/pages/order/detail?orderId=${pending.orderId}${query}` });
    },
    goHome() {
      common_vendor.index.switchTab({ url: "/pages/home/index" });
    },
    async contactCarrier(order) {
      common_vendor.index.navigateTo({ url: `/pages/order/detail?orderId=${order.id}` });
    },
    signContract(order) {
      common_vendor.index.navigateTo({ url: `/pages/order/contract?orderId=${order.id}` });
    },
    goDrivers(orderId) {
      common_vendor.index.navigateTo({ url: `/pages/order/drivers?orderId=${orderId}` });
    },
    async confirmReceipt(order) {
      common_vendor.index.showModal({
        title: "确认收车",
        content: "您确定已经线下支付完运费并安全收到车辆了吗？确认后担保服务将完成结案。",
        confirmColor: "#f97316",
        confirmText: "确认收车",
        cancelText: "再看看",
        success: async (res) => {
          if (res.confirm) {
            await utils_api.api.confirmReceipt(order.id);
            common_vendor.index.showToast({ title: "已确认收车", icon: "success" });
            this.load();
          }
        }
      });
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
    a: common_vendor.f($data.tabs, (item, k0, i0) => {
      return common_vendor.e({
        a: common_vendor.t(item.label),
        b: $data.activeStatus === item.value
      }, $data.activeStatus === item.value ? {} : {}, {
        c: item.value,
        d: $data.activeStatus === item.value ? 1 : "",
        e: common_vendor.o(($event) => $options.changeStatus(item.value), item.value)
      });
    }),
    b: !$data.isLoggedIn
  }, !$data.isLoggedIn ? {
    c: common_vendor.o((...args) => $options.goLogin && $options.goLogin(...args), "08")
  } : !$data.loading && $data.orders.length === 0 ? {
    e: common_vendor.p({
      name: "package-open",
      size: "xl",
      color: "#f97316"
    }),
    f: common_vendor.o((...args) => $options.goHome && $options.goHome(...args), "ba")
  } : $data.isLoggedIn ? {
    h: common_vendor.f($data.orders, (order, k0, i0) => {
      return common_vendor.e({
        a: common_vendor.t(order.carrierName || "承运商"),
        b: common_vendor.t($data.orderStatusText[order.orderStatus]),
        c: common_vendor.n($options.statusClass(order.orderStatus)),
        d: common_vendor.t(order.orderNo),
        e: common_vendor.t($data.transportModeText[order.transportMode] || "运输"),
        f: common_vendor.t(order.originCityName),
        g: common_vendor.t(order.originProvinceName),
        h: common_vendor.t(order.hasPickupService ? "需提车" : "不提车"),
        i: order.hasPickupService ? 1 : "",
        j: order.hasPickupService
      }, order.hasPickupService ? {
        k: common_vendor.t($options.formatServiceAddress(order, "origin"))
      } : {}, {
        l: common_vendor.t(order.destinationCityName),
        m: common_vendor.t(order.destinationProvinceName),
        n: common_vendor.t(order.hasDeliveryService ? "需送车" : "不送车"),
        o: order.hasDeliveryService ? 1 : "",
        p: order.hasDeliveryService
      }, order.hasDeliveryService ? {
        q: common_vendor.t($options.formatServiceAddress(order, "destination"))
      } : {}, {
        r: common_vendor.t($options.dateText(order.createdAt)),
        s: common_vendor.t($options.yuanVal(order.orderAmountCent)),
        t: $options.orderTimingTip(order)
      }, $options.orderTimingTip(order) ? {
        v: common_vendor.t($options.orderTimingTip(order))
      } : {}, {
        w: order.orderStatus === "PENDING_CONFIRM"
      }, order.orderStatus === "PENDING_CONFIRM" ? {
        x: common_vendor.o(($event) => $options.contactCarrier(order), order.id),
        y: common_vendor.o(($event) => $options.goDetail(order.id), order.id)
      } : order.orderStatus === "PENDING_CONTRACT" ? {
        A: common_vendor.o(($event) => $options.contactCarrier(order), order.id),
        B: common_vendor.o(($event) => $options.signContract(order), order.id)
      } : order.orderStatus === "PENDING_PICKUP" ? {
        D: common_vendor.o(($event) => $options.goDetail(order.id), order.id),
        E: common_vendor.o(($event) => $options.goDrivers(order.id), order.id)
      } : order.orderStatus === "IN_TRANSIT" ? {
        G: common_vendor.o(($event) => $options.goTransitTrack(order.id), order.id),
        H: common_vendor.o(($event) => $options.goDetail(order.id), order.id)
      } : order.orderStatus === "PENDING_RECEIPT" ? {
        J: common_vendor.o(($event) => $options.goDetail(order.id), order.id),
        K: common_vendor.o(($event) => $options.confirmReceipt(order), order.id)
      } : {
        L: common_vendor.o(($event) => $options.goDetail(order.id), order.id)
      }, {
        z: order.orderStatus === "PENDING_CONTRACT",
        C: order.orderStatus === "PENDING_PICKUP",
        F: order.orderStatus === "IN_TRANSIT",
        I: order.orderStatus === "PENDING_RECEIPT",
        M: common_vendor.o(() => {
        }, order.id),
        N: order.id,
        O: common_vendor.o(($event) => $options.goDetail(order.id), order.id)
      });
    }),
    i: common_assets._imports_1$1
  } : {}, {
    d: !$data.loading && $data.orders.length === 0,
    g: $data.isLoggedIn
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/order/list.js.map
