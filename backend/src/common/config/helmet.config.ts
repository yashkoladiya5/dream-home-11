export function createHelmetConfig() {
  const isProd = process.env.NODE_ENV === 'production';
  const cdnDomain = process.env.CDN_DOMAIN || 'cdn.dreamhome11.com';

  return {
    contentSecurityPolicy: isProd
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
              "'self'",
              `https://${cdnDomain}`,
              'https://cdnjs.cloudflare.com',
            ],
            styleSrc: [
              "'self'",
              `https://${cdnDomain}`,
              'https://fonts.googleapis.com',
            ],
            imgSrc: [
              "'self'",
              'data:',
              'https:',
              'blob:',
              `https://${cdnDomain}`,
            ],
            connectSrc: [
              "'self'",
              'https://api.dreamhome11.com',
              'https://sentry.io',
            ],
            fontSrc: [
              "'self'",
              'https://fonts.gstatic.com',
              `https://${cdnDomain}`,
            ],
            objectSrc: ["'none'"],
            frameAncestors: ["'none'"],
            upgradeInsecureRequests: [],
            mediaSrc: ["'self'", `https://${cdnDomain}`],
          },
        }
      : false,
    crossOriginEmbedderPolicy: { policy: 'require-corp' as const },
    crossOriginOpenerPolicy: { policy: 'same-origin' as const },
    crossOriginResourcePolicy: { policy: 'same-origin' as const },
    hsts: {
      maxAge: 63072000,
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' as const },
  };
}
