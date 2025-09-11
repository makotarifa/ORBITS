export const APP_CONSTANTS = {
  CORS: {
    DEFAULT_FRONTEND_URL: 'http://localhost:5173',
  },
  JWT: {
    SECRET_KEY: 'JWT_SECRET',
  },
  DATABASE: {
    DEFAULT_HOST: 'localhost',
    DEFAULT_PORT: 5432,
  },
} as const;