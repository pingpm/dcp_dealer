"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_miniappLoginPage = require("../../utils/miniapp-login-page.js");
const utils_api = require("../../utils/api.js");
const AddressMapPicker = () => "../../components/address-map-picker/address-map-picker.js";
const DealerImageUploader = () => "../../components/dealer-image-uploader/dealer-image-uploader.js";
const RegionPicker = () => "../../components/region-picker/region-picker.js";
const _sfc_main = {
  mixins: [utils_miniappLoginPage.miniappLoginPageMixin],
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
      submitting: false,
      devUploading: false,
      companyNameError: "",
      companyNameChecking: false,
      companyNameCheckedValue: ""
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
    clearCompanyNameError() {
      this.companyNameError = "";
      this.companyNameCheckedValue = "";
    },
    async checkCompanyNameUsed() {
      const companyName = this.form.companyName.trim();
      if (!companyName || this.companyNameChecking)
        return false;
      if (this.companyNameCheckedValue === companyName)
        return Boolean(this.companyNameError);
      this.companyNameChecking = true;
      try {
        const result = await utils_api.api.verificationCompanyNameCheck({ companyName });
        this.companyNameCheckedValue = companyName;
        if (result.companyNameUsed) {
          this.companyNameError = "该企业已入驻，请核对企业名称或更换后重试";
          return true;
        }
        this.companyNameError = "";
        return false;
      } catch (error) {
        return false;
      } finally {
        this.companyNameChecking = false;
      }
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
      this.form.longitude = region.longitude || "";
      this.form.latitude = region.latitude || "";
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
        defaultLng: this.form.longitude || "",
        defaultLat: this.form.latitude || "",
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
    async useDevPhotos() {
      if (this.devUploading)
        return;
      this.devUploading = true;
      try {
        const [licenseFile, siteFile] = await Promise.all([
          utils_api.api.importDevTestFile("test/dealer/dealer_company_licensepng.png", "IMAGE"),
          utils_api.api.importDevTestFile("test/dealer/dealer_office_photo1.png", "IMAGE")
        ]);
        this.licenseFiles = [{ fileId: licenseFile.fileId, fileUrl: licenseFile.fileUrl }];
        this.siteFiles = [{ fileId: siteFile.fileId, fileUrl: siteFile.fileUrl }];
      } finally {
        this.devUploading = false;
      }
    },
    validate() {
      const requiredFields = [
        ["contactName", "请填写联系人姓名"],
        ["companyName", "请填写企业全称"],
        ["provinceId", "请选择所在省市"],
        ["cityId", "请选择所在省市"],
        ["addressPoiName", "请在地图上选择详细地址"],
        ["addressDetail", "请在地图上选择详细地址"],
        ["longitude", "详细地址缺少定位信息，请重新在地图上选择"],
        ["latitude", "详细地址缺少定位信息，请重新在地图上选择"]
      ];
      for (const [key, message] of requiredFields) {
        if (!String(this.form[key] || "").trim()) {
          common_vendor.index.showToast({ title: message, icon: "none" });
          return false;
        }
      }
      if (this.companyNameError) {
        common_vendor.index.showToast({ title: this.companyNameError, icon: "none" });
        return false;
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
      if (await this.checkCompanyNameUsed()) {
        common_vendor.index.showToast({ title: this.companyNameError, icon: "none" });
        return;
      }
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
      } catch (error) {
        const message = (error == null ? void 0 : error.message) || "";
        if (message.includes("企业") && message.includes("入驻")) {
          this.companyNameError = message;
          this.companyNameCheckedValue = this.form.companyName.trim();
        }
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
  const _easycom_miniapp_login_sheet2 = common_vendor.resolveComponent("miniapp-login-sheet");
  (_easycom_dealer_image_uploader2 + _easycom_region_picker2 + _easycom_address_map_picker2 + _easycom_miniapp_login_sheet2)();
}
const _easycom_dealer_image_uploader = () => "../../components/dealer-image-uploader/dealer-image-uploader.js";
const _easycom_region_picker = () => "../../components/region-picker/region-picker.js";
const _easycom_address_map_picker = () => "../../components/address-map-picker/address-map-picker.js";
const _easycom_miniapp_login_sheet = () => "../../components/miniapp-login-sheet/miniapp-login-sheet.js";
if (!Math) {
  (_easycom_dealer_image_uploader + _easycom_region_picker + _easycom_address_map_picker + _easycom_miniapp_login_sheet)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.form.contactName,
    b: common_vendor.o(($event) => $data.form.contactName = $event.detail.value, "db"),
    c: $data.companyNameError ? 1 : "",
    d: common_vendor.o([($event) => $data.form.companyName = $event.detail.value, (...args) => $options.clearCompanyNameError && $options.clearCompanyNameError(...args)], "9f"),
    e: common_vendor.o((...args) => $options.checkCompanyNameUsed && $options.checkCompanyNameUsed(...args), "0a"),
    f: common_vendor.o((...args) => $options.checkCompanyNameUsed && $options.checkCompanyNameUsed(...args), "ff"),
    g: $data.form.companyName,
    h: $data.companyNameError
  }, $data.companyNameError ? {
    i: common_vendor.t($data.companyNameError)
  } : {}, {
    j: $data.form.provinceName
  }, $data.form.provinceName ? {
    k: common_vendor.t($data.form.provinceName),
    l: common_vendor.t($data.form.cityName)
  } : {}, {
    m: common_vendor.o((...args) => $options.openRegionPicker && $options.openRegionPicker(...args), "f2"),
    n: $data.form.addressPoiName || $data.form.addressDetail
  }, $data.form.addressPoiName || $data.form.addressDetail ? common_vendor.e({
    o: common_vendor.t($data.form.addressPoiName || $data.form.addressDetail),
    p: $data.form.addressDetail
  }, $data.form.addressDetail ? {
    q: common_vendor.t($data.form.addressDetail)
  } : {}) : {}, {
    r: !$data.form.cityId ? 1 : "",
    s: common_vendor.o((...args) => $options.openAddressPicker && $options.openAddressPicker(...args), "ed"),
    t: common_vendor.o(($event) => $data.licenseFiles = $event, "ad"),
    v: common_vendor.p({
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
    w: common_vendor.o(($event) => $data.siteFiles = $event, "91"),
    x: common_vendor.p({
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
    y: common_vendor.sr("regionPicker", "046332e7-2"),
    z: common_vendor.o($options.onRegionSelect, "29"),
    A: common_vendor.p({
      title: "选择省市地区"
    }),
    B: common_vendor.sr("addressMapPicker", "046332e7-3"),
    C: common_vendor.o($options.onAddressSelect, "83"),
    D: common_vendor.p({
      title: "选择详细地址",
      placeholder: "搜索市场、园区、道路、公司名称",
      ["allow-manual-address"]: false
    }),
    E: $data.submitting,
    F: common_vendor.o((...args) => $options.submit && $options.submit(...args), "d2"),
    G: common_vendor.sr("loginSheet", "046332e7-4"),
    H: common_vendor.o(_ctx.handleLoginSuccess, "0a")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/verification/form.js.map
