"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const _sfc_main = {
  name: "AddressMapPicker",
  props: {
    title: {
      type: String,
      default: "选择详细地址"
    },
    placeholder: {
      type: String,
      default: "搜索园区、道路、公司名称"
    },
    allowManualAddress: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      visible: false,
      provinceName: "",
      cityName: "",
      keyword: "",
      manualAddress: "",
      searching: false,
      results: [],
      showSuggestions: false,
      searchTimer: null,
      reverseSearching: false,
      selectedAddress: this.emptyAddress(),
      mapState: {
        latitude: 39.90923,
        longitude: 116.397428,
        scale: 13
      }
    };
  },
  computed: {
    mapMarkers() {
      if (!this.selectedAddress.lng || !this.selectedAddress.lat)
        return [];
      return [
        {
          id: 1,
          longitude: Number(this.selectedAddress.lng),
          latitude: Number(this.selectedAddress.lat),
          iconPath: "/static/map_marker.svg",
          width: 28,
          height: 36
        }
      ];
    }
  },
  methods: {
    emptyAddress() {
      return {
        id: "",
        name: "",
        address: "",
        provinceName: "",
        cityName: "",
        lng: "",
        lat: "",
        districtName: "",
        districtId: ""
      };
    },
    open(options = {}) {
      this.provinceName = options.provinceName || "";
      this.cityName = options.cityName || "";
      this.keyword = options.keyword || options.name || options.address || "";
      this.manualAddress = options.address || "";
      this.results = [];
      this.showSuggestions = false;
      this.selectedAddress = {
        ...this.emptyAddress(),
        id: options.id || "",
        name: options.name || "",
        address: options.address || "",
        provinceName: options.provinceName || "",
        cityName: options.cityName || "",
        lng: options.lng || "",
        lat: options.lat || "",
        districtName: options.districtName || "",
        districtId: options.districtId || ""
      };
      if (options.defaultLng && options.defaultLat && !this.selectedAddress.lng) {
        this.setMapPoint({ lng: options.defaultLng, lat: options.defaultLat, scale: 12 });
      }
      this.visible = true;
      if (this.searchTimer) {
        clearTimeout(this.searchTimer);
        this.searchTimer = null;
      }
      this.$nextTick(() => {
        this.initMap();
      });
    },
    close() {
      this.showSuggestions = false;
      this.visible = false;
    },
    async initMap() {
      if (this.selectedAddress.lng && this.selectedAddress.lat) {
        this.setMapPoint({
          lng: this.selectedAddress.lng,
          lat: this.selectedAddress.lat,
          scale: 16
        });
        return;
      }
      const cityKeyword = this.cityName || this.provinceName;
      const cityResults = await this.searchPoiAddresses(cityKeyword, { pageSize: 1, silent: true });
      if (cityResults.length) {
        this.setMapPoint({ lng: cityResults[0].lng, lat: cityResults[0].lat, scale: 12 });
      }
    },
    searchPoiAddresses(keyword, options = {}) {
      const normalizedKeyword = (keyword || "").trim();
      if (!normalizedKeyword)
        return Promise.resolve([]);
      return utils_api.api.amapPoiSearch({
        keywords: normalizedKeyword,
        city: this.cityName || "",
        pageSize: options.pageSize || 10
      }).then((data) => {
        const items = Array.isArray(data.items) ? data.items : [];
        if (!items.length && !options.silent) {
          common_vendor.index.showToast({ title: "未找到相关地址", icon: "none" });
        }
        return items.map((item) => this.normalizePoiAddress(item));
      }).catch(() => []);
    },
    reverseGeocodeAddress(lng, lat) {
      if (!lng || !lat)
        return Promise.resolve(null);
      return utils_api.api.amapRegeo({ lng, lat }).then((data) => data.item ? this.normalizePoiAddress(data.item) : null).catch(() => null);
    },
    normalizePoiAddress(item) {
      const provinceName = this.normalizeRegionName(item.provinceName || this.provinceName);
      const cityName = this.normalizeRegionName(item.cityName || this.cityName);
      const districtName = this.normalizeRegionName(item.districtName || "");
      const address = String(item.rawAddress || item.address || "").trim();
      return {
        id: item.id,
        name: item.name || address,
        address,
        provinceName,
        cityName,
        districtName,
        districtId: item.districtId || "",
        lng: item.lng,
        lat: item.lat
      };
    },
    normalizeRegionName(name) {
      return Array.isArray(name) ? name.filter(Boolean).join("") : String(name || "").trim();
    },
    setMapPoint({ lng, lat, scale = 16 }) {
      if (!lng || !lat)
        return;
      this.mapState = {
        longitude: Number(lng),
        latitude: Number(lat),
        scale
      };
    },
    onKeywordInput() {
      if (this.searchTimer)
        clearTimeout(this.searchTimer);
      const keyword = this.keyword.trim();
      if (!keyword) {
        this.results = [];
        this.showSuggestions = false;
        return;
      }
      this.searchTimer = setTimeout(() => {
        this.searchAddress({ silent: true });
      }, 350);
    },
    async searchAddress(options = {}) {
      const keyword = this.keyword.trim();
      if (!keyword) {
        common_vendor.index.showToast({ title: "请输入搜索关键词", icon: "none" });
        return;
      }
      this.searching = true;
      const results = await this.searchPoiAddresses(keyword, options);
      this.searching = false;
      this.results = results;
      this.showSuggestions = results.length > 0;
    },
    selectAddressResult(item) {
      this.selectedAddress = { ...item };
      this.keyword = item.name;
      this.manualAddress = item.address || item.name || "";
      this.showSuggestions = false;
      this.setMapPoint({ lng: item.lng, lat: item.lat, scale: 16 });
    },
    async onMapTap(e) {
      const lng = e.detail && (e.detail.longitude || e.detail.x);
      const lat = e.detail && (e.detail.latitude || e.detail.y);
      if (!lng || !lat || this.reverseSearching)
        return;
      this.reverseSearching = true;
      const result = await this.reverseGeocodeAddress(lng, lat);
      this.reverseSearching = false;
      if (!result) {
        common_vendor.index.showToast({ title: "未解析到当前位置地址", icon: "none" });
        return;
      }
      this.selectAddressResult(result);
    },
    confirm() {
      const name = (this.selectedAddress.name || "").trim();
      const manualAddress = (this.manualAddress || "").trim();
      if (!name && (!this.allowManualAddress || !manualAddress)) {
        common_vendor.index.showToast({ title: "请选择详细地址", icon: "none" });
        return;
      }
      if (this.allowManualAddress && !name && manualAddress) {
        this.$emit("select", {
          ...this.emptyAddress(),
          name: manualAddress,
          address: manualAddress,
          provinceName: this.provinceName,
          cityName: this.cityName,
          lng: this.mapState.longitude || "",
          lat: this.mapState.latitude || ""
        });
        this.close();
        return;
      }
      this.$emit("select", {
        ...this.selectedAddress,
        address: this.selectedAddress.address || manualAddress
      });
      this.close();
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.visible
  }, $data.visible ? common_vendor.e({
    b: common_vendor.o((...args) => $options.close && $options.close(...args), "52"),
    c: common_vendor.t($props.title),
    d: common_vendor.t($data.provinceName),
    e: common_vendor.t($data.cityName),
    f: common_vendor.o((...args) => $options.close && $options.close(...args), "df"),
    g: $props.placeholder,
    h: common_vendor.o([($event) => $data.keyword = $event.detail.value, (...args) => $options.onKeywordInput && $options.onKeywordInput(...args)], "0c"),
    i: common_vendor.o((...args) => $options.searchAddress && $options.searchAddress(...args), "f1"),
    j: $data.keyword,
    k: $data.showSuggestions
  }, $data.showSuggestions ? {
    l: common_vendor.f($data.results, (item, k0, i0) => {
      return {
        a: common_vendor.t(item.name),
        b: common_vendor.t(item.address),
        c: item.id || item.name + item.address,
        d: common_vendor.o(($event) => $options.selectAddressResult(item), item.id || item.name + item.address),
        e: common_vendor.o(($event) => $options.selectAddressResult(item), item.id || item.name + item.address)
      };
    })
  } : {}, {
    m: $data.searching,
    n: common_vendor.o((...args) => $options.searchAddress && $options.searchAddress(...args), "e7"),
    o: $props.allowManualAddress
  }, $props.allowManualAddress ? {
    p: $data.manualAddress,
    q: common_vendor.o(($event) => $data.manualAddress = $event.detail.value, "96")
  } : {}, {
    r: $data.mapState.latitude,
    s: $data.mapState.longitude,
    t: $data.mapState.scale,
    v: $options.mapMarkers,
    w: common_vendor.o((...args) => $options.onMapTap && $options.onMapTap(...args), "23"),
    x: common_vendor.o((...args) => $options.close && $options.close(...args), "73"),
    y: common_vendor.o((...args) => $options.confirm && $options.confirm(...args), "4e")
  }) : {});
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/address-map-picker/address-map-picker.js.map
