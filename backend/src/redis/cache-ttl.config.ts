export const CACHE_TTL = {
  CONTEST_LIST: 30,
  CONTEST_DETAIL: 15,
  LEADERBOARD: 10,
  USER_PROFILE: 60,
  REWARDS_CATALOG: 120,
  WINNERS_LIST: 300,
  DASHBOARD: 30,
  REFERRAL_DATA: 60,
  FEED_POSTS: 30,
  WALLET_BALANCE: 5,
  CONTEST_RANKINGS: 10,
  KYC_STATUS: 60,
} as const;

export type CacheTtlKey = keyof typeof CACHE_TTL;

export const CACHE_KEY_PREFIXES = {
  RESPONSE: 'cache:response',
  LEADERBOARD: 'leaderboard',
  USER: 'user',
  CONTEST: 'contest',
  BANNER: 'banner',
} as const;
