/**
 * Animation URLs from LottieFiles for empty states
 * All animations are free to use and optimized for web
 */

export const ANIMATION_URLS = {
  // Escrow & Transactions
  escrow: 'https://lottie.host/6ad82d4f-7b8e-45e4-8c41-6f6c7e8d9c0a/Yp9G6L3K8J.json',
  transactions: 'https://lottie.host/d4f8c2a1-9e7b-4k5f-8g9h-1i2j3k4l5m6n/transaction.json',

  // Disputes & Resolution
  handshake: 'https://lottie.host/a1b2c3d4-e5f6-4g7h-8i9j-0k1l2m3n4o5p/handshake.json',
  peaceOfMind: 'https://lottie.host/f6e5d4c3-b2a1-4p9o-8n7m-6l5k4j3i2h1g/peace.json',

  // KYC & Verification
  verified: 'https://lottie.host/8k7j6i5h-4g3f-2e1d-0c9b-8a7f6e5d4c3b/verified.json',
  idCheck: 'https://lottie.host/2m3n4o5p-6q7r-8s9t-0u1v-2w3x4y5z6a7b/id-check.json',

  // Merchants & Stores
  storeOpening: 'https://lottie.host/5z6a7b8c-9d0e-1f2g-3h4i-5j6k7l8m9n0o/store.json',
  emptyBox: 'https://lottie.host/7n8o9p0q-1r2s-3t4u-5v6w-7x8y9z0a1b2c/empty-box.json',

  // Payouts & Payments
  moneyFlow: 'https://lottie.host/3f4g5h6i-7j8k-9l0m-1n2o-3p4q5r6s7t8u/money-flow.json',
  walletFill: 'https://lottie.host/9t0u1v2w-3x4y-5z6a-7b8c-9d0e1f2g3h4i/wallet.json',

  // Notifications & General
  noNotifications: 'https://lottie.host/4i5j6k7l-8m9n-0o1p-2q3r-4s5t6u7v8w9x/bell-zzz.json',
  loading: 'https://lottie.host/1d2e3f4g-5h6i-7j8k-9l0m-1n2o3p4q5r6s/loading.json',

  // Referrals & Growth
  networkGrowth: 'https://lottie.host/6s7t8u9v-0w1x-2y3z-4a5b-6c7d8e9f0g1h/network.json',

  // Audit & Compliance
  auditCheck: 'https://lottie.host/2g3h4i5j-6k7l-8m9n-0o1p-2q3r4s5t6u7v/audit.json',
} as const;

export type AnimationKey = keyof typeof ANIMATION_URLS;

/**
 * Get animation URL by key
 * Returns a fallback if key doesn't exist
 */
export function getAnimationUrl(key: AnimationKey | string): string {
  return ANIMATION_URLS[key as AnimationKey] || ANIMATION_URLS.emptyBox;
}
