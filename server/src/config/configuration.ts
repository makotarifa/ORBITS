export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    name: process.env.DATABASE_NAME,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
  socket: {
    corsOrigin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:5173',
  },
  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL, 10) || 60000,
    limit: parseInt(process.env.RATE_LIMIT_LIMIT, 10) || 10,
  },
  game: {
    roomMaxPlayers: parseInt(process.env.GAME_ROOM_MAX_PLAYERS, 10) || 8,
    matchDuration: parseInt(process.env.GAME_MATCH_DURATION, 10) || 300000, // 5 minutes
    updateRate: parseInt(process.env.GAME_UPDATE_RATE, 10) || 60, // 60 FPS
  },
});