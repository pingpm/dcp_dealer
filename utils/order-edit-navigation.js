export function getOrderDetailPageRoute(orderId) {
  return `/pages/order/detail?orderId=${orderId}`;
}

function getPageRouteWithQuery(page) {
  const route = page?.route ? `/${page.route}` : '';
  const query = page?.options?.orderId || page?.options?.id || '';
  return { route, orderId: query ? String(query) : '' };
}

export function isSameOrderDetailPage(page, orderId) {
  const pageInfo = getPageRouteWithQuery(page);
  return pageInfo.route === '/pages/order/detail' && pageInfo.orderId === String(orderId || '');
}

export function returnToOrderDetail({ orderId, shouldRefresh = false, uniApi } = {}) {
  if (!uniApi) {
    throw new Error('returnToOrderDetail requires uniApi');
  }

  const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : [];
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
