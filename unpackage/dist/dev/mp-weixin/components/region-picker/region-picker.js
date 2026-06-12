"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const _sfc_main = {
  name: "RegionPicker",
  props: {
    title: {
      type: String,
      default: "选择地区"
    }
  },
  data() {
    return {
      visible: false,
      animating: false,
      loading: false,
      searchLoading: false,
      activeTab: "province",
      // 'province' | 'city'
      searchKeyword: "",
      provinces: [],
      cities: [],
      allCities: [],
      allCitiesLoaded: false,
      selectedProvince: null,
      selectedCity: null
    };
  },
  computed: {
    normalizedKeyword() {
      return this.normalizeKeyword(this.searchKeyword);
    },
    provinceMap() {
      return this.provinces.reduce((map, province) => {
        map[String(province.id)] = province;
        return map;
      }, {});
    },
    searchResults() {
      const keyword = this.normalizedKeyword;
      if (!keyword)
        return [];
      const matchedProvinces = this.provinces.filter((province) => this.regionMatches(province, keyword)).map((province) => this.decorateItem(province, "province"));
      const matchedCities = this.allCities.filter(
        (city) => this.regionMatches(city, keyword) || this.regionMatches(this.provinceMap[String(city.parentId)], keyword)
      ).map((city) => this.decorateItem(city, "city"));
      return [...matchedProvinces, ...matchedCities];
    },
    currentList() {
      if (this.normalizedKeyword)
        return this.searchResults;
      const list = this.activeTab === "province" ? this.provinces : this.cities;
      return list.map((item) => this.decorateItem(item, this.activeTab));
    },
    currentLoading() {
      return this.loading || this.searchLoading;
    }
  },
  methods: {
    open() {
      this.activeTab = "province";
      this.searchKeyword = "";
      this.selectedProvince = null;
      this.selectedCity = null;
      this.cities = [];
      this.visible = true;
      this.$nextTick(() => {
        setTimeout(() => {
          this.animating = true;
        }, 50);
      });
      if (this.provinces.length === 0) {
        this.loadProvinces();
      }
    },
    close() {
      this.animating = false;
      setTimeout(() => {
        this.visible = false;
      }, 300);
    },
    switchTab(tab) {
      if (tab === "city" && !this.selectedProvince)
        return;
      this.activeTab = tab;
    },
    async loadProvinces() {
      this.loading = true;
      try {
        const res = await utils_api.api.regions(null, "PROVINCE");
        this.provinces = res.items || [];
      } catch (err) {
        this.showRegionLoadError(err, "加载地区失败");
      } finally {
        this.loading = false;
      }
    },
    async loadCities(provinceId) {
      this.loading = true;
      try {
        const res = await utils_api.api.regions(provinceId, "CITY");
        this.cities = res.items || [];
      } catch (err) {
        this.showRegionLoadError(err, "加载城市失败");
      } finally {
        this.loading = false;
      }
    },
    async loadAllCities() {
      if (this.allCitiesLoaded)
        return;
      this.searchLoading = true;
      try {
        if (this.provinces.length === 0) {
          await this.loadProvinces();
        }
        const res = await utils_api.api.regions(null, "CITY");
        this.allCities = res.items || [];
        this.allCitiesLoaded = true;
      } catch (err) {
        this.showRegionLoadError(err, "加载城市失败");
      } finally {
        this.searchLoading = false;
      }
    },
    showRegionLoadError(err, fallback) {
      const title = (err == null ? void 0 : err.statusCode) === 401 ? "请先登录后再选择地区" : (err == null ? void 0 : err.message) || fallback;
      common_vendor.index.showToast({ title, icon: "none" });
    },
    onSearchInput(event) {
      this.searchKeyword = event.detail.value || "";
      if (this.normalizedKeyword && !this.allCitiesLoaded) {
        this.loadAllCities();
      }
    },
    clearSearch() {
      this.searchKeyword = "";
    },
    normalizeKeyword(value) {
      return String(value || "").trim().toLowerCase();
    },
    regionMatches(region, keyword) {
      if (!region)
        return false;
      return this.normalizeKeyword(region.regionName).includes(keyword);
    },
    decorateItem(item, itemType) {
      return {
        ...item,
        itemType,
        itemKey: `${itemType}-${item.id}`
      };
    },
    getProvinceName(provinceId) {
      var _a;
      return ((_a = this.provinceMap[String(provinceId)]) == null ? void 0 : _a.regionName) || "";
    },
    isSelected(item) {
      const type = item.itemType || this.activeTab;
      if (type === "province") {
        return this.selectedProvince && this.selectedProvince.id === item.id;
      }
      return this.selectedCity && this.selectedCity.id === item.id;
    },
    async selectItem(item) {
      var _a;
      if ((item.itemType || this.activeTab) === "province") {
        this.selectedProvince = item;
        this.selectedCity = null;
        this.cities = [];
        this.searchKeyword = "";
        this.activeTab = "city";
        await this.loadCities(item.id);
      } else {
        const province = ((_a = this.selectedProvince) == null ? void 0 : _a.id) === item.parentId ? this.selectedProvince : this.provinceMap[String(item.parentId)];
        if (!province) {
          common_vendor.index.showToast({ title: "未找到所属省份", icon: "none" });
          return;
        }
        this.selectedProvince = province;
        this.selectedCity = item;
        this.$emit("select", {
          provinceId: this.selectedProvince.id,
          provinceName: this.selectedProvince.regionName,
          cityId: item.id,
          cityName: item.regionName,
          longitude: item.longitude || "",
          latitude: item.latitude || ""
        });
        this.close();
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.visible
  }, $data.visible ? common_vendor.e({
    b: $data.animating ? 1 : "",
    c: common_vendor.o((...args) => $options.close && $options.close(...args), "2a"),
    d: common_vendor.t($props.title),
    e: common_vendor.o((...args) => $options.close && $options.close(...args), "6c"),
    f: $data.searchKeyword,
    g: common_vendor.o((...args) => $options.onSearchInput && $options.onSearchInput(...args), "31"),
    h: $data.searchKeyword
  }, $data.searchKeyword ? {
    i: common_vendor.o((...args) => $options.clearSearch && $options.clearSearch(...args), "0f")
  } : {}, {
    j: !$options.normalizedKeyword
  }, !$options.normalizedKeyword ? common_vendor.e({
    k: common_vendor.t($data.selectedProvince ? $data.selectedProvince.regionName : "选择省份"),
    l: $data.activeTab === "province" ? 1 : "",
    m: common_vendor.o(($event) => $options.switchTab("province"), "31"),
    n: $data.selectedProvince
  }, $data.selectedProvince ? {
    o: common_vendor.t($data.selectedCity ? $data.selectedCity.regionName : "选择城市"),
    p: $data.activeTab === "city" ? 1 : "",
    q: common_vendor.o(($event) => $options.switchTab("city"), "8e")
  } : {}) : {}, {
    r: $options.currentLoading
  }, $options.currentLoading ? {} : common_vendor.e({
    s: common_vendor.f($options.currentList, (item, k0, i0) => {
      return common_vendor.e({
        a: common_vendor.t(item.regionName),
        b: item.itemType === "city"
      }, item.itemType === "city" ? {
        c: common_vendor.t($options.getProvinceName(item.parentId))
      } : {}, {
        d: $options.isSelected(item)
      }, $options.isSelected(item) ? {} : {}, {
        e: item.itemKey,
        f: $options.isSelected(item) ? 1 : "",
        g: common_vendor.o(($event) => $options.selectItem(item), item.itemKey)
      });
    }),
    t: $options.currentList.length === 0
  }, $options.currentList.length === 0 ? {
    v: common_vendor.t($options.normalizedKeyword ? "未找到匹配的省市" : "暂无地区数据")
  } : {}), {
    w: $data.animating ? 1 : ""
  }) : {});
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/region-picker/region-picker.js.map
