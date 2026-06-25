import { api, getSession, requireLogin } from './api.js';

export async function ensureDealerReady() {
  if (!requireLogin()) return false;
  try {
    const status = await api.verificationStatus();
    const session = getSession() || {};
    const dealerVerificationRequired =
      status.dealerVerificationRequired !== undefined
        ? status.dealerVerificationRequired !== false
        : session.dealerVerificationRequired !== false;
    if (dealerVerificationRequired && status.reviewStatus !== 'APPROVED') {
      uni.redirectTo({ url: '/pages/verification/status' });
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
}

export function goAfterLogin(loginData) {
  if (loginData?.needVerificationPrompt) {
    uni.setStorageSync('dealer_need_verification_prompt', '1');
  }
  uni.reLaunch({ url: '/pages/home/index' });
}

export function currentProfile() {
  return getSession()?.profile || {};
}
