export function createWebSocketCorsConfig() {
  const isProd = process.env.NODE_ENV === 'production';
  const envOrigins = process.env.CORS_ORIGINS;
  const defaultOrigins = [
    'https://dreamhome11.com',
    'https://www.dreamhome11.com',
    'https://admin.dreamhome11.com',
    'https://api.dreamhome11.com',
  ];
  const allowedOrigins = envOrigins
    ? envOrigins.split(',').map((o) => o.trim())
    : defaultOrigins;

  return {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!isProd || !origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  };
}
