const BASE_URL = __ENV.TARGET_URL || 'http://localhost:3000';
const ENVIRONMENT = __ENV.ENVIRONMENT || 'development';

export const BASE_URL_CONFIG = BASE_URL;
export const API_PREFIX = '/api/v1';
export const ENV = ENVIRONMENT;

export const STAGES = [
  { duration: '5s', target: 10 },
  { duration: '10s', target: 50 },
  { duration: '30s', target: 50 },
  { duration: '10s', target: 0 },
];

export const THRESHOLDS = {
  http_req_duration: ['p(95)<2000'],
  http_req_failed: ['rate<0.01'],
};

export const SHARED_OPTIONS = {
  stages: STAGES,
  thresholds: THRESHOLDS,
  tags: {
    project: 'dreamhome11',
    environment: ENVIRONMENT,
  },
};
