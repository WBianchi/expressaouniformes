"use client";
import { useActionState } from "react";
import { Loader2, LockKeyhole } from "lucide-react";
import { login, type LoginState } from "@/app/admin/actions";
import s from "./AdminLogin.module.css";

export function AdminLogin({ configured }: { configured: boolean }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <main className={s.page}>
      <form className={s.card} action={action}>
        <span className={s.icon} aria-hidden>
          <LockKeyhole size={24} />
        </span>
        <h1>Painel da fábrica</h1>
        <p>Acesso restrito à equipe Expressão Uniformes.</p>
        {configured ? (
          <>
            <label htmlFor="admin-pass" className="sr-only">
              Senha
            </label>
            <input id="admin-pass" name="password" type="password" className="input" placeholder="Senha do painel" autoComplete="current-password" required autoFocus />
            {state.error && (
              <span className={s.error} role="alert">
                {state.error}
              </span>
            )}
            <button className="btn btn-primary btn-lg btn-block" disabled={pending}>
              {pending ? <Loader2 size={18} className={s.spin} /> : "Entrar"}
            </button>
          </>
        ) : (
          <p className={s.error}>Defina a variável ADMIN_PASSWORD no servidor para liberar o painel.</p>
        )}
      </form>
    </main>
  );
}
