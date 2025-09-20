/**
 * env.js
 * - Centralized environment loader with strict checks.
 */
export function getEnv() {
  const env = {
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: process.env.PORT || "6700",
    MONGO_URI: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/easy_upkeep_ai",
    JWT_SECRET: process.env.JWT_SECRET || "dev_jwt_secret_change_me",
    COOKIE_SECRET: process.env.COOKIE_SECRET || "dev_cookie_secret_change_me",
    CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:6600",
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
    DAILY_TASK_LIMIT: Number(process.env.DAILY_TASK_LIMIT || "100"),
    APP_DOMAIN: process.env.APP_DOMAIN || "localhost"
  };
  return env;
}