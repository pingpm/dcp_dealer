"use strict";
const reviewStatusText = {
  UNVERIFIED: "未认证",
  PENDING: "待审核",
  APPROVED: "审核通过",
  REJECTED: "审核驳回"
};
const orderStatusText = {
  PENDING_PAYMENT: "待支付",
  PENDING_CONFIRM: "待承运商确认",
  PENDING_PICKUP: "待提车",
  IN_TRANSIT: "运输中",
  PENDING_RECEIPT: "待确认收车",
  CANCEL_PENDING: "取消中",
  COMPLETED: "已完成",
  CANCELED: "已取消"
};
const transportModeText = {
  LARGE_TRUCK: "大板",
  SMALL_TRUCK: "小板",
  DRIVING: "代驾"
};
const vehicleConditionText = {
  NEW: "新车",
  USED: "二手车"
};
const orderLogActionText = {
  CREATE: "订单提交创建",
  CREATE_ORDER: "订单提交创建",
  UPDATE_ORDER: "车商修改订单",
  GUARANTEE_PAID: "担保交易服务费已支付",
  CARRIER_CONFIRM: "承运商确认订单",
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
  WITHDRAW: "撤销取消申请",
  CANCEL_HANDLE: "取消申请已处理",
  CANCEL_APPROVED: "同意取消申请",
  CANCEL_REJECTED: "拒绝取消申请",
  FORCE_CANCEL: "系统强制取消",
  ADMIN_FORCE_CANCEL: "系统强制取消",
  STATUS_CHANGE: "订单状态变更"
};
function formatOrderLogAction(value) {
  if (!value)
    return "";
  const key = String(value).toUpperCase();
  return orderLogActionText[key] || value;
}
function yuanText(cent) {
  const value = Number(cent || 0);
  return `${(value / 100).toFixed(2)}元`;
}
function yuanToCent(value) {
  const text = String(value || "").trim();
  if (!/^\d+(\.\d{1,2})?$/.test(text)) {
    return null;
  }
  const [yuan, decimal = ""] = text.split(".");
  return Number(`${yuan}${decimal.padEnd(2, "0")}`);
}
function dateText(value) {
  if (!value)
    return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime()))
    return "-";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
function pad(value) {
  return String(value).padStart(2, "0");
}
function statusClass(status) {
  if (["APPROVED", "SUCCESS", "COMPLETED"].includes(status))
    return "status-success";
  if (["REJECTED", "CANCELED", "CANCEL_PENDING", "FAILED"].includes(status))
    return "status-danger";
  if (["PENDING_PICKUP", "IN_TRANSIT", "REFUNDED"].includes(status))
    return "status-info";
  return "status-warning";
}
exports.dateText = dateText;
exports.formatOrderLogAction = formatOrderLogAction;
exports.orderStatusText = orderStatusText;
exports.reviewStatusText = reviewStatusText;
exports.statusClass = statusClass;
exports.transportModeText = transportModeText;
exports.vehicleConditionText = vehicleConditionText;
exports.yuanText = yuanText;
exports.yuanToCent = yuanToCent;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/format.js.map
