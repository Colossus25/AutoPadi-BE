import { Request, Response } from 'express';

/**
 * Lightweight flash-message plumbing for admin view controllers.
 *
 * Messages survive a redirect via short-lived query string
 * (`?flash=…&kind=…`) — avoids needing session middleware. The view's flash
 * partial reads them and they disappear on the next navigation.
 */

export type FlashKind = 'success' | 'error';

export function redirectWithFlash(
  res: Response,
  path: string,
  kind: FlashKind,
  message: string,
) {
  const qs = new URLSearchParams({ flash: message, kind }).toString();
  return res.redirect(`${path}?${qs}`);
}

export function extractFlash(req: Request): { kind: FlashKind; message: string } | null {
  const message = (req.query.flash as string | undefined)?.trim();
  if (!message) return null;
  const kindRaw = req.query.kind;
  const kind: FlashKind = kindRaw === 'error' ? 'error' : 'success';
  return { kind, message };
}

/**
 * Best-effort error message extraction. Nest's HttpExceptions wrap the real
 * message under `.response.message` (sometimes an array from class-validator).
 */
export function errorMessage(e: unknown): string {
  const obj = e as { response?: { message?: string | string[] }; message?: string };
  const msg = obj?.response?.message ?? obj?.message;
  return Array.isArray(msg) ? msg.join(', ') : msg ?? 'Something went wrong.';
}
