import "dotenv/config";

export const dbConfig = {
  DB_HOST: process.env.DB_HOST || "localhost",
  DB_PORT: process.env.DB_PORT || "5432",
  DB_USERNAME: "postgres",
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME,
  DB_URL: process.env.DB_URL,
};

export const appConfig = {
  APP_NAME: process.env.APP_NAME ? process.env.APP_NAME : "",
  APP_FRONTEND: process.env.APP_FRONTEND ? process.env.APP_FRONTEND : "",
  APP_URL: process.env.APP_URL ? process.env.APP_URL : "",
  WEB_FRONTEND: process.env.WEB_FRONTEND,
  PORT: process.env.PORT || 8000,
  DEBUG: process.env.DEBUG,
  ENV: process.env.ENV || "dev",
  TZ: process.env.TZ || "Africa/Lagos",

  BCRYPT_SALT: process.env.BCRYPT_SALT,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
  JWT_SECRET: process.env.JWT_SECRET,
  COOKIE_SECRET: process.env.COOKIE_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  FILE_UPLOAD_PATH: process.env.FILE_UPLOAD_PATH,

  // MAIL_HOST: process.env.MAIL_HOST || "",
  MAIL_PORT: process.env.MAIL_PORT || "",
  MAIL_USER: process.env.MAIL_USER || "",
  MAIL_PASS: process.env.MAIL_PASS || "",
  MAIL_EMAIL: process.env.MAIL_EMAIL || "",

  CLOUDINARYNAME: process.env.CLOUDINARYNAME,
  CLOUDINARYAPIKEY: process.env.CLOUDINARYAPIKEY,
  CLOUDINARYAPISECRET: process.env.CLOUDINARYAPISECRET,

  SWAGGER_PASSWORD: process.env.SWAGGER_PASSWORD
    ? process.env.SWAGGER_PASSWORD
    : "secret",

  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_PORT: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  OTP_TIMEOUT: 15,
};
