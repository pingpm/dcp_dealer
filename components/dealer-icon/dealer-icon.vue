<template>
  <view class="dealer-icon" :style="iconStyle"></view>
</template>

<script>
const sizeMap = {
  xs: '22rpx',
  sm: '28rpx',
  md: '36rpx',
  lg: '54rpx',
  xl: '72rpx',
  empty: '104rpx',
};

export default {
  name: 'DealerIcon',
  props: {
    name: {
      type: String,
      required: true,
    },
    size: {
      type: String,
      default: 'md',
    },
    color: {
      type: String,
      default: '#f97316',
    },
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
        maskImage: `url("${src}")`,
      };
    },
  },
};
</script>

<style>
.dealer-icon {
  display: inline-block;
  flex-shrink: 0;
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
  -webkit-mask-size: contain;
  mask-size: contain;
}
</style>
