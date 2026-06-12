"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      orderId: "",
      order: {},
      vehicles: [],
      logs: [],
      cancelRequest: null,
      pickupUrls: [],
      handoverUrls: [],
      orderStatusText: common_vendor.orderStatusText,
      transportModeText: common_vendor.transportModeText,
      vehicleConditionText: common_vendor.vehicleConditionText,
      countdownTimeText: "",
      shouldShowPaymentSuccessModal: false
    };
  },
  computed: {
    canCancel() {
      return [
        "PENDING_PAYMENT",
        "PENDING_CONFIRM",
        "PENDING_CONTRACT",
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
        PENDING_CONTRACT: "/static/order_status_pendding.svg",
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
        PENDING_CONTRACT: "待确认",
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
      if (status === "PENDING_CONTRACT")
        return "待双方签署合同";
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
        "PENDING_CONTRACT",
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
    if (!common_vendor.requireLogin())
      return;
    this.orderId = options.orderId;
    this.shouldShowPaymentSuccessModal = options.paymentSuccess === "1";
    this.load();
  },
  methods: {
    dateText: common_vendor.dateText,
    yuanText: common_vendor.yuanText,
    statusClass: common_vendor.statusClass,
    async load() {
      const data = await common_vendor.api.orderDetail(this.orderId);
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
      const payment = await common_vendor.api.createGuaranteePayment(this.orderId);
      await common_vendor.api.simulatePaymentSuccess(payment.paymentId);
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
    goContract() {
      common_vendor.index.navigateTo({ url: `/pages/order/contract?orderId=${this.orderId}` });
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
            await common_vendor.api.confirmReceipt(this.orderId);
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
      if (!actionType)
        return "";
      const key = String(actionType).toUpperCase();
      const map = {
        CREATE: "订单提交创建",
        CREATE_ORDER: "订单提交创建",
        GUARANTEE_PAID: "担保交易服务费已支付",
        CARRIER_CONFIRM: "承运商确认订单",
        CONFIRM_CONTRACT: "双方确认合同",
        CONTRACT_SIGN: "双方确认合同",
        SET_DRIVER: "设置司机信息",
        PICKUP: "承运商提车验车完成",
        PICKUP_CONFIRM: "承运商提车验车完成",
        TRANSIT_LOCATION: "上报在途位置",
        TRANSIT_REPORT: "上报在途位置",
        HANDOVER: "承运商已交车",
        HANDOVER_CONFIRM: "承运商已交车",
        RECEIPT_CONFIRM: "车商确认已收车",
        DEALER_CONFIRM_RECEIPT: "车商确认已收车",
        AUTO_RECEIPT: "系统自动确认收车",
        DIRECT_CANCEL: "订单取消关闭",
        CANCEL_REQUEST: "发起取消申请",
        CANCEL_WITHDRAW: "撤销取消申请",
        WITHDRAW: "撤回取消申请",
        CANCEL_HANDLE: "取消申请已处理",
        CANCEL_APPROVED: "同意取消申请",
        CANCEL_REJECTED: "拒绝取消申请",
        FORCE_CANCEL: "系统强制取消",
        ADMIN_FORCE_CANCEL: "系统强制取消",
        STATUS_CHANGE: "订单状态变更"
      };
      return map[key] || actionType;
    }
  }
};
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
    g: $data.order.orderNo
  }, $data.order.orderNo ? {
    h: common_vendor.t($data.order.orderNo)
  } : {}, {
    i: common_vendor.n($options.statusToneClass),
    j: $options.showLatestLocationCard
  }, $options.showLatestLocationCard ? {
    k: common_assets._imports_0$1,
    l: common_vendor.t($options.statusTitle),
    m: common_vendor.t($options.latestLocationDisplayText),
    n: common_vendor.o((...args) => $options.goTransitTrack && $options.goTransitTrack(...args), "46")
  } : {}, {
    o: $options.showInviteCard
  }, $options.showInviteCard ? {
    p: $options.inviteUrl,
    q: common_vendor.o((...args) => $options.copyInviteLink && $options.copyInviteLink(...args), "dc")
  } : {}, {
    r: common_assets._imports_1,
    s: common_vendor.t($data.order.carrierName || "未入驻承运商"),
    t: common_vendor.o((...args) => $options.contactCarrier && $options.contactCarrier(...args), "13"),
    v: common_vendor.t($data.order.originCityName),
    w: common_vendor.t($data.transportModeText[$data.order.transportMode]),
    x: common_vendor.t($data.order.destinationCityName),
    y: common_vendor.t($options.yuanText($data.order.orderAmountCent)),
    z: common_vendor.t($options.dateText($data.order.agreedDeliveryTime)),
    A: common_vendor.t($data.order.hasInvoice ? "需要发票（线下开具）" : "不需要发票"),
    B: $options.hasPickupServiceValue
  }, $options.hasPickupServiceValue ? common_vendor.e({
    C: common_vendor.t($data.order.hasPickupService ? "需要提车" : "不需要提车"),
    D: common_vendor.n($data.order.hasPickupService ? "status-success" : "status-warning"),
    E: $data.order.hasPickupService
  }, $data.order.hasPickupService ? {
    F: common_vendor.t($options.addressText("origin"))
  } : {}) : {}, {
    G: $options.hasDeliveryServiceValue
  }, $options.hasDeliveryServiceValue ? common_vendor.e({
    H: common_vendor.t($data.order.hasDeliveryService ? "需要送车" : "不需要送车"),
    I: common_vendor.n($data.order.hasDeliveryService ? "status-success" : "status-warning"),
    J: $data.order.hasDeliveryService
  }, $data.order.hasDeliveryService ? {
    K: common_vendor.t($options.addressText("destination"))
  } : {}) : {}, {
    L: common_vendor.t($data.order.customerSubjectName || "个人客户"),
    M: common_vendor.t($options.contactText($data.order.senderName, $data.order.senderPhone)),
    N: common_vendor.t($options.contactText($data.order.receiverName, $data.order.receiverPhone)),
    O: common_vendor.t($data.vehicles.length),
    P: common_vendor.f($data.vehicles, (vehicle, k0, i0) => {
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
    Q: $data.order.driverInfo || $data.order.deliveryDriverInfo
  }, $data.order.driverInfo || $data.order.deliveryDriverInfo ? common_vendor.e({
    R: $data.order.driverInfo
  }, $data.order.driverInfo ? {
    S: common_vendor.t($data.order.driverInfo.driverName),
    T: common_vendor.t($data.order.driverInfo.driverPhone),
    U: common_vendor.t($data.order.driverInfo.licensePlate),
    V: common_vendor.t($data.order.driverInfo.idNumber || "-")
  } : {}, {
    W: $data.order.deliveryDriverInfo
  }, $data.order.deliveryDriverInfo ? {
    X: common_vendor.t($data.order.deliveryDriverInfo.driverName),
    Y: common_vendor.t($data.order.deliveryDriverInfo.driverPhone),
    Z: common_vendor.t($data.order.deliveryDriverInfo.licensePlate),
    aa: common_vendor.t($data.order.deliveryDriverInfo.idNumber || "-")
  } : {}) : {}, {
    ab: $data.order.pickupDetails
  }, $data.order.pickupDetails ? common_vendor.e({
    ac: common_vendor.t($options.dateText($data.order.pickupDetails.pickupTime)),
    ad: common_vendor.t($data.order.pickupDetails.remark || "-"),
    ae: $data.pickupUrls.length
  }, $data.pickupUrls.length ? {
    af: common_vendor.f($data.pickupUrls, (url, index, i0) => {
      return {
        a: url,
        b: common_vendor.o(($event) => $options.previewImg(url), index),
        c: index
      };
    })
  } : {}) : {}, {
    ag: $data.order.handoverDetails
  }, $data.order.handoverDetails ? common_vendor.e({
    ah: common_vendor.t($options.dateText($data.order.handoverDetails.handoverTime)),
    ai: common_vendor.t($data.order.handoverDetails.remark || "-"),
    aj: $data.handoverUrls.length
  }, $data.handoverUrls.length ? {
    ak: common_vendor.f($data.handoverUrls, (url, index, i0) => {
      return {
        a: url,
        b: common_vendor.o(($event) => $options.previewImg(url), index),
        c: index
      };
    })
  } : {}) : {}, {
    al: common_vendor.f($data.logs, (log, idx, i0) => {
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
    am: $data.logs.length === 0
  }, $data.logs.length === 0 ? {} : {}, {
    an: $data.order.orderStatus === "PENDING_CONFIRM"
  }, $data.order.orderStatus === "PENDING_CONFIRM" ? {} : {}, {
    ao: ["PENDING_PAYMENT", "PENDING_CONFIRM", "PENDING_CONTRACT", "PENDING_PICKUP", "IN_TRANSIT", "PENDING_RECEIPT"].includes($data.order.orderStatus)
  }, ["PENDING_PAYMENT", "PENDING_CONFIRM", "PENDING_CONTRACT", "PENDING_PICKUP", "IN_TRANSIT", "PENDING_RECEIPT"].includes($data.order.orderStatus) ? common_vendor.e({
    ap: $data.order.orderStatus === "PENDING_CONFIRM"
  }, $data.order.orderStatus === "PENDING_CONFIRM" ? {
    aq: common_vendor.o((...args) => $options.goEdit && $options.goEdit(...args), "8b")
  } : {}, {
    ar: $options.showContactPrimary
  }, $options.showContactPrimary ? {
    as: common_vendor.o((...args) => $options.contactCarrier && $options.contactCarrier(...args), "08")
  } : {}, {
    at: $data.order.orderStatus === "PENDING_PAYMENT"
  }, $data.order.orderStatus === "PENDING_PAYMENT" ? {
    av: common_vendor.o((...args) => $options.payAgain && $options.payAgain(...args), "40")
  } : {}, {
    aw: $data.order.orderStatus === "PENDING_CONTRACT"
  }, $data.order.orderStatus === "PENDING_CONTRACT" ? {
    ax: common_vendor.o((...args) => $options.goContract && $options.goContract(...args), "00")
  } : {}, {
    ay: $data.order.orderStatus === "IN_TRANSIT"
  }, $data.order.orderStatus === "IN_TRANSIT" ? {
    az: common_vendor.o((...args) => $options.goTransitTrack && $options.goTransitTrack(...args), "eb")
  } : {}, {
    aA: $data.order.orderStatus === "PENDING_RECEIPT"
  }, $data.order.orderStatus === "PENDING_RECEIPT" ? {
    aB: common_vendor.o((...args) => $options.confirmReceipt && $options.confirmReceipt(...args), "f3")
  } : {}, {
    aC: common_vendor.o((...args) => $options.showMoreActions && $options.showMoreActions(...args), "d8")
  }) : {
    aD: common_vendor.o((...args) => $options.goCancelLogs && $options.goCancelLogs(...args), "b4")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
