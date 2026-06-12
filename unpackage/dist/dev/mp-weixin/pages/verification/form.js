"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const AddressMapPicker = () => "../../components/address-map-picker/address-map-picker.js";
const DealerImageUploader = () => "../../components/dealer-image-uploader/dealer-image-uploader.js";
const RegionPicker = () => "../../components/region-picker/region-picker.js";
const _sfc_main = {
  components: {
    AddressMapPicker,
    DealerImageUploader,
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
      licenseFiles: [],
      siteFiles: [],
      exampleImages: {
        dealerBusinessLicense: "",
        dealerBusinessSite: ""
      },
      submitting: false
    };
  },
  onLoad() {
    this.loadExampleImages();
    if (utils_api.requireLogin())
      this.loadDetail();
  },
  methods: {
    async loadExampleImages() {
      try {
        const data = await utils_api.api.exampleImageConfigs();
        const byKey = {};
        (data.items || []).forEach((item) => {
          byKey[item.urlKey] = item;
        });
        this.exampleImages.dealerBusinessLicense = this.enabledExampleUrl(
          byKey.dealer_business_license_example_url
        );
        this.exampleImages.dealerBusinessSite = this.enabledExampleUrl(
          byKey.dealer_business_site_example_url
        );
      } catch (error) {
        this.exampleImages.dealerBusinessLicense = "";
        this.exampleImages.dealerBusinessSite = "";
      }
    },
    enabledExampleUrl(item) {
      return (item == null ? void 0 : item.enabled) && (item == null ? void 0 : item.url) ? item.url : "";
    },
    async loadDetail() {
      var _a, _b;
      try {
        const detail = await utils_api.api.verificationDetail();
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
        await utils_api.api.submitVerification(payload);
        common_vendor.index.showToast({ title: "认证材料提交成功", icon: "success" });
        setTimeout(() => common_vendor.index.redirectTo({ url: "/pages/verification/status" }), 600);
      } finally {
        this.submitting = false;
      }
    }
  }
};
if (!Array) {
  const _easycom_dealer_image_uploader2 = common_vendor.resolveComponent("dealer-image-uploader");
  const _easycom_region_picker2 = common_vendor.resolveComponent("region-picker");
  const _easycom_address_map_picker2 = common_vendor.resolveComponent("address-map-picker");
  (_easycom_dealer_image_uploader2 + _easycom_region_picker2 + _easycom_address_map_picker2)();
}
const _easycom_dealer_image_uploader = () => "../../components/dealer-image-uploader/dealer-image-uploader.js";
const _easycom_region_picker = () => "../../components/region-picker/region-picker.js";
const _easycom_address_map_picker = () => "../../components/address-map-picker/address-map-picker.js";
if (!Math) {
  (_easycom_dealer_image_uploader + _easycom_region_picker + _easycom_address_map_picker)();
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
    o: common_vendor.o(($event) => $data.licenseFiles = $event, "39"),
    p: common_vendor.p({
      title: "营业执照照片",
      tip: "清晰拍摄，文字无遮挡，仅限1张",
      ["usage-scene"]: "BUSINESS_LICENSE",
      ["max-count"]: 1,
      ["add-text"]: "上传执照",
      required: true,
      ["status-format"]: "single",
      ["example-src"]: $data.exampleImages.dealerBusinessLicense,
      modelValue: $data.licenseFiles
    }),
    q: common_vendor.o(($event) => $data.siteFiles = $event, "be"),
    r: common_vendor.p({
      title: "经营场地照片",
      tip: "展示真实车商展厅、场地，至少1张，最多9张",
      ["usage-scene"]: "BUSINESS_SITE",
      ["max-count"]: 9,
      ["add-text"]: "上传场地照",
      required: true,
      separator: true,
      ["example-src"]: $data.exampleImages.dealerBusinessSite,
      modelValue: $data.siteFiles
    }),
    s: common_vendor.sr("regionPicker", "046332e7-2"),
    t: common_vendor.o($options.onRegionSelect, "b5"),
    v: common_vendor.p({
      title: "选择省市地区"
    }),
    w: common_vendor.sr("addressMapPicker", "046332e7-3"),
    x: common_vendor.o($options.onAddressSelect, "7f"),
    y: common_vendor.p({
      title: "选择详细地址",
      placeholder: "搜索市场、园区、道路、公司名称"
    }),
    z: $data.submitting,
    A: common_vendor.o((...args) => $options.submit && $options.submit(...args), "1a")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/verification/form.js.map
