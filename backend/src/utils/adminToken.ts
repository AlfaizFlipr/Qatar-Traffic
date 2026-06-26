import crypto from "crypto";
import { env } from "../config/env";

/**
 * Tiny self-contained signed-token helper (no JWT dependency).
 * Format: base64url(payloadJson).base64url(hmacSha256).
 */

interface TokenPayload {
  sub: string; // username
  exp: number; // epoch ms expiry
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function sign(data: string): string {
  return crypto
    .createHmac("sha256", env.admin.secret)
    .update(data)
    .digest("base64url");
}

export function signToken(username: string): string {
  const payload: TokenPayload = {
    sub: username,
    exp: Date.now() + env.admin.tokenTtlMs,
  };
  const body = b64url(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

export function verifyToken(token: string): TokenPayload | null {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = sign(body);
  // Constant-time comparison to avoid leaking signature info.
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (
    sigBuf.length !== expBuf.length ||
    !crypto.timingSafeEqual(sigBuf, expBuf)
  )
    return null;

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as TokenPayload;
    if (typeof payload.exp !== "number" || payload.exp < Date.now())
      return null;
    return payload;
  } catch {
    return null;
  }
}
