"use client";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ORDER_ID_RE } from "@/lib/orders";
import { updateStoredOrderStatus } from "@/components/checkout/orderStorage";
import { fetchOrderStatus } from "@/components/checkout/useOrderStatus";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  FileCheck2,
  Heart,
  LayoutDashboard,
  LogIn,
  LogOut,
  MapPin,
  Package,
  Plus,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { getProduct } from "@/lib/catalog";
import { addressSchema } from "@/lib/validation";
import { useStore } from "@/components/store/StoreProvider";
import { ProductCard } from "@/components/ui/ProductCard";
import { LayoutApproval } from "./LayoutApproval";
import { OrderCard, StatusChip, Timeline } from "./Orders";
import {
  clearProfile,
  orderStage,
  readAddresses,
  readOrders,
  readProfile,
  sampleOrder,
  saveAddresses,
  saveOrders,
  saveProfile,
  type Order,
  type Profile,
  type SavedAddress,
} from "./storage";
import s from "./Account.module.css";

const SECTIONS = [
  { id: "visao-geral", label: "Visão geral", icon: LayoutDashboard },
  { id: "pedidos", label: "Pedidos", icon: Package },
  { id: "layout", label: "Aprovação de layout", icon: FileCheck2 },
  { id: "enderecos", label: "Endereços", icon: MapPin },
  { id: "favoritos", label: "Favoritos", icon: Heart },
  { id: "dados", label: "Dados", icon: UserRound },
] as const;
type Section = (typeof SECTIONS)[number]["id"];

const profileSchema = z.object({
  name: z.string().trim().min(3, "Informe o nome completo"),
  email: z.email("E-mail inválido"),
  phone: z.string().refine((v) => !v || v.replace(/\D/g, "").length >= 10, "Telefone com DDD"),
  company: z.string().optional(),
});

const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};
const maskCep = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
};

const errorsOf = (e: z.ZodError) => {
  const out: Record<string, string> = {};
  for (const i of e.issues) {
    const k = String(i.path[0]);
    if (!out[k]) out[k] = i.message;
  }
  return out;
};

