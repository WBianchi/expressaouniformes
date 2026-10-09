"use client";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { Check, ImagePlus, MessageSquareText, Sparkles, Trash2, TrendingDown, TriangleAlert } from "lucide-react";
import { getColor, getProduct, money, positionFees, type Position, type Size } from "@/lib/catalog";
import { type CartLine, lineQuantity, lineTotal, unitPrice, volumeDiscount, volumeTiers } from "@/lib/pricing";
import { useStore } from "@/components/store/StoreProvider";
import { SafeImage, Stepper } from "@/components/ui/primitives";
import { LOGO_ACCEPT, makeLogoThumb } from "./logoThumb";
import { AnimatedMoney } from "./AnimatedMoney";
import s from "./Cart.module.css";

const allPositions = Object.keys(positionFees) as Position[];

export function CartLineItem({ line, index }: { line: CartLine; index: number }) {
  const { updateLine, removeLine, restoreLine } = useStore();
  const product = getProduct(line.slug);
  const color = getColor(line.color);
  const [draft, setDraft] = useState(line.sizes);
  const [notes, setNotes] = useState(line.notes ?? "");
  const [removing, setRemoving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const uid = useId();

  useEffect(() => setDraft(line.sizes), [line.sizes]);
  useEffect(() => setNotes(line.notes ?? ""), [line.notes]);

  if (!product) return null;
  const draftQty = lineQuantity({ sizes: draft });
  const belowMin = draftQty < product.minQty;
  const qty = lineQuantity(line);
  const unit = unitPrice(line);
  const fees = line.positions.reduce((t, p) => t + positionFees[p].fee, 0);
  const fullUnit = product.price + fees;
  const off = volumeDiscount(qty);
  const next = [...volumeTiers].reverse().find((t) => qty < t.min);

  function setSize(size: Size, n: number) {
    const sizes = { ...draft, [size]: n };
    if (!n) delete sizes[size];
    setDraft(sizes);
    if (lineQuantity({ sizes }) >= product!.minQty) updateLine(line.id, { sizes });
  }

  function togglePosition(p: Position) {
    const has = line.positions.includes(p);
    const positions = has ? line.positions.filter((x) => x !== p) : allPositions.filter((x) => x === p || line.positions.includes(x));
    updateLine(line.id, { positions });
  }

  async function onLogo(file?: File) {
    if (!file) return;
    try {
      const logo = await makeLogoThumb(file);
      updateLine(line.id, { logo });
      toast.success("Logo atualizada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível usar esta imagem.");
    }
  }

  function remove() {
    setRemoving(true);
    window.setTimeout(() => {
      removeLine(line.id);
      toast(`${product!.name} removido`, {
        action: { label: "Desfazer", onClick: () => restoreLine(line.id) },
      });
    }, 380);
  }

  return (
    <div className={s.lineWrap} data-removing={removing || undefined}>
    <article className={s.line} style={{ animationDelay: `${index * 70}ms` }} aria-labelledby={`${uid}-t`}>
      <Link href={`/produto/${product.slug}`} className={s.lineMedia} tabIndex={-1} aria-hidden>
        <SafeImage src={product.image} alt="" />
        {line.logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={s.lineLogoBadge} src={line.logo.thumb} alt="" />
        )}
      </Link>

      <div className={s.lineMain}>
        <header className={s.lineHead}>
          <div>
            <Link href={`/produto/${product.slug}`} id={`${uid}-t`} className={s.lineTitle}>
              {product.name}
            </Link>
            <p className={s.lineMeta}>
              <span className={s.dot} style={{ "--sw": color?.hex } as React.CSSProperties} aria-hidden />
              {color?.name} · {product.fabric}
            </p>
          </div>
          <button type="button" className={`icon-btn ${s.remove}`} onClick={remove} aria-label={`Remover ${product.name}`}>
            <Trash2 size={18} strokeWidth={1.75} />
          </button>
        </header>

        <fieldset className={s.block}>
          <legend className={s.blockTitle}>
            Grade de tamanhos <span className={s.blockHint}>{draftQty} peças · mín. {product.minQty}</span>
          </legend>
          <div className={s.sizes}>
            {product.sizes.map((size) => (
              <div key={size} className={s.size} data-active={(draft[size] ?? 0) > 0 || undefined}>
                <span aria-hidden>{size}</span>
                <Stepper size="sm" value={draft[size] ?? 0} onChange={(n) => setSize(size, n)} label={`tamanho ${size}`} />
              </div>
            ))}
          </div>
          {belowMin && (
            <p className={s.warn} role="alert">
              <TriangleAlert size={14} /> Mínimo de {product.minQty} peças por modelo. Ajuste a grade para salvar.
            </p>
          )}
        </fieldset>

        <fieldset className={s.block}>
          <legend className={s.blockTitle}>Posições da logo</legend>
          <div className={s.positions}>
            {allPositions.map((p) => {
              const on = line.positions.includes(p);
              return (
                <button key={p} type="button" className={s.position} aria-pressed={on} onClick={() => togglePosition(p)}>
                  <span className={s.check} aria-hidden>{on && <Check size={12} strokeWidth={3} />}</span>
                  {positionFees[p].label}
                  <small>+{money(positionFees[p].fee)}/pç</small>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className={s.lineExtras}>
          <div className={s.logoBox}>
            {line.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={line.logo.thumb} alt={`Logo enviada: ${line.logo.name}`} className={s.logoThumb} />
            ) : (
              <span className={s.logoEmpty} aria-hidden>
                <ImagePlus size={18} strokeWidth={1.75} />
              </span>
            )}
            <div className={s.logoText}>
              <strong>{line.logo ? line.logo.name : "Sem logo anexada"}</strong>
              <span>{line.logo ? "Arte revisada pela nossa equipe" : "Você pode enviar agora ou depois"}</span>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}>
              {line.logo ? "Trocar" : "Enviar"}
            </button>
            <input ref={fileRef} type="file" accept={LOGO_ACCEPT} hidden onChange={(e) => onLogo(e.target.files?.[0])} />
          </div>

          <details className={s.notes} open={!!line.notes || undefined}>
            <summary>
              <MessageSquareText size={15} strokeWidth={1.75} /> Observações {line.notes ? "· editar" : "(opcional)"}
            </summary>
            <textarea
              className="input"
              rows={2}
              maxLength={1000}
              value={notes}
              placeholder="Ex.: nomes nas costas, cor da linha do bordado…"
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => notes !== (line.notes ?? "") && updateLine(line.id, { notes: notes.trim() || undefined })}
              aria-label={`Observações para ${product.name}`}
            />
          </details>
        </div>

        <footer className={s.lineFoot}>
          <div className={s.tierInfo}>
            {off > 0 && (
              <span className="chip chip-success">
                <TrendingDown size={12} /> {Math.round(off * 100)}% off por volume
              </span>
            )}
            {next && (
              <span className={s.nextTier}>
                <Sparkles size={13} /> Faltam <b>{next.min - qty} peças</b> para {Math.round(next.off * 100)}% de desconto
              </span>
            )}
          </div>
          <div className={s.linePrice}>
            <span className={s.unit}>
              {off > 0 && <del>{money(fullUnit)}</del>} <AnimatedMoney value={unit} />/pç
            </span>
            <strong><AnimatedMoney value={lineTotal(line)} /></strong>
          </div>
        </footer>
      </div>
    </article>
    </div>
  );
}
