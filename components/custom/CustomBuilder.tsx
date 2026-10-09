"use client";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Copy,
  ImagePlus,
  Info,
  MessageCircle,
  PenLine,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { colors, customProducts, whatsappLink } from "@/lib/catalog";
import { SafeImage, Stepper, Swatches } from "@/components/ui/primitives";
import { GarmentPreview } from "./GarmentPreview";
import {
  applyModel,
  briefingText,
  collarInfo,
  collarOptions,
  colorName,
  cuffInfo,
  cuffOptions,
  deadlines,
  defaultBrief,
  extraInfo,
  extraOptions,
  fabricInfo,
  fabricOptions,
  gradeTotal,
  isModel,
  logoPositions,
  MIN_QTY,
  modelName,
  sizes,
  sleeveInfo,
  sleeveOptions,
  suggestGrade,
  type Brief,
  type LogoPosition,
} from "./config";
import s from "./Custom.module.css";

const DRAFT_KEY = "eu-custom-draft";
const allColors = colors.map((c) => c.id);

const STEPS = [
  { id: "modelo", label: "Modelo base", title: "Escolha um ponto de partida" },
  { id: "tecido", label: "Tecido", title: "Qual tecido combina com a rotina da equipe?" },
  { id: "gola", label: "Gola", title: "Escolha a gola" },
  { id: "mangas", label: "Mangas e punho", title: "Mangas e acabamento do punho" },
  { id: "friso", label: "Friso", title: "Detalhe de friso" },
  { id: "cores", label: "Cores", title: "Cores da sua identidade" },
  { id: "extras", label: "Extras", title: "Acabamentos extras" },
  { id: "logo", label: "Logo", title: "Logo e posições" },
  { id: "quantidade", label: "Quantidade", title: "Quantidade, grade e prazo" },
  { id: "empresa", label: "Empresa", title: "Dados da empresa" },
  { id: "revisao", label: "Revisão", title: "Revise seu briefing" },
] as const;
const EMPRESA = 9;
const REVIEW = 10;

const companySchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da empresa"),
  cnpj: z.string().refine((v) => !v.trim() || v.replace(/\D/g, "").length === 14, "O CNPJ deve ter 14 dígitos"),
  contact: z.string().trim().min(3, "Informe o nome do responsável"),
  phone: z.string().refine((v) => v.replace(/\D/g, "").length >= 10, "Informe um telefone com DDD"),
  email: z.email("Informe um e-mail válido"),
  city: z.string().trim().min(2, "Informe a cidade"),
  uf: z.string().regex(/^[A-Za-z]{2}$/, "UF com 2 letras"),
});
type CompanyErrors = Partial<Record<keyof Brief["company"], string>>;

const maskCnpj = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
};
const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

function validateCompany(c: Brief["company"]): CompanyErrors {
  const r = companySchema.safeParse(c);
  if (r.success) return {};
  const e: CompanyErrors = {};
  for (const i of r.error.issues) {
    const k = i.path[0] as keyof Brief["company"];
    if (!e[k]) e[k] = i.message;
  }
  return e;
}

/** Grupo de cartões de escolha única, acessível como radiogroup. */
function Choice<T extends string>({
  label,
  options,
  value,
  onChange,
  info,
  columns = 2,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  info?: Record<string, string>;
  columns?: 2 | 3;
}) {
  return (
    <div className={s.choices} role="radiogroup" aria-label={label} data-cols={columns}>
      {options.map((o) => (
        <button key={o} type="button" role="radio" aria-checked={value === o} className={s.choice} data-active={value === o || undefined} onClick={() => onChange(o)}>
          <span className={s.choiceCheck} aria-hidden>
            <Check size={13} strokeWidth={3} />
          </span>
          <strong>{o}</strong>
          {info?.[o] && <small>{info[o]}</small>}
        </button>
      ))}
    </div>
  );
}

function Field({ label, error, hint, children, id }: { label: string; error?: string; hint?: string; children: ReactNode; id: string }) {
  return (
    <div className={s.field} data-error={error ? "" : undefined}>
      <label htmlFor={id}>{label}</label>
      {children}
      {error ? (
        <span className={s.fieldError} id={`${id}-err`} role="alert">
          {error}
        </span>
      ) : (
        hint && <span className={s.fieldHint}>{hint}</span>
      )}
    </div>
  );
}

