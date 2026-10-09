"use client";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Building2, Check, Eye, EyeOff, Loader2, Lock, Mail, MailCheck, User } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { readProfile, saveProfile, type Profile } from "@/components/account/storage";
import { FacebookIcon, GoogleIcon } from "./BrandIcons";
import s from "./Auth.module.css";

type Mode = "login" | "signup" | "forgot" | "sent";

const loginSchema = z.object({
  email: z.email("Informe um e-mail válido"),
  password: z.string().min(6, "A senha tem pelo menos 6 caracteres"),
});
const signupSchema = z.object({
  type: z.enum(["pf", "pj"]),
  name: z.string().trim().min(3, "Informe o nome completo"),
  company: z.string().optional(),
  email: z.email("Informe um e-mail válido"),
  password: z.string().min(8, "Use pelo menos 8 caracteres"),
  terms: z.boolean().refine((v) => v, "Aceite os termos para continuar"),
});
const forgotSchema = z.object({ email: z.email("Informe um e-mail válido") });

type Errors = Record<string, string | undefined>;
const issues = (e: z.ZodError): Errors => {
  const out: Errors = {};
  for (const i of e.issues) {
    const k = String(i.path[0]);
    if (!out[k]) out[k] = i.message;
  }
  return out;
};

export function passwordStrength(p: string) {
  let score = 0;
  if (p.length >= 8) score++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) score++;
  if (/\d/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  if (p.length >= 12 && score >= 3) score = 4;
  const labels = ["Muito fraca", "Fraca", "Razoável", "Boa", "Forte"];
  return { score, label: p ? labels[score] : "" };
}

