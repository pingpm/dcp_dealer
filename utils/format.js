export const reviewStatusText = {
  UNVERIFIED: '未认证',
  PENDING: '待审核',
  APPROVED: '审核通过',
  REJECTED: '审核驳回',
};

export const orderStatusText = {
  PENDING_PAYMENT: '待支付',
  PENDING_CONFIRM: '待承运商确认',
  PENDING_CONTRACT: '待确认合同',
  PENDING_PICKUP: '待提车',
  IN_TRANSIT: '运输中',
  PENDING_RECEIPT: '待确认收车',
  CANCEL_PENDING: '取消中',
  COMPLETED: '已完成',
  CANCELED: '已取消',
};

export const paymentStatusText = {
  PENDING: '待支付',
  SUCCESS: '支付成功',
  FAILED: '支付失败',
  CLOSED: '已关闭',
  REFUNDED: '已退款',
};

export const transportModeText = {
  LARGE_TRUCK: '大板',
  SMALL_TRUCK: '小板',
};

export const vehicleConditionText = {
  NEW: '新车',
  USED: '二手车',
};

export const notificationSceneText = {
  ORDER_SUBMITTED: '订单待确认',
  ORDER_MODIFIED: '待确认订单已修改',
  CONTRACT_PENDING: '待确认模拟合同',
  DELIVERY_COMPLETED: '待确认收车',
  CANCEL_REQUESTED: '取消申请待处理',
  CANCEL_WITHDRAWN: '取消申请已撤销',
  CANCEL_HANDLED: '取消申请已处理',
  ADMIN_FORCE_CANCELED: '后台强制取消',
  DEPOSIT_BELOW_MINIMUM: '保证金不足',
  INFO_FEE_INSUFFICIENT: '信息费不足',
  WALLET_RECHARGE_SUCCESS: '充值成功',
  ADMIN_WALLET_ADJUSTED: '后台调账',
  VERIFICATION_APPROVED: '认证审核通过',
  VERIFICATION_REJECTED: '认证审核驳回',
};

export const notificationChannelText = {
  SMS: '短信',
  WECHAT_MINI_PROGRAM: '小程序',
};

export function yuanText(cent) {
  const value = Number(cent || 0);
  return `${(value / 100).toFixed(2)}元`;
}

export function yuanToCent(value) {
  const text = String(value || '').trim();
  if (!/^\d+(\.\d{1,2})?$/.test(text)) {
    return null;
  }
  const [yuan, decimal = ''] = text.split('.');
  return Number(`${yuan}${decimal.padEnd(2, '0')}`);
}

export function dateText(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function pad(value) {
  return String(value).padStart(2, '0');
}

export function statusClass(status) {
  if (['APPROVED', 'SUCCESS', 'COMPLETED'].includes(status)) return 'status-success';
  if (['REJECTED', 'CANCELED', 'CANCEL_PENDING', 'FAILED'].includes(status)) return 'status-danger';
  if (['PENDING_PICKUP', 'IN_TRANSIT', 'REFUNDED'].includes(status)) return 'status-info';
  return 'status-warning';
}

export function safeText(value, fallback = '-') {
  return value === undefined || value === null || value === '' ? fallback : value;
}
