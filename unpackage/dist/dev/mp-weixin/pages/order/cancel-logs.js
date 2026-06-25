"use strict";
const utils_miniappLoginPage = require("../../utils/miniapp-login-page.js");
const utils_api = require("../../utils/api.js");
const utils_format = require("../../utils/format.js");
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  mixins: [utils_miniappLoginPage.miniappLoginPageMixin],
  data() {
    return {
      orderId: "",
      logs: []
    };
  },
  onLoad(options) {
    if (!utils_api.requireLogin())
      return;
    this.orderId = options.orderId;
    this.load();
  },
  methods: {
    dateText: utils_format.dateText,
    yuanText: utils_format.yuanText,
    async load() {
      const data = await utils_api.api.negotiationHistory(this.orderId);
      this.logs = data.items || data.logs || [];
    },
    translateAction(log) {
      const actionType = log.actionType;
      if (!actionType)
        return "";
      if (log.historyType === "COMPENSATION" && actionType === "REQUEST") {
        return "车商发起赔付申请";
      }
      const map = {
        REQUEST: "发起取消申请",
        APPROVED: "同意取消申请",
        REJECTED: "拒绝取消申请",
        WITHDRAW: "撤回取消申请",
        WITHDRAWN: "已撤回",
        CLOSED: "关闭取消申请",
        CARRIER_APPROVE: "承运商同意赔付",
        CARRIER_REJECT: "承运商拒绝赔付",
        REQUEST_PLATFORM: "车商申请平台介入",
        PLATFORM_APPROVE: "平台通过赔付",
        PLATFORM_REJECT: "平台驳回赔付",
        MARK_OFFLINE_PAID: "平台标记线下打款"
      };
      const key = String(actionType).toUpperCase();
      return map[key] || actionType;
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
    a: $data.logs.length === 0
  }, $data.logs.length === 0 ? {} : {
    b: common_vendor.f($data.logs, (log, idx, i0) => {
      return common_vendor.e({
        a: idx === 0 ? 1 : "",
        b: idx < $data.logs.length - 1
      }, idx < $data.logs.length - 1 ? {} : {}, {
        c: common_vendor.t($options.translateAction(log)),
        d: common_vendor.t(log.historyType === "COMPENSATION" ? "赔付" : "取消"),
        e: common_vendor.t($options.dateText(log.createdAt)),
        f: log.claimNo
      }, log.claimNo ? {
        g: common_vendor.t(log.claimNo)
      } : {}, {
        h: log.reason || log.remark
      }, log.reason || log.remark ? {
        i: common_vendor.t(log.reason || log.remark)
      } : {}, {
        j: log.amountCent !== null && log.amountCent !== void 0
      }, log.amountCent !== null && log.amountCent !== void 0 ? {
        k: common_vendor.t($options.yuanText(log.amountCent))
      } : {}, {
        l: log.id
      });
    })
  }, {
    c: common_vendor.sr("loginSheet", "ff65abe0-0"),
    d: common_vendor.o(_ctx.handleLoginSuccess, "8a")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/order/cancel-logs.js.map
