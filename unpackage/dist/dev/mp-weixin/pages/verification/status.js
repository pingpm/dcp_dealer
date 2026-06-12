"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const utils_format = require("../../utils/format.js");
const _sfc_main = {
  data() {
    return {
      status: {
        reviewStatus: "UNVERIFIED",
        mediaFiles: []
      },
      reviewStatusText: utils_format.reviewStatusText
    };
  },
  computed: {
    statusIconName() {
      const map = {
        APPROVED: "circle-check",
        PENDING: "hourglass",
        REJECTED: "triangle-alert"
      };
      return map[this.status.reviewStatus] || "user-round";
    },
    statusIconColor() {
      const map = {
        APPROVED: "#16a34a",
        PENDING: "#d97706",
        REJECTED: "#dc2626"
      };
      return map[this.status.reviewStatus] || "#64748b";
    },
    licenseFiles() {
      return (this.status.mediaFiles || []).filter((f) => f.usageScene === "BUSINESS_LICENSE");
    },
    siteFiles() {
      return (this.status.mediaFiles || []).filter((f) => f.usageScene === "BUSINESS_SITE");
    }
  },
  onShow() {
    if (utils_api.requireLogin())
      this.load();
  },
  methods: {
    dateText: utils_format.dateText,
    statusClass: utils_format.statusClass,
    async load() {
      const res = await utils_api.api.verificationStatus();
      this.status = res;
      if (res.reviewStatus !== "UNVERIFIED") {
        try {
          const detail = await utils_api.api.verificationDetail();
          if (detail && detail.version) {
            this.status = {
              ...this.status,
              provinceName: detail.version.provinceName,
              cityName: detail.version.cityName,
              addressDetail: detail.version.addressDetail,
              mediaFiles: detail.version.mediaFiles || []
            };
          }
        } catch (e) {
        }
      }
    },
    previewImg(url) {
      common_vendor.index.previewImage({
        urls: [url]
      });
    },
    goHome() {
      common_vendor.index.switchTab({ url: "/pages/home/index" });
    },
    goForm() {
      common_vendor.index.navigateTo({ url: "/pages/verification/form" });
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
      name: $options.statusIconName,
      size: "lg",
      color: $options.statusIconColor
    }),
    b: common_vendor.t($data.reviewStatusText[$data.status.reviewStatus] || "-"),
    c: $data.status.reviewStatus === "APPROVED"
  }, $data.status.reviewStatus === "APPROVED" ? {} : $data.status.reviewStatus === "PENDING" ? {} : $data.status.reviewStatus === "REJECTED" ? {} : {}, {
    d: $data.status.reviewStatus === "PENDING",
    e: $data.status.reviewStatus === "REJECTED",
    f: common_vendor.n($data.status.reviewStatus.toLowerCase()),
    g: $data.status.rejectReason
  }, $data.status.rejectReason ? {
    h: common_vendor.t($data.status.rejectReason)
  } : {}, {
    i: $data.status.reviewStatus !== "UNVERIFIED"
  }, $data.status.reviewStatus !== "UNVERIFIED" ? common_vendor.e({
    j: common_vendor.t($data.status.companyName || "未填写"),
    k: common_vendor.t($data.status.contactName || "未填写"),
    l: $data.status.provinceName
  }, $data.status.provinceName ? {
    m: common_vendor.t($data.status.provinceName),
    n: common_vendor.t($data.status.cityName),
    o: common_vendor.t($data.status.addressDetail)
  } : {}, {
    p: $data.status.submittedAt
  }, $data.status.submittedAt ? {
    q: common_vendor.t($options.dateText($data.status.submittedAt))
  } : {}, {
    r: $data.status.reviewedAt
  }, $data.status.reviewedAt ? {
    s: common_vendor.t($options.dateText($data.status.reviewedAt))
  } : {}, {
    t: $options.licenseFiles.length
  }, $options.licenseFiles.length ? {
    v: common_vendor.f($options.licenseFiles, (file, k0, i0) => {
      return {
        a: file.fileId,
        b: file.fileUrl,
        c: common_vendor.o(($event) => $options.previewImg(file.fileUrl), file.fileId)
      };
    })
  } : {}, {
    w: $options.siteFiles.length
  }, $options.siteFiles.length ? {
    x: common_vendor.t($options.siteFiles.length),
    y: common_vendor.f($options.siteFiles, (file, k0, i0) => {
      return {
        a: file.fileId,
        b: file.fileUrl,
        c: common_vendor.o(($event) => $options.previewImg(file.fileUrl), file.fileId)
      };
    })
  } : {}) : {}, {
    z: $data.status.reviewStatus === "APPROVED"
  }, $data.status.reviewStatus === "APPROVED" ? {
    A: common_vendor.o((...args) => $options.goHome && $options.goHome(...args), "c1")
  } : $data.status.reviewStatus === "PENDING" ? {
    C: common_vendor.o((...args) => $options.load && $options.load(...args), "20")
  } : {
    D: common_vendor.t($data.status.reviewStatus === "REJECTED" ? "重新提交认证信息" : "立即去认证"),
    E: common_vendor.o((...args) => $options.goForm && $options.goForm(...args), "68")
  }, {
    B: $data.status.reviewStatus === "PENDING"
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/verification/status.js.map
