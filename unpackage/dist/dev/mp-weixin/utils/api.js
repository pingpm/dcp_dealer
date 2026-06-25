"use strict";
const common_vendor = require("../common/vendor.js");
const config_api = require("../config/api.js");
const TOKEN_KEY = "dealer_token";
const PROFILE_KEY = "dealer_profile";
const MINIAPP_LOGIN_PROMPT_KEY = "dealer_miniapp_login_prompt";
function getToken() {
  return common_vendor.index.getStorageSync(TOKEN_KEY) || "";
}
function setSession(data) {
  common_vendor.index.setStorageSync(TOKEN_KEY, data.token);
  common_vendor.index.setStorageSync(PROFILE_KEY, data);
}
function clearSession() {
  common_vendor.index.removeStorageSync(TOKEN_KEY);
  common_vendor.index.removeStorageSync(PROFILE_KEY);
}
function getSession() {
  return common_vendor.index.getStorageSync(PROFILE_KEY) || null;
}
function openLoginPrompt(payload = {}) {
  const data = typeof payload === "string" ? { actionText: payload } : payload;
  common_vendor.index.setStorageSync(MINIAPP_LOGIN_PROMPT_KEY, data || {});
  common_vendor.index.$emit("open-miniapp-login-sheet", data);
  return true;
}
function consumePendingLoginPrompt() {
  const payload = common_vendor.index.getStorageSync(MINIAPP_LOGIN_PROMPT_KEY) || null;
  if (payload) {
    common_vendor.index.removeStorageSync(MINIAPP_LOGIN_PROMPT_KEY);
  }
  return payload;
}
function requireLogin(payload = {}) {
  if (!getToken()) {
    openLoginPrompt(payload);
    return false;
  }
  return true;
}
function request(options) {
  const token = getToken();
  const header = {
    ...options.header || {}
  };
  if (token) {
    header.Authorization = `Bearer ${token}`;
  }
  return new Promise((resolve, reject) => {
    common_vendor.index.request({
      url: `${config_api.API_BASE_URL}${options.url}`,
      method: options.method || "GET",
      data: options.data || {},
      header,
      success(res) {
        const body = res.data || {};
        if (res.statusCode >= 200 && res.statusCode < 300 && body.success) {
          resolve(normalizeFileUrls(body.data));
          return;
        }
        const message = body.message || "请求失败";
        if (res.statusCode === 401) {
          clearSession();
          if (options.authRedirect !== false) {
            openLoginPrompt({ actionText: "重新登录" });
          }
        }
        if (!options.silent) {
          common_vendor.index.showToast({ title: message, icon: "none" });
        }
        reject({ ...body, statusCode: res.statusCode, message });
      },
      fail(error) {
        if (!options.silent) {
          common_vendor.index.showToast({ title: "网络连接失败", icon: "none" });
        }
        reject(error);
      }
    });
  });
}
function uploadFile(filePath, fileType, usageScene = "") {
  const token = getToken();
  return new Promise((resolve, reject) => {
    common_vendor.index.uploadFile({
      url: `${config_api.API_BASE_URL}/files`,
      filePath,
      name: "file",
      formData: { fileType, usageScene },
      header: token ? { Authorization: `Bearer ${token}` } : {},
      success(res) {
        let body = {};
        try {
          body = JSON.parse(res.data);
        } catch (error) {
          reject(error);
          return;
        }
        if (res.statusCode >= 200 && res.statusCode < 300 && body.success) {
          resolve(normalizeFileUrls(body.data));
          return;
        }
        const message = body.message || "上传失败";
        common_vendor.index.showToast({ title: message, icon: "none" });
        reject(body);
      },
      fail(error) {
        common_vendor.index.showToast({ title: "上传失败", icon: "none" });
        reject(error);
      }
    });
  });
}
function resolveFileUrl(fileUrl) {
  if (!fileUrl || typeof fileUrl !== "string")
    return fileUrl || "";
  if (/^(https?:|data:|blob:|file:|wxfile:)/i.test(fileUrl))
    return fileUrl;
  if (!fileUrl.startsWith("/uploads/"))
    return fileUrl;
  const origin = fileServiceOrigin();
  return origin ? `${origin}${fileUrl}` : fileUrl;
}
function fileServiceOrigin() {
  var _a;
  const baseUrl = config_api.API_BASE_URL.replace(/\/+$/, "");
  const match = baseUrl.match(/^(https?:\/\/[^/]+)/i);
  if (match)
    return match[1];
  if (typeof window !== "undefined" && ((_a = window.location) == null ? void 0 : _a.origin)) {
    return window.location.origin;
  }
  return "";
}
function normalizeFileUrls(value) {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeFileUrls(item));
  }
  if (!value || typeof value !== "object") {
    return value;
  }
  return Object.keys(value).reduce((next, key) => {
    const item = value[key];
    next[key] = key === "fileUrl" ? resolveFileUrl(item) : normalizeFileUrls(item);
    return next;
  }, {});
}
const api = {
  exampleImageConfigs() {
    return request({
      url: "/system-configs/example-images",
      authRedirect: false
    });
  },
  sendLoginCode(phone) {
    return request({
      url: "/auth/miniapp/verification-codes",
      method: "POST",
      data: {
        appType: "DEALER_MINIAPP",
        phone
      }
    });
  },
  login(phone, verificationCode) {
    return request({
      url: "/auth/miniapp/login",
      method: "POST",
      data: {
        appType: "DEALER_MINIAPP",
        phone,
        verificationCode
      }
    });
  },
  loginWithWechatCode(phone, verificationCode, wxCode) {
    return request({
      url: "/auth/miniapp/login",
      method: "POST",
      data: {
        appType: "DEALER_MINIAPP",
        phone,
        verificationCode,
        wxCode
      }
    });
  },
  wechatPhoneLogin(phoneCode, wxCode) {
    return request({
      url: "/auth/miniapp/wechat-phone-login",
      method: "POST",
      data: {
        appType: "DEALER_MINIAPP",
        phoneCode,
        wxCode
      }
    });
  },
  bindWechatOpenid(wxCode) {
    return request({
      url: "/auth/miniapp/wechat-openid",
      method: "POST",
      data: {
        appType: "DEALER_MINIAPP",
        wxCode
      }
    });
  },
  me(options = {}) {
    return request({ url: "/auth/me", ...options });
  },
  verificationStatus(options = {}) {
    return request({ url: "/dealer/verification/status", ...options });
  },
  verificationDetail() {
    return request({ url: "/dealer/verification" });
  },
  verificationCompanyNameCheck(params = {}) {
    const query = toQuery(params);
    return request({
      url: `/dealer/verification/company-name-check${query ? `?${query}` : ""}`,
      silent: true
    });
  },
  submitVerification(data) {
    return request({ url: "/dealer/verification", method: "POST", data });
  },
  regions(parentId, level) {
    const params = {};
    if (parentId)
      params.parentId = parentId;
    if (level)
      params.level = level;
    const query = toQuery(params);
    return request({ url: `/regions${query ? `?${query}` : ""}` });
  },
  vehicleBrands() {
    return request({ url: "/vehicle/brands" });
  },
  vehicleSeries(brandId) {
    return request({ url: `/vehicle/series?${toQuery({ brandId })}` });
  },
  vehicleModels(seriesId) {
    return request({ url: `/vehicle/models?${toQuery({ seriesId })}` });
  },
  searchVehicleModels(params) {
    return request({ url: `/vehicle/models/search?${toQuery(params)}` });
  },
  amapPoiSearch(params = {}) {
    return request({ url: `/map/amap/pois?${toQuery(params)}` });
  },
  amapRegeo(params = {}) {
    return request({ url: `/map/amap/regeo?${toQuery(params)}` });
  },
  amapDrivingRoute(params = {}) {
    return request({ url: `/map/amap/driving-route?${toQuery(params)}` });
  },
  searchCarriers(params) {
    return request({ url: `/dealer/carrier-search?${toQuery(params)}` });
  },
  carrierPublicProfile(carrierId) {
    return request({ url: `/dealer/carriers/${carrierId}/profile` });
  },
  revealCarrierPhone(data) {
    return request({ url: "/dealer/contact/carrier-phone", method: "POST", data });
  },
  importDevTestFile(relativePath, fileType = "IMAGE") {
    return request({
      url: "/dev/test-files/import",
      method: "POST",
      data: { relativePath, fileType }
    });
  },
  platformGuaranteeService() {
    return request({ url: "/dealer/value-added-services/platform-guarantee" });
  },
  guaranteeServiceAgreement(options = {}) {
    return request({ url: "/agreements/guarantee-service", authRedirect: false, ...options });
  },
  createOrder(data) {
    return request({ url: "/orders", method: "POST", data });
  },
  updateOrder(orderId, data) {
    return request({ url: `/orders/${orderId}`, method: "PUT", data });
  },
  async createGuaranteePayment(orderId) {
    return request({ url: `/orders/${orderId}/guarantee-payment`, method: "POST" });
  },
  payment(paymentId, options = {}) {
    return request({ url: `/payments/${paymentId}`, ...options });
  },
  syncWechatPayment(paymentId, options = {}) {
    if (!paymentId) {
      return Promise.resolve({ synced: false, mock: true });
    }
    return request({ url: `/payments/${paymentId}/wechat-sync`, method: "POST", ...options });
  },
  orders(params = {}, options = {}) {
    const query = toQuery(params);
    return request({ url: `/orders${query ? `?${query}` : ""}`, ...options });
  },
  orderDetail(orderId) {
    return request({ url: `/orders/${orderId}` });
  },
  confirmReceipt(orderId) {
    return request({ url: `/orders/${orderId}/receipt-confirm`, method: "POST" });
  },
  cancelOrder(orderId, cancelReason) {
    return request({
      url: `/orders/${orderId}/cancel-requests`,
      method: "POST",
      data: { cancelReason }
    });
  },
  cancelLogs(orderId) {
    return request({ url: `/orders/${orderId}/cancel-logs` });
  },
  negotiationHistory(orderId) {
    return request({ url: `/orders/${orderId}/negotiation-history` });
  },
  compensationEligibility(orderId) {
    return request({ url: `/orders/${orderId}/compensation-eligibility` });
  },
  compensationClaims(orderId) {
    return request({ url: `/orders/${orderId}/compensation-claims` });
  },
  createCompensationClaim(orderId, data) {
    return request({ url: `/orders/${orderId}/compensation-claims`, method: "POST", data });
  },
  compensationClaim(claimId) {
    return request({ url: `/compensation-claims/${claimId}` });
  },
  requestCompensationPlatformIntervention(claimId, reason) {
    return request({
      url: `/compensation-claims/${claimId}/platform-intervention`,
      method: "POST",
      data: { reason }
    });
  },
  notificationSettings() {
    return request({ url: "/account/notification-settings" });
  },
  updateNotificationSetting(data) {
    return request({ url: "/account/notification-settings", method: "PUT", data });
  }
};
function miniappLoginCode() {
  return new Promise((resolve, reject) => {
    common_vendor.index.login({
      provider: "weixin",
      success(res) {
        if (res.code) {
          resolve(res.code);
          return;
        }
        reject(new Error("微信登录未返回 code"));
      },
      fail: reject
    });
  });
}
function requestWechatPayment(paymentParams) {
  if ((paymentParams == null ? void 0 : paymentParams.mock) || (paymentParams == null ? void 0 : paymentParams.provider) === "DEV_H5") {
    return Promise.resolve({ mock: true });
  }
  return new Promise((resolve, reject) => {
    common_vendor.index.requestPayment({
      provider: "wxpay",
      timeStamp: paymentParams.timeStamp,
      nonceStr: paymentParams.nonceStr,
      package: paymentParams.package,
      signType: paymentParams.signType || "MD5",
      paySign: paymentParams.paySign,
      success: resolve,
      fail: reject
    });
  });
}
function toQuery(params) {
  return Object.entries(params).filter(([, value]) => value !== void 0 && value !== null && value !== "").map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join("&");
}
function decodeQueryValue(value) {
  if (typeof value !== "string")
    return value;
  try {
    return decodeURIComponent(value);
  } catch (error) {
    return value;
  }
}
function decodeQuery(options = {}) {
  const query = {};
  Object.keys(options).forEach((key) => {
    query[key] = decodeQueryValue(options[key]);
  });
  return query;
}
exports.api = api;
exports.clearSession = clearSession;
exports.consumePendingLoginPrompt = consumePendingLoginPrompt;
exports.decodeQuery = decodeQuery;
exports.getSession = getSession;
exports.getToken = getToken;
exports.miniappLoginCode = miniappLoginCode;
exports.requestWechatPayment = requestWechatPayment;
exports.requireLogin = requireLogin;
exports.setSession = setSession;
exports.toQuery = toQuery;
exports.uploadFile = uploadFile;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/api.js.map
