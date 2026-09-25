"use client";
import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { IText } from "fabric";
import { GarmentOptions } from "./GarmentOptions";
import { AiArt } from "./AiArt";
import { useStudio } from "./useStudio";
import {
  X,
  Type,
  Upload,
  Undo2,
  Redo2,
  Trash2,
  AlignCenter,
  Download,
  Save,
  Layers,
  Box,
  MousePointer2,
  Check,
  ShoppingBag,
  ArrowUp,
  ArrowDown,
  ZoomIn,
  ZoomOut,
  Maximize,
} from "lucide-react";
import { type Product, type Design, colors, money } from "@/lib/catalog";
import ShirtPreview from "./ShirtPreview";
export default function StudioModal({
  product,
  initial,
  onClose,
  onAdd,
}: {
  product: Product;
  initial?: Design;
  onClose: () => void;
  onAdd: (d: Design) => void;
}) {
  const {
    design,
    setDesign,
    side,
    mode,
    setMode,
    objects,
    selected,
    setSelected,
    ready,
    historyIndex,
    historyLength,
    element,
    fabric,
    file,
    state,
    sync,
    changeSide,
    undo,
    mutate,
    addText,
    upload,
    property,
    save,
    restore,
    download,
    total,
    textObject,
  } = useStudio(product, initial);
  const stageRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(0.5);
  const [viewZoom, setViewZoom] = useState({ "2d": 1, "3d": 1 });
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new ResizeObserver(([entry]) => {
      setFitScale(
        Math.max(
          0.1,
          Math.min(
            (entry.contentRect.width - 32) / 850,
            (entry.contentRect.height - 40) / 850,
          ),
        ),
      );
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, [ready]);
  const currentZoom = viewZoom[mode];
  function adjustZoom(delta: number) {
    setViewZoom((previous) => ({
      ...previous,
      [mode]: Math.max(
        0.5,
        Math.min(2, Math.round((previous[mode] + delta) * 10) / 10),
      ),
    }));
  }
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="studio-overlay" />
        <Dialog.Content
          className="studio-modal"
          aria-describedby="studio-description"
        >
          <header className="studio-header">
            <div className="studio-title">
              <span className="studio-logo">e.</span>
              <div>
                <Dialog.Title>
                  Estúdio Expressão <span>BETA</span>
                </Dialog.Title>
                <Dialog.Description id="studio-description">
                  {product.name} · Crie uma expressão só sua
                </Dialog.Description>
              </div>
            </div>
            <div className="studio-header-actions">
              <button className="button secondary small" onClick={save}>
                <Save size={16} /> Salvar rascunho
              </button>
              <Dialog.Close className="icon-button" aria-label="Fechar estúdio">
                <X />
              </Dialog.Close>
            </div>
          </header>
          <div className="studio-body">
            <aside className="studio-tools">
              <span className="eyebrow">SUA PEÇA</span>
              <h3>Comece pela cor</h3>
              <div className="swatches">
                {colors.map((c) => (
                  <button
                    key={c.hex}
                    title={c.name}
                    aria-label={c.name}
                    aria-pressed={design.color === c.hex}
                    style={{ background: c.hex }}
                    onClick={() => setDesign((d) => ({ ...d, color: c.hex }))}
                  >
                    {design.color === c.hex && (
                      <Check
                        size={17}
                        color={c.hex === "#e5e1d8" ? "#123" : "#fff"}
                      />
                    )}
                  </button>
                ))}
              </div>
              <p className="muted small-text">
                {colors.find((c) => c.hex === design.color)?.name}
              </p>
              <hr />
              <span className="eyebrow">DÊ SEU TOQUE</span>
              <button
                className="tool-tile"
                onClick={() => file.current?.click()}
                disabled={!ready}
              >
                <Upload size={21} />
                <span>
                  <strong>Adicionar logo</strong>
                  <small>PNG, JPG ou WebP · até 4 MB</small>
                </span>
              </button>
              <input
                type="file"
                ref={file}
                hidden
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => {
                  void upload(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              <button className="tool-tile" onClick={addText} disabled={!ready}>
                <Type size={22} />
                <span>
                  <strong>Adicionar texto</strong>
                  <small>Nome, frase ou assinatura</small>
                </span>
              </button>
              <AiArt disabled={!ready} onUse={upload} />
              <GarmentOptions
                value={design.garment}
                onChange={(garment) => setDesign((d) => ({ ...d, garment }))}
              />
              <hr />
              <label className="field-label">
                Técnica de personalização
                <select
                  value={design.technique}
                  onChange={(e) =>
                    setDesign((d) => ({ ...d, technique: e.target.value }))
                  }
                >
                  <option>Silk</option>
                  <option>Bordado</option>
                  <option>Sublimação</option>
                </select>
              </label>
              <div className="studio-tip">
                <ShieldNote />A prévia ajuda a visualizar sua ideia. A fábrica
                confere a viabilidade e o arquivo antes da produção.
              </div>
              <button className="text-button" onClick={restore}>
                Abrir rascunho deste navegador
              </button>
            </aside>
            <section className="studio-workspace">
              <div className="workspace-top">
                <div className="segmented">
                  <button
                    className={mode === "2d" ? "active" : ""}
                    onClick={() => setMode("2d")}
                  >
                    <MousePointer2 size={15} /> Editar em 2D
                  </button>
                  <button
                    className={mode === "3d" ? "active" : ""}
                    onClick={() => {
                      sync(false);
                      setMode("3d");
                    }}
                  >
                    <Box size={16} /> Visualizar 3D
                  </button>
                </div>
                <div className="history-tools">
                  <button
                    className="icon-button"
                    aria-label="Desfazer"
                    disabled={historyIndex === 0}
                    onClick={() => void undo(-1)}
                  >
                    <Undo2 size={18} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label="Refazer"
                    disabled={historyIndex >= historyLength - 1}
                    onClick={() => void undo(1)}
                  >
                    <Redo2 size={18} />
                  </button>
                </div>
              </div>
              <div
                className="zoom-controls"
                role="group"
                aria-label="Zoom da visualização"
              >
                <button
                  className="icon-button"
                  aria-label="Afastar"
                  disabled={currentZoom <= 0.5}
                  onClick={() => adjustZoom(-0.1)}
                >
                  <ZoomOut size={18} />
                </button>
                <output aria-live="polite">
                  {Math.round(currentZoom * 100)}%
                </output>
                <button
                  className="icon-button"
                  aria-label="Aproximar"
                  disabled={currentZoom >= 2}
                  onClick={() => adjustZoom(0.1)}
                >
                  <ZoomIn size={18} />
                </button>
                <button
                  className="icon-button"
                  aria-label="Enquadrar camiseta inteira"
                  title="Enquadrar camiseta inteira"
                  onClick={() =>
                    setViewZoom((previous) => ({ ...previous, [mode]: 1 }))
                  }
                >
                  <Maximize size={18} />
                </button>
              </div>
              <div className="design-stage" ref={stageRef}>
                <div className="studio-scene">
                  <div className="shirt-stage">
                    <ShirtPreview
                      zoom={1000 * fitScale * currentZoom}
                      color={design.color}
                      garment={design.garment}
                      front={mode === "3d" ? design.frontImage : undefined}
                      back={mode === "3d" ? design.backImage : undefined}
                      side={side}
                      interactive={mode === "3d"}
                      allowWheelZoom={false}
                    />
                  </div>
                  <div
                    className="canvas-position"
                    style={{
                      visibility: mode === "2d" ? "visible" : "hidden",
                      transform: `translate(-50%, -50%) scale(${fitScale * currentZoom})`,
                      top: `calc(50% - ${15 * fitScale * currentZoom}px)`,
                    }}
                  >
                    <div className="print-area-label">
                      ÁREA DE PERSONALIZAÇÃO
                    </div>
                    <div className="fabric-frame">
                      <div ref={element} className="fabric-host" />
                    </div>
                  </div>
                </div>
                <span className="stage-hint">
                  {mode === "2d"
                    ? "Selecione um elemento para mover, girar e redimensionar."
                    : "Arraste para girar. Use os controles de zoom para aproximar."}
                </span>
              </div>
              <div className="workspace-bottom">
                <div className="segmented">
                  <button
                    className={side === "front" ? "active" : ""}
                    onClick={() => void changeSide("front")}
                  >
                    Frente
                  </button>
                  <button
                    className={side === "back" ? "active" : ""}
                    onClick={() => void changeSide("back")}
                  >
                    Costas
                  </button>
                </div>
                <span>Modelo demonstrativo de camiseta</span>
              </div>
            </section>
            <aside className="studio-properties">
              <div className="row-between">
                <h3>
                  <Layers size={17} /> Camadas
                </h3>
                <span className="count">{objects.length}</span>
              </div>
              <div className="layers">
                {objects.length === 0 ? (
                  <p className="muted small-text">
                    Adicione sua marca ou um texto a este lado.
                  </p>
                ) : (
                  objects.map((o, i) => (
                    <button
                      className={selected === o ? "active" : ""}
                      key={i}
                      onClick={() => {
                        fabric.current?.setActiveObject(o);
                        fabric.current?.requestRenderAll();
                        setSelected(o);
                      }}
                    >
                      <span>
                        {o instanceof IText ? (
                          <Type size={15} />
                        ) : (
                          <Upload size={15} />
                        )}
                      </span>
                      <span>
                        {o instanceof IText ? o.text : "Logo / imagem"}
                      </span>
                    </button>
                  ))
                )}
              </div>
              {selected && (
                <div className="properties">
                  <span className="eyebrow">PROPRIEDADES</span>
                  {textObject && (
                    <>
                      <label className="field-label">
                        Texto
                        <input
                          value={textObject.text}
                          onChange={(e) => property("text", e.target.value)}
                        />
                      </label>
                      <label className="field-label">
                        Fonte
                        <select
                          value={textObject.fontFamily}
                          onChange={(e) =>
                            property("fontFamily", e.target.value)
                          }
                        >
                          <option>Arial</option>
                          <option>Georgia</option>
                          <option>Verdana</option>
                          <option>Courier New</option>
                        </select>
                      </label>
                      <label className="field-label inline-label">
                        Cor
                        <input
                          type="color"
                          value={String(textObject.fill)}
                          onChange={(e) => property("fill", e.target.value)}
                        />
                      </label>
                    </>
                  )}
                  <div className="position-fields">
                    <label className="field-label">
                      Posição X
                      <input
                        type="number"
                        value={Math.round(selected.left)}
                        onChange={(e) =>
                          property("left", Number(e.target.value) || 0)
                        }
                      />
                    </label>
                    <label className="field-label">
                      Posição Y
                      <input
                        type="number"
                        value={Math.round(selected.top)}
                        onChange={(e) =>
                          property("top", Number(e.target.value) || 0)
                        }
                      />
                    </label>
                  </div>
                  <label className="field-label">
                    Largura: {Math.round(selected.getScaledWidth())} px
                    <input
                      type="range"
                      min="10"
                      max="270"
                      value={Math.min(
                        270,
                        Math.round(selected.getScaledWidth()),
                      )}
                      onChange={(e) =>
                        mutate(() => {
                          selected.scaleToWidth(Number(e.target.value));
                          selected.setCoords();
                        })
                      }
                    />
                  </label>
                  <label className="field-label">
                    Rotação: {Math.round(selected.angle)}°
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      value={selected.angle}
                      onChange={(e) =>
                        property("angle", Number(e.target.value))
                      }
                    />
                  </label>
                  <div className="button-row">
                    <button
                      className="icon-button"
                      title="Centralizar"
                      aria-label="Centralizar elemento"
                      onClick={() => mutate((c) => c.centerObjectH(selected))}
                    >
                      <AlignCenter size={18} />
                    </button>
                    <button
                      className="icon-button"
                      aria-label="Trazer para frente"
                      onClick={() =>
                        mutate((c) => c.bringObjectForward(selected))
                      }
                    >
                      <ArrowUp size={18} />
                    </button>
                    <button
                      className="icon-button"
                      aria-label="Enviar para trás"
                      onClick={() =>
                        mutate((c) => c.sendObjectBackwards(selected))
                      }
                    >
                      <ArrowDown size={18} />
                    </button>
                    <button
                      className="icon-button danger"
                      aria-label="Excluir elemento"
                      onClick={() => mutate((c) => c.remove(selected))}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              )}
              <hr />
              <h3>Vista toda a equipe</h3>
              <p className="muted small-text">
                Distribua as peças por tamanho.
              </p>
              <div className="size-grid">
                {Object.entries(design.sizes).map(([size, n]) => (
                  <label key={size}>
                    {size}
                    <input
                      aria-label={"Quantidade " + size}
                      type="number"
                      min="0"
                      max="9999"
                      value={n}
                      onChange={(e) =>
                        setDesign((d) => ({
                          ...d,
                          sizes: {
                            ...d.sizes,
                            [size]: Math.max(
                              0,
                              Math.min(
                                9999,
                                Math.floor(Number(e.target.value)) || 0,
                              ),
                            ),
                          },
                        }))
                      }
                    />
                  </label>
                ))}
              </div>
              <p className={total < 30 ? "error-text" : "muted small-text"}>
                {total} peças · mínimo de 30 por cor/modelo
              </p>
              <hr />
              <button className="export-button" onClick={() => download(false)}>
                <Download size={16} /> Baixar arte deste lado
              </button>
              <button className="export-button" onClick={() => download(true)}>
                <Download size={16} /> Exportar projeto editável
              </button>
            </aside>
          </div>
          <footer className="studio-footer">
            <div>
              <strong>{money(product.price * total)}</strong>
              <span>
                {total} peças × {money(product.price)} · estimativa
                demonstrativa
              </span>
            </div>
            <button
              className="button primary"
              disabled={total < 30 || !ready}
              onClick={() => {
                sync(false);
                onAdd(state.current);
              }}
            >
              <ShoppingBag size={17} /> Adicionar ao carrinho
            </button>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
function ShieldNote() {
  return <Check size={17} />;
}
