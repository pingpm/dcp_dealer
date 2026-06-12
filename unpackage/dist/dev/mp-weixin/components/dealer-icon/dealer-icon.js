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
  return {
    a: common_vendor.s($options.iconStyle)
  };
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/dealer-icon/dealer-icon.js.map
