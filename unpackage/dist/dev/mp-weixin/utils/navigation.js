"use strict";
const common_vendor = require("../common/vendor.js");
const utils_api = require("./api.js");
async function ensureDealerReady() {
  if (!utils_api.requireLogin())
    return false;
  try {
    const status = await utils_api.api.verificationStatus();
    const session = utils_api.getSession() || {};
    const dealerVerificationRequired = status.dealerVerificationRequired !== void 0 ? status.dealerVerificationRequired !== false : session.dealerVerificationRequired !== false;
    if (dealerVerificationRequired && status.reviewStatus !== "APPROVED") {
      common_vendor.index.redirectTo({ url: "/pages/verification/status" });
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
}
function goAfterLogin(loginData) {
  if (loginData == null ? void 0 : loginData.needVerificationPrompt) {
    common_vendor.index.setStorageSync("dealer_need_verification_prompt", "1");
  }
  common_vendor.index.reLaunch({ url: "/pages/home/index" });
}
exports.ensureDealerReady = ensureDealerReady;
exports.goAfterLogin = goAfterLogin;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/navigation.js.map
