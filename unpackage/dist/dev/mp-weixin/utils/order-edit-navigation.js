"use strict";
function getOrderDetailPageRoute(orderId) {
  return `/pages/order/detail?orderId=${orderId}`;
}
function getPageRouteWithQuery(page) {
  var _a, _b;
  const route = (page == null ? void 0 : page.route) ? `/${page.route}` : "";
  const query = ((_a = page == null ? void 0 : page.options) == null ? void 0 : _a.orderId) || ((_b = page == null ? void 0 : page.options) == null ? void 0 : _b.id) || "";
  return { route, orderId: query ? String(query) : "" };
}
function isSameOrderDetailPage(page, orderId) {
  const pageInfo = getPageRouteWithQuery(page);
  return pageInfo.route === "/pages/order/detail" && pageInfo.orderId === String(orderId || "");
}
function returnToOrderDetail({ orderId, shouldRefresh = false, uniApi } = {}) {
  if (!uniApi) {
    throw new Error("returnToOrderDetail requires uniApi");
  }
  const pages = typeof getCurrentPages === "function" ? getCurrentPages() : [];
  const previousPage = pages[pages.length - 2];
  if (isSameOrderDetailPage(previousPage, orderId)) {
    if (shouldRefresh && previousPage) {
      previousPage.$vm = previousPage.$vm || {};
      previousPage.$vm.shouldRefreshOnShow = true;
    }
    uniApi.navigateBack();
    return;
  }
  uniApi.redirectTo({ url: getOrderDetailPageRoute(orderId) });
}
exports.returnToOrderDetail = returnToOrderDetail;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/order-edit-navigation.js.map
