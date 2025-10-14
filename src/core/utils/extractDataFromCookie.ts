import { _AUTH_COOKIE_NAME_ } from "@/constants";
import { iCookieData, UserRequest, ISuperAdminCookieData } from "@/definitions";
import { NotAcceptableException, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import { SUPERADMIN_AUTH_COOKIE } from "@/constants";

export function getUserCookieData(userEmail: string, req: UserRequest) {
  const cookieData: string = req.cookies[_AUTH_COOKIE_NAME_];
  if (!cookieData) return null;

  const { user } = JSON.parse(
    decodeURIComponent(cookieData)
  ) as unknown as iCookieData;
  if (!user) return null;

  return user.email == userEmail ? user : null;
}

export function extractSuperAdminFromCookie(request: Request): ISuperAdminCookieData {
  const cookieData: string = request.cookies[SUPERADMIN_AUTH_COOKIE];

  if (!cookieData) throw new UnauthorizedException("SuperAdmin unauthenticated");
  const { token, superadmin } = JSON.parse(
    decodeURIComponent(cookieData)
  ) as ISuperAdminCookieData;

  if (!token) throw new NotAcceptableException("SuperAdmin not logged in!");
  if (!superadmin)
    throw new NotAcceptableException("No superadmin account found!");

  return { token, superadmin };
}

export function extractDataFromCookie(request: Request): iCookieData {
  const cookieData: string = request.cookies[_AUTH_COOKIE_NAME_];

  if (!cookieData) throw new UnauthorizedException("You are unauthenticated");
  const { token, user } = JSON.parse(
    decodeURIComponent(cookieData)
  ) as unknown as iCookieData;

  if (!token) throw new NotAcceptableException("You are not logged in!");
  if (!user)
    throw new NotAcceptableException(
      "No user account is associated with this user!"
    );

  return { token, user };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractUserForCookie(user: any) {
  return {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      user_type: user.user_type,
      phone: user.phone,
      id_type: user.id_type,
      id_number: user.id_number,
      id_image: user.id_image,
      address: user.address,
      landmark: user.landmark,
      city: user.city,
      state: user.state,
      proof_of_address_image: user.proof_of_address_image,
      email_verified_at: user.email_verified_at,
      deleted_at: user.deleted_at,
      created_at: user.created_at,
      updated_at: user.updated_at,
  };
}
