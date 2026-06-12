"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const _sfc_main = {
  data() {
    return {
      orderId: "",
      contract: {},
      submitting: false
    };
  },
  computed: {
    confirmDeadlineAt() {
      return this.contract.confirmDeadlineAt || this.contract.contractConfirmDeadlineAt || "";
    },
    contractExpired() {
      if (!this.confirmDeadlineAt)
        return false;
      const deadline = new Date(this.confirmDeadlineAt);
      return !Number.isNaN(deadline.getTime()) && deadline.getTime() <= Date.now();
    },
    deadlineText() {
      return this.confirmDeadlineAt ? this.dateText(this.confirmDeadlineAt) : "未设置";
    }
  },
  onLoad(options) {
    if (!utils_api.requireLogin())
      return;
    this.orderId = options.orderId;
    this.load();
  },
  methods: {
    async load() {
      this.contract = await utils_api.api.contract(this.orderId);
    },
    dateTextDateOnly(val) {
      if (!val)
        return "";
      const date = new Date(val);
      if (Number.isNaN(date.getTime()))
        return "";
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    },
    dateText(val) {
      if (!val)
        return "";
      const date = new Date(val);
      if (Number.isNaN(date.getTime()))
        return "";
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    },
    back() {
      common_vendor.index.redirectTo({ url: `/pages/order/detail?orderId=${this.orderId}` });
    },
    async confirm() {
      if (this.contractExpired) {
        common_vendor.index.showToast({ title: "合同签署已超时", icon: "none" });
        return;
      }
      this.submitting = true;
      try {
        const result = await utils_api.api.confirmContract(this.orderId);
        if ((result == null ? void 0 : result.expired) || (result == null ? void 0 : result.orderStatus) === "CANCELED") {
          common_vendor.index.showToast({ title: "合同签署已超时，订单已取消", icon: "none" });
          setTimeout(
            () => common_vendor.index.redirectTo({ url: `/pages/order/detail?orderId=${this.orderId}` }),
            800
          );
          return;
        }
        common_vendor.index.showToast({ title: "合同已确认", icon: "success" });
        setTimeout(
          () => common_vendor.index.redirectTo({ url: `/pages/order/detail?orderId=${this.orderId}` }),
          500
        );
      } finally {
        this.submitting = false;
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.t($data.contract.contractNo || "-"),
    b: common_vendor.t($data.contract.contractContent || "合同内容加载中..."),
    c: $data.contract.dealerConfirmedAt
  }, $data.contract.dealerConfirmedAt ? {
    d: common_vendor.t($options.dateTextDateOnly($data.contract.dealerConfirmedAt))
  } : {}, {
    e: $data.contract.carrierConfirmedAt
  }, $data.contract.carrierConfirmedAt ? {
    f: common_vendor.t($options.dateTextDateOnly($data.contract.carrierConfirmedAt))
  } : {}, {
    g: common_vendor.t($data.contract.dealerConfirmedAt ? "已确认" : "待您确认"),
    h: common_vendor.n($data.contract.dealerConfirmedAt ? "status-success" : "status-warning"),
    i: common_vendor.t($data.contract.carrierConfirmedAt ? "已确认" : "等待承运商确认"),
    j: common_vendor.n($data.contract.carrierConfirmedAt ? "status-success" : "status-warning"),
    k: common_vendor.t($options.deadlineText),
    l: $options.contractExpired ? 1 : "",
    m: $options.contractExpired && !$data.contract.dealerConfirmedAt
  }, $options.contractExpired && !$data.contract.dealerConfirmedAt ? {} : {}, {
    n: !$data.contract.dealerConfirmedAt
  }, !$data.contract.dealerConfirmedAt ? {
    o: common_vendor.t($options.contractExpired ? "签署已超时" : "确认模拟合同"),
    p: $data.submitting,
    q: $options.contractExpired,
    r: common_vendor.o((...args) => $options.confirm && $options.confirm(...args), "01")
  } : {
    s: common_vendor.o((...args) => $options.back && $options.back(...args), "f3")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/order/contract.js.map
