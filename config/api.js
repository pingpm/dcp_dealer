// 车商端 API 地址配置。
// 发布微信小程序前，将 MINIAPP_API_BASE_URL 改为已配置到微信小程序后台的 HTTPS request 合法域名。
export const MINIAPP_API_BASE_URL = 'http://127.0.0.1:3001/api';

// H5 本地开发默认走 Vite 代理；静态构建预览可通过 VITE_H5_API_BASE_URL 指向后端。
const h5ApiBaseUrl =
  typeof __H5_API_BASE_URL__ === 'string' && __H5_API_BASE_URL__ ? __H5_API_BASE_URL__ : '/api';
export const H5_API_BASE_URL = h5ApiBaseUrl;
export const H5_API_PROXY_TARGET = 'http://127.0.0.1:3001';

let apiBaseUrl = MINIAPP_API_BASE_URL;

// #ifdef H5
apiBaseUrl = H5_API_BASE_URL;
// #endif

export const API_BASE_URL = apiBaseUrl;