export default function CustomBuilder({ initialModel }: { initialModel?: string }) {
  const [brief, setBrief] = useState<Brief>(() => (isModel(initialModel) ? applyModel(defaultBrief, initialModel) : defaultBrief));
  const [step, setStep] = useState(isModel(initialModel) ? 1 : 0);
  const [visited, setVisited] = useState<Set<number>>(() => new Set([0, isModel(initialModel) ? 1 : 0]));
  const [view, setView] = useState<"front" | "back">("front");
  const [previewOpen, setPreviewOpen] = useState(true);
  const [errors, setErrors] = useState<CompanyErrors>({});
  const [loaded, setLoaded] = useState(false);
  const [dir, setDir] = useState<"next" | "prev">("next");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const userNavigated = useRef(false);

  // restaura rascunho
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw) as { brief?: Partial<Brief>; step?: number };
        if (d.brief && typeof d.brief === "object") {
          let b: Brief = { ...defaultBrief, ...d.brief, colors: { ...defaultBrief.colors, ...d.brief.colors }, company: { ...defaultBrief.company, ...d.brief.company } };
          if (isModel(initialModel) && initialModel !== b.model) b = applyModel(b, initialModel);
          setBrief(b);
          if (!isModel(initialModel) && typeof d.step === "number" && d.step >= 0 && d.step <= REVIEW) {
            setStep(d.step);
            setVisited(new Set(Array.from({ length: d.step + 1 }, (_, i) => i)));
          }
          toast("Rascunho restaurado", { description: "Continuamos de onde você parou.", duration: 2500 });
        }
      }
    } catch {
      /* rascunho inválido ou armazenamento indisponível */
    }
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = useCallback((b: Brief, st: number, silent = true) => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ brief: b, step: st, savedAt: new Date().toISOString() }));
    } catch {
      try {
        // sem espaço: salva sem a imagem da logo
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ brief: { ...b, logo: b.logo ? { name: b.logo.name } : null }, step: st }));
        if (!silent) toast.warning("Rascunho salvo sem a imagem da logo (arquivo grande).");
        return true;
      } catch {
        if (!silent) toast.error("Não foi possível salvar o rascunho neste navegador.");
        return false;
      }
    }
    if (!silent) toast.success("Rascunho salvo neste navegador");
    return true;
  }, []);

  // salvamento automático
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => persist(brief, step), 600);
    return () => clearTimeout(t);
  }, [brief, step, loaded, persist]);

  useEffect(() => {
    if (!userNavigated.current) return;
    headingRef.current?.focus({ preventScroll: true });
    const top = topRef.current?.getBoundingClientRect().top ?? 0;
    if (top < 0) topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  const go = (i: number) => {
    const n = Math.max(0, Math.min(REVIEW, i));
    userNavigated.current = true;
    setDir(n < step ? "prev" : "next");
    setStep(n);
    setVisited((v) => new Set(v).add(n));
  };

  const set = <K extends keyof Brief>(k: K, v: Brief[K]) => setBrief((b) => ({ ...b, [k]: v }));
  const setColor = (k: keyof Brief["colors"], v: string) => setBrief((b) => ({ ...b, colors: { ...b.colors, [k]: v } }));
  const setCompany = (k: keyof Brief["company"], v: string) => {
    setBrief((b) => ({ ...b, company: { ...b.company, [k]: v } }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };
  const toggleExtra = (e: string) => set("extras", brief.extras.includes(e) ? brief.extras.filter((x) => x !== e) : [...brief.extras, e]);
  const togglePosition = (p: LogoPosition) => {
    const on = !brief.positions.includes(p);
    set("positions", on ? [...brief.positions, p] : brief.positions.filter((x) => x !== p));
    if (on) setView(p === "Costas" ? "back" : "front");
  };

  const chooseModel = (slug: string) => {
    setBrief((b) => applyModel(b, slug));
    toast.success(`${modelName(slug)} selecionado`, { description: "Aplicamos um ponto de partida. Ajuste o que quiser nas próximas etapas.", duration: 2600 });
  };

  const onLogo = (file: File | undefined) => {
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp|svg\+xml)$/.test(file.type)) return toast.error("Envie PNG, JPG, WEBP ou SVG.");
    if (file.size > 5 * 1024 * 1024) return toast.error("Arquivo acima de 5 MB. Envie pelo WhatsApp após o briefing.");
    const reader = new FileReader();
    reader.onload = () => {
      set("logo", { name: file.name, dataUrl: String(reader.result) });
      if (!brief.positions.length) set("positions", ["Peito esquerdo"]);
      toast.success("Logo adicionada à prévia");
    };
    reader.onerror = () => toast.error("Não foi possível ler o arquivo.");
    reader.readAsDataURL(file);
  };

  const text = useMemo(() => briefingText(brief), [brief]);
  const companyOk = Object.keys(validateCompany(brief.company)).length === 0;
  const gradeSum = gradeTotal(brief.grade);

  const ensureValid = () => {
    const e = validateCompany(brief.company);
    if (Object.keys(e).length) {
      setErrors(e);
      go(EMPRESA);
      toast.error("Complete os dados da empresa para enviar o briefing.");
      return false;
    }
    if (brief.quantity < MIN_QTY) {
      go(8);
      toast.error(`A produção sob medida começa em ${MIN_QTY} peças.`);
      return false;
    }
    return true;
  };

  const copy = async () => {
    if (!ensureValid()) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Briefing copiado");
    } catch {
      toast.error("Não foi possível copiar automaticamente. Selecione o texto da revisão.");
    }
  };

  const reset = () => {
    setBrief(defaultBrief);
    setErrors({});
    setView("front");
    go(0);
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignora */
    }
    toast("Briefing reiniciado");
  };

  const next = () => {
    if (step === EMPRESA) {
      const e = validateCompany(brief.company);
      setErrors(e);
      if (Object.keys(e).length) {
        toast.error("Confira os campos destacados.");
        return;
      }
    }
    go(step + 1);
  };

  const current = STEPS[step];
  const progress = Math.round((step / REVIEW) * 100);

  const summary: [string, string, number][] = [
    ["Modelo", modelName(brief.model), 0],
    ["Tecido", brief.fabric, 1],
    ["Gola", brief.collar, 2],
    ["Mangas", `${brief.sleeve} · ${brief.cuff}`, 3],
    ["Friso", brief.friso ? colorName(brief.colors.friso) : "Sem friso", 4],
    ["Cores", `${colorName(brief.colors.body)} · ${colorName(brief.colors.collar)} · ${colorName(brief.colors.sleeve)}`, 5],
    ["Extras", brief.extras.length ? brief.extras.join(", ") : "Nenhum", 6],
    ["Logo", brief.logo ? `${brief.logo.name}${brief.positions.length ? ` · ${brief.positions.join(", ")}` : ""}` : brief.positions.length ? `A enviar · ${brief.positions.join(", ")}` : "A definir", 7],
    ["Quantidade", `${brief.quantity} peças`, 8],
  ];

  return (
    <div className={s.builder} ref={topRef} id="montar">
      {/* prévia */}
      <aside className={s.aside} aria-label="Prévia e resumo">
        <div className={s.previewCard}>
          <div className={s.previewHead}>
            <div>
              <span className={s.eyebrow}>Prévia ilustrativa</span>
              <strong>{modelName(brief.model)}</strong>
            </div>
            <button type="button" className={s.previewToggle} aria-expanded={previewOpen} aria-controls="preview-body" onClick={() => setPreviewOpen((o) => !o)}>
              {previewOpen ? "Ocultar" : "Mostrar"} <ChevronDown size={16} data-open={previewOpen || undefined} />
            </button>
          </div>
          <div id="preview-body" className={s.previewBody} data-open={previewOpen || undefined}>
            <div className={s.stage}>
              <GarmentPreview brief={brief} view={view} className={s.svg} />
              <div className={s.viewSwitch} role="group" aria-label="Lado da peça">
                <button type="button" aria-pressed={view === "front"} onClick={() => setView("front")}>
                  Frente
                </button>
                <button type="button" aria-pressed={view === "back"} onClick={() => setView("back")}>
                  Costas
                </button>
              </div>
            </div>
            <p className={s.previewNote}>
              <Info size={14} /> Ilustração para orientar o briefing. O modelo final é definido com o consultor e aprovado em amostra.
            </p>
            <dl className={s.summary}>
              {summary.map(([k, v, i]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>
                    <button type="button" onClick={() => go(i)} title={`Editar ${k.toLowerCase()}`}>
                      {v}
                    </button>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </aside>

      {/* wizard */}
      <section className={s.wizard} aria-labelledby="step-title">
        <div className={s.progressWrap}>
          <div className={s.progressTop}>
            <span>
              Etapa <b>{step + 1}</b> de {STEPS.length}
            </span>
            <span>{progress}%</span>
          </div>
          <div className={s.progressBar} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-label="Progresso do briefing">
            <span style={{ width: `${Math.max(progress, 4)}%` }} />
          </div>
          <nav className={s.stepNav} aria-label="Etapas">
            <ol>
              {STEPS.map((st, i) => (
                <li key={st.id}>
                  <button
                    type="button"
                    onClick={() => go(i)}
                    aria-current={i === step ? "step" : undefined}
                    data-state={i === step ? "current" : visited.has(i) ? "done" : undefined}
                  >
                    <span className={s.stepNum}>{visited.has(i) && i !== step ? <Check size={12} strokeWidth={3} /> : i + 1}</span>
                    {st.label}
                  </button>
                </li>
              ))}
            </ol>
          </nav>
        </div>

        <div className={s.panel} key={step} data-dir={dir}>
          <h2 id="step-title" ref={headingRef} tabIndex={-1} className={s.stepTitle}>
            {current.title}
          </h2>

          {step === 0 && (
            <div className={s.models}>
              {customProducts.map((p) => (
                <button key={p.slug} type="button" className={s.model} aria-pressed={brief.model === p.slug} data-active={brief.model === p.slug || undefined} onClick={() => chooseModel(p.slug)}>
                  <span className={s.modelMedia}>
                    <SafeImage src={p.image} alt="" />
                  </span>
                  <span className={s.modelBody}>
                    <strong>{p.name}</strong>
                    <small>{p.short}</small>
                  </span>
                  <span className={s.choiceCheck} aria-hidden>
                    <Check size={13} strokeWidth={3} />
                  </span>
                </button>
              ))}
              <button type="button" className={`${s.model} ${s.modelZero}`} aria-pressed={brief.model === "zero"} data-active={brief.model === "zero" || undefined} onClick={() => chooseModel("zero")}>
                <span className={s.modelMedia}>
                  <Sparkles size={34} strokeWidth={1.5} />
                </span>
                <span className={s.modelBody}>
                  <strong>Começar do zero</strong>
                  <small>Uma base neutra para criar a peça do seu jeito.</small>
                </span>
                <span className={s.choiceCheck} aria-hidden>
                  <Check size={13} strokeWidth={3} />
                </span>
              </button>
            </div>
          )}

          {step === 1 && <Choice label="Tecido" options={fabricOptions} value={brief.fabric} onChange={(v) => set("fabric", v)} info={fabricInfo} />}

          {step === 2 && (
            <Choice
              label="Gola"
              options={collarOptions}
              value={brief.collar}
              onChange={(v) => setBrief((b) => ({ ...b, collar: v, friso: v === "Polo com friso" ? true : b.friso }))}
              info={collarInfo}
            />
          )}

          {step === 3 && (
            <div className={s.stack}>
              <div>
                <h3 className={s.groupTitle}>Mangas</h3>
                <Choice label="Mangas" options={sleeveOptions} value={brief.sleeve} onChange={(v) => set("sleeve", v)} info={sleeveInfo} columns={3} />
              </div>
              <div>
                <h3 className={s.groupTitle}>Punho</h3>
                <Choice
                  label="Punho"
                  options={cuffOptions}
                  value={brief.cuff}
                  onChange={(v) => setBrief((b) => ({ ...b, cuff: v, friso: v === "Punho com friso" ? true : b.friso }))}
                  info={cuffInfo}
                  columns={3}
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className={s.stack}>
              <Choice
                label="Friso"
                options={["Sem friso", "Com friso"] as const}
                value={brief.friso ? "Com friso" : "Sem friso"}
                onChange={(v) => setBrief((b) => ({ ...b, friso: v === "Com friso", collar: v === "Sem friso" && b.collar === "Polo com friso" ? "Polo tradicional" : b.collar, cuff: v === "Sem friso" && b.cuff === "Punho com friso" ? "Punho liso" : b.cuff }))}
                info={{ "Sem friso": "Visual limpo e sóbrio.", "Com friso": "Listras na gola, punho e recortes com a cor da marca." }}
              />
              {brief.friso && (
                <div className={s.colorRow}>
                  <div>
                    <strong>Cor do friso</strong>
                    <span>{colorName(brief.colors.friso)}</span>
                  </div>
                  <Swatches ids={allColors} value={brief.colors.friso} onChange={(v) => setColor("friso", v)} />
                </div>
              )}
            </div>
          )}

          {step === 5 && (
            <div className={s.stack}>
              {(
                [
                  ["body", "Corpo"],
                  ["collar", "Gola e punho"],
                  ["sleeve", brief.extras.includes("Recorte bicolor") ? "Mangas e recortes" : "Mangas"],
                  ["friso", "Friso"],
                ] as [keyof Brief["colors"], string][]
              ).map(([k, label]) => (
                <div key={k} className={s.colorRow} data-disabled={k === "friso" && !brief.friso ? "" : undefined}>
                  <div>
                    <strong>{label}</strong>
                    <span>{k === "friso" && !brief.friso ? "Ative o friso na etapa anterior" : colorName(brief.colors[k])}</span>
                  </div>
                  <Swatches ids={allColors} value={brief.colors[k]} onChange={(v) => setColor(k, v)} />
                </div>
              ))}
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setBrief((b) => ({ ...b, colors: { ...b.colors, collar: b.colors.body, sleeve: b.colors.body } }))}
              >
                Igualar gola e mangas ao corpo
              </button>
            </div>
          )}

          {step === 6 && (
            <div className={s.choices} data-cols={2}>
              {extraOptions.map((e) => {
                const on = brief.extras.includes(e);
                return (
                  <button key={e} type="button" role="checkbox" aria-checked={on} className={s.choice} data-active={on || undefined} onClick={() => toggleExtra(e)}>
                    <span className={s.choiceCheck} data-square aria-hidden>
                      <Check size={13} strokeWidth={3} />
                    </span>
                    <strong>{e}</strong>
                    <small>{extraInfo[e]}</small>
                  </button>
                );
              })}
            </div>
          )}

          {step === 7 && (
            <div className={s.stack}>
              <label
                className={s.drop}
                data-has={brief.logo ? "" : undefined}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  onLogo(e.dataTransfer.files?.[0]);
                }}
              >
                <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="sr-only" onChange={(e) => onLogo(e.target.files?.[0])} />
                {brief.logo?.dataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={brief.logo.dataUrl} alt={`Logo ${brief.logo.name}`} className={s.logoThumb} />
                ) : (
                  <span className={s.dropIcon}>
                    <ImagePlus size={26} strokeWidth={1.6} />
                  </span>
                )}
                <span className={s.dropText}>
                  <strong>{brief.logo ? brief.logo.name : "Envie sua logo (opcional)"}</strong>
                  <small>{brief.logo ? "Clique para trocar o arquivo" : "Arraste ou clique · PNG, JPG, WEBP ou SVG até 5 MB"}</small>
                </span>
              </label>
              {brief.logo && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => set("logo", null)}>
                  <Trash2 size={15} /> Remover logo
                </button>
              )}
              <p className={s.muted}>Sem a arte agora? Tudo bem — o consultor recebe o arquivo pelo WhatsApp e cuida da vetorização se precisar.</p>
              <div>
                <h3 className={s.groupTitle}>Posições da logo</h3>
                <div className={s.chips}>
                  {logoPositions.map((p) => {
                    const on = brief.positions.includes(p);
                    return (
                      <button key={p} type="button" role="checkbox" aria-checked={on} className={s.toggleChip} data-active={on || undefined} onClick={() => togglePosition(p)}>
                        {on && <Check size={14} strokeWidth={3} />} {p}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 8 && (
            <div className={s.stack}>
              <div className={s.qtyRow}>
                <div>
                  <strong>Quantidade total</strong>
                  <span>Mínimo de {MIN_QTY} peças por modelo</span>
                </div>
                <Stepper value={brief.quantity} onChange={(n) => set("quantity", n)} min={MIN_QTY} max={99999} step={5} label="quantidade total" />
              </div>
              <div className={s.chips}>
                {[30, 50, 100, 200, 500].map((n) => (
                  <button key={n} type="button" className={s.toggleChip} data-active={brief.quantity === n || undefined} aria-pressed={brief.quantity === n} onClick={() => set("quantity", n)}>
                    {n} peças
                  </button>
                ))}
              </div>
              <div>
                <div className={s.groupHead}>
                  <h3 className={s.groupTitle}>Grade estimada</h3>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => set("grade", suggestGrade(brief.quantity))}>
                    <Sparkles size={15} /> Distribuir automaticamente
                  </button>
                </div>
                <div className={s.grade}>
                  {sizes.map((sz) => (
                    <div key={sz} className={s.gradeCell}>
                      <span>{sz}</span>
                      <Stepper size="sm" value={brief.grade[sz] ?? 0} onChange={(n) => set("grade", { ...brief.grade, [sz]: n })} label={`tamanho ${sz}`} />
                    </div>
                  ))}
                </div>
                <p className={s.gradeNote} data-warn={gradeSum > 0 && gradeSum !== brief.quantity ? "" : undefined} aria-live="polite">
                  {gradeSum === 0
                    ? "Opcional: a grade pode ser confirmada depois com o consultor."
                    : gradeSum === brief.quantity
                      ? `Grade completa: ${gradeSum} peças.`
                      : `A grade soma ${gradeSum} de ${brief.quantity} peças. Ajuste ou confirme com o consultor.`}
                </p>
              </div>
              <div>
                <h3 className={s.groupTitle}>Prazo desejado</h3>
                <div className={s.chips}>
                  {deadlines.map((d) => (
                    <button key={d} type="button" className={s.toggleChip} data-active={brief.deadline === d || undefined} aria-pressed={brief.deadline === d} onClick={() => set("deadline", d)}>
                      {d}
                    </button>
                  ))}
                </div>
                {brief.deadline === "Data específica" && (
                  <div className={s.inline}>
                    <Field label="Data de entrega desejada" id="deadline-date">
                      <input id="deadline-date" type="date" className="input" value={brief.deadlineDate} min={new Date().toISOString().slice(0, 10)} onChange={(e) => set("deadlineDate", e.target.value)} />
                    </Field>
                  </div>
                )}
              </div>
              <Field label="Observações (opcional)" id="notes" hint="Ex.: uniforme para recepção e equipe externa, nomes bordados, NR aplicável…">
                <textarea id="notes" className={`input ${s.textarea}`} rows={3} maxLength={800} value={brief.notes} onChange={(e) => set("notes", e.target.value)} />
              </Field>
            </div>
          )}

          {step === EMPRESA && (
            <form
              className={s.form}
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                next();
              }}
            >
              <Field label="Nome da empresa" id="c-name" error={errors.name}>
                <input id="c-name" className="input" autoComplete="organization" value={brief.company.name} onChange={(e) => setCompany("name", e.target.value)} aria-invalid={!!errors.name} aria-describedby={errors.name ? "c-name-err" : undefined} />
              </Field>
              <Field label="CNPJ (opcional)" id="c-cnpj" error={errors.cnpj}>
                <input id="c-cnpj" className="input" inputMode="numeric" value={brief.company.cnpj} onChange={(e) => setCompany("cnpj", maskCnpj(e.target.value))} placeholder="00.000.000/0000-00" aria-invalid={!!errors.cnpj} aria-describedby={errors.cnpj ? "c-cnpj-err" : undefined} />
              </Field>
              <Field label="Responsável" id="c-contact" error={errors.contact}>
                <input id="c-contact" className="input" autoComplete="name" value={brief.company.contact} onChange={(e) => setCompany("contact", e.target.value)} aria-invalid={!!errors.contact} aria-describedby={errors.contact ? "c-contact-err" : undefined} />
              </Field>
              <Field label="WhatsApp / telefone" id="c-phone" error={errors.phone}>
                <input id="c-phone" className="input" inputMode="tel" autoComplete="tel" value={brief.company.phone} onChange={(e) => setCompany("phone", maskPhone(e.target.value))} placeholder="(00) 00000-0000" aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "c-phone-err" : undefined} />
              </Field>
              <Field label="E-mail" id="c-email" error={errors.email}>
                <input id="c-email" className="input" type="email" autoComplete="email" value={brief.company.email} onChange={(e) => setCompany("email", e.target.value.trim())} aria-invalid={!!errors.email} aria-describedby={errors.email ? "c-email-err" : undefined} />
              </Field>
              <div className={s.cityRow}>
                <Field label="Cidade" id="c-city" error={errors.city}>
                  <input id="c-city" className="input" autoComplete="address-level2" value={brief.company.city} onChange={(e) => setCompany("city", e.target.value)} aria-invalid={!!errors.city} aria-describedby={errors.city ? "c-city-err" : undefined} />
                </Field>
                <Field label="UF" id="c-uf" error={errors.uf}>
                  <input id="c-uf" className="input" maxLength={2} autoComplete="address-level1" value={brief.company.uf} onChange={(e) => setCompany("uf", e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase())} aria-invalid={!!errors.uf} aria-describedby={errors.uf ? "c-uf-err" : undefined} />
                </Field>
              </div>
              <button type="submit" hidden />
            </form>
          )}

          {step === REVIEW && (
            <div className={s.stack}>
              {!companyOk && (
                <div className={s.alert} role="status">
                  <Info size={18} /> Faltam dados da empresa.{" "}
                  <button type="button" onClick={() => go(EMPRESA)}>
                    Completar agora
                  </button>
                </div>
              )}
              <div className={s.review}>
                {summary.map(([k, v, i]) => (
                  <div key={k} className={s.reviewItem}>
                    <span>{k}</span>
                    <strong>{v}</strong>
                    <button type="button" className={s.editBtn} onClick={() => go(i)} aria-label={`Editar ${k.toLowerCase()}`}>
                      <PenLine size={14} />
                    </button>
                  </div>
                ))}
                <div className={s.reviewItem}>
                  <span>Empresa</span>
                  <strong>{brief.company.name ? `${brief.company.name} · ${brief.company.city}/${brief.company.uf}` : "—"}</strong>
                  <button type="button" className={s.editBtn} onClick={() => go(EMPRESA)} aria-label="Editar dados da empresa">
                    <PenLine size={14} />
                  </button>
                </div>
              </div>
              <details className={s.textPreview}>
                <summary>Ver mensagem que será enviada</summary>
                <pre>{text}</pre>
              </details>
              <div className={s.finalActions}>
                <a
                  className="btn btn-whatsapp btn-lg btn-block"
                  href={whatsappLink(text)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    if (!ensureValid()) e.preventDefault();
                    else persist(brief, step);
                  }}
                >
                  <MessageCircle size={20} /> Enviar briefing pelo WhatsApp
                </a>
                <div className={s.secondaryActions}>
                  <button type="button" className="btn btn-outline" onClick={copy}>
                    <Copy size={17} /> Copiar briefing
                  </button>
                  <button type="button" className="btn btn-outline" onClick={() => persist(brief, step, false)}>
                    <Save size={17} /> Salvar rascunho
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={reset}>
                    <RotateCcw size={17} /> Recomeçar
                  </button>
                </div>
                {brief.logo && <p className={s.muted}>Lembrete: anexe o arquivo “{brief.logo.name}” na conversa do WhatsApp.</p>}
              </div>
            </div>
          )}
        </div>

        {step < REVIEW && (
          <div className={s.navBar}>
            <button type="button" className="btn btn-ghost" onClick={() => go(step - 1)} disabled={step === 0}>
              <ArrowLeft size={18} /> Voltar
            </button>
            <button type="button" className={`btn ${step === EMPRESA ? "btn-accent" : "btn-primary"}`} onClick={next}>
              {step === EMPRESA ? "Revisar briefing" : `Próximo: ${STEPS[step + 1].label}`} <ArrowRight size={18} />
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
