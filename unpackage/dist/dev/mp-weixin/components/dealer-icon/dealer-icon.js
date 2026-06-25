"use strict";
const common_vendor = require("../../common/vendor.js");
const sizeMap = {
  xs: "22rpx",
  sm: "28rpx",
  md: "36rpx",
  lg: "54rpx",
  xl: "72rpx",
  empty: "104rpx"
};
const _sfc_main = {
  name: "DealerIcon",
  props: {
    name: {
      type: String,
      required: true
    },
    size: {
      type: String,
      default: "md"
    },
    color: {
      type: String,
      default: "#f97316"
    }
  },
  computed: {
    cssIconStyle() {
      const size = sizeMap[this.size] || this.size || sizeMap.md;
      return {
        width: size,
        height: size,
        color: this.color
      };
    },
    iconStyle() {
      const size = sizeMap[this.size] || this.size || sizeMap.md;
      const src = `/static/icons/${this.name}.svg`;
      return {
        width: size,
        height: size,
        backgroundColor: this.color,
        WebkitMaskImage: `url("${src}")`,
        maskImage: `url("${src}")`
      };
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $props.name === "package-open"
  }, $props.name === "package-open" ? {} : $props.name === "hourglass" ? {} : $props.name === "triangle-alert" ? {} : {}, {
    b: $props.name === "hourglass",
    c: $props.name === "triangle-alert",
    d: common_vendor.s($options.cssIconStyle)
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/dealer-icon/dealer-icon.js.map