export default function AccountView() {
  const router = useRouter();
  const { favorites } = useStore();
  const [loaded, setLoaded] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [section, setSection] = useState<Section>("visao-geral");
  const [layoutOrder, setLayoutOrder] = useState<string | null>(null);

  useEffect(() => {
    setProfile(readProfile());
    const list = readOrders().sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    setOrders(list.length ? list : [sampleOrder()]);
    const h = window.location.hash.slice(1);
    if (SECTIONS.some((x) => x.id === h)) setSection(h as Section);
    setLoaded(true);
    // sincroniza com o Asaas o status de pagamento dos pedidos ainda em aberto
    const ctrl = new AbortController();
    const open = list.filter((o) => !o.sample && !(o as { demo?: boolean }).demo && o.payment?.status !== "pago" && ORDER_ID_RE.test(o.id)).slice(0, 10);
    Promise.all(open.map((o) => fetchOrderStatus(o.id, ctrl.signal).then((s) => [o.id, s] as const).catch(() => [o.id, null] as const))).then((res) => {
      const changed = res.filter(([, s]) => s);
      if (!changed.length) return;
      for (const [oid, s] of changed) updateStoredOrderStatus(oid, s!);
      setOrders(readOrders().sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")));
    });
    return () => ctrl.abort();
  }, []);

  const go = (id: Section) => {
    setSection(id);
    try {
      history.replaceState(null, "", `#${id}`);
    } catch {
      /* ignora */
    }
    document.getElementById("conta-conteudo")?.focus({ preventScroll: true });
    if (window.innerWidth < 900) document.getElementById("conta-conteudo")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const isSample = orders.length === 1 && orders[0].sample;
  const awaiting = orders.filter((o) => o.layout?.status === "enviado" || o.layout?.status === "ajuste");
  const layoutOrders = useMemo(() => orders.filter((o) => o.layout || orderStage(o) >= 0), [orders]);

  const updateLayout = (id: string, layout: NonNullable<Order["layout"]>) => {
    setOrders((list) => {
      const next = list.map((o) => {
        if (o.id !== id) return o;
        const updated: Order = { ...o, layout };
        if (layout.status === "aprovado" && orderStage(o) < 2 && !/produ|envi|entreg/i.test(o.status)) updated.status = "layout_aprovado";
        return updated;
      });
      // mantém no localStorage apenas pedidos reais (o exemplo não é gravado)
      if (!next.every((o) => o.sample) && !saveOrders(next)) toast.error("Não foi possível salvar a alteração neste navegador.");
      return next;
    });
  };

  const logout = () => {
    clearProfile();
    setProfile(null);
    toast("Você saiu da conta");
    router.push("/");
  };

  if (!loaded) {
    return (
      <div className={`container ${s.wrap}`}>
        <div className={s.layout}>
          <div className="skeleton" style={{ height: 320 }} />
          <div className="skeleton" style={{ height: 420 }} />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={`container ${s.wrap}`}>
        <div className={s.invite}>
          <span className={s.inviteImg} style={{ backgroundImage: "url(/images/sections/account-bg.webp)" }} aria-hidden />
          <span className={s.inviteIcon}>
            <UserRound size={30} strokeWidth={1.6} />
          </span>
          <h1>Entre para ver sua conta</h1>
          <p>Acompanhe pedidos, aprove o layout da sua logo e guarde seus endereços e favoritos em um só lugar.</p>
          <div className={s.inviteActions}>
            <Link href="/login" className="btn btn-primary btn-lg">
              <LogIn size={18} /> Entrar ou criar conta
            </Link>
            <Link href="/loja" className="btn btn-outline btn-lg">
              Explorar a loja
            </Link>
          </div>
          <p className={s.demoNote}>Ambiente de demonstração até a integração da autenticação.</p>
        </div>
      </div>
    );
  }

  const first = profile.name.split(" ")[0];
  const latest = orders[0];

  return (
    <div className={`container ${s.wrap}`}>
      <div className={s.top}>
        <span className={s.topImg} style={{ backgroundImage: "url(/images/sections/account-bg.webp)" }} aria-hidden />
        <div>
          <span className={s.eyebrow}>Minha conta</span>
          <h1>Olá, {first}</h1>
          <p>{awaiting.length ? `Você tem ${awaiting.length} layout${awaiting.length > 1 ? "s" : ""} aguardando aprovação.` : "Acompanhe pedidos, layouts e favoritos em um só lugar."}</p>
        </div>
        <span className={s.demoChip} title="Os dados ficam apenas neste navegador">
          Modo demonstração
        </span>
      </div>

      <div className={s.layout}>
        <nav className={s.nav} aria-label="Seções da conta">
          <div className={s.navUser}>
            <span className={s.avatar} aria-hidden>
              {profile.name
                .split(" ")
                .slice(0, 2)
                .map((w) => w[0])
                .join("")
                .toUpperCase()}
            </span>
            <div>
              <strong>{profile.name}</strong>
              <span>{profile.email}</span>
            </div>
          </div>
          <ul>
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <li key={id}>
                <button type="button" aria-current={section === id ? "page" : undefined} onClick={() => go(id)}>
                  <Icon size={18} strokeWidth={1.75} />
                  <span>{label}</span>
                  {id === "layout" && awaiting.length > 0 && <b className={s.badge}>{awaiting.length}</b>}
                  {id === "favoritos" && favorites.length > 0 && <b className={s.badgeSoft}>{favorites.length}</b>}
                </button>
              </li>
            ))}
            <li>
              <button type="button" className={s.logout} onClick={logout}>
                <LogOut size={18} strokeWidth={1.75} />
                <span>Sair</span>
              </button>
            </li>
          </ul>
        </nav>

        <section id="conta-conteudo" className={s.content} tabIndex={-1} aria-label={SECTIONS.find((x) => x.id === section)?.label}>
          <div key={section} className={s.sectionAnim}>
            {section === "visao-geral" && (
              <>
                <div className={s.stats}>
                  <button type="button" className={s.stat} onClick={() => go("pedidos")}>
                    <Package size={20} strokeWidth={1.75} />
                    <strong>{isSample ? 0 : orders.length}</strong>
                    <span>Pedidos</span>
                  </button>
                  <button type="button" className={s.stat} data-highlight={awaiting.length ? "" : undefined} onClick={() => go("layout")}>
                    <FileCheck2 size={20} strokeWidth={1.75} />
                    <strong>{awaiting.length}</strong>
                    <span>Layouts para aprovar</span>
                  </button>
                  <button type="button" className={s.stat} onClick={() => go("favoritos")}>
                    <Heart size={20} strokeWidth={1.75} />
                    <strong>{favorites.length}</strong>
                    <span>Favoritos</span>
                  </button>
                </div>

                {latest && (
                  <div className={s.card}>
                    <div className={s.cardHead}>
                      <div>
                        <h2>Último pedido</h2>
                        <span className={s.muted}>
                          #{latest.id}
                          {latest.sample && " · exemplo ilustrativo"}
                        </span>
                      </div>
                      <StatusChip order={latest} />
                    </div>
                    <Timeline order={latest} />
                    <div className={s.cardActions}>
                      {(latest.layout?.status === "enviado" || latest.layout?.status === "ajuste") && (
                        <button
                          type="button"
                          className="btn btn-accent btn-sm"
                          onClick={() => {
                            setLayoutOrder(latest.id);
                            go("layout");
                          }}
                        >
                          <FileCheck2 size={16} /> Revisar layout
                        </button>
                      )}
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => go("pedidos")}>
                        Ver pedidos <ArrowRight size={15} />
                      </button>
                    </div>
                  </div>
                )}

                <div className={s.quick}>
                  <Link href="/loja?tipo=stock" className={s.quickCard}>
                    <Package size={22} strokeWidth={1.75} />
                    <div>
                      <strong>Pronta para personalizar</strong>
                      <span>Peças em estoque com a sua logo, a partir de 5 unidades.</span>
                    </div>
                    <ArrowRight size={18} />
                  </Link>
                  <Link href="/orcamento" className={s.quickCard}>
                    <Sparkles size={22} strokeWidth={1.75} />
                    <div>
                      <strong>Monte seu uniforme</strong>
                      <span>Orçamento para empresas, a partir de 30 peças.</span>
                    </div>
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </>
            )}

            {section === "pedidos" && (
              <>
                <div className={s.sectionHead}>
                  <h2>Pedidos</h2>
                  {isSample && <p className={s.muted}>Você ainda não tem pedidos neste navegador. Veja abaixo um exemplo de como o acompanhamento funciona.</p>}
                </div>
                <div className={s.orders}>
                  {orders.map((o) => (
                    <OrderCard
                      key={o.id}
                      order={o}
                      onReviewLayout={(id) => {
                        setLayoutOrder(id);
                        go("layout");
                      }}
                    />
                  ))}
                </div>
              </>
            )}

            {section === "layout" && (
              <>
                <div className={s.sectionHead}>
                  <h2>Aprovação de layout</h2>
                  <p className={s.muted}>Após o pagamento, enviamos uma simulação com a sua logo aplicada. Aprove ou peça ajustes antes da produção.</p>
                </div>
                <LayoutApproval orders={layoutOrders} selectedId={layoutOrder} onSelect={setLayoutOrder} onUpdate={updateLayout} />
              </>
            )}

            {section === "enderecos" && <Addresses />}

            {section === "favoritos" && (
              <>
                <div className={s.sectionHead}>
                  <h2>Favoritos</h2>
                </div>
                {favorites.length ? (
                  <div className={s.favGrid}>
                    {favorites.map((slug) => {
                      const p = getProduct(slug);
                      return p ? <ProductCard key={slug} product={p} /> : null;
                    })}
                  </div>
                ) : (
                  <div className={s.empty}>
                    <Heart size={28} strokeWidth={1.5} />
                    <strong>Nenhum favorito ainda</strong>
                    <p>Toque no coração dos produtos para guardar aqui.</p>
                    <Link href="/loja" className="btn btn-primary btn-sm">
                      Explorar produtos
                    </Link>
                  </div>
                )}
              </>
            )}

            {section === "dados" && (
              <ProfileForm
                profile={profile}
                onSave={(p) => {
                  if (saveProfile(p)) {
                    setProfile(p);
                    toast.success("Dados atualizados");
                  } else toast.error("Não foi possível salvar neste navegador.");
                }}
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function ProfileForm({ profile, onSave }: { profile: Profile; onSave: (p: Profile) => void }) {
  const [f, setF] = useState({ name: profile.name, email: profile.email, phone: profile.phone ?? "", company: profile.company ?? "", type: profile.type });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const r = profileSchema.safeParse(f);
    if (!r.success) return setErrors(errorsOf(r.error));
    setErrors({});
    onSave({ ...profile, ...f, name: f.name.trim(), phone: f.phone || undefined, company: f.company.trim() || undefined });
  };
  const field = (k: "name" | "email" | "phone" | "company", label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className={s.field} data-error={errors[k] ? "" : undefined}>
      <label htmlFor={`p-${k}`}>{label}</label>
      <input
        id={`p-${k}`}
        className="input"
        value={f[k]}
        onChange={(e) => setF({ ...f, [k]: k === "phone" ? maskPhone(e.target.value) : e.target.value })}
        aria-invalid={!!errors[k]}
        aria-describedby={errors[k] ? `p-${k}-err` : undefined}
        {...props}
      />
      {errors[k] && (
        <span className={s.error} id={`p-${k}-err`} role="alert">
          {errors[k]}
        </span>
      )}
    </div>
  );
  return (
    <>
      <div className={s.sectionHead}>
        <h2>Dados pessoais</h2>
        <p className={s.muted}>Usados para agilizar o checkout. Em demonstração, ficam apenas neste navegador.</p>
      </div>
      <form className={`${s.card} ${s.form}`} onSubmit={submit} noValidate>
        <div className={s.segment} role="radiogroup" aria-label="Tipo de conta">
          {(
            [
              ["pf", "Pessoa física"],
              ["pj", "Empresa (PJ)"],
            ] as const
          ).map(([v, label]) => (
            <button key={v} type="button" role="radio" aria-checked={f.type === v} data-active={f.type === v || undefined} onClick={() => setF({ ...f, type: v })}>
              {label}
            </button>
          ))}
        </div>
        {field("name", "Nome completo", { autoComplete: "name" })}
        {field("email", "E-mail", { type: "email", autoComplete: "email" })}
        {field("phone", "Telefone / WhatsApp", { inputMode: "tel", autoComplete: "tel", placeholder: "(00) 00000-0000" })}
        {f.type === "pj" && field("company", "Empresa", { autoComplete: "organization" })}
        <div className={s.formActions}>
          <button type="submit" className="btn btn-primary">
            Salvar alterações
          </button>
        </div>
      </form>
    </>
  );
}

const emptyAddress = { label: "", cep: "", street: "", number: "", complement: "", district: "", city: "", state: "" };

function Addresses() {
  const [list, setList] = useState<SavedAddress[]>([]);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(emptyAddress);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => setList(readAddresses()), []);

  const persist = (next: SavedAddress[]) => {
    setList(next);
    if (!saveAddresses(next)) toast.error("Não foi possível salvar neste navegador.");
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const r = addressSchema.safeParse({ ...f, state: f.state.toUpperCase() });
    if (!r.success) return setErrors(errorsOf(r.error));
    persist([...list, { ...r.data, label: f.label.trim() || `Endereço ${list.length + 1}`, id: crypto.randomUUID() }]);
    setF(emptyAddress);
    setErrors({});
    setOpen(false);
    toast.success("Endereço salvo");
  };
  const input = (k: keyof typeof emptyAddress, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, wide = false) => (
    <div className={s.field} data-error={errors[k] ? "" : undefined} data-wide={wide || undefined}>
      <label htmlFor={`ad-${k}`}>{label}</label>
      <input
        id={`ad-${k}`}
        className="input"
        value={f[k]}
        onChange={(e) => {
          const v = k === "cep" ? maskCep(e.target.value) : k === "state" ? e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 2) : e.target.value;
          setF({ ...f, [k]: v });
        }}
        aria-invalid={!!errors[k]}
        aria-describedby={errors[k] ? `ad-${k}-err` : undefined}
        {...props}
      />
      {errors[k] && (
        <span className={s.error} id={`ad-${k}-err`} role="alert">
          {errors[k]}
        </span>
      )}
    </div>
  );

  return (
    <>
      <div className={s.sectionHead} data-row>
        <h2>Endereços</h2>
        {!open && (
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setOpen(true)}>
            <Plus size={16} /> Novo endereço
          </button>
        )}
      </div>
      {open && (
        <form className={`${s.card} ${s.form} ${s.addrForm}`} onSubmit={submit} noValidate>
          {input("label", "Identificação (opcional)", { placeholder: "Ex.: Matriz, Filial Centro" }, true)}
          {input("cep", "CEP", { inputMode: "numeric", autoComplete: "postal-code", placeholder: "00000-000" })}
          {input("street", "Rua", { autoComplete: "address-line1" }, true)}
          {input("number", "Número")}
          {input("complement", "Complemento")}
          {input("district", "Bairro")}
          {input("city", "Cidade", { autoComplete: "address-level2" })}
          {input("state", "UF", { autoComplete: "address-level1", maxLength: 2 })}
          <div className={s.formActions} data-wide>
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Salvar endereço
            </button>
          </div>
        </form>
      )}
      {list.length ? (
        <ul className={s.addresses}>
          {list.map((a) => (
            <li key={a.id} className={s.address}>
              <MapPin size={18} strokeWidth={1.75} />
              <div>
                <strong>{a.label}</strong>
                <span>
                  {a.street}, {a.number}
                  {a.complement ? ` — ${a.complement}` : ""}
                </span>
                <span>
                  {a.district} · {a.city}/{a.state} · CEP {a.cep}
                </span>
              </div>
              <button
                type="button"
                className="icon-btn"
                aria-label={`Remover ${a.label}`}
                onClick={() => {
                  persist(list.filter((x) => x.id !== a.id));
                  toast("Endereço removido");
                }}
              >
                <Trash2 size={17} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        !open && (
          <div className={s.empty}>
            <MapPin size={28} strokeWidth={1.5} />
            <strong>Nenhum endereço salvo</strong>
            <p>Salve os endereços da empresa e filiais para agilizar os próximos pedidos.</p>
          </div>
        )
      )}
    </>
  );
}
