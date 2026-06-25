"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const utils_navigation = require("../../utils/navigation.js");
const common_assets = require("../../common/assets.js");
const DealerOrderForm = () => "../../components/dealer-order-form/dealer-order-form.js";
function blankRoute() {
  return {
    provinceId: "",
    provinceName: "",
    cityId: "",
    cityName: "",
    districtId: "",
    districtName: "",
    addressPoiName: "",
    addressDetail: "",
    longitude: "",
    latitude: ""
  };
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function seedFromProfile(profile = {}, user = {}) {
  return {
    orderAmountYuan: "",
    agreedDate: "",
    form: {
      transportMode: "LARGE_TRUCK",
      customerSubject: {
        subjectType: "ENTERPRISE",
        subjectName: profile.companyName || "",
        subjectPhone: profile.registeredPhone || user.registeredPhone || ""
      },
      origin: blankRoute(),
      destination: blankRoute(),
      hasPickupService: true,
      hasDeliveryService: false,
      sender: { name: "", phone: "" },
      receiver: { name: "", phone: "" },
      vehicles: [],
      hasInvoice: false,
      hasInsurance: false,
      insuranceRemark: ""
    }
  };
}
const _sfc_main = {
  components: { DealerOrderForm },
  data() {
    const session = utils_api.getSession();
    return {
      activeDrawer: "",
      carrier: {},
      carrierMeta: {
        carrierId: "",
        carrierPhone: "",
        routeId: "",
        carrierRouteId: ""
      },
      formSeed: seedFromProfile((session == null ? void 0 : session.profile) || {}, (session == null ? void 0 : session.user) || {}),
      formSeedVersion: 0,
      platformGuaranteeService: {
        serviceType: "GUARANTEE",
        serviceName: "平台担保交易",
        priceCent: 0
      },
      platformGuaranteeItems: [],
      submitting: false,
      paymentConsent: true,
      agreedDeliveryDateText: ""
    };
  },
  computed: {
    carrierDisplayName() {
      if (this.carrierMeta.carrierId)
        return this.carrier.carrierName || "承运商";
      if (this.carrierMeta.carrierPhone)
        return `未入驻承运商 ${this.carrierMeta.carrierPhone}`;
      return "待选择承运商";
    },
    totalPayAmountYuan() {
      return ((this.platformGuaranteeService.priceCent || 0) / 100).toFixed(2);
    }
  },
  async onLoad(options) {
    if (!await utils_navigation.ensureDealerReady())
      return;
    await this.loadLatestDealerProfile();
    this.applyCarrierSeed(options);
    await this.loadPlatformGuaranteeService();
  },
  methods: {
    async loadLatestDealerProfile() {
      try {
        const latestSession = await utils_api.api.me({ authRedirect: false });
        const currentSession = utils_api.getSession() || {};
        if (latestSession.user) {
          utils_api.setSession({
            ...currentSession,
            ...latestSession,
            token: currentSession.token
          });
        }
        this.formSeed = seedFromProfile(latestSession.profile || {}, latestSession.user || {});
        this.formSeedVersion += 1;
      } catch (error) {
      }
    },
    applyCarrierSeed(options = {}) {
      if (!options.carrier)
        return;
      this.carrier = JSON.parse(decodeURIComponent(options.carrier));
      const search = this.carrier.searchCondition || {};
      const seed = JSON.parse(JSON.stringify(this.formSeed));
      this.carrierMeta = {
        carrierId: this.carrier.carrierId || "",
        carrierPhone: this.carrier.phone || "",
        routeId: this.carrier.routeId || "",
        carrierRouteId: this.carrier.carrierRouteId || ""
      };
      seed.form.transportMode = this.carrier.routeType || search.transportMode || "LARGE_TRUCK";
      if (search.originCityId) {
        seed.form.origin = {
          ...seed.form.origin,
          provinceId: search.originProvinceId || "",
          provinceName: search.originProvinceName || "",
          cityId: search.originCityId,
          cityName: search.originCityName,
          longitude: search.originLongitude || search.originCityLongitude || "",
          latitude: search.originLatitude || search.originCityLatitude || ""
        };
      }
      if (search.destinationCityId) {
        seed.form.destination = {
          ...seed.form.destination,
          provinceId: search.destinationProvinceId || "",
          provinceName: search.destinationProvinceName || "",
          cityId: search.destinationCityId,
          cityName: search.destinationCityName,
          longitude: search.destinationLongitude || search.destinationCityLongitude || "",
          latitude: search.destinationLatitude || search.destinationCityLatitude || ""
        };
      }
      this.formSeed = seed;
      this.formSeedVersion += 1;
    },
    async loadPlatformGuaranteeService() {
      try {
        const result = await utils_api.api.platformGuaranteeService();
        this.platformGuaranteeService = result.aggregateService || this.platformGuaranteeService;
        this.platformGuaranteeItems = result.items || [];
      } catch (error) {
        this.platformGuaranteeItems = [];
        common_vendor.index.showToast({ title: error.message || "平台增值服务暂不可用", icon: "none" });
      }
    },
    closeDrawer() {
      this.activeDrawer = "";
    },
    onNextStep() {
      const form = this.$refs.orderForm;
      if (!form || !form.validate())
        return;
      if (!this.platformGuaranteeService.priceCent || this.platformGuaranteeItems.length === 0) {
        common_vendor.index.showToast({ title: "平台担保交易服务暂不可用", icon: "none" });
        this.loadPlatformGuaranteeService();
        return;
      }
      this.syncAgreedDeliveryDateText();
      this.activeDrawer = "payment";
    },
    syncAgreedDeliveryDateText() {
      var _a;
      const form = this.$refs.orderForm;
      this.agreedDeliveryDateText = ((_a = form == null ? void 0 : form.getAgreedDeliveryDateText) == null ? void 0 : _a.call(form)) || "";
    },
    openGuaranteeAgreement() {
      common_vendor.index.navigateTo({ url: "/pages/agreement/detail?type=guarantee" });
    },
    async executeOrderPayment() {
      if (!this.paymentConsent) {
        common_vendor.index.showToast({ title: "请同意担保交易服务协议", icon: "none" });
        return;
      }
      this.submitting = true;
      try {
        let order = null;
        try {
          order = await this.createOrderPayload();
        } catch (err) {
          common_vendor.index.showToast({ title: `订单创建失败：${err.message || "网络错误"}`, icon: "none" });
          return;
        }
        let payment = null;
        try {
          payment = await utils_api.api.createGuaranteePayment(order.orderId);
        } catch (err) {
          this.closeDrawer();
          this.openCreatedOrderDetail(order.orderId);
          common_vendor.index.showToast({ title: "订单已创建，发起支付失败", icon: "none" });
          return;
        }
        const pollPaymentSuccess = this.waitForPaymentSuccess(payment.paymentId);
        pollPaymentSuccess.catch(() => {
        });
        const payResult = await Promise.race([
          utils_api.requestWechatPayment(payment.paymentParams).then(() => ({ source: "client" })).catch((error) => ({ source: "client", error })),
          pollPaymentSuccess.then(() => ({ source: "server" }))
        ]);
        if (payResult.error) {
          const paid = await this.checkPaymentSuccess(payment.paymentId);
          if (!paid) {
            this.closeDrawer();
            this.openCreatedOrderDetail(order.orderId);
            common_vendor.index.showToast({ title: "订单已创建，待支付担保费", icon: "none" });
            return;
          }
        }
        try {
          await pollPaymentSuccess;
        } catch (error) {
          this.closeDrawer();
          this.openCreatedOrderDetail(order.orderId);
          common_vendor.index.showToast({ title: "支付已完成，正在等待确认", icon: "none" });
          return;
        }
        this.closeDrawer();
        this.openCreatedOrderDetail(order.orderId, true);
      } finally {
        this.submitting = false;
      }
    },
    createOrderPayload() {
      const form = this.$refs.orderForm;
      return utils_api.api.createOrder(form.buildPayload(this.carrierMeta));
    },
    async checkPaymentSuccess(paymentId) {
      var _a;
      if (!paymentId)
        return true;
      try {
        const syncResult = await utils_api.api.syncWechatPayment(paymentId, { silent: true });
        if (((_a = syncResult == null ? void 0 : syncResult.payment) == null ? void 0 : _a.paymentStatus) === "SUCCESS")
          return true;
      } catch (error) {
      }
      try {
        const payment = await utils_api.api.payment(paymentId, { silent: true });
        return (payment == null ? void 0 : payment.paymentStatus) === "SUCCESS";
      } catch (error) {
        return false;
      }
    },
    async waitForPaymentSuccess(paymentId) {
      if (!paymentId)
        return true;
      for (let index = 0; index < 15; index += 1) {
        if (await this.checkPaymentSuccess(paymentId))
          return true;
        await sleep(index < 5 ? 1e3 : 2e3);
      }
      throw new Error("支付结果确认超时");
    },
    openCreatedOrderDetail(orderId, paymentSuccess = false) {
      common_vendor.index.setStorageSync(
        "dealer_pending_order_detail",
        JSON.stringify({ orderId, paymentSuccess })
      );
      common_vendor.index.switchTab({ url: "/pages/order/list" });
    }
  }
};
if (!Array) {
  const _easycom_dealer_order_form2 = common_vendor.resolveComponent("dealer-order-form");
  _easycom_dealer_order_form2();
}
const _easycom_dealer_order_form = () => "../../components/dealer-order-form/dealer-order-form.js";
if (!Math) {
  _easycom_dealer_order_form();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.t($options.carrierDisplayName),
    b: $data.carrierMeta.carrierId
  }, $data.carrierMeta.carrierId ? {} : {}, {
    c: common_vendor.sr("orderForm", "3081147e-0"),
    d: common_vendor.p({
      seed: $data.formSeed,
      ["seed-version"]: $data.formSeedVersion
    }),
    e: $data.submitting,
    f: common_vendor.o((...args) => $options.onNextStep && $options.onNextStep(...args), "0e"),
    g: $data.activeDrawer === "payment" ? 1 : "",
    h: common_vendor.o((...args) => $options.closeDrawer && $options.closeDrawer(...args), "fb"),
    i: common_vendor.o((...args) => $options.closeDrawer && $options.closeDrawer(...args), "b1"),
    j: common_vendor.t($options.totalPayAmountYuan),
    k: common_vendor.f($data.platformGuaranteeItems, (item, k0, i0) => {
      return common_vendor.e({
        a: common_vendor.t(item.serviceName),
        b: item.description
      }, item.description ? {
        c: common_vendor.t(item.description)
      } : {}, {
        d: item.serviceType === "LIMITED_TIME_DELIVERY" && $data.agreedDeliveryDateText
      }, item.serviceType === "LIMITED_TIME_DELIVERY" && $data.agreedDeliveryDateText ? {
        e: common_vendor.t($data.agreedDeliveryDateText)
      } : {}, {
        f: item.serviceType
      });
    }),
    l: common_assets._imports_0$2,
    m: $data.paymentConsent ? 1 : "",
    n: common_vendor.o(($event) => $data.paymentConsent = !$data.paymentConsent, "4f"),
    o: common_vendor.o(($event) => $data.paymentConsent = !$data.paymentConsent, "25"),
    p: common_vendor.o((...args) => $options.openGuaranteeAgreement && $options.openGuaranteeAgreement(...args), "65"),
    q: common_vendor.t($options.totalPayAmountYuan),
    r: $data.submitting,
    s: common_vendor.o((...args) => $options.executeOrderPayment && $options.executeOrderPayment(...args), "d0"),
    t: $data.activeDrawer === "payment" ? 1 : ""
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/order/create.js.map
