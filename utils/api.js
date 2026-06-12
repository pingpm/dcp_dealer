import { API_BASE_URL } from '../config/api';

const TOKEN_KEY = 'dealer_token';
const PROFILE_KEY = 'dealer_profile';

export function getToken() {
  return uni.getStorageSync(TOKEN_KEY) || '';
}

export function setSession(data) {
  uni.setStorageSync(TOKEN_KEY, data.token);
  uni.setStorageSync(PROFILE_KEY, data);
}

export function clearSession() {
  uni.removeStorageSync(TOKEN_KEY);
  uni.removeStorageSync(PROFILE_KEY);
}

export function getSession() {
  return uni.getStorageSync(PROFILE_KEY) || null;
}

export function requireLogin() {
  if (!getToken()) {
    uni.reLaunch({ url: '/pages/auth/login' });
    return false;
  }
  return true;
}

export function request(options) {
  const token = getToken();
  const header = {
    ...(options.header || {}),
  };
  if (token) {
    header.Authorization = `Bearer ${token}`;
  }

  return new Promise((resolve, reject) => {
    uni.request({
      url: `${API_BASE_URL}${options.url}`,
      method: options.method || 'GET',
      data: options.data || {},
      header,
      success(res) {
        const body = res.data || {};
        if (res.statusCode >= 200 && res.statusCode < 300 && body.success) {
          resolve(body.data);
          return;
        }
        const message = body.message || '请求失败';
        if (res.statusCode === 401) {
          clearSession();
          if (options.authRedirect !== false) {
            uni.reLaunch({ url: '/pages/auth/login' });
          }
        }
        if (!options.silent) {
          uni.showToast({ title: message, icon: 'none' });
        }
        reject({ ...body, statusCode: res.statusCode, message });
      },
      fail(error) {
        if (!options.silent) {
          uni.showToast({ title: '网络连接失败', icon: 'none' });
        }
        reject(error);
      },
    });
  });
}

export function uploadFile(filePath, fileType, usageScene = '') {
  const token = getToken();
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: `${API_BASE_URL}/files`,
      filePath,
      name: 'file',
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
          resolve(body.data);
          return;
        }
        const message = body.message || '上传失败';
        uni.showToast({ title: message, icon: 'none' });
        reject(body);
      },
      fail(error) {
        uni.showToast({ title: '上传失败', icon: 'none' });
        reject(error);
      },
    });
  });
}

