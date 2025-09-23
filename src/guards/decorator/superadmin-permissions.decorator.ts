import { SuperAdminPermission } from "@/definitions";
import { SetMetadata } from "@nestjs/common";

export const SUPER_PERMISSIONS_KEY = 'permissions';
export const Super_Permissions = (...permissions: SuperAdminPermission[]) => SetMetadata(SUPER_PERMISSIONS_KEY, permissions);