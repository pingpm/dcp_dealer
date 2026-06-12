"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      status: {
        reviewStatus: "UNVERIFIED",
        mediaFiles: []
      },
      reviewStatusText: common_vendor.reviewStatusText
    };
  },
  computed: {
    licenseFiles() {
      return (this.status.mediaFiles || []).filter((f) => f.usageScene === "BUSINESS_LICENSE");
    },
    siteFiles() {
      return (this.status.mediaFiles || []).filter((f) => f.usageScene === "BUSINESS_SITE");
    }
  },
  onShow() {
    if (common_vendor.requireLogin())
      this.load();
  },
  methods: {
    dateText: common_vendor.dateText,
    statusClass: common_vendor.statusClass,
    async load() {
      const res = await common_vendor.api.verificationStatus();
      this.status = res;
      if (res.reviewStatus !== "UNVERIFIED") {
        try {
          const detail = await common_vendor.api.verificationDetail();
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
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.status.reviewStatus === "APPROVED"
  }, $data.status.reviewStatus === "APPROVED" ? {} : $data.status.reviewStatus === "PENDING" ? {} : $data.status.reviewStatus === "REJECTED" ? {} : {}, {
    b: $data.status.reviewStatus === "PENDING",
    c: $data.status.reviewStatus === "REJECTED",
    d: common_vendor.t($data.reviewStatusText[$data.status.reviewStatus] || "-"),
    e: $data.status.reviewStatus === "APPROVED"
  }, $data.status.reviewStatus === "APPROVED" ? {} : $data.status.reviewStatus === "PENDING" ? {} : $data.status.reviewStatus === "REJECTED" ? {} : {}, {
    f: $data.status.reviewStatus === "PENDING",
    g: $data.status.reviewStatus === "REJECTED",
    h: common_vendor.n($data.status.reviewStatus.toLowerCase()),
    i: $data.status.rejectReason
  }, $data.status.rejectReason ? {
    j: common_vendor.t($data.status.rejectReason)
  } : {}, {
    k: $data.status.reviewStatus !== "UNVERIFIED"
  }, $data.status.reviewStatus !== "UNVERIFIED" ? common_vendor.e({
    l: common_vendor.t($data.status.companyName || "未填写"),
    m: common_vendor.t($data.status.contactName || "未填写"),
    n: $data.status.provinceName
  }, $data.status.provinceName ? {
    o: common_vendor.t($data.status.provinceName),
    p: common_vendor.t($data.status.cityName),
    q: common_vendor.t($data.status.addressDetail)
  } : {}, {
    r: $data.status.submittedAt
  }, $data.status.submittedAt ? {
    s: common_vendor.t($options.dateText($data.status.submittedAt))
  } : {}, {
    t: $data.status.reviewedAt
  }, $data.status.reviewedAt ? {
    v: common_vendor.t($options.dateText($data.status.reviewedAt))
  } : {}, {
    w: $options.licenseFiles.length
  }, $options.licenseFiles.length ? {
    x: common_vendor.f($options.licenseFiles, (file, k0, i0) => {
      return {
        a: file.fileId,
        b: file.fileUrl,
        c: common_vendor.o(($event) => $options.previewImg(file.fileUrl), file.fileId)
      };
    })
  } : {}, {
    y: $options.siteFiles.length
  }, $options.siteFiles.length ? {
    z: common_vendor.t($options.siteFiles.length),
    A: common_vendor.f($options.siteFiles, (file, k0, i0) => {
      return {
        a: file.fileId,
        b: file.fileUrl,
        c: common_vendor.o(($event) => $options.previewImg(file.fileUrl), file.fileId)
      };
    })
  } : {}) : {}, {
    B: $data.status.reviewStatus === "APPROVED"
  }, $data.status.reviewStatus === "APPROVED" ? {
    C: common_vendor.o((...args) => $options.goHome && $options.goHome(...args), "b4")
  } : $data.status.reviewStatus === "PENDING" ? {
    E: common_vendor.o((...args) => $options.load && $options.load(...args), "8d")
  } : {
    F: common_vendor.t($data.status.reviewStatus === "REJECTED" ? "重新提交认证信息" : "立即去认证"),
    G: common_vendor.o((...args) => $options.goForm && $options.goForm(...args), "0c")
  }, {
    D: $data.status.reviewStatus === "PENDING"
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
