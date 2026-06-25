<template>
  <view class="page order-detail-page">
    <!-- Top Status Card -->
    <view class="order-status-summary-card" :class="statusToneClass">
      <image class="order-status-summary-icon" :src="statusIconSrc" mode="aspectFit" />
      <view class="order-status-summary-main">
        <view class="order-status-summary-head">
          <text class="order-status-summary-title">{{ statusTitle }}</text>
          <text
            v-if="statusActionText"
            class="order-status-summary-action"
            @click.stop="handleStatusAction"
          >
            {{ statusActionText }}
          </text>
        </view>
        <text class="order-status-summary-desc">{{ statusDesc }}</text>
        <text v-if="statusTimingDesc" class="order-status-summary-tip">
          {{ statusTimingDesc }}
        </text>
        <text class="order-status-summary-no" v-if="order.orderNo"
          >订单号：{{ order.orderNo }}</text
        >
      </view>
    </view>

    <view v-if="showLatestLocationCard" class="latest-location-card" @click="goTransitTrack">
      <view class="latest-location-main">
        <view class="latest-location-status-row">
          <image
            class="latest-location-status-icon"
            src="/static/order_status_transport.svg"
            mode="aspectFit"
          />
          <text class="latest-location-status-title">{{ statusTitle }}</text>
        </view>
        <view class="latest-location-info-row">
          <text class="latest-location-label">最新位置</text>
          <view class="latest-location-value-wrap">
            <text class="latest-location-value">{{ latestLocationDisplayText }}</text>
            <text class="latest-location-arrow">›</text>
          </view>
        </view>
      </view>
    </view>

    <!-- Invitation / Share Link Card (Only for PENDING_CONFIRM) -->
    <view v-if="showInviteCard" class="section invitation-share-card">
      <view class="invite-title-row font-bold">承运商邀请</view>
      <view class="invite-desc-v2">
        该承运商手机号未注册入驻。填写订单后，您可复制链接或直接通过微信分享，邀请其入驻并确认订单：
      </view>

      <view class="share-link-input-row">
        <text class="share-link-lbl">邀请链接：</text>
        <input class="share-link-input font-mono" :value="inviteUrl" readonly disabled />
      </view>

      <view class="share-actions-row">
        <button class="primary-btn share-action-btn-small" @click="copyInviteLink">
          复制邀请链接
        </button>
      </view>
    </view>

    <!-- Route Details Card -->
    <view class="section detail-section-card">
      <view class="carrier-product-head route-card-head">
        <view class="carrier-product-name">
          <image
            class="carrier-product-icon"
            src="/static/order_carrier_icon.svg"
            mode="aspectFit"
          />
          <text class="carrier-product-title">{{ order.carrierName || '未入驻承运商' }}</text>
        </view>
        <view class="carrier-phone-action" @click.stop="contactCarrier">
          <text class="phone-action-icon">☎</text>
          <text>电话联系</text>
        </view>
      </view>
      <view class="carrier-product-divider"></view>

      <!-- Flow Visualizer -->
      <view class="detail-route-flow">
        <view class="flow-node">
          <text class="flow-city">{{ order.originCityName }}</text>
          <text class="flow-role-lbl">发车地</text>
        </view>
        <view class="flow-connector">
          <view class="flow-bar"></view>
          <text class="flow-mode-tag">{{ transportModeText[order.transportMode] }}</text>
        </view>
        <view class="flow-node text-right">
          <text class="flow-city">{{ order.destinationCityName }}</text>
          <text class="flow-role-lbl">收车地</text>
        </view>
      </view>

      <!-- Details Grid List -->
      <view class="detail-grid-info">
        <view class="detail-row">
          <text class="detail-label">约定托运运费</text>
          <text class="detail-value price-highlight">{{ yuanText(order.orderAmountCent) }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">约定最迟送达</text>
          <text class="detail-value">{{ dateText(order.agreedDeliveryTime) }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">开具发票</text>
          <text class="detail-value">{{
            order.hasInvoice ? '需要发票（线下开具）' : '不需要发票'
          }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">保险</text>
          <text class="detail-value">
            {{
              order.hasInsurance
                ? `含保险，最高保额${yuanText(order.insuranceMaxAmountCent)}`
                : '不含保险'
            }}
          </text>
        </view>
        <view class="detail-row" v-if="order.hasInsurance && order.insuranceRemark">
          <text class="detail-label">保险备注</text>
          <text class="detail-value">{{ order.insuranceRemark }}</text>
        </view>
      </view>
    </view>

    <!-- Pickup / Delivery Service Card -->
    <view class="section detail-section-card">
      <view class="section-title">提送车服务</view>
      <view class="service-info-list">
        <view class="service-info-item" v-if="hasPickupServiceValue">
          <view class="service-info-head">
            <text class="service-info-title">提车服务</text>
            <text
              class="status-tag mini-tag-v2"
              :class="order.hasPickupService ? 'status-success' : 'status-warning'"
            >
              {{ order.hasPickupService ? '需要提车' : '不需要提车' }}
            </text>
          </view>
          <view class="detail-row service-address-row" v-if="order.hasPickupService">
            <text class="detail-label">提车位置</text>
            <text class="detail-value service-address">{{ addressText('origin') }}</text>
          </view>
        </view>

        <view class="service-info-item" v-if="hasDeliveryServiceValue">
          <view class="service-info-head">
            <text class="service-info-title">送车服务</text>
            <text
              class="status-tag mini-tag-v2"
              :class="order.hasDeliveryService ? 'status-success' : 'status-warning'"
            >
              {{ order.hasDeliveryService ? '需要送车' : '不需要送车' }}
            </text>
          </view>
          <view class="detail-row service-address-row" v-if="order.hasDeliveryService">
            <text class="detail-label">送车位置</text>
            <text class="detail-value service-address">{{ addressText('destination') }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- Contacts Card -->
    <view class="section detail-section-card">
      <view class="section-title">联系人信息</view>
      <view class="detail-grid-info">
        <view class="detail-row border-bottom-mini">
          <text class="detail-label">客户主体</text>
          <text class="detail-value">{{ order.customerSubjectName || '个人客户' }}</text>
        </view>
        <view class="detail-row border-bottom-mini pt-2">
          <view class="contact-lbl-block">
            <text class="bullet-tag orange">●</text>
            <text class="contact-role-name">发车人</text>
          </view>
          <text class="detail-value">{{ contactText(order.senderName, order.senderPhone) }}</text>
        </view>
        <view class="detail-row pt-2">
          <view class="contact-lbl-block">
            <text class="bullet-tag blue">●</text>
            <text class="contact-role-name">收车人</text>
          </view>
          <text class="detail-value">{{
            contactText(order.receiverName, order.receiverPhone)
          }}</text>
        </view>
      </view>
    </view>

    <!-- Vehicles List Card -->
    <view class="section detail-section-card">
      <view class="section-title">承运车辆 ({{ vehicles.length }}辆)</view>

      <view v-for="vehicle in vehicles" :key="vehicle.id" class="detail-vehicle-item">
        <view class="vehicle-head">
          <text class="vehicle-icon">车</text>
          <text class="vehicle-title font-bold"
            >{{ vehicle.brandName }} {{ vehicle.seriesName || '' }}
            {{ vehicle.modelName || '' }}</text
          >
        </view>
        <view class="vehicle-details">
          <view class="vehicle-col">
            <text class="veh-lbl">车架号 (VIN)</text>
            <text class="veh-val font-mono">{{ vehicle.vin || '未录入' }}</text>
          </view>
          <view class="vehicle-col">
            <text class="veh-lbl">车牌号</text>
            <text class="veh-val font-mono">{{ vehicle.plateNumber || '-' }}</text>
          </view>
          <view class="vehicle-col text-right">
            <text class="veh-lbl">车况类型</text>
            <text class="status-tag status-success mini-tag-v2">{{
              vehicle.vehicleConditionType === 'NEW' ? '新车' : '二手车'
            }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- Fulfillment Driver Info -->
    <view class="section detail-section-card" v-if="order.driverInfo || order.deliveryDriverInfo">
      <view class="section-title">承运司机信息</view>
      <view class="driver-block" v-if="order.driverInfo">
        <view class="driver-role-title">提车司机</view>
        <view class="detail-grid-info">
          <view class="detail-row">
            <text class="detail-label">姓名电话</text>
            <text class="detail-value"
              >{{ order.driverInfo.driverName }} ({{ order.driverInfo.driverPhone }})</text
            >
          </view>
          <view class="detail-row">
            <text class="detail-label">车牌/身份证</text>
            <text class="detail-value font-mono"
              >{{ order.driverInfo.licensePlate }} / {{ order.driverInfo.idNumber || '-' }}</text
            >
          </view>
        </view>
      </view>
      <view class="driver-block separator" v-if="order.deliveryDriverInfo">
        <view class="driver-role-title">交车司机</view>
        <view class="detail-grid-info">
          <view class="detail-row">
            <text class="detail-label">姓名电话</text>
            <text class="detail-value"
              >{{ order.deliveryDriverInfo.driverName }} ({{
                order.deliveryDriverInfo.driverPhone
              }})</text
            >
          </view>
          <view class="detail-row">
            <text class="detail-label">车牌/身份证</text>
            <text class="detail-value font-mono"
              >{{ order.deliveryDriverInfo.licensePlate }} /
              {{ order.deliveryDriverInfo.idNumber || '-' }}</text
            >
          </view>
        </view>
      </view>
    </view>

    <!-- Pickup Media -->
    <view class="section detail-section-card" v-if="order.pickupDetails">
      <view class="section-title">提车验车记录</view>
      <view class="detail-grid-info" style="margin-bottom: 20rpx">
        <view class="detail-row">
          <text class="detail-label">提车节点时间</text>
          <text class="detail-value">{{ dateText(order.pickupDetails.pickupTime) }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">提车备注</text>
          <text class="detail-value">{{ order.pickupDetails.remark || '-' }}</text>
        </view>
      </view>
      <text class="label">验车媒体照片/视频</text>
      <view class="upload-grid" v-if="pickupUrls.length">
        <view class="upload-preview" v-for="(url, index) in pickupUrls" :key="index">
          <image :src="url" mode="aspectFill" class="upload-img" @click="previewImg(url)" />
        </view>
      </view>
      <view v-else class="empty-media-text">暂无验车媒体</view>
    </view>

    <!-- Handover Media -->
    <view class="section detail-section-card" v-if="order.handoverDetails">
      <view class="section-title">交车凭证记录</view>
      <view class="detail-grid-info" style="margin-bottom: 20rpx">
        <view class="detail-row">
          <text class="detail-label">交车节点时间</text>
          <text class="detail-value">{{ dateText(order.handoverDetails.handoverTime) }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">交车备注</text>
          <text class="detail-value">{{ order.handoverDetails.remark || '-' }}</text>
        </view>
      </view>
      <text class="label">交车凭证照片</text>
      <view class="upload-grid" v-if="handoverUrls.length">
        <view class="upload-preview" v-for="(url, index) in handoverUrls" :key="index">
          <image :src="url" mode="aspectFill" class="upload-img" @click="previewImg(url)" />
        </view>
      </view>
      <view v-else class="empty-media-text">暂无交车凭证照片</view>
    </view>

    <!-- Timeline Logs Card -->
    <view class="section detail-section-card" v-if="compensationClaim || compensationEligibility.eligible">
      <view class="section-title">逾期赔付</view>
      <view class="detail-grid-info" v-if="compensationClaim">
        <view class="detail-row">
          <text class="detail-label">申请编号</text>
          <text class="detail-value">{{ compensationClaim.claimNo }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">申请状态</text>
          <text class="detail-value">{{ compensationStatusText(compensationClaim.claimStatus) }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">申请金额</text>
          <text class="detail-value price-highlight">{{ yuanText(compensationClaim.requestedCompensationCent) }}</text>
        </view>
      </view>
      <view class="detail-grid-info" v-else>
        <view class="detail-row">
          <text class="detail-label">赔付标准</text>
          <text class="detail-value">
            {{ yuanText(compensationEligibility.ruleSnapshot.compensationPerDayCent) }}/天
          </text>
        </view>
        <view class="detail-row">
          <text class="detail-label">建议赔付</text>
          <text class="detail-value price-highlight">
            {{ yuanText(compensationEligibility.ruleSnapshot.suggestedCompensationCent) }}
          </text>
        </view>
      </view>
      <button
        v-if="compensationClaim"
        class="plain-btn w-full"
        style="margin-top: 20rpx"
        @click="goCompensationDetail"
      >
        查看赔付详情
      </button>
    </view>

    <!-- Timeline Logs Card -->
    <view class="section detail-section-card">
      <view class="section-title">订单追踪节点</view>

      <view class="timeline-container">
        <view
          v-for="(log, idx) in logs"
          :key="log.id"
          class="timeline-item"
          :class="{ latest: idx === 0 }"
        >
          <view class="timeline-line-wrap">
            <view class="timeline-dot" :class="getLogStatusClass(log.actionType)"></view>
            <view v-if="idx < logs.length - 1" class="timeline-trail-line"></view>
          </view>
          <view class="timeline-content">
            <text class="timeline-action">{{ logActionText(log.actionType) }}</text>
            <text v-if="log.remark" class="timeline-remark">{{ log.remark }}</text>
            <text class="timeline-time">{{ dateText(log.createdAt) }}</text>
          </view>
        </view>
        <view v-if="logs.length === 0" class="subtle-empty-logs">暂无订单流程轨迹</view>
      </view>
    </view>

    <!-- Fixed Action Bar -->
    <view class="fixed-footer detail-footer-actions">
      <!-- Waiting/Pending Alert Notice -->
      <view v-if="order.orderStatus === 'PENDING_CONFIRM'" class="footer-alert-notice-text">
        承运商长时间未确认，您可以主动进行联系
      </view>

      <view class="actions-wrapper">
        <view
          class="footer-buttons-row"
          v-if="
            [
              'PENDING_PAYMENT',
              'PENDING_CONFIRM',
              'PENDING_PICKUP',
              'IN_TRANSIT',
              'PENDING_RECEIPT',
              'COMPLETED',
            ].includes(order.orderStatus)
          "
        >
          <button
            v-if="order.orderStatus === 'PENDING_CONFIRM'"
            class="primary-btn flex-btn"
            @click="goEdit"
          >
            修改订单信息
          </button>

          <button v-if="showContactPrimary" class="primary-btn flex-btn" @click="contactCarrier">
            联系承运商
          </button>

          <!-- Primary Actions -->
          <button
            v-if="order.orderStatus === 'PENDING_PAYMENT'"
            class="primary-btn flex-btn"
            @click="payAgain"
          >
            继续支付担保费
          </button>

          <button
            v-if="order.orderStatus === 'IN_TRANSIT'"
            class="secondary-btn flex-btn"
            @click="goTransitTrack"
          >
            查看在途位置
          </button>

          <button
            v-if="order.orderStatus === 'PENDING_RECEIPT'"
            class="primary-btn flex-btn"
            @click="confirmReceipt"
          >
            确认已收车
          </button>

          <!-- More Actions -->
          <view class="more-text-btn" @click="showMoreActions">更多</view>
        </view>

        <view class="footer-buttons-row" v-else>
          <button class="plain-btn flex-btn" @click="goCancelLogs">协商历史</button>
        </view>
      </view>
    </view>
    <miniapp-login-sheet ref="loginSheet" @success="handleLoginSuccess" />
  </view>
</template>

<script>
import { miniappLoginPageMixin } from '../../utils/miniapp-login-page.js';
import { api, requestWechatPayment, requireLogin } from '../../utils/api.js';
import {
  dateText,
  formatOrderLogAction,
  orderStatusText,
  statusClass,
  transportModeText,
  yuanText,
  vehicleConditionText,
} from '../../utils/format.js';

export default {
  mixins: [miniappLoginPageMixin],
  data() {
    return {
      orderId: '',
      order: {},
      vehicles: [],
      logs: [],
      cancelRequest: null,
      pickupUrls: [],
      handoverUrls: [],
      orderStatusText,
      transportModeText,
      vehicleConditionText,
      countdownTimeText: '',
      shouldShowPaymentSuccessModal: false,
      shouldRefreshOnShow: false,
      compensationEligibility: {},
      compensationClaim: null,
    };
  },
  computed: {
    canCancel() {
      return [
        'PENDING_PAYMENT',
        'PENDING_CONFIRM',
        'PENDING_PICKUP',
        'IN_TRANSIT',
      ].includes(this.order.orderStatus);
    },
    statusToneClass() {
      const status = this.order.orderStatus;
      if (status === 'COMPLETED') return 'status-card-complete';
      if (['CANCELED', 'CANCEL_PENDING'].includes(status)) return 'status-card-canceled';
      if (['PENDING_PICKUP', 'IN_TRANSIT', 'PENDING_RECEIPT'].includes(status)) {
        return 'status-card-transport';
      }
      return 'status-card-pending';
    },
    statusIconSrc() {
      const status = this.order.orderStatus;
      const map = {
        PENDING_PAYMENT: '/static/order_status_pendding.svg',
        PENDING_CONFIRM: '/static/order_status_pendding.svg',
        PENDING_PICKUP: '/static/order_status_wait_for_pickup.svg',
        IN_TRANSIT: '/static/order_status_transport.svg',
        PENDING_RECEIPT: '/static/order_status_transport.svg',
        CANCEL_PENDING: '/static/order_status_canceled.svg',
        COMPLETED: '/static/order_status_complete.svg',
        CANCELED: '/static/order_status_canceled.svg',
      };
      return map[status] || '/static/order_status_pendding.svg';
    },
    statusTitle() {
      const status = this.order.orderStatus;
      const map = {
        PENDING_PAYMENT: '待支付',
        PENDING_CONFIRM: '待确认',
        PENDING_PICKUP: '待提车',
        IN_TRANSIT: '运输中',
        PENDING_RECEIPT: '待收车',
        CANCEL_PENDING: '取消中',
        COMPLETED: '已完成',
        CANCELED: '已取消',
      };
      return map[status] || this.orderStatusText[status] || '-';
    },
    statusDesc() {
      const status = this.order.orderStatus;
      if (status === 'PENDING_PAYMENT') return '待支付增值服务费';
      if (status === 'PENDING_CONFIRM') return '待承运商确认订单信息';
      if (status === 'PENDING_PICKUP') return '待承运商提车';
      if (status === 'IN_TRANSIT') return '承运商正在运输车辆';
      if (status === 'PENDING_RECEIPT') return '交车单据已上传，请您确认收车';
      if (status === 'COMPLETED') return '订单已完成';
      if (status === 'CANCELED') return this.cancelReasonText || '订单已取消';
      if (status === 'CANCEL_PENDING') {
        if (!this.cancelRequest) return '取消申请处理中';
        const name = this.cancelRequest.requesterName || this.requesterTypeText;
        const reason = this.cancelRequest.cancelReason
          ? `：${this.cancelRequest.cancelReason}`
          : '';
        return `${name}申请取消${reason}`;
      }
      return '请查看订单详情中的下一步操作';
    },
    statusTimingDesc() {
      const status = this.order.orderStatus;
      if (status === 'PENDING_CONFIRM' && this.order.carrierConfirmDeadlineAt) {
        return `承运商需在 ${this.dateText(this.order.carrierConfirmDeadlineAt)} 前确认，超时后订单将不能继续履约。`;
      }
      if (status === 'PENDING_RECEIPT' && this.order.autoReceiptAt) {
        return `如您未主动确认收车，系统将在 ${this.dateText(this.order.autoReceiptAt)} 自动确认。`;
      }
      return '';
    },
    statusActionText() {
      if (this.order.orderStatus !== 'CANCEL_PENDING') return '';
      return this.cancelRequest?.requesterType === 'CARRIER' ? '处理取消' : '查看协商';
    },
    requesterTypeText() {
      const map = {
        DEALER: '车商',
        CARRIER: '承运商',
        ADMIN: '平台',
        SYSTEM: '系统',
      };
      return map[this.cancelRequest?.requesterType] || '对方';
    },
    showLatestLocationCard() {
      return Boolean(this.order.orderStatus);
    },
    sortedTransitLocations() {
      return [...(this.order.transitLocations || [])].sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
      );
    },
    latestTransitLocation() {
      return this.sortedTransitLocations[0] || null;
    },
    latestLocationDisplayText() {
      const latest = this.latestTransitLocation;
      if (!latest) return '还没上报';
      const location = [latest.cityName, latest.address].filter(Boolean).join(' ');
      const time = this.relativeTimeText(latest.createdAt);
      const text = location || '已上报，暂无详细地址';
      return time ? `【${time}】 ${text}` : text;
    },
    cancelReasonText() {
      return this.cancelRequest?.cancelReason ? `取消原因：${this.cancelRequest.cancelReason}` : '';
    },
    inviteUrl() {
      return `https://iyunche.com/invite/order?id=${this.orderId}`;
    },
    showInviteCard() {
      return (
        this.order.orderStatus === 'PENDING_CONFIRM' &&
        (!this.order.carrierId || this.order.carrierName === '未入驻承运商')
      );
    },
    showContactPrimary() {
      return [
        'PENDING_CONFIRM',
        'PENDING_PICKUP',
        'IN_TRANSIT',
        'PENDING_RECEIPT',
      ].includes(this.order.orderStatus);
    },
    hasPickupServiceValue() {
      return typeof this.order.hasPickupService === 'boolean';
    },
    hasDeliveryServiceValue() {
      return typeof this.order.hasDeliveryService === 'boolean';
    },
  },
  onLoad(options) {
    if (!requireLogin()) return;
    this.orderId = options.orderId;
    this.shouldShowPaymentSuccessModal = options.paymentSuccess === '1';
    this.load();
  },
  onShow() {
    if (!this.shouldRefreshOnShow || !this.orderId) return;
    this.shouldRefreshOnShow = false;
    this.load();
  },
  methods: {
    dateText,
    yuanText,
    statusClass,
    async load() {
      const data = await api.orderDetail(this.orderId);
      this.order = data.order || {};
      this.vehicles = data.vehicles || [];
      this.cancelRequest = data.cancelRequest || null;

      // Sort logs so latest is first
      const rawLogs = data.logs || [];
      this.logs = rawLogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      this.pickupUrls = [];
      this.handoverUrls = [];
      if (data.mediaFiles) {
        data.mediaFiles.forEach((file) => {
          if (file.usageScene === 'PICKUP_INSPECTION') {
            this.pickupUrls.push(file.fileUrl);
          } else if (file.usageScene === 'HANDOVER_PHOTO') {
            this.handoverUrls.push(file.fileUrl);
          }
        });
      }

      this.countdownTimeText = this.order.autoCancelAt
        ? this.dateText(this.order.autoCancelAt)
        : '';

      if (this.shouldShowPaymentSuccessModal) {
        this.showPaymentSuccessModal();
      }
      await this.loadCompensation();
    },
    async loadCompensation() {
      try {
        const claims = await api.compensationClaims(this.orderId);
        this.compensationClaim = (claims.items || [])[0] || null;
        if (!this.compensationClaim && this.order.orderStatus === 'COMPLETED') {
          this.compensationEligibility = await api.compensationEligibility(this.orderId);
        } else {
          this.compensationEligibility = {};
        }
      } catch (error) {
        this.compensationEligibility = {};
      }
    },
    showPaymentSuccessModal() {
      this.shouldShowPaymentSuccessModal = false;
      uni.showModal({
        title: '支付成功',
        content: '增值服务费已支付成功。',
        confirmColor: '#f97316',
        confirmText: '我知道了',
        cancelText: '关闭',
        success: () => {},
      });
    },
    addressText(type) {
      const prefix = type === 'origin' ? 'origin' : 'destination';
      return (
        [
          this.order[`${prefix}ProvinceName`],
          this.order[`${prefix}CityName`],
          this.order[`${prefix}DistrictName`],
          this.order[`${prefix}AddressDetail`],
        ]
          .filter(Boolean)
          .join('') || '-'
      );
    },
    contactText(name, phone) {
      return [name, phone].filter(Boolean).join(' ') || '-';
    },
    relativeTimeText(value) {
      if (!value) return '';
      const time = new Date(value).getTime();
      if (Number.isNaN(time)) return '';
      const diffMinute = Math.max(0, Math.floor((Date.now() - time) / 60000));
      if (diffMinute < 1) return '刚刚';
      if (diffMinute < 60) return `${diffMinute}分钟前`;
      const diffHour = Math.floor(diffMinute / 60);
      if (diffHour < 24) return `${diffHour}小时前`;
      const diffDay = Math.floor(diffHour / 24);
      return `${diffDay}天前`;
    },
    previewImg(url) {
      uni.previewImage({ urls: [url] });
    },
    async payAgain() {
      const payment = await api.createGuaranteePayment(this.orderId);
      await requestWechatPayment(payment.paymentParams);
      await api.syncWechatPayment(payment.paymentId);
      this.shouldShowPaymentSuccessModal = true;
      await this.load();
    },
    contactCarrier() {
      if (!this.order.carrierPhone) {
        uni.showToast({ title: '暂无承运商联系电话', icon: 'none' });
        return;
      }
      uni.showModal({
        title: '联系承运商',
        content: `联系电话：${this.order.carrierPhone}\n是否立即拨打？`,
        confirmColor: '#f97316',
        confirmText: '呼叫',
        success: (res) => {
          if (res.confirm) {
            uni.makePhoneCall({ phoneNumber: this.order.carrierPhone });
          }
        },
      });
    },
    goTransitTrack() {
      uni.navigateTo({ url: `/pages/order/transit-track?orderId=${this.orderId}` });
    },
    goEdit() {
      uni.navigateTo({ url: `/pages/order/edit?orderId=${this.orderId}` });
    },
    goCancel() {
      uni.navigateTo({ url: `/pages/order/cancel-request?orderId=${this.orderId}` });
    },
    goCancelLogs() {
      uni.navigateTo({ url: `/pages/order/cancel-logs?orderId=${this.orderId}` });
    },
    goCancelHandle() {
      const query = this.cancelRequest?.id ? `&cancelRequestId=${this.cancelRequest.id}` : '';
      uni.navigateTo({ url: `/pages/order/cancel-handle?orderId=${this.orderId}${query}` });
    },
    goCompensationRequest() {
      uni.navigateTo({ url: `/pages/order/compensation-request?orderId=${this.orderId}` });
    },
    handleCompensationRequestAction() {
      if (this.compensationEligibility.mode === 'OFFLINE_SERVICE') {
        this.showCompensationServiceModal();
        return;
      }
      this.goCompensationRequest();
    },
    showCompensationServiceModal() {
      const phone = this.compensationEligibility.customerServicePhone || '';
      uni.showModal({
        title: '联系平台客服',
        content: phone
          ? `当前赔付申请请联系平台客服：${phone}`
          : '当前赔付申请请联系平台客服处理。',
        confirmText: phone ? '拨打客服' : '我知道了',
        cancelText: '取消',
        showCancel: Boolean(phone),
        confirmColor: '#f97316',
        success: (res) => {
          if (res.confirm && phone) {
            uni.makePhoneCall({ phoneNumber: phone });
          }
        },
      });
    },
    goCompensationDetail() {
      if (!this.compensationClaim?.id) return;
      uni.navigateTo({
        url: `/pages/order/compensation-detail?claimId=${this.compensationClaim.id}`,
      });
    },
    compensationStatusText(status) {
      const map = {
        PENDING_CARRIER: '待承运商处理',
        CARRIER_APPROVED: '承运商已同意',
        CARRIER_REJECTED: '承运商已拒绝',
        PLATFORM_PENDING: '平台介入中',
        PLATFORM_APPROVED: '平台已通过',
        PLATFORM_REJECTED: '平台已驳回',
        CANCELED: '已撤销',
      };
      return map[status] || status || '-';
    },
    handleStatusAction() {
      if (this.statusActionText === '处理取消') {
        this.goCancelHandle();
        return;
      }
      this.goCancelLogs();
    },
    showMoreActions() {
      const itemList = [];
      const actions = [];
      if (this.canCancel) {
        itemList.push('取消订单');
        actions.push(() => this.goCancel());
      }
      itemList.push('协商历史');
      actions.push(() => this.goCancelLogs());
      if (this.compensationEligibility.actionVisible) {
        itemList.push('申请赔付');
        actions.push(() => this.handleCompensationRequestAction());
      }
      if (this.compensationClaim) {
        itemList.push('赔付详情');
        actions.push(() => this.goCompensationDetail());
      }

      uni.showActionSheet({
        itemList,
        success: (res) => {
          if (actions[res.tapIndex]) {
            actions[res.tapIndex]();
          }
        },
      });
    },
    copyInviteLink() {
      uni.setClipboardData({
        data: this.inviteUrl,
        success: () => {
          uni.showToast({ title: '复制链接成功', icon: 'success' });
        },
      });
    },
    async confirmReceipt() {
      uni.showModal({
        title: '确认收车',
        content: '您确定已经线下支付完运费并安全收到车辆了吗？确认后担保服务将完成结案。',
        confirmColor: '#f97316',
        success: async (res) => {
          if (res.confirm) {
            await api.confirmReceipt(this.orderId);
            uni.showToast({ title: '已确认收车', icon: 'success' });
            this.load();
          }
        },
      });
    },
    getLogStatusClass(actionType) {
      if (
        [
          'RECEIPT_CONFIRM',
          'COMPLETED',
          'HANDOVER_CONFIRM',
          'CONTRACT_SIGN',
          'GUARANTEE_PAID',
          'CONFIRM_CONTRACT',
          'AUTO_RECEIPT',
          'CANCEL_APPROVED',
        ].includes(actionType)
      ) {
        return 'status-success';
      }
      if (
        [
          'CANCEL_REQUEST',
          'CANCEL_HANDLE',
          'FORCE_CANCEL',
          'ADMIN_FORCE_CANCEL',
          'DIRECT_CANCEL',
          'CANCEL_REJECTED',
        ].includes(actionType)
      ) {
        return 'status-danger';
      }
      if (
        [
          'PICKUP_CONFIRM',
          'TRANSIT_REPORT',
          'SET_DRIVER',
          'PICKUP',
          'TRANSIT_LOCATION',
          'HANDOVER',
        ].includes(actionType)
      ) {
        return 'status-info';
      }
      return 'status-warning';
    },
    logActionText(actionType) {
      return formatOrderLogAction(actionType);
    },
  },
};
</script>

<style>
.order-detail-page {
  padding: 24rpx;
  padding-bottom: calc(240rpx + env(safe-area-inset-bottom));
  background-color: transparent;
}

.order-status-summary-card {
  display: flex;
  align-items: flex-start;
  gap: 24rpx;
  padding: 34rpx 30rpx;
  background: #ffffff;
  border-radius: var(--radius-lg);
  border: 1rpx solid rgba(229, 231, 235, 0.7);
  margin-bottom: 24rpx;
  box-shadow: 0 8rpx 22rpx rgba(17, 24, 39, 0.04);
}

.order-status-summary-icon {
  width: 72rpx;
  height: 72rpx;
  flex-shrink: 0;
}

.order-status-summary-main {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.order-status-summary-head {
  min-height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.order-status-summary-title {
  color: #111827;
  font-size: 34rpx;
  font-weight: 900;
  line-height: 1.2;
}

.order-status-summary-desc {
  color: #6b7280;
  font-size: 25rpx;
  line-height: 1.45;
  word-break: break-all;
}

.order-status-summary-tip {
  color: #c2410c;
  background: #fff7ed;
  border-radius: 8rpx;
  padding: 12rpx 16rpx;
  font-size: 23rpx;
  line-height: 1.45;
  word-break: break-all;
}

.order-status-summary-no {
  color: #9ca3af;
  font-size: 21rpx;
  line-height: 1.3;
  font-family: monospace;
}

.order-status-summary-action {
  color: var(--primary-color);
  font-size: 25rpx;
  font-weight: 800;
  line-height: 1.2;
  flex-shrink: 0;
}

.order-status-summary-action:active {
  opacity: 0.75;
}

.order-status-summary-card.status-card-transport .order-status-summary-title {
  color: #005fcc;
}

.order-status-summary-card.status-card-complete .order-status-summary-title {
  color: #16a34a;
}

.order-status-summary-card.status-card-canceled .order-status-summary-title {
  color: #ef4444;
}

.latest-location-card {
  display: flex;
  margin: 0 0 24rpx;
  padding: 34rpx 38rpx 36rpx;
  border: 1rpx solid rgba(229, 231, 235, 0.72);
  border-radius: 34rpx;
  background: #ffffff;
  box-shadow: 0 8rpx 22rpx rgba(17, 24, 39, 0.04);
}

.latest-location-card:active {
  opacity: 0.86;
}

.latest-location-main {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.latest-location-status-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.latest-location-status-icon {
  width: 36rpx;
  height: 36rpx;
  flex-shrink: 0;
}

.latest-location-status-title {
  color: #1f2937;
  font-size: 32rpx;
  font-weight: 900;
  line-height: 1.25;
}

.latest-location-info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 22rpx;
}

.latest-location-label {
  flex-shrink: 0;
  color: #9ca3af;
  font-size: 28rpx;
  line-height: 1.35;
}

.latest-location-value-wrap {
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12rpx;
}

.latest-location-value {
  min-width: 0;
  color: #1f2937;
  font-size: 28rpx;
  line-height: 1.35;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.latest-location-arrow {
  flex-shrink: 0;
  color: #c4c4c4;
  font-size: 46rpx;
  line-height: 1;
  font-weight: 300;
}

/* Share / Invitation Link Card V2 styling */
.invitation-share-card {
  padding: 32rpx;
}

.invite-title-row {
  font-size: 28rpx;
  color: #111827;
  margin-bottom: 12rpx;
}

.invite-desc-v2 {
  font-size: 24rpx;
  color: #4b5563;
  line-height: 1.5;
  margin-bottom: 24rpx;
}

.share-link-input-row {
  display: flex;
  align-items: center;
  background: #f9fafb;
  border: 1rpx solid #e5e7eb;
  border-radius: var(--radius-md);
  padding: 18rpx 24rpx;
  margin-bottom: 24rpx;
}

.share-link-lbl {
  font-size: 22rpx;
  color: #9ca3af;
  flex-shrink: 0;
}

.share-link-input {
  flex: 1;
  font-size: 22rpx;
  color: #4b5563;
  border: none;
  background: transparent;
}

.share-actions-row {
  display: flex;
  justify-content: center;
}

.share-action-btn-small {
  width: 100%;
  min-height: 80rpx !important;
  font-size: 26rpx !important;
  border-radius: 40rpx !important;
  font-weight: bold !important;
  box-shadow: none !important;
  background: var(--primary-color) !important;
  color: #ffffff !important;
}

.share-action-btn-small:active {
  background: #ea580c !important;
}

.carrier-product-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.route-card-head {
  margin-bottom: 0;
}

.carrier-product-name {
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.carrier-product-icon {
  flex-shrink: 0;
  width: 48rpx;
  height: 48rpx;
}

.carrier-product-title {
  min-width: 0;
  color: #1f2937;
  font-size: 32rpx;
  font-weight: 850;
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.carrier-phone-action {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8rpx;
  color: #ff4d55;
  font-size: 28rpx;
  font-weight: 750;
  line-height: 1.2;
}

.carrier-phone-action:active {
  opacity: 0.72;
}

.phone-action-icon {
  font-size: 28rpx;
  line-height: 1;
}

.carrier-product-divider {
  height: 1rpx;
  margin: 30rpx 0 34rpx;
  background: #eef2f7;
}

/* Detail Route Flow */
.detail-route-flow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx;
  border-radius: var(--radius-md);
  background: #f9fafb;
  margin-bottom: 30rpx;
  border: 1rpx solid #f1f5f9;
}

.flow-node {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.flow-node.text-right {
  text-align: right;
  align-items: flex-end;
}

.flow-city {
  font-size: 34rpx;
  font-weight: 800;
  color: #111827;
}

.flow-role-lbl {
  font-size: 20rpx;
  color: #9ca3af;
}

.flow-connector {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.flow-bar {
  width: 100%;
  height: 2rpx;
  background: #e5e7eb;
}

.flow-icon {
  font-size: 30rpx;
  position: absolute;
  top: -24rpx;
  background: #f9fafb;
  padding: 0 4rpx;
}

.flow-mode-tag {
  font-size: 18rpx;
  color: #9ca3af;
  margin-top: 8rpx;
  font-weight: bold;
}

/* Detail row styles */
.detail-grid-info {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 26rpx;
}

.detail-row.address-row {
  align-items: flex-start;
}

.border-bottom-mini {
  border-bottom: 1rpx solid #f3f4f6;
  padding-bottom: 16rpx;
}

.detail-label {
  color: #4b5563;
}

.detail-value {
  color: #111827;
  font-weight: 500;
}

.detail-address {
  max-width: 420rpx;
  text-align: right;
  line-height: 1.45;
}

.detail-value.text-bold {
  font-weight: bold;
}

.detail-value.price-highlight {
  color: var(--primary-color);
  font-size: 32rpx;
  font-weight: 900;
}

/* Pickup / delivery service */
.service-info-list {
  display: flex;
  flex-direction: column;
  gap: 22rpx;
}

.service-info-item {
  padding: 24rpx;
  background: #f9fafb;
  border: 1rpx solid #f1f5f9;
  border-radius: var(--radius-md);
}

.service-info-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18rpx;
}

.service-info-title {
  color: #111827;
  font-size: 28rpx;
  font-weight: 800;
}

.service-address-row {
  align-items: flex-start;
}

.service-address {
  max-width: 450rpx;
  text-align: right;
  line-height: 1.45;
  font-weight: 650;
}

/* Contacts visual tag */
.contact-lbl-block {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.bullet-tag {
  font-size: 16rpx;
}

.bullet-tag.orange {
  color: var(--primary-color);
}

.bullet-tag.blue {
  color: #2563eb;
}

.contact-role-name {
  font-size: 26rpx;
  color: #4b5563;
  font-weight: bold;
}

/* Vehicle detail items */
.detail-vehicle-item {
  border: 1rpx solid #f3f4f6;
  border-radius: var(--radius-md);
  padding: 24rpx;
  margin-bottom: 20rpx;
  background: #f9fafb;
}

.detail-vehicle-item:last-child {
  margin-bottom: 0;
}

.vehicle-head {
  display: flex;
  align-items: center;
  gap: 16rpx;
  border-bottom: 1rpx solid #f3f4f6;
  padding-bottom: 16rpx;
  margin-bottom: 18rpx;
}

.vehicle-icon {
  color: var(--primary-color);
  font-size: 24rpx;
  font-weight: 800;
}

.vehicle-title {
  font-size: 28rpx;
  color: #111827;
}

.vehicle-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.vehicle-col {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  max-width: 260rpx;
}

.veh-lbl {
  font-size: 20rpx;
  color: #9ca3af;
}

.veh-val {
  font-size: 26rpx;
  color: #4b5563;
}

.mini-tag-v2 {
  min-height: 38rpx !important;
  font-size: 20rpx !important;
  padding: 0 12rpx !important;
  border-radius: 6rpx !important;
  line-height: 1.5;
}

/* Timeline logs */
.timeline-container {
  display: flex;
  flex-direction: column;
  padding-left: 20rpx;
  margin-top: 10rpx;
}

.timeline-item {
  display: flex;
  gap: 30rpx;
  position: relative;
  padding-bottom: 36rpx;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-line-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  width: 20rpx;
}

.timeline-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: #cbd5e1;
  z-index: 2;
  margin-top: 12rpx;
}

.timeline-dot.status-success {
  background: #16a34a;
}
.timeline-dot.status-danger {
  background: #dc2626;
}
.timeline-dot.status-info {
  background: #2563eb;
}
.timeline-dot.status-warning {
  background: #ea580c;
}

.timeline-item.latest .timeline-dot {
  box-shadow: 0 0 0 6rpx rgba(249, 115, 22, 0.2);
}
.timeline-item.latest .timeline-dot.status-success {
  box-shadow: 0 0 0 6rpx rgba(22, 163, 74, 0.2);
}
.timeline-item.latest .timeline-dot.status-danger {
  box-shadow: 0 0 0 6rpx rgba(220, 38, 38, 0.2);
}
.timeline-item.latest .timeline-dot.status-info {
  box-shadow: 0 0 0 6rpx rgba(37, 99, 235, 0.2);
}
.timeline-item.latest .timeline-dot.status-warning {
  box-shadow: 0 0 0 6rpx rgba(249, 115, 22, 0.2);
}

.timeline-trail-line {
  position: absolute;
  top: 28rpx;
  bottom: -28rpx;
  width: 2rpx;
  background: #e2e8f0;
  z-index: 1;
}

.timeline-content {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  flex: 1;
}

.timeline-action {
  font-size: 28rpx;
  font-weight: 750;
  color: #111827;
}

.timeline-item.latest .timeline-action {
  color: var(--primary-color);
}

.timeline-remark {
  font-size: 24rpx;
  color: #4b5563;
  background: #f9fafb;
  padding: 12rpx 20rpx;
  border-radius: var(--radius-sm);
  line-height: 1.4;
  border: 1rpx solid #f3f4f6;
}

.timeline-time {
  font-size: 20rpx;
  color: #9ca3af;
}

.subtle-empty-logs {
  padding: 40rpx;
  text-align: center;
  color: #9ca3af;
  font-size: 24rpx;
}

/* Glassmorphic Actions footer overrides */
.footer-alert-notice-text {
  font-size: 22rpx;
  color: var(--primary-color);
  text-align: center;
  padding: 10rpx 0 20rpx;
  font-weight: bold;
}

.actions-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.flex-btn {
  width: 100%;
}

.cancel-btn {
  width: 100%;
}

.history-btn {
  width: 100%;
}

.driver-block {
  margin-bottom: 24rpx;
}

.driver-block.separator {
  padding-top: 24rpx;
  border-top: 1rpx solid #f1f5f9;
}

.driver-role-title {
  margin-bottom: 14rpx;
  color: var(--primary-color);
  font-size: 26rpx;
  font-weight: 750;
}

.more-text-btn {
  flex: 0 0 auto;
  min-width: 92rpx;
  padding: 0 8rpx;
  color: #4b5563;
  font-size: 28rpx;
  font-weight: 700;
  line-height: 88rpx;
  text-align: center;
}

.empty-media-text {
  margin-top: 16rpx;
  padding: 24rpx;
  border-radius: var(--radius-md);
  background: #f9fafb;
  color: #9ca3af;
  font-size: 24rpx;
  text-align: center;
}
</style>
