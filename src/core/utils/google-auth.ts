import { appConfig } from "@/config";
import {
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { OAuth2Client } from "google-auth-library";

export interface GoogleProfile {
  email: string;
  email_verified: boolean;
  given_name?: string;
  family_name?: string;
  picture?: string;
  sub: string;
}

let client: OAuth2Client | null = null;

// All configured per-platform client IDs are accepted as valid audiences.
function getAudiences(): string[] {
  return [
    appConfig.GOOGLE_CLIENT_ID,
    appConfig.GOOGLE_IOS_CLIENT_ID,
    appConfig.GOOGLE_ANDROID_CLIENT_ID,
  ].filter(Boolean) as string[];
}

export async function verifyGoogleIdToken(
  idToken: string
): Promise<GoogleProfile> {
  const audience = getAudiences();
  if (!audience.length)
    throw new ServiceUnavailableException(
      "Google sign-in is not configured. Set GOOGLE_CLIENT_ID."
    );

  if (!client) client = new OAuth2Client();

  let payload;
  try {
    const ticket = await client.verifyIdToken({ idToken, audience });
    payload = ticket.getPayload();
  } catch {
    throw new UnauthorizedException("Invalid or expired Google token.");
  }

  if (!payload || !payload.email)
    throw new UnauthorizedException("Google token did not contain an email.");

  return {
    email: payload.email,
    email_verified: Boolean(payload.email_verified),
    given_name: payload.given_name,
    family_name: payload.family_name,
    picture: payload.picture,
    sub: payload.sub,
  };
}
