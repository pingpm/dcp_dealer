"use strict";
const common_vendor = require("../../common/vendor.js");
const AddressMapPicker = () => "../../components/address-map-picker/address-map-picker.js";
const RegionPicker = () => "../../components/region-picker/region-picker.js";
const _sfc_main = {
  components: {
    AddressMapPicker,
    RegionPicker
  },
  data() {
    return {
      form: {
        contactName: "",
        companyName: "",
        provinceId: "",
        provinceName: "",
        cityId: "",
        cityName: "",
        districtId: "",
        districtName: "",
        addressPoiName: "",
        addressDetail: "",
        longitude: "",
        latitude: ""
      },
      // Stores actual file objects { fileId, fileUrl }
      licenseFiles: [],
      siteFiles: [],
      uploadingLicense: false,
      uploadingSite: false,
      submitting: false
    };
  },
  onLoad() {
    if (common_vendor.requireLogin())
      this.loadDetail();
  },
  methods: {
    async loadDetail() {
      var _a, _b;
      try {
        const detail = await common_vendor.api.verificationDetail();
        const profile = detail.profile || {};
        const snapshot = ((_a = detail.version) == null ? void 0 : _a.snapshotData) || {};
        this.form = {
          ...this.form,
          contactName: snapshot.contactName || profile.contactName || "",
          companyName: snapshot.companyName || profile.companyName || "",
          provinceId: snapshot.provinceId || "",
          provinceName: snapshot.provinceName || "",
          cityId: snapshot.cityId || "",
          cityName: snapshot.cityName || "",
          districtId: snapshot.districtId || "",
          districtName: snapshot.districtName || "",
          addressPoiName: snapshot.addressPoiName || "",
          addressDetail: snapshot.addressDetail || "",
          longitude: snapshot.longitude || "",
          latitude: snapshot.latitude || ""
        };
        if ((_b = detail.version) == null ? void 0 : _b.mediaFiles) {
          const media = detail.version.mediaFiles || [];
          this.licenseFiles = media.filter((f) => f.usageScene === "BUSINESS_LICENSE").map((f) => ({ fileId: f.fileId, fileUrl: f.fileUrl }));
          this.siteFiles = media.filter((f) => f.usageScene === "BUSINESS_SITE").map((f) => ({ fileId: f.fileId, fileUrl: f.fileUrl }));
        }
      } catch (error) {
      }
    },
    openRegionPicker() {
      this.$refs.regionPicker.open();
    },
    onRegionSelect(region) {
      this.form.provinceId = region.provinceId;
      this.form.provinceName = region.provinceName;
      this.form.cityId = region.cityId;
      this.form.cityName = region.cityName;
      this.form.districtId = "";
      this.form.districtName = "";
      this.form.addressPoiName = "";
      this.form.addressDetail = "";
      this.form.longitude = "";
      this.form.latitude = "";
    },
    openAddressPicker() {
      if (!this.form.cityId) {
        common_vendor.index.showToast({ title: "请先选择所在省市", icon: "none" });
        return;
      }
      this.$refs.addressMapPicker.open({
        id: "",
        name: this.form.addressPoiName || "",
        address: this.form.addressDetail || "",
        provinceName: this.form.provinceName || "",
        cityName: this.form.cityName || "",
        lng: this.form.longitude || "",
        lat: this.form.latitude || "",
        districtName: this.form.districtName || "",
        districtId: this.form.districtId || ""
      });
    },
    onAddressSelect(address) {
      const name = (address.name || "").trim();
      this.form.addressPoiName = name;
      this.form.addressDetail = address.address || name;
      this.form.longitude = address.lng || "";
      this.form.latitude = address.lat || "";
      this.form.districtName = address.districtName || this.form.districtName;
      this.form.districtId = address.districtId || this.form.districtId;
    },
    previewImg(url) {
      common_vendor.index.previewImage({
        urls: [url]
      });
    },
    chooseLicense() {
      if (this.uploadingLicense)
        return;
      this.chooseImage("licenseFiles", "uploadingLicense", "BUSINESS_LICENSE", 1);
    },
    chooseSite() {
      if (this.uploadingSite)
        return;
      this.chooseImage("siteFiles", "uploadingSite", "BUSINESS_SITE", 9 - this.siteFiles.length);
    },
    chooseImage(targetArrayKey, loadingKey, scene, count) {
      common_vendor.index.chooseImage({
        count,
        success: async (res) => {
          this[loadingKey] = true;
          try {
            for (const path of res.tempFilePaths) {
              const file = await common_vendor.uploadFile(path, "IMAGE", scene);
              const fileObj = { fileId: file.fileId, fileUrl: file.fileUrl };
              if (targetArrayKey === "licenseFiles") {
                this[targetArrayKey] = [fileObj];
              } else {
                this[targetArrayKey].push(fileObj);
              }
            }
          } catch (e) {
          } finally {
            this[loadingKey] = false;
          }
        }
      });
    },
    deleteLicense(index) {
      this.licenseFiles.splice(index, 1);
    },
    deleteSite(index) {
      this.siteFiles.splice(index, 1);
    },
    validate() {
      const required = [
        "contactName",
        "companyName",
        "provinceId",
        "cityId",
        "addressPoiName",
        "addressDetail",
        "longitude",
        "latitude"
      ];
      for (const key of required) {
        if (!this.form[key]) {
          common_vendor.index.showToast({ title: "请完整填写企业信息及经营地址", icon: "none" });
          return false;
        }
      }
      if (!this.licenseFiles.length) {
        common_vendor.index.showToast({ title: "请上传营业执照照片", icon: "none" });
        return false;
      }
      if (!this.siteFiles.length) {
        common_vendor.index.showToast({ title: "请至少上传一张经营场地照片", icon: "none" });
        return false;
      }
      return true;
    },
    async submit() {
      if (!this.validate())
        return;
      this.submitting = true;
      try {
        const payload = {
          ...this.form,
          businessLicenseFileIds: this.licenseFiles.map((f) => f.fileId),
          businessSiteFileIds: this.siteFiles.map((f) => f.fileId)
        };
        await common_vendor.api.submitVerification(payload);
        common_vendor.index.showToast({ title: "认证材料提交成功", icon: "success" });
        setTimeout(() => common_vendor.index.redirectTo({ url: "/pages/verification/status" }), 600);
      } finally {
        this.submitting = false;
      }
    }
  }
};
if (!Array) {
  const _easycom_region_picker2 = common_vendor.resolveComponent("region-picker");
  const _easycom_address_map_picker2 = common_vendor.resolveComponent("address-map-picker");
  (_easycom_region_picker2 + _easycom_address_map_picker2)();
}
const _easycom_region_picker = () => "../../components/region-picker/region-picker.js";
const _easycom_address_map_picker = () => "../../components/address-map-picker/address-map-picker.js";
if (!Math) {
  (_easycom_region_picker + _easycom_address_map_picker)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.form.contactName,
    b: common_vendor.o(($event) => $data.form.contactName = $event.detail.value, "db"),
    c: $data.form.companyName,
    d: common_vendor.o(($event) => $data.form.companyName = $event.detail.value, "8c"),
    e: $data.form.provinceName
  }, $data.form.provinceName ? {
    f: common_vendor.t($data.form.provinceName),
    g: common_vendor.t($data.form.cityName)
  } : {}, {
    h: common_vendor.o((...args) => $options.openRegionPicker && $options.openRegionPicker(...args), "79"),
    i: $data.form.addressPoiName || $data.form.addressDetail
  }, $data.form.addressPoiName || $data.form.addressDetail ? common_vendor.e({
    j: common_vendor.t($data.form.addressPoiName || $data.form.addressDetail),
    k: $data.form.addressDetail
  }, $data.form.addressDetail ? {
    l: common_vendor.t($data.form.addressDetail)
  } : {}) : {}, {
    m: !$data.form.cityId ? 1 : "",
    n: common_vendor.o((...args) => $options.openAddressPicker && $options.openAddressPicker(...args), "e6"),
    o: common_vendor.t($data.licenseFiles.length ? "已上传" : "未上传"),
    p: common_vendor.n($data.licenseFiles.length ? "status-success" : "status-warning"),
    q: common_vendor.f($data.licenseFiles, (file, idx, i0) => {
      return {
        a: file.fileUrl,
        b: common_vendor.o(($event) => $options.previewImg(file.fileUrl), file.fileId),
        c: common_vendor.o(($event) => $options.deleteLicense(idx), file.fileId),
        d: file.fileId
      };
    }),
    r: $data.licenseFiles.length === 0
  }, $data.licenseFiles.length === 0 ? {
    s: common_vendor.t($data.uploadingLicense ? "⏳" : "+"),
    t: common_vendor.t($data.uploadingLicense ? "上传中..." : "上传执照"),
    v: common_vendor.o((...args) => $options.chooseLicense && $options.chooseLicense(...args), "4f"),
    w: $data.uploadingLicense ? 1 : ""
  } : {}, {
    x: common_vendor.t($data.siteFiles.length),
    y: common_vendor.n($data.siteFiles.length ? "status-success" : "status-warning"),
    z: common_vendor.f($data.siteFiles, (file, idx, i0) => {
      return {
        a: file.fileUrl,
        b: common_vendor.o(($event) => $options.previewImg(file.fileUrl), file.fileId),
        c: common_vendor.o(($event) => $options.deleteSite(idx), file.fileId),
        d: file.fileId
      };
    }),
    A: $data.siteFiles.length < 9
  }, $data.siteFiles.length < 9 ? {
    B: common_vendor.t($data.uploadingSite ? "⏳" : "+"),
    C: common_vendor.t($data.uploadingSite ? "上传中..." : "上传场地照"),
    D: common_vendor.o((...args) => $options.chooseSite && $options.chooseSite(...args), "ff"),
    E: $data.uploadingSite ? 1 : ""
  } : {}, {
    F: common_vendor.sr("regionPicker", "046332e7-0"),
    G: common_vendor.o($options.onRegionSelect, "97"),
    H: common_vendor.p({
      title: "选择省市地区"
    }),
    I: common_vendor.sr("addressMapPicker", "046332e7-1"),
    J: common_vendor.o($options.onAddressSelect, "94"),
    K: common_vendor.p({
      title: "选择详细地址",
      placeholder: "搜索市场、园区、道路、公司名称"
    }),
    L: $data.submitting,
    M: common_vendor.o((...args) => $options.submit && $options.submit(...args), "e1")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