function Field({
  id,
  label,
  icon,
  error,
  children,
  aside,
}: {
  id: string;
  label: string;
  icon: ReactNode;
  error?: string;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className={s.field} data-error={error ? "" : undefined}>
      <div className={s.labelRow}>
        <label htmlFor={id}>{label}</label>
        {aside}
      </div>
      <div className={s.inputWrap}>
        <span className={s.inputIcon} aria-hidden>
          {icon}
        </span>
        {children}
      </div>
      {error && (
        <span className={s.error} id={`${id}-err`} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

const nameFromEmail = (email: string) =>
  email
    .split("@")[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ") || "Cliente";

export function AuthCard() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [busy, setBusy] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [form, setForm] = useState({ email: "", password: "", name: "", company: "", type: "pf" as "pf" | "pj", remember: true, terms: false });
  const [sentTo, setSentTo] = useState("");

  useEffect(() => {
    const p = readProfile();
    if (p) setForm((f) => ({ ...f, email: p.email }));
  }, []);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };
  const switchMode = (m: Mode) => {
    setMode(m);
    setErrors({});
    setShowPass(false);
  };
  const strength = passwordStrength(form.password);

  const social = (provider: string) =>
    toast.info(`Login com ${provider} em breve`, {
      description: "O acesso social será ativado na integração de autenticação. Por enquanto, use e-mail e senha no modo demonstração.",
    });

  const finish = (profile: Profile, message: string) => {
    if (!saveProfile(profile)) {
      toast.error("Não foi possível salvar a sessão neste navegador.");
      setBusy(false);
      return;
    }
    toast.success(message, { description: "Ambiente de demonstração — seus dados ficam apenas neste navegador." });
    router.push("/conta");
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (mode === "login") {
      const r = loginSchema.safeParse(form);
      if (!r.success) return setErrors(issues(r.error));
      setBusy(true);
      await new Promise((ok) => setTimeout(ok, 650));
      const prev = readProfile();
      const same = prev && prev.email.toLowerCase() === form.email.toLowerCase();
      finish(
        same ? prev : { name: nameFromEmail(form.email), email: form.email, type: "pf", createdAt: new Date().toISOString(), demo: true },
        `Olá, ${(same ? prev.name : nameFromEmail(form.email)).split(" ")[0]}!`,
      );
    } else if (mode === "signup") {
      const r = signupSchema.safeParse(form);
      if (!r.success) return setErrors(issues(r.error));
      setBusy(true);
      await new Promise((ok) => setTimeout(ok, 750));
      finish(
        {
          name: form.name.trim(),
          email: form.email,
          type: form.type,
          company: form.type === "pj" ? form.company.trim() || undefined : undefined,
          createdAt: new Date().toISOString(),
          demo: true,
        },
        "Conta criada!",
      );
    } else if (mode === "forgot") {
      const r = forgotSchema.safeParse(form);
      if (!r.success) return setErrors(issues(r.error));
      setBusy(true);
      await new Promise((ok) => setTimeout(ok, 700));
      setBusy(false);
      setSentTo(form.email);
      switchMode("sent");
    }
  };

  const tabIndex = mode === "signup" ? 1 : 0;

  if (mode === "forgot" || mode === "sent") {
    return (
      <div className={s.card} key="forgot">
        <button type="button" className={s.back} onClick={() => switchMode("login")}>
          <ArrowLeft size={16} /> Voltar para o login
        </button>
        {mode === "forgot" ? (
          <form className={s.form} onSubmit={submit} noValidate>
            <div className={s.head}>
              <h1>Recuperar senha</h1>
              <p>Informe o e-mail da sua conta. Enviaremos um link para você criar uma nova senha.</p>
            </div>
            <Field id="f-email" label="E-mail" icon={<Mail size={18} />} error={errors.email}>
              <input
                id="f-email"
                type="email"
                className="input"
                autoComplete="email"
                autoFocus
                value={form.email}
                onChange={(e) => set("email", e.target.value.trim())}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "f-email-err" : undefined}
              />
            </Field>
            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={busy}>
              {busy ? <Loader2 size={18} className={s.spin} /> : null} Enviar link de recuperação
            </button>
          </form>
        ) : (
          <div className={`${s.form} ${s.sent}`} role="status">
            <span className={s.sentIcon}>
              <MailCheck size={30} strokeWidth={1.75} />
            </span>
            <div className={s.head}>
              <h1>Confira seu e-mail</h1>
              <p>
                Se houver uma conta para <b>{sentTo}</b>, você receberá um link para redefinir a senha nos próximos minutos.
              </p>
            </div>
            <button type="button" className="btn btn-primary btn-lg btn-block" onClick={() => switchMode("login")}>
              Voltar para o login
            </button>
            <button type="button" className={s.link} onClick={() => switchMode("forgot")}>
              Não recebeu? Enviar novamente
            </button>
          </div>
        )}
        <p className={s.demo}>Demonstração: nenhum e-mail é enviado até a integração de autenticação.</p>
      </div>
    );
  }

  return (
    <div className={s.card} key="auth">
      <div className={s.tabs} role="tablist" aria-label="Acesso" style={{ "--tab": tabIndex } as React.CSSProperties}>
        <span className={s.tabPill} aria-hidden />
        <button type="button" role="tab" id="tab-login" aria-selected={mode === "login"} aria-controls="auth-panel" onClick={() => switchMode("login")}>
          Entrar
        </button>
        <button type="button" role="tab" id="tab-signup" aria-selected={mode === "signup"} aria-controls="auth-panel" onClick={() => switchMode("signup")}>
          Criar conta
        </button>
      </div>

      <div id="auth-panel" role="tabpanel" aria-labelledby={mode === "login" ? "tab-login" : "tab-signup"} className={s.panel} key={mode}>
        <div className={s.head}>
          <h1>{mode === "login" ? "Bem-vindo de volta" : "Crie sua conta"}</h1>
          <p>{mode === "login" ? "Acompanhe pedidos, aprove layouts e repita compras com poucos cliques." : "Leva menos de um minuto. Para empresas e pessoas físicas."}</p>
        </div>

        <div className={s.social}>
          <button type="button" className={s.socialBtn} onClick={() => social("Google")}>
            <GoogleIcon /> Continuar com Google
          </button>
          <button type="button" className={s.socialBtn} onClick={() => social("Facebook")}>
            <FacebookIcon /> Continuar com Facebook
          </button>
        </div>

        <div className={s.divider}>
          <span>ou</span>
        </div>

        <form className={s.form} onSubmit={submit} noValidate>
          {mode === "signup" && (
            <>
              <div className={s.segment} role="radiogroup" aria-label="Tipo de cadastro">
                {(
                  [
                    ["pf", "Pessoa física", User],
                    ["pj", "Empresa (PJ)", Building2],
                  ] as const
                ).map(([v, label, Icon]) => (
                  <button key={v} type="button" role="radio" aria-checked={form.type === v} data-active={form.type === v || undefined} onClick={() => set("type", v)}>
                    <Icon size={16} /> {label}
                  </button>
                ))}
              </div>
              <Field id="s-name" label={form.type === "pj" ? "Nome do responsável" : "Nome completo"} icon={<User size={18} />} error={errors.name}>
                <input id="s-name" className="input" autoComplete="name" value={form.name} onChange={(e) => set("name", e.target.value)} aria-invalid={!!errors.name} aria-describedby={errors.name ? "s-name-err" : undefined} />
              </Field>
              {form.type === "pj" && (
                <Field id="s-company" label="Empresa (opcional)" icon={<Building2 size={18} />}>
                  <input id="s-company" className="input" autoComplete="organization" value={form.company} onChange={(e) => set("company", e.target.value)} />
                </Field>
              )}
            </>
          )}

          <Field id="a-email" label="E-mail" icon={<Mail size={18} />} error={errors.email}>
            <input
              id="a-email"
              type="email"
              className="input"
              autoComplete="email"
              placeholder="voce@empresa.com.br"
              value={form.email}
              onChange={(e) => set("email", e.target.value.trim())}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "a-email-err" : undefined}
            />
          </Field>

          <Field
            id="a-pass"
            label="Senha"
            icon={<Lock size={18} />}
            error={errors.password}
            aside={
              mode === "login" ? (
                <button type="button" className={s.link} onClick={() => switchMode("forgot")}>
                  Esqueci a senha
                </button>
              ) : undefined
            }
          >
            <input
              id="a-pass"
              type={showPass ? "text" : "password"}
              className={`input ${s.passInput}`}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              aria-invalid={!!errors.password}
              aria-describedby={[errors.password ? "a-pass-err" : "", mode === "signup" ? "a-pass-strength" : ""].filter(Boolean).join(" ") || undefined}
            />
            <button type="button" className={s.eye} onClick={() => setShowPass((v) => !v)} aria-label={showPass ? "Ocultar senha" : "Mostrar senha"} aria-pressed={showPass}>
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </Field>

          {mode === "signup" && (
            <div className={s.strength} data-score={strength.score} id="a-pass-strength" aria-live="polite">
              <div className={s.strengthBars} aria-hidden>
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} data-on={form.password && i < Math.max(1, strength.score) ? "" : undefined} />
                ))}
              </div>
              <span>{form.password ? `Força da senha: ${strength.label}` : "Use letras maiúsculas, números e símbolos."}</span>
            </div>
          )}

          {mode === "login" ? (
            <label className={s.check}>
              <input type="checkbox" checked={form.remember} onChange={(e) => set("remember", e.target.checked)} />
              <span className={s.box} aria-hidden>
                <Check size={12} strokeWidth={3.2} />
              </span>
              Lembrar-me
            </label>
          ) : (
            <div className={s.field}>
              <label className={s.check} data-error={errors.terms ? "" : undefined}>
                <input type="checkbox" checked={form.terms} onChange={(e) => set("terms", e.target.checked)} aria-invalid={!!errors.terms} aria-describedby={errors.terms ? "a-terms-err" : undefined} />
                <span className={s.box} aria-hidden>
                  <Check size={12} strokeWidth={3.2} />
                </span>
                <span>
                  Li e aceito os <Link href="/privacidade">termos de uso e a política de privacidade</Link>.
                </span>
              </label>
              {errors.terms && (
                <span className={s.error} id="a-terms-err" role="alert">
                  {errors.terms}
                </span>
              )}
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={busy}>
            {busy ? (
              <>
                <Loader2 size={18} className={s.spin} /> {mode === "login" ? "Entrando…" : "Criando conta…"}
              </>
            ) : (
              <>
                {mode === "login" ? "Entrar" : "Criar conta"} <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>

      <p className={s.demo}>
        Ambiente de demonstração: qualquer e-mail e senha válidos funcionam e os dados ficam apenas neste navegador até a integração
        da autenticação.
      </p>
    </div>
  );
}
