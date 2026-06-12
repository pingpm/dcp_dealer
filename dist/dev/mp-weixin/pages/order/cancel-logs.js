"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      orderId: "",
      logs: []
    };
  },
  onLoad(options) {
    if (!common_vendor.requireLogin())
      return;
    this.orderId = options.orderId;
    this.load();
  },
  methods: {
    dateText: common_vendor.dateText,
    async load() {
      const data = await common_vendor.api.cancelLogs(this.orderId);
      this.logs = data.items || data.logs || [];
    },
    translateAction(actionType) {
      if (!actionType)
        return "";
      const map = {
        REQUEST: "发起取消申请",
        APPROVED: "同意取消申请",
        REJECTED: "拒绝取消申请",
        WITHDRAW: "撤回取消申请",
        WITHDRAWN: "已撤回",
        CLOSED: "关闭取消申请"
      };
      const key = String(actionType).toUpperCase();
      return map[key] || actionType;
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.logs.length === 0
  }, $data.logs.length === 0 ? {} : {
    b: common_vendor.f($data.logs, (log, idx, i0) => {
      return common_vendor.e({
        a: idx === 0 ? 1 : "",
        b: idx < $data.logs.length - 1
      }, idx < $data.logs.length - 1 ? {} : {}, {
        c: common_vendor.t($options.translateAction(log.actionType)),
        d: common_vendor.t($options.dateText(log.createdAt)),
        e: log.reason || log.remark
      }, log.reason || log.remark ? {
        f: common_vendor.t(log.reason || log.remark)
      } : {}, {
        g: log.id
      });
    })
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
