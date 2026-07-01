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

// Server-side OAuth client (holds the client secret). Used for the redirect
// flow: we build the consent URL and exchange the returned code ourselves.
function getClient(): OAuth2Client {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL } =
    appConfig;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_CALLBACK_URL)
    throw new ServiceUnavailableException(
      "Google sign-in is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_CALLBACK_URL."
    );
  return new OAuth2Client({
    clientId: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    redirectUri: GOOGLE_CALLBACK_URL,
  });
}

// Step 1 — the Google consent URL we redirect the user's browser to.
export function getGoogleAuthUrl(state: string): string {
  return getClient().generateAuthUrl({
    access_type: "online",
    scope: ["openid", "email", "profile"],
    prompt: "select_account",
    state,
  });
}

// Step 2 — exchange the authorization code for the user's verified profile.
export async function exchangeGoogleCode(code: string): Promise<GoogleProfile> {
  const client = getClient();

  let idToken: string | undefined;
  try {
    const { tokens } = await client.getToken(code);
    idToken = tokens.id_token ?? undefined;
  } catch {
    throw new UnauthorizedException(
      "Could not exchange Google authorization code."
    );
  }
  if (!idToken)
    throw new UnauthorizedException("Google did not return an ID token.");

  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: appConfig.GOOGLE_CLIENT_ID as string,
    });
    payload = ticket.getPayload();
  } catch {
    throw new UnauthorizedException("Invalid Google ID token.");
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