export const api = {
  exampleImageConfigs() {
    return request({
      url: '/system-configs/example-images',
      authRedirect: false,
    });
  },
  sendLoginCode(phone) {
    return request({
      url: '/auth/miniapp/verification-codes',
      method: 'POST',
      data: {
        appType: 'DEALER_MINIAPP',
        phone,
      },
    });
  },
  login(phone, verificationCode) {
    return request({
      url: '/auth/miniapp/login',
      method: 'POST',
      data: {
        appType: 'DEALER_MINIAPP',
        phone,
        verificationCode,
      },
    });
  },
  loginWithWechatCode(phone, verificationCode, wxCode) {
    return request({
      url: '/auth/miniapp/login',
      method: 'POST',
      data: {
        appType: 'DEALER_MINIAPP',
        phone,
        verificationCode,
        wxCode,
      },
    });
  },
  bindWechatOpenid(wxCode) {
    return request({
      url: '/auth/miniapp/wechat-openid',
      method: 'POST',
      data: {
        appType: 'DEALER_MINIAPP',
        wxCode,
      },
    });
  },
  me(options = {}) {
    return request({ url: '/auth/me', ...options });
  },
  verificationStatus(options = {}) {
    return request({ url: '/dealer/verification/status', ...options });
  },
  verificationDetail() {
    return request({ url: '/dealer/verification' });
  },
  submitVerification(data) {
    return request({ url: '/dealer/verification', method: 'POST', data });
  },
  regions(parentId, level) {
    const params = {};
    if (parentId) params.parentId = parentId;
    if (level) params.level = level;
    const query = toQuery(params);
    return request({ url: `/regions${query ? `?${query}` : ''}` });
  },
  vehicleBrands() {
    return request({ url: '/vehicle/brands' });
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
  revealCarrierPhone(data) {
    return request({ url: '/dealer/contact/carrier-phone', method: 'POST', data });
  },
  platformGuaranteeService() {
    return request({ url: '/dealer/value-added-services/platform-guarantee' });
  },
  createOrder(data) {
    return request({ url: '/orders', method: 'POST', data });
  },
  updateOrder(orderId, data) {
    return request({ url: `/orders/${orderId}`, method: 'PUT', data });
  },
  async createGuaranteePayment(orderId) {
    // #ifdef H5
    await request({ url: `/orders/${orderId}/dev-mark-guarantee-paid`, method: 'POST' });
    return {
      paymentId: '',
      paymentParams: {
        provider: 'DEV_H5',
        mock: true,
      },
      h5MockPaid: true,
    };
    // #endif
    // #ifndef H5
    return request({ url: `/orders/${orderId}/guarantee-payment`, method: 'POST' });
    // #endif
  },
  payment(paymentId) {
    return request({ url: `/payments/${paymentId}` });
  },
  syncWechatPayment(paymentId) {
    if (!paymentId) {
      return Promise.resolve({ synced: false, mock: true });
    }
    return request({ url: `/payments/${paymentId}/wechat-sync`, method: 'POST' });
  },
  orders(params = {}, options = {}) {
    const query = toQuery(params);
    return request({ url: `/orders${query ? `?${query}` : ''}`, ...options });
  },
  orderDetail(orderId) {
    return request({ url: `/orders/${orderId}` });
  },
  confirmReceipt(orderId) {
    return request({ url: `/orders/${orderId}/receipt-confirm`, method: 'POST' });
  },
  contract(orderId) {
    return request({ url: `/orders/${orderId}/contract` });
  },
  confirmContract(orderId) {
    return request({ url: `/orders/${orderId}/contract/confirm`, method: 'POST' });
  },
  cancelOrder(orderId, cancelReason) {
    return request({
      url: `/orders/${orderId}/cancel-requests`,
      method: 'POST',
      data: { cancelReason },
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
    return request({ url: `/orders/${orderId}/compensation-claims`, method: 'POST', data });
  },
  compensationClaim(claimId) {
    return request({ url: `/compensation-claims/${claimId}` });
  },
  requestCompensationPlatformIntervention(claimId, reason) {
    return request({
      url: `/compensation-claims/${claimId}/platform-intervention`,
      method: 'POST',
      data: { reason },
    });
  },
  notificationSettings() {
    return request({ url: '/account/notification-settings' });
  },
  updateNotificationSetting(data) {
    return request({ url: '/account/notification-settings', method: 'PUT', data });
  },
};

export function miniappLoginCode() {
  // #ifdef MP-WEIXIN
  return new Promise((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success(res) {
        if (res.code) {
          resolve(res.code);
          return;
        }
        reject(new Error('微信登录未返回 code'));
      },
      fail: reject,
    });
  });
  // #endif
  // #ifndef MP-WEIXIN
  return Promise.resolve('');
  // #endif
}

export function requestWechatPayment(paymentParams) {
  if (paymentParams?.mock || paymentParams?.provider === 'DEV_H5') {
    return Promise.resolve({ mock: true });
  }
  // #ifdef MP-WEIXIN
  return new Promise((resolve, reject) => {
    uni.requestPayment({
      provider: 'wxpay',
      timeStamp: paymentParams.timeStamp,
      nonceStr: paymentParams.nonceStr,
      package: paymentParams.package,
      signType: paymentParams.signType || 'MD5',
      paySign: paymentParams.paySign,
      success: resolve,
      fail: reject,
    });
  });
  // #endif
  // #ifndef MP-WEIXIN
  return Promise.resolve({ mock: true });
  // #endif
}

export function toQuery(params) {
  return Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
}

export function decodeQueryValue(value) {
  if (typeof value !== 'string') return value;
  try {
    return decodeURIComponent(value);
  } catch (error) {
    return value;
  }
}

export function decodeQuery(options = {}) {
  const query = {};
  Object.keys(options).forEach((key) => {
    query[key] = decodeQueryValue(options[key]);
  });
  return query;
}
