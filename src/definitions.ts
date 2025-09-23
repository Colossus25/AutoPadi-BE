import type { Request } from "express";
import { User } from "./modules/auth/entities/user.entity";
import { SuperAdmin } from "./modules/superadmin/entities/super-admin.entity";

export type UserRequest = Request & { user: User };

export type SuperAdminRequest = Request & { user: SuperAdmin}

export type CloudinaryUpload = {
  asset_id: string;
  public_id: string;
  version: number;
  version_id: string;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  folder: string;
  original_filename: string;
  name?: string;
};

export enum SystemPreferenceFetcher {
  user = "user",
  company = "company",
}

export type iCookieData = {
  token: string;
  user: User;
};

export interface ISuperAdminCookieData {
  token: string
  superadmin: {
    id: number
    email: string
  }
}

export type CurrencyType = {
  symbol?: string;
  name: string;
  symbol_native: string;
  decimal_digits: number;
  rounding: number;
  code?: string;
  name_plural: string;
};

export enum PermissionValueType {
  // USERS
  CAN_CREATE_USERS = "CAN_CREATE_USERS",
  CAN_VIEW_ALL_USERS = "CAN_VIEW_ALL_USERS",
  CAN_VIEW_ONE_USER = "CAN_VIEW_ONE_USER",
  CAN_UPDATE_USERS = "CAN_UPDATE_USERS",
  CAN_DELETE_USERS = "CAN_DELETE_USERS",

  // ROLES
  CAN_CREATE_ROLES = "CAN_CREATE_ROLES",
  CAN_VIEW_ALL_ROLES = "CAN_VIEW_ALL_ROLES",
  CAN_VIEW_ONE_ROLE = "CAN_VIEW_ONE_ROLE",
  CAN_UPDATE_ROLES = "CAN_UPDATE_ROLES",
  CAN_DELETE_ROLES = "CAN_DELETE_ROLES",

   // ORGANISATIONS
  CAN_VIEW_ORGANISATION = "CAN_VIEW_ORGANISATION",
  CAN_UPDATE_ORGANISATION = "CAN_UPDATE_ORGANISATION",

  // ADMIN FLAG
  IS_ADMIN = "IS_ADMIN",
}

export enum SuperAdminPermission {
  IS_SUPER_ADMIN = "IS_SUPER_ADMIN",
  CAN_ADD_USER = "CAN_ADD_USER",
  CAN_EDIT_USER = "CAN_EDIT_USER",
  CAN_DEACTIVATE_USER = "CAN_DEACTIVATE_USER",
  CAN_DELETE_USER = "CAN_DELETE_USER",
  CAN_ENABLE_USER = "CAN_ENABLE_USER",
  CAN_DISABLE_USER = "CAN_DISABLE_USER",
  CAN_SUSPEND_USER = "CAN_SUSPEND_USER",
  CAN_ARCHIVE_USER = "CAN_ARCHIVE_USER",
  CAN_VIEW_SESSIONS = "CAN_VIEW_SESSIONS",
  CAN_TERMINATE_SESSIONS = "CAN_TERMINATE_SESSION"
}

export enum SystemCache {
  "SYSTEM_USER_PREFERENCES" = "SYSTEM_USER_PREFERENCES",
  "SYSTEM_COMPANY_PREFERENCES" = "SYSTEM_COMPANY_PREFERENCES",
  "USER_PREFERENCES" = "USER_PREFERENCES",
  "COMPANY_PREFERENCES" = "COMPANY_PREFERENCES",
  USER_PERMISSIONS = "USER_PERMISSIONS",
  "DEFAULT_USER_PREFERENCES" = "DEFAULT_USER_PREFERENCES",
  "DEFAULT_COMPANY_PREFERENCES" = "DEFAULT_COMPANY_PREFERENCES",
  "COMPANY_ROLES" = "COMPANY_ROLES",
  "USER_ROLES" = "USER_ROLES",
  "ADMIN_PERMISSIONS" = "ADMIN_PERMISSIONS",
  "SYSTEM_UOM" = "SYSTEM_UOM",
}

export interface MailAttachment {
  ContentType: string | false;
  Filename: string;
  Base64Content: string;
}

export interface MailDataType {
  subject: string;
  attachments?: string[];
  html?: string;
  templateId?: number;
  variables?: object;
}

export interface MailerOptions {
  to: {
    name: string;
    email: string;
  };
  from?: {
    email: string;
    name: string;
  };
}
