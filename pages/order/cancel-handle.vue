<template>
  <view class="page cancel-handle-page">
    <view class="section handle-card">
      <view class="section-title">处理取消申请</view>
      <view class="subtle handle-desc">
        当前取消申请详情暂不可处理，请返回订单详情查看最新状态或联系平台协助处理。
      </view>
    </view>

    <view class="fixed-footer">
      <button class="primary-btn back-btn" @click="goOrders">返回订单列表</button>
    </view>
  </view>
</template>

<script>
export default {
  methods: {
    goOrders() {
      uni.switchTab({ url: '/pages/order/list' });
    },
  },
};
</script>

<style>
.cancel-handle-page {
  padding: 30rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.handle-card {
  text-align: center;
  padding: 60rpx 40rpx;
}

.handle-desc {
  font-size: 26rpx;
  line-height: 1.6;
  color: var(--text-muted);
}

.back-btn {
  width: 100%;
}
</style>
