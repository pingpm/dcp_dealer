"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_miniappLoginPage = require("../../utils/miniapp-login-page.js");
const utils_api = require("../../utils/api.js");
const utils_format = require("../../utils/format.js");
const _sfc_main = {
  mixins: [utils_miniappLoginPage.miniappLoginPageMixin],
  data() {
    return {
      claimId: "",
      claim: {},
      logs: [],
      interventionReason: ""
    };
  },
  onLoad(options) {
    if (!utils_api.requireLogin())
      return;
    this.claimId = options.claimId;
    this.load();
  },
  methods: {
    dateText: utils_format.dateText,
    yuanText: utils_format.yuanText,
    async load() {
      const data = await utils_api.api.compensationClaim(this.claimId);
      this.claim = data.claim || {};
      this.logs = data.logs || [];
    },
    statusText(status) {
      const map = {
        PENDING_CARRIER: "待承运商处理",
        CARRIER_APPROVED: "承运商已同意",
        CARRIER_REJECTED: "承运商已拒绝",
        PLATFORM_PENDING: "平台介入中",
        PLATFORM_APPROVED: "平台已通过",
        PLATFORM_REJECTED: "平台已驳回",
        CANCELED: "已撤销"
      };
      return map[status] || status || "-";
    },
    actionText(action) {
      const map = {
        REQUEST: "车商发起赔付申请",
        CARRIER_APPROVE: "承运商同意赔付",
        CARRIER_REJECT: "承运商拒绝赔付",
        REQUEST_PLATFORM: "车商申请平台介入",
        PLATFORM_APPROVE: "平台通过赔付",
        PLATFORM_REJECT: "平台驳回赔付",
        MARK_OFFLINE_PAID: "平台标记线下打款"
      };
      return map[action] || action;
    },
    async requestPlatform() {
      if (!this.interventionReason.trim()) {
        common_vendor.index.showToast({ title: "请填写介入原因", icon: "none" });
        return;
      }
      await utils_api.api.requestCompensationPlatformIntervention(this.claimId, this.interventionReason);
      common_vendor.index.showToast({ title: "已申请平台介入", icon: "success" });
      this.load();
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
    a: $data.claim.id
  }, $data.claim.id ? common_vendor.e({
    b: common_vendor.t($data.claim.claimNo),
    c: common_vendor.t($options.statusText($data.claim.claimStatus)),
    d: common_vendor.t($options.dateText($data.claim.agreedDeliveryTime)),
    e: common_vendor.t($options.dateText($data.claim.carrierHandoverTime)),
    f: common_vendor.t($data.claim.overdueDays),
    g: common_vendor.t($options.yuanText($data.claim.requestedCompensationCent)),
    h: $data.claim.finalCompensationCent !== null
  }, $data.claim.finalCompensationCent !== null ? {
    i: common_vendor.t($options.yuanText($data.claim.finalCompensationCent))
  } : {}) : {}, {
    j: $data.claim.id
  }, $data.claim.id ? {
    k: common_vendor.f($data.logs, (log, k0, i0) => {
      return common_vendor.e({
        a: common_vendor.t($options.actionText(log.actionType)),
        b: log.reason
      }, log.reason ? {
        c: common_vendor.t(log.reason)
      } : {}, {
        d: log.remark
      }, log.remark ? {
        e: common_vendor.t(log.remark)
      } : {}, {
        f: common_vendor.t($options.dateText(log.createdAt)),
        g: log.id
      });
    })
  } : {}, {
    l: $data.claim.claimStatus === "CARRIER_REJECTED"
  }, $data.claim.claimStatus === "CARRIER_REJECTED" ? {
    m: $data.interventionReason,
    n: common_vendor.o(($event) => $data.interventionReason = $event.detail.value, "91"),
    o: common_vendor.o((...args) => $options.requestPlatform && $options.requestPlatform(...args), "ea")
  } : {}, {
    p: common_vendor.sr("loginSheet", "6d77c830-0"),
    q: common_vendor.o(_ctx.handleLoginSuccess, "7f")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-6d77c830"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/order/compensation-detail.js.map
