"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_miniappLoginPage = require("../../utils/miniapp-login-page.js");
const utils_api = require("../../utils/api.js");
const utils_format = require("../../utils/format.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  mixins: [utils_miniappLoginPage.miniappLoginPageMixin],
  data() {
    return {
      orderId: "",
      order: {},
      vehicles: [],
      logs: [],
      cancelRequest: null,
      pickupUrls: [],
      handoverUrls: [],
      orderStatusText: utils_format.orderStatusText,
      transportModeText: utils_format.transportModeText,
      vehicleConditionText: utils_format.vehicleConditionText,
      countdownTimeText: "",
      shouldShowPaymentSuccessModal: false,
      shouldRefreshOnShow: false,
      compensationEligibility: {},
      compensationClaim: null
    };
  },
  computed: {
    canCancel() {
      return [
        "PENDING_PAYMENT",
        "PENDING_CONFIRM",
        "PENDING_PICKUP",
        "IN_TRANSIT"
      ].includes(this.order.orderStatus);
    },
    statusToneClass() {
      const status = this.order.orderStatus;
      if (status === "COMPLETED")
        return "status-card-complete";
      if (["CANCELED", "CANCEL_PENDING"].includes(status))
        return "status-card-canceled";
      if (["PENDING_PICKUP", "IN_TRANSIT", "PENDING_RECEIPT"].includes(status)) {
        return "status-card-transport";
      }
      return "status-card-pending";
    },
    statusIconSrc() {
      const status = this.order.orderStatus;
      const map = {
        PENDING_PAYMENT: "/static/order_status_pendding.svg",
        PENDING_CONFIRM: "/static/order_status_pendding.svg",
        PENDING_PICKUP: "/static/order_status_wait_for_pickup.svg",
        IN_TRANSIT: "/static/order_status_transport.svg",
        PENDING_RECEIPT: "/static/order_status_transport.svg",
        CANCEL_PENDING: "/static/order_status_canceled.svg",
        COMPLETED: "/static/order_status_complete.svg",
        CANCELED: "/static/order_status_canceled.svg"
      };
      return map[status] || "/static/order_status_pendding.svg";
    },
    statusTitle() {
      const status = this.order.orderStatus;
      const map = {
        PENDING_PAYMENT: "待支付",
        PENDING_CONFIRM: "待确认",
        PENDING_PICKUP: "待提车",
        IN_TRANSIT: "运输中",
        PENDING_RECEIPT: "待收车",
        CANCEL_PENDING: "取消中",
        COMPLETED: "已完成",
        CANCELED: "已取消"
      };
      return map[status] || this.orderStatusText[status] || "-";
    },
    statusDesc() {
      const status = this.order.orderStatus;
      if (status === "PENDING_PAYMENT")
        return "待支付增值服务费";
      if (status === "PENDING_CONFIRM")
        return "待承运商确认订单信息";
      if (status === "PENDING_PICKUP")
        return "待承运商提车";
      if (status === "IN_TRANSIT")
        return "承运商正在运输车辆";
      if (status === "PENDING_RECEIPT")
        return "交车单据已上传，请您确认收车";
      if (status === "COMPLETED")
        return "订单已完成";
      if (status === "CANCELED")
        return this.cancelReasonText || "订单已取消";
      if (status === "CANCEL_PENDING") {
        if (!this.cancelRequest)
          return "取消申请处理中";
        const name = this.cancelRequest.requesterName || this.requesterTypeText;
        const reason = this.cancelRequest.cancelReason ? `：${this.cancelRequest.cancelReason}` : "";
        return `${name}申请取消${reason}`;
      }
      return "请查看订单详情中的下一步操作";
    },
    statusTimingDesc() {
      const status = this.order.orderStatus;
      if (status === "PENDING_CONFIRM" && this.order.carrierConfirmDeadlineAt) {
        return `承运商需在 ${this.dateText(this.order.carrierConfirmDeadlineAt)} 前确认，超时后订单将不能继续履约。`;
      }
      if (status === "PENDING_RECEIPT" && this.order.autoReceiptAt) {
        return `如您未主动确认收车，系统将在 ${this.dateText(this.order.autoReceiptAt)} 自动确认。`;
      }
      return "";
    },
    statusActionText() {
      var _a;
      if (this.order.orderStatus !== "CANCEL_PENDING")
        return "";
      return ((_a = this.cancelRequest) == null ? void 0 : _a.requesterType) === "CARRIER" ? "处理取消" : "查看协商";
    },
    requesterTypeText() {
      var _a;
      const map = {
        DEALER: "车商",
        CARRIER: "承运商",
        ADMIN: "平台",
        SYSTEM: "系统"
      };
      return map[(_a = this.cancelRequest) == null ? void 0 : _a.requesterType] || "对方";
    },
    showLatestLocationCard() {
      return Boolean(this.order.orderStatus);
    },
    sortedTransitLocations() {
      return [...this.order.transitLocations || []].sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
    },
    latestTransitLocation() {
      return this.sortedTransitLocations[0] || null;
    },
    latestLocationDisplayText() {
      const latest = this.latestTransitLocation;
      if (!latest)
        return "还没上报";
      const location = [latest.cityName, latest.address].filter(Boolean).join(" ");
      const time = this.relativeTimeText(latest.createdAt);
      const text = location || "已上报，暂无详细地址";
      return time ? `【${time}】 ${text}` : text;
    },
    cancelReasonText() {
      var _a;
      return ((_a = this.cancelRequest) == null ? void 0 : _a.cancelReason) ? `取消原因：${this.cancelRequest.cancelReason}` : "";
    },
    inviteUrl() {
      return `https://iyunche.com/invite/order?id=${this.orderId}`;
    },
    showInviteCard() {
      return this.order.orderStatus === "PENDING_CONFIRM" && (!this.order.carrierId || this.order.carrierName === "未入驻承运商");
    },
    showContactPrimary() {
      return [
        "PENDING_CONFIRM",
        "PENDING_PICKUP",
        "IN_TRANSIT",
        "PENDING_RECEIPT"
      ].includes(this.order.orderStatus);
    },
    hasPickupServiceValue() {
      return typeof this.order.hasPickupService === "boolean";
    },
    hasDeliveryServiceValue() {
      return typeof this.order.hasDeliveryService === "boolean";
    }
  },
  onLoad(options) {
    if (!utils_api.requireLogin())
      return;
    this.orderId = options.orderId;
    this.shouldShowPaymentSuccessModal = options.paymentSuccess === "1";
    this.load();
  },
  onShow() {
    if (!this.shouldRefreshOnShow || !this.orderId)
      return;
    this.shouldRefreshOnShow = false;
    this.load();
  },
  methods: {
    dateText: utils_format.dateText,
    yuanText: utils_format.yuanText,
    statusClass: utils_format.statusClass,
    async load() {
      const data = await utils_api.api.orderDetail(this.orderId);
      this.order = data.order || {};
      this.vehicles = data.vehicles || [];
      this.cancelRequest = data.cancelRequest || null;
      const rawLogs = data.logs || [];
      this.logs = rawLogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      this.pickupUrls = [];
      this.handoverUrls = [];
      if (data.mediaFiles) {
        data.mediaFiles.forEach((file) => {
          if (file.usageScene === "PICKUP_INSPECTION") {
            this.pickupUrls.push(file.fileUrl);
          } else if (file.usageScene === "HANDOVER_PHOTO") {
            this.handoverUrls.push(file.fileUrl);
          }
        });
      }
      this.countdownTimeText = this.order.autoCancelAt ? this.dateText(this.order.autoCancelAt) : "";
      if (this.shouldShowPaymentSuccessModal) {
        this.showPaymentSuccessModal();
      }
      await this.loadCompensation();
    },
    async loadCompensation() {
      try {
        const claims = await utils_api.api.compensationClaims(this.orderId);
        this.compensationClaim = (claims.items || [])[0] || null;
        if (!this.compensationClaim && this.order.orderStatus === "COMPLETED") {
          this.compensationEligibility = await utils_api.api.compensationEligibility(this.orderId);
        } else {
          this.compensationEligibility = {};
        }
      } catch (error) {
        this.compensationEligibility = {};
      }
    },
    showPaymentSuccessModal() {
      this.shouldShowPaymentSuccessModal = false;
      common_vendor.index.showModal({
        title: "支付成功",
        content: "增值服务费已支付成功。",
        confirmColor: "#f97316",
        confirmText: "我知道了",
        cancelText: "关闭",
        success: () => {
        }
      });
    },
    addressText(type) {
      const prefix = type === "origin" ? "origin" : "destination";
      return [
        this.order[`${prefix}ProvinceName`],
        this.order[`${prefix}CityName`],
        this.order[`${prefix}DistrictName`],
        this.order[`${prefix}AddressDetail`]
      ].filter(Boolean).join("") || "-";
    },
    contactText(name, phone) {
      return [name, phone].filter(Boolean).join(" ") || "-";
    },
    relativeTimeText(value) {
      if (!value)
        return "";
      const time = new Date(value).getTime();
      if (Number.isNaN(time))
        return "";
      const diffMinute = Math.max(0, Math.floor((Date.now() - time) / 6e4));
      if (diffMinute < 1)
        return "刚刚";
      if (diffMinute < 60)
        return `${diffMinute}分钟前`;
      const diffHour = Math.floor(diffMinute / 60);
      if (diffHour < 24)
        return `${diffHour}小时前`;
      const diffDay = Math.floor(diffHour / 24);
      return `${diffDay}天前`;
    },
    previewImg(url) {
      common_vendor.index.previewImage({ urls: [url] });
    },
    async payAgain() {
      const payment = await utils_api.api.createGuaranteePayment(this.orderId);
      await utils_api.requestWechatPayment(payment.paymentParams);
      await utils_api.api.syncWechatPayment(payment.paymentId);
      this.shouldShowPaymentSuccessModal = true;
      await this.load();
    },
    contactCarrier() {
      if (!this.order.carrierPhone) {
        common_vendor.index.showToast({ title: "暂无承运商联系电话", icon: "none" });
        return;
      }
      common_vendor.index.showModal({
        title: "联系承运商",
        content: `联系电话：${this.order.carrierPhone}
是否立即拨打？`,
        confirmColor: "#f97316",
        confirmText: "呼叫",
        success: (res) => {
          if (res.confirm) {
            common_vendor.index.makePhoneCall({ phoneNumber: this.order.carrierPhone });
          }
        }
      });
    },
    goTransitTrack() {
      common_vendor.index.navigateTo({ url: `/pages/order/transit-track?orderId=${this.orderId}` });
    },
    goEdit() {
      common_vendor.index.navigateTo({ url: `/pages/order/edit?orderId=${this.orderId}` });
    },
    goCancel() {
      common_vendor.index.navigateTo({ url: `/pages/order/cancel-request?orderId=${this.orderId}` });
    },
    goCancelLogs() {
      common_vendor.index.navigateTo({ url: `/pages/order/cancel-logs?orderId=${this.orderId}` });
    },
    goCancelHandle() {
      var _a;
      const query = ((_a = this.cancelRequest) == null ? void 0 : _a.id) ? `&cancelRequestId=${this.cancelRequest.id}` : "";
      common_vendor.index.navigateTo({ url: `/pages/order/cancel-handle?orderId=${this.orderId}${query}` });
    },
    goCompensationRequest() {
      common_vendor.index.navigateTo({ url: `/pages/order/compensation-request?orderId=${this.orderId}` });
    },
    handleCompensationRequestAction() {
      if (this.compensationEligibility.mode === "OFFLINE_SERVICE") {
        this.showCompensationServiceModal();
        return;
      }
      this.goCompensationRequest();
    },
    showCompensationServiceModal() {
      const phone = this.compensationEligibility.customerServicePhone || "";
      common_vendor.index.showModal({
        title: "联系平台客服",
        content: phone ? `当前赔付申请请联系平台客服：${phone}` : "当前赔付申请请联系平台客服处理。",
        confirmText: phone ? "拨打客服" : "我知道了",
        cancelText: "取消",
        showCancel: Boolean(phone),
        confirmColor: "#f97316",
        success: (res) => {
          if (res.confirm && phone) {
            common_vendor.index.makePhoneCall({ phoneNumber: phone });
          }
        }
      });
    },
    goCompensationDetail() {
      var _a;
      if (!((_a = this.compensationClaim) == null ? void 0 : _a.id))
        return;
      common_vendor.index.navigateTo({
        url: `/pages/order/compensation-detail?claimId=${this.compensationClaim.id}`
      });
    },
    compensationStatusText(status) {
      const map = {
        PENDING_CARRIER: "待承运商处理",
        CARRIER_APPROVED: "承运商已同意",
        CARRIER_REJECTED: "承运商已拒绝",
        PLATFORM_PENDING: "平台介入中",
        PLATFORM_APPROVED: "平台已通过",
        PLATFORM_REJECTED: "平台已驳回",
        CANCELED: "已撤销"
      };
      return map[status] || status || "-";
    },
    handleStatusAction() {
      if (this.statusActionText === "处理取消") {
        this.goCancelHandle();
        return;
      }
      this.goCancelLogs();
    },
    showMoreActions() {
      const itemList = [];
      const actions = [];
      if (this.canCancel) {
        itemList.push("取消订单");
        actions.push(() => this.goCancel());
      }
      itemList.push("协商历史");
      actions.push(() => this.goCancelLogs());
      if (this.compensationEligibility.actionVisible) {
        itemList.push("申请赔付");
        actions.push(() => this.handleCompensationRequestAction());
      }
      if (this.compensationClaim) {
        itemList.push("赔付详情");
        actions.push(() => this.goCompensationDetail());
      }
      common_vendor.index.showActionSheet({
        itemList,
        success: (res) => {
          if (actions[res.tapIndex]) {
            actions[res.tapIndex]();
          }
        }
      });
    },
    copyInviteLink() {
      common_vendor.index.setClipboardData({
        data: this.inviteUrl,
        success: () => {
          common_vendor.index.showToast({ title: "复制链接成功", icon: "success" });
        }
      });
    },
    async confirmReceipt() {
      common_vendor.index.showModal({
        title: "确认收车",
        content: "您确定已经线下支付完运费并安全收到车辆了吗？确认后担保服务将完成结案。",
        confirmColor: "#f97316",
        success: async (res) => {
          if (res.confirm) {
            await utils_api.api.confirmReceipt(this.orderId);
            common_vendor.index.showToast({ title: "已确认收车", icon: "success" });
            this.load();
          }
        }
      });
    },
    getLogStatusClass(actionType) {
      if ([
        "RECEIPT_CONFIRM",
        "COMPLETED",
        "HANDOVER_CONFIRM",
        "CONTRACT_SIGN",
        "GUARANTEE_PAID",
        "CONFIRM_CONTRACT",
        "AUTO_RECEIPT",
        "CANCEL_APPROVED"
      ].includes(actionType)) {
        return "status-success";
      }
      if ([
        "CANCEL_REQUEST",
        "CANCEL_HANDLE",
        "FORCE_CANCEL",
        "ADMIN_FORCE_CANCEL",
        "DIRECT_CANCEL",
        "CANCEL_REJECTED"
      ].includes(actionType)) {
        return "status-danger";
      }
      if ([
        "PICKUP_CONFIRM",
        "TRANSIT_REPORT",
        "SET_DRIVER",
        "PICKUP",
        "TRANSIT_LOCATION",
        "HANDOVER"
      ].includes(actionType)) {
        return "status-info";
      }
      return "status-warning";
    },
    logActionText(actionType) {
      return utils_format.formatOrderLogAction(actionType);
    }
  }
};
if (!Array) {
  const _easycom_miniapp_login_sheet2 = common_vendor.resolveComponent("miniapp-login-sheet");
  _easycom_miniapp_login_sheet2();
}
const _easycom_miniapp_login_sheet = () => "../../components/miniapp-login-sheet/miniapp-login-sheet.js";
if (!Math) {
  _easycom_miniapp_login_sheet();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $options.statusIconSrc,
    b: common_vendor.t($options.statusTitle),
    c: $options.statusActionText
  }, $options.statusActionText ? {
    d: common_vendor.t($options.statusActionText),
    e: common_vendor.o((...args) => $options.handleStatusAction && $options.handleStatusAction(...args), "08")
  } : {}, {
    f: common_vendor.t($options.statusDesc),
    g: $options.statusTimingDesc
  }, $options.statusTimingDesc ? {
    h: common_vendor.t($options.statusTimingDesc)
  } : {}, {
    i: $data.order.orderNo
  }, $data.order.orderNo ? {
    j: common_vendor.t($data.order.orderNo)
  } : {}, {
    k: common_vendor.n($options.statusToneClass),
    l: $options.showLatestLocationCard
  }, $options.showLatestLocationCard ? {
    m: common_assets._imports_0$3,
    n: common_vendor.t($options.statusTitle),
    o: common_vendor.t($options.latestLocationDisplayText),
    p: common_vendor.o((...args) => $options.goTransitTrack && $options.goTransitTrack(...args), "12")
  } : {}, {
    q: $options.showInviteCard
  }, $options.showInviteCard ? {
    r: $options.inviteUrl,
    s: common_vendor.o((...args) => $options.copyInviteLink && $options.copyInviteLink(...args), "ae")
  } : {}, {
    t: common_assets._imports_1$1,
    v: common_vendor.t($data.order.carrierName || "未入驻承运商"),
    w: common_vendor.o((...args) => $options.contactCarrier && $options.contactCarrier(...args), "bb"),
    x: common_vendor.t($data.order.originCityName),
    y: common_vendor.t($data.transportModeText[$data.order.transportMode]),
    z: common_vendor.t($data.order.destinationCityName),
    A: common_vendor.t($options.yuanText($data.order.orderAmountCent)),
    B: common_vendor.t($options.dateText($data.order.agreedDeliveryTime)),
    C: common_vendor.t($data.order.hasInvoice ? "需要发票（线下开具）" : "不需要发票"),
    D: common_vendor.t($data.order.hasInsurance ? `含保险，最高保额${$options.yuanText($data.order.insuranceMaxAmountCent)}` : "不含保险"),
    E: $data.order.hasInsurance && $data.order.insuranceRemark
  }, $data.order.hasInsurance && $data.order.insuranceRemark ? {
    F: common_vendor.t($data.order.insuranceRemark)
  } : {}, {
    G: $options.hasPickupServiceValue
  }, $options.hasPickupServiceValue ? common_vendor.e({
    H: common_vendor.t($data.order.hasPickupService ? "需要提车" : "不需要提车"),
    I: common_vendor.n($data.order.hasPickupService ? "status-success" : "status-warning"),
    J: $data.order.hasPickupService
  }, $data.order.hasPickupService ? {
    K: common_vendor.t($options.addressText("origin"))
  } : {}) : {}, {
    L: $options.hasDeliveryServiceValue
  }, $options.hasDeliveryServiceValue ? common_vendor.e({
    M: common_vendor.t($data.order.hasDeliveryService ? "需要送车" : "不需要送车"),
    N: common_vendor.n($data.order.hasDeliveryService ? "status-success" : "status-warning"),
    O: $data.order.hasDeliveryService
  }, $data.order.hasDeliveryService ? {
    P: common_vendor.t($options.addressText("destination"))
  } : {}) : {}, {
    Q: common_vendor.t($data.order.customerSubjectName || "个人客户"),
    R: common_vendor.t($options.contactText($data.order.senderName, $data.order.senderPhone)),
    S: common_vendor.t($options.contactText($data.order.receiverName, $data.order.receiverPhone)),
    T: common_vendor.t($data.vehicles.length),
    U: common_vendor.f($data.vehicles, (vehicle, k0, i0) => {
      return {
        a: common_vendor.t(vehicle.brandName),
        b: common_vendor.t(vehicle.seriesName || ""),
        c: common_vendor.t(vehicle.modelName || ""),
        d: common_vendor.t(vehicle.vin || "未录入"),
        e: common_vendor.t(vehicle.plateNumber || "-"),
        f: common_vendor.t(vehicle.vehicleConditionType === "NEW" ? "新车" : "二手车"),
        g: vehicle.id
      };
    }),
    V: $data.order.driverInfo || $data.order.deliveryDriverInfo
  }, $data.order.driverInfo || $data.order.deliveryDriverInfo ? common_vendor.e({
    W: $data.order.driverInfo
  }, $data.order.driverInfo ? {
    X: common_vendor.t($data.order.driverInfo.driverName),
    Y: common_vendor.t($data.order.driverInfo.driverPhone),
    Z: common_vendor.t($data.order.driverInfo.licensePlate),
    aa: common_vendor.t($data.order.driverInfo.idNumber || "-")
  } : {}, {
    ab: $data.order.deliveryDriverInfo
  }, $data.order.deliveryDriverInfo ? {
    ac: common_vendor.t($data.order.deliveryDriverInfo.driverName),
    ad: common_vendor.t($data.order.deliveryDriverInfo.driverPhone),
    ae: common_vendor.t($data.order.deliveryDriverInfo.licensePlate),
    af: common_vendor.t($data.order.deliveryDriverInfo.idNumber || "-")
  } : {}) : {}, {
    ag: $data.order.pickupDetails
  }, $data.order.pickupDetails ? common_vendor.e({
    ah: common_vendor.t($options.dateText($data.order.pickupDetails.pickupTime)),
    ai: common_vendor.t($data.order.pickupDetails.remark || "-"),
    aj: $data.pickupUrls.length
  }, $data.pickupUrls.length ? {
    ak: common_vendor.f($data.pickupUrls, (url, index, i0) => {
      return {
        a: url,
        b: common_vendor.o(($event) => $options.previewImg(url), index),
        c: index
      };
    })
  } : {}) : {}, {
    al: $data.order.handoverDetails
  }, $data.order.handoverDetails ? common_vendor.e({
    am: common_vendor.t($options.dateText($data.order.handoverDetails.handoverTime)),
    an: common_vendor.t($data.order.handoverDetails.remark || "-"),
    ao: $data.handoverUrls.length
  }, $data.handoverUrls.length ? {
    ap: common_vendor.f($data.handoverUrls, (url, index, i0) => {
      return {
        a: url,
        b: common_vendor.o(($event) => $options.previewImg(url), index),
        c: index
      };
    })
  } : {}) : {}, {
    aq: $data.compensationClaim || $data.compensationEligibility.eligible
  }, $data.compensationClaim || $data.compensationEligibility.eligible ? common_vendor.e({
    ar: $data.compensationClaim
  }, $data.compensationClaim ? {
    as: common_vendor.t($data.compensationClaim.claimNo),
    at: common_vendor.t($options.compensationStatusText($data.compensationClaim.claimStatus)),
    av: common_vendor.t($options.yuanText($data.compensationClaim.requestedCompensationCent))
  } : {
    aw: common_vendor.t($options.yuanText($data.compensationEligibility.ruleSnapshot.compensationPerDayCent)),
    ax: common_vendor.t($options.yuanText($data.compensationEligibility.ruleSnapshot.suggestedCompensationCent))
  }, {
    ay: $data.compensationClaim
  }, $data.compensationClaim ? {
    az: common_vendor.o((...args) => $options.goCompensationDetail && $options.goCompensationDetail(...args), "73")
  } : {}) : {}, {
    aA: common_vendor.f($data.logs, (log, idx, i0) => {
      return common_vendor.e({
        a: common_vendor.n($options.getLogStatusClass(log.actionType)),
        b: idx < $data.logs.length - 1
      }, idx < $data.logs.length - 1 ? {} : {}, {
        c: common_vendor.t($options.logActionText(log.actionType)),
        d: log.remark
      }, log.remark ? {
        e: common_vendor.t(log.remark)
      } : {}, {
        f: common_vendor.t($options.dateText(log.createdAt)),
        g: log.id,
        h: idx === 0 ? 1 : ""
      });
    }),
    aB: $data.logs.length === 0
  }, $data.logs.length === 0 ? {} : {}, {
    aC: $data.order.orderStatus === "PENDING_CONFIRM"
  }, $data.order.orderStatus === "PENDING_CONFIRM" ? {} : {}, {
    aD: ["PENDING_PAYMENT", "PENDING_CONFIRM", "PENDING_PICKUP", "IN_TRANSIT", "PENDING_RECEIPT", "COMPLETED"].includes($data.order.orderStatus)
  }, ["PENDING_PAYMENT", "PENDING_CONFIRM", "PENDING_PICKUP", "IN_TRANSIT", "PENDING_RECEIPT", "COMPLETED"].includes($data.order.orderStatus) ? common_vendor.e({
    aE: $data.order.orderStatus === "PENDING_CONFIRM"
  }, $data.order.orderStatus === "PENDING_CONFIRM" ? {
    aF: common_vendor.o((...args) => $options.goEdit && $options.goEdit(...args), "81")
  } : {}, {
    aG: $options.showContactPrimary
  }, $options.showContactPrimary ? {
    aH: common_vendor.o((...args) => $options.contactCarrier && $options.contactCarrier(...args), "bf")
  } : {}, {
    aI: $data.order.orderStatus === "PENDING_PAYMENT"
  }, $data.order.orderStatus === "PENDING_PAYMENT" ? {
    aJ: common_vendor.o((...args) => $options.payAgain && $options.payAgain(...args), "3d")
  } : {}, {
    aK: $data.order.orderStatus === "IN_TRANSIT"
  }, $data.order.orderStatus === "IN_TRANSIT" ? {
    aL: common_vendor.o((...args) => $options.goTransitTrack && $options.goTransitTrack(...args), "72")
  } : {}, {
    aM: $data.order.orderStatus === "PENDING_RECEIPT"
  }, $data.order.orderStatus === "PENDING_RECEIPT" ? {
    aN: common_vendor.o((...args) => $options.confirmReceipt && $options.confirmReceipt(...args), "41")
  } : {}, {
    aO: common_vendor.o((...args) => $options.showMoreActions && $options.showMoreActions(...args), "04")
  }) : {
    aP: common_vendor.o((...args) => $options.goCancelLogs && $options.goCancelLogs(...args), "a1")
  }, {
    aQ: common_vendor.sr("loginSheet", "bdc04d5a-0"),
    aR: common_vendor.o(_ctx.handleLoginSuccess, "8b")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/order/detail.js.map
