"use client";
import { defaultGarment, fabrics, type Garment } from "@/lib/garment";
export function GarmentOptions({
  value = defaultGarment,
  onChange,
}: {
  value?: Garment;
  onChange: (value: Garment) => void;
}) {
  function update(patch: Partial<Garment>) {
    onChange({ ...value, ...patch });
  }
  return (
    <fieldset className="garment-options">
      <legend>Acabamentos e tecido</legend>
      <label className="garment-toggle">
        <input
          type="checkbox"
          checked={value.collarEnabled}
          onChange={(e) => update({ collarEnabled: e.target.checked })}
        />
        Personalizar gola
      </label>
      {value.collarEnabled && (
        <label className="garment-color">
          Cor da gola
          <input
            type="color"
            value={value.collarColor}
            onChange={(e) => update({ collarColor: e.target.value })}
          />
        </label>
      )}
      <label className="garment-toggle">
        <input
          type="checkbox"
          checked={value.sleevesEnabled}
          onChange={(e) => update({ sleevesEnabled: e.target.checked })}
        />
        Personalizar mangas
      </label>
      {value.sleevesEnabled && (
        <>
          <label className="field-label">
            Detalhe das mangas
            <select
              value={value.sleeveDetail}
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
          <label className="garment-color">
            Cor das mangas
            <input
              type="color"
              value={value.sleeveColor}
              onChange={(e) => update({ sleeveColor: e.target.value })}
            />
          </label>
        </>
      )}
      <label className="field-label">
        Tecido
        <select
          value={value.fabric}
          onChange={(e) =>
            update({ fabric: e.target.value as Garment["fabric"] })
          }
        >
          {Object.entries(fabrics).map(([id, f]) => (
            <option key={id} value={id}>
              {f.name}
            </option>
          ))}
        </select>
      </label>
      <p className="muted small-text">
        {fabrics[value.fabric].description}. Textura ilustrativa; confirme as
        amostras com a fábrica. As opções não alteram o preço demonstrativo.
      </p>
    </fieldset>
  );
}
