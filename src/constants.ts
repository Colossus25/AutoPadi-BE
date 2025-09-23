import type { CookieOptions as CookieOptionsType } from "express";

export const _IS_PROD_ = process.env.ENV === "production",
  _AUTH_COOKIE_NAME_ = "__8139a745d54__",
  _TTL_ = 1000 * 60 * 60 * 24 * 7,
  _THROTTLE_TTL_ = 60 * 5; //5mins

export const CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  maxAge: _TTL_,
} satisfies CookieOptionsType;

export const MAILJETTemplates = {
  verify_email_address: 7045933,
  reset_password_request: 6420775,
  password_request_success: 6420770,
  email_confirmation_success: 6420759,
};

export const SUPERADMIN_AUTH_COOKIE = 'SUPERADMIN_AUTH';
