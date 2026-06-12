"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const utils_format = require("../../utils/format.js");
const _sfc_main = {
  data() {
    return {
      orderId: "",
      eligibility: {},
      dealerClaimText: "",
      requestedYuan: "",
      evidenceFiles: [],
      submitting: false
    };
  },
  computed: {
    rule() {
      return this.eligibility.ruleSnapshot || {};
    }
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
      this.eligibility = await utils_api.api.compensationEligibility(this.orderId);
      if (!this.eligibility.eligible) {
        common_vendor.index.showModal({
          title: "暂不可申请",
          content: "当前订单不满足赔付申请条件，或已存在赔付申请。",
          showCancel: false,
          confirmColor: "#f97316",
          success: () => common_vendor.index.navigateBack()
        });
      }
    },
    chooseEvidence() {
      common_vendor.index.chooseImage({
        count: 9 - this.evidenceFiles.length,
        sizeType: ["compressed"],
        success: async (res) => {
          for (const path of res.tempFilePaths || []) {
            const file = await utils_api.uploadFile(path, "IMAGE", "COMPENSATION_EVIDENCE");
            this.evidenceFiles.push(file);
          }
        }
      });
    },
    removeEvidence(index) {
      this.evidenceFiles.splice(index, 1);
    },
    async submit() {
      if (!this.dealerClaimText.trim()) {
        common_vendor.index.showToast({ title: "请填写申请说明", icon: "none" });
        return;
      }
      const requestedCompensationCent = this.requestedYuan ? Math.round(Number(this.requestedYuan) * 100) : void 0;
      if (this.requestedYuan && (!Number.isFinite(requestedCompensationCent) || requestedCompensationCent <= 0)) {
        common_vendor.index.showToast({ title: "申请金额不正确", icon: "none" });
        return;
      }
      this.submitting = true;
      try {
        await utils_api.api.createCompensationClaim(this.orderId, {
          dealerClaimText: this.dealerClaimText,
          requestedCompensationCent,
          evidenceFileIds: this.evidenceFiles.map((file) => file.fileId || file.id)
        });
        common_vendor.index.showToast({ title: "已提交赔付申请", icon: "success" });
        setTimeout(() => common_vendor.index.navigateBack(), 600);
      } finally {
        this.submitting = false;
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.eligibility.order
  }, $data.eligibility.order ? {
    b: common_vendor.t($data.eligibility.order.orderNo),
    c: common_vendor.t($options.dateText($data.eligibility.order.agreedDeliveryTime)),
    d: common_vendor.t($options.dateText($data.eligibility.order.carrierHandoverTime)),
    e: common_vendor.t($options.yuanText($data.eligibility.order.orderAmountCent)),
    f: common_vendor.t($options.rule.overdueDays || 0),
    g: common_vendor.t($options.yuanText($options.rule.compensationPerDayCent)),
    h: common_vendor.t($options.yuanText($options.rule.suggestedCompensationCent)),
    i: common_vendor.t($options.dateText($options.rule.applyDeadlineAt))
  } : {}, {
    j: $data.dealerClaimText,
    k: common_vendor.o(($event) => $data.dealerClaimText = $event.detail.value, "b0"),
    l: common_vendor.t($data.dealerClaimText.length),
    m: $data.requestedYuan,
    n: common_vendor.o(($event) => $data.requestedYuan = $event.detail.value, "ca"),
    o: common_vendor.f($data.evidenceFiles, (file, index, i0) => {
      return {
        a: file.fileUrl,
        b: common_vendor.o(($event) => $options.removeEvidence(index), file.fileId),
        c: file.fileId
      };
    }),
    p: $data.evidenceFiles.length < 9
  }, $data.evidenceFiles.length < 9 ? {
    q: common_vendor.o((...args) => $options.chooseEvidence && $options.chooseEvidence(...args), "b9")
  } : {}, {
    r: $data.submitting,
    s: common_vendor.o((...args) => $options.submit && $options.submit(...args), "f9")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-d63d8b31"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/order/compensation-request.js.map
