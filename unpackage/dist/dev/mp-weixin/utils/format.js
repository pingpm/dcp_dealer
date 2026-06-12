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
  PENDING_CONTRACT: "待确认合同",
  PENDING_PICKUP: "待提车",
  IN_TRANSIT: "运输中",
  PENDING_RECEIPT: "待确认收车",
  CANCEL_PENDING: "取消中",
  COMPLETED: "已完成",
  CANCELED: "已取消"
};
const transportModeText = {
  LARGE_TRUCK: "大板",
  SMALL_TRUCK: "小板"
};
const vehicleConditionText = {
  NEW: "新车",
  USED: "二手车"
};
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
exports.orderStatusText = orderStatusText;
exports.reviewStatusText = reviewStatusText;
exports.statusClass = statusClass;
exports.transportModeText = transportModeText;
exports.vehicleConditionText = vehicleConditionText;
exports.yuanText = yuanText;
exports.yuanToCent = yuanToCent;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/format.js.map
