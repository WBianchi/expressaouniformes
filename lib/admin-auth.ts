// Sessão do painel administrativo: senha única (ADMIN_PASSWORD) e cookie assinado com HMAC.
import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "eu-admin";
const MAX_AGE = 12 * 60 * 60; // 12 h

export const adminConfigured = () => !!process.env.ADMIN_PASSWORD?.trim();

function secret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.AUTH_SECRET || `eu:${process.env.ADMIN_PASSWORD ?? ""}`;
}

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

function safeEqual(a: string, b: string) {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export const checkPassword = (input: string) => adminConfigured() && safeEqual(input, process.env.ADMIN_PASSWORD!.trim());

export function sessionToken(now = Date.now()) {
  const exp = String(Math.floor(now / 1000) + MAX_AGE);
  return `${exp}.${sign(exp)}`;
}

export function verifyToken(token: string | undefined, now = Date.now()) {
  if (!token || !adminConfigured()) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || !/^\d+$/.test(exp) || Number(exp) * 1000 < now) return false;
  return safeEqual(sig, sign(exp));
}

export async function isAdmin() {
  const jar = await cookies();
  return verifyToken(jar.get(ADMIN_COOKIE)?.value);
}

export async function startSession() {
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endSession() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
}
