import { afterEach, describe, expect, it, vi } from 'vitest';
import { returnToOrderDetail } from './order-edit-navigation.js';

function mockPages(pages) {
  globalThis.getCurrentPages = vi.fn(() => pages);
}

describe('order edit navigation', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete globalThis.getCurrentPages;
  });

  it('returns to the existing order detail page and marks it for refresh', () => {
    const detailVm = {};
    const uniApi = {
      navigateBack: vi.fn(),
      redirectTo: vi.fn(),
    };

    mockPages([
      { route: 'pages/order/list' },
      { route: 'pages/order/detail', options: { orderId: '101' }, $vm: detailVm },
      { route: 'pages/order/edit', options: { orderId: '101' } },
    ]);

    returnToOrderDetail({ orderId: '101', shouldRefresh: true, uniApi });

    expect(detailVm.shouldRefreshOnShow).toBe(true);
    expect(uniApi.navigateBack).toHaveBeenCalledTimes(1);
    expect(uniApi.redirectTo).not.toHaveBeenCalled();
  });

  it('redirects to detail when there is no matching previous detail page', () => {
    const uniApi = {
      navigateBack: vi.fn(),
      redirectTo: vi.fn(),
    };

    mockPages([{ route: 'pages/order/list' }, { route: 'pages/order/edit', options: { orderId: '101' } }]);

    returnToOrderDetail({ orderId: '101', shouldRefresh: true, uniApi });

    expect(uniApi.navigateBack).not.toHaveBeenCalled();
    expect(uniApi.redirectTo).toHaveBeenCalledWith({
      url: '/pages/order/detail?orderId=101',
    });
  });

  it('reports a clear error when no uni api is passed', () => {
    mockPages([
      { route: 'pages/order/list' },
      { route: 'pages/order/detail', options: { orderId: '101' }, $vm: {} },
      { route: 'pages/order/edit', options: { orderId: '101' } },
    ]);

    expect(() => returnToOrderDetail({ orderId: '101' })).toThrow(
      'returnToOrderDetail requires uniApi',
    );
  });
});
