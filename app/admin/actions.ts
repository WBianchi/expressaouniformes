"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { checkPassword, endSession, startSession } from "@/lib/admin-auth";

// limite simples de tentativas por IP (por instância)
const attempts = new Map<string, number[]>();

export type LoginState = { error?: string };

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  const h = await headers();
  const ip = (h.get("x-vercel-forwarded-for") || h.get("x-forwarded-for") || "local").split(",")[0].trim();
  const now = Date.now();
  const list = (attempts.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  if (list.length >= 8) return { error: "Muitas tentativas. Aguarde alguns minutos." };

  const password = String(form.get("password") ?? "");
  if (!checkPassword(password)) {
    attempts.set(ip, [...list, now]);
    return { error: "Senha incorreta." };
  }
  attempts.delete(ip);
  await startSession();
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin");
}
