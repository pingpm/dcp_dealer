<template>
  <!-- #ifdef MP-WEIXIN -->
  <view class="dealer-icon-css" :style="cssIconStyle">
    <view v-if="name === 'package-open'" class="css-icon package-open-icon">
      <view class="package-lid"></view>
      <view class="package-body"></view>
      <view class="package-seam"></view>
    </view>
    <view v-else-if="name === 'hourglass'" class="css-icon hourglass-icon">
      <view class="hourglass-line top"></view>
      <view class="hourglass-line bottom"></view>
      <view class="hourglass-cross left"></view>
      <view class="hourglass-cross right"></view>
    </view>
    <view v-else-if="name === 'triangle-alert'" class="css-icon alert-icon">
      <view class="alert-triangle">
        <text class="alert-mark">!</text>
      </view>
    </view>
    <text v-else class="css-icon fallback-icon">!</text>
  </view>
  <!-- #endif -->

  <!-- #ifndef MP-WEIXIN -->
  <view class="dealer-icon" :style="iconStyle"></view>
  <!-- #endif -->
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
    cssIconStyle() {
      const size = sizeMap[this.size] || this.size || sizeMap.md;
      return {
        width: size,
        height: size,
        color: this.color,
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
        maskImage: `url("${src}")`,
      };
    },
  },
};
</script>

<style>
.dealer-icon-css {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  line-height: 1;
}

.css-icon {
  position: relative;
  width: 100%;
  height: 100%;
  color: inherit;
}

.package-lid {
  position: absolute;
  left: 18%;
  top: 22%;
  width: 64%;
  height: 24%;
  border: 4rpx solid currentColor;
  border-radius: 8rpx 8rpx 4rpx 4rpx;
  box-sizing: border-box;
  transform: skewY(-12deg);
}

.package-body {
  position: absolute;
  left: 18%;
  top: 40%;
  width: 64%;
  height: 42%;
  border: 4rpx solid currentColor;
  border-top: 0;
  border-radius: 0 0 8rpx 8rpx;
  box-sizing: border-box;
}

.package-seam {
  position: absolute;
  left: 50%;
  top: 46%;
  width: 4rpx;
  height: 30%;
  border-radius: 4rpx;
  background: currentColor;
  transform: translateX(-50%);
}

.hourglass-line {
  position: absolute;
  left: 22%;
  width: 56%;
  height: 4rpx;
  border-radius: 4rpx;
  background: currentColor;
}

.hourglass-line.top {
  top: 16%;
}

.hourglass-line.bottom {
  bottom: 16%;
}

.hourglass-cross {
  position: absolute;
  left: 50%;
  top: 24%;
  width: 4rpx;
  height: 52%;
  border-radius: 4rpx;
  background: currentColor;
  transform-origin: center;
}

.hourglass-cross.left {
  transform: translateX(-50%) rotate(42deg);
}

.hourglass-cross.right {
  transform: translateX(-50%) rotate(-42deg);
}

.alert-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.alert-triangle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 84%;
  height: 84%;
  border: 4rpx solid currentColor;
  border-radius: 10rpx;
  box-sizing: border-box;
  transform: rotate(45deg);
}

.alert-mark {
  color: inherit;
  font-size: 72%;
  font-weight: 900;
  line-height: 1;
  transform: rotate(-45deg);
}

.fallback-icon {
  color: inherit;
  font-size: 80%;
  font-weight: 900;
}

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
