"use client";
import { Check } from "lucide-react";
import { colors, type Design } from "@/lib/catalog";
import { defaultGarment, fabrics, type Garment } from "@/lib/garment";
export type StudioSection =
  "base" | "collar" | "sleeves" | "fabric" | "art" | "order";
export const sectionNames: Record<StudioSection, string> = {
  base: "Cor da peça",
  collar: "Gola",
  sleeves: "Mangas",
  fabric: "Tecido",
  art: "Logo e texto",
  order: "Grade e pedido",
};
export function StylePanel({
  section,
  design,
  onChange,
}: {
  section: StudioSection;
  design: Design;
  onChange: (patch: Partial<Design>) => void;
}) {
  const garment = design.garment || defaultGarment;
  const update = (patch: Partial<Garment>) =>
    onChange({ garment: { ...garment, ...patch } });
  if (section === "fabric")
    return (
      <div className="material-list">
        {Object.entries(fabrics).map(([id, fabric]) => (
          <button
            key={id}
            aria-pressed={garment.fabric === id}
            onClick={() => update({ fabric: id as Garment["fabric"] })}
          >
            <span className={`fabric-sample fabric-${id}`} />
            <span>
              <strong>{fabric.name}</strong>
              <small>{fabric.description}</small>
            </span>
            {garment.fabric === id && <Check size={16} />}
          </button>
        ))}
        <p className="muted small-text">
          Texturas ilustrativas. Confirme as amostras com a fábrica.
        </p>
      </div>
    );
  const collar = section === "collar",
    sleeves = section === "sleeves";
  const enabled = collar
    ? garment.collarEnabled
    : sleeves
      ? garment.sleevesEnabled
      : true;
  const currentColor = collar
    ? garment.collarColor
    : sleeves
      ? garment.sleeveColor
      : design.color;
  function setColor(color: string) {
    if (collar) update({ collarColor: color });
    else if (sleeves) update({ sleeveColor: color });
    else onChange({ color });
  }
  const palette = [...colors, { name: "Branco", hex: "#ffffff" }];
  return (
    <div className="style-panel">
      {(collar || sleeves) && (
        <label className="garment-toggle">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) =>
              update(
                collar
                  ? { collarEnabled: e.target.checked }
                  : { sleevesEnabled: e.target.checked },
              )
            }
          />
          Personalizar {collar ? "gola" : "mangas"}
        </label>
      )}
      {!enabled && (
        <p className="muted small-text">
          Ative para escolher um acabamento com cor própria.
        </p>
      )}
      {enabled && (
        <>
          {sleeves && (
            <label className="field-label">
              Detalhe das mangas
              <select
                value={garment.sleeveDetail}
                onChange={(e) =>
                  update({
                    sleeveDetail: e.target.value as Garment["sleeveDetail"],
                  })
                }
              >
                <option value="full">Mangas inteiras</option>
                <option value="cuff">Faixa nas pontas</option>
              </select>
            </label>
          )}
          <span className="eyebrow">ESCOLHA UMA COR</span>
          <div className="color-answer-list">
            {palette.map((c) => (
              <button
                key={c.hex}
                aria-pressed={currentColor === c.hex}
                onClick={() => setColor(c.hex)}
              >
                <span>{c.name}</span>
                <span
                  className="color-answer-swatch"
                  style={{ background: c.hex }}
                >
                  {currentColor === c.hex && (
                    <Check
                      size={13}
                      color={
                        ["#ffffff", "#e5e1d8", "#dfb641"].includes(c.hex)
                          ? "#123"
                          : "#fff"
                      }
                    />
                  )}
                </span>
              </button>
            ))}
          </div>
          <label className="garment-color">
            Outra cor
            <input
              aria-label="Cor personalizada"
              type="color"
              value={currentColor}
              onChange={(e) => setColor(e.target.value)}
            />
          </label>
        </>
      )}
    </div>
  );
}
