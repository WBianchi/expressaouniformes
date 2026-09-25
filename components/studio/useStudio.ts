"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Canvas, FabricImage, IText, FabricObject } from "fabric";
import { toast } from "sonner";
import { designSchema } from "@/lib/design-validation";
import {
  type Product,
  type Design,
  type Side,
  newDesign,
  quantity,
} from "@/lib/catalog";
export function useStudio(product: Product, initial?: Design) {
  const [design, setDesign] = useState<Design>(
      () => initial || newDesign(product),
    ),
    [side, setSide] = useState<Side>("front"),
    [mode, setMode] = useState<"2d" | "3d">("2d"),
    [objects, setObjects] = useState<FabricObject[]>([]),
    [selected, setSelected] = useState<FabricObject | null>(null),
    [, setTick] = useState(0),
    [ready, setReady] = useState(false),
    [historyIndex, setHistoryIndex] = useState(0),
    [historyLength, setHistoryLength] = useState(1);
  const [canvasHost, setCanvasHost] = useState<HTMLDivElement | null>(null);
  const element = useCallback(
    (node: HTMLDivElement | null) => setCanvasHost(node),
    [],
  );
  const fabric = useRef<Canvas | null>(null),
    file = useRef<HTMLInputElement>(null),
    state = useRef(design),
    sideRef = useRef<Side>("front"),
    history = useRef<string[]>([]),
    index = useRef(0),
    restoring = useRef(false),
    generation = useRef(0);
  useEffect(() => {
    state.current = design;
  }, [design]);
  const sync = useCallback((record = true) => {
    const c = fabric.current;
    if (!c) return;
    const json = JSON.stringify(c.toJSON());
    const image = c.toDataURL({ format: "png", multiplier: 2 });
    const next = {
      ...state.current,
      [sideRef.current]: json,
      [sideRef.current + "Image"]: image,
    };
    state.current = next;
    setDesign(next);
    setObjects([...c.getObjects()].reverse());
    setSelected(c.getActiveObject() || null);
    setTick((t) => t + 1);
    if (record && !restoring.current) {
      history.current = [
        ...history.current.slice(0, index.current + 1),
        json,
      ].slice(-40);
      index.current = history.current.length - 1;
      setHistoryIndex(index.current);
      setHistoryLength(history.current.length);
    }
  }, []);
  useEffect(() => {
    if (!canvasHost) return;
    setReady(false);
    let disposed = false;
    // Radix mounts its portal after the parent effect. Initialize when the host exists.
    // Fabric owns all descendants; React never reconciles its wrapped canvas nodes.
    const canvasElement = document.createElement("canvas");
    canvasElement.setAttribute(
      "aria-label",
      "Área de edição da personalização",
    );
    canvasHost.appendChild(canvasElement);
    const c = new Canvas(canvasElement, {
      width: 270,
      height: 320,
      preserveObjectStacking: true,
      selectionColor: "rgba(38,96,205,.1)",
    });
    fabric.current = c;
    FabricObject.ownDefaults.cornerColor = "#2460ce";
    FabricObject.ownDefaults.borderColor = "#2460ce";
    FabricObject.ownDefaults.cornerStyle = "circle";
    FabricObject.ownDefaults.transparentCorners = false;
    const update = () => sync();
    const selection = () => {
      setSelected(c.getActiveObject() || null);
      setTick((t) => t + 1);
    };
    c.on("object:modified", update);
    c.on("text:changed", update);
    c.on("selection:created", selection);
    c.on("selection:updated", selection);
    c.on("selection:cleared", selection);
    const load = async () => {
      if (state.current.front)
        await c.loadFromJSON(JSON.parse(state.current.front));
      else {
        c.add(
          new IText("SUA MARCA", {
            left: 135,
            top: 65,
            originX: "center",
            fontSize: 22,
            fontFamily: "Arial",
            fontWeight: "bold",
            fill: "#ffffff",
          }),
        );
      }
      if (disposed) return;
      c.renderAll();
      history.current = [JSON.stringify(c.toJSON())];
      index.current = 0;
      sync(false);
      setReady(true);
    };
    load().catch((error) => {
      if (disposed) return;
      console.error("[studio] Failed to initialize editor", error);
      toast.error("Não foi possível abrir a arte. Feche e reabra o estúdio.");
    });
    return () => {
      disposed = true;
      generation.current++;
      if (fabric.current === c) fabric.current = null;
      void c.dispose().catch(() => {});
      canvasElement.remove();
    };
  }, [canvasHost, sync]);
  async function changeSide(next: Side) {
    if (next === side || !fabric.current || restoring.current) return;
    sync(false);
    restoring.current = true;
    const c = fabric.current;
    sideRef.current = next;
    setSide(next);
    c.clear();
    try {
      const json = state.current[next];
      if (json) await c.loadFromJSON(JSON.parse(json));
      c.renderAll();
      history.current = [JSON.stringify(c.toJSON())];
      index.current = 0;
      setHistoryIndex(0);
      setHistoryLength(1);
      sync(false);
    } catch {
      toast.error("Não foi possível carregar este lado.");
    } finally {
      restoring.current = false;
    }
  }
  async function undo(delta: number) {
    const c = fabric.current;
    const next = index.current + delta;
    if (!c || next < 0 || next >= history.current.length || restoring.current)
      return;
    restoring.current = true;
    try {
      await c.loadFromJSON(JSON.parse(history.current[next]));
      index.current = next;
      setHistoryIndex(next);
      c.renderAll();
      sync(false);
    } catch {
      toast.error("Não foi possível restaurar esta etapa.");
    } finally {
      restoring.current = false;
    }
  }
  function mutate(fn: (c: Canvas) => void) {
    if (!fabric.current || restoring.current) return;
    fn(fabric.current);
    fabric.current.requestRenderAll();
    sync();
  }
  function addText() {
    setMode("2d");
    mutate((c) => {
      const t = new IText("Seu texto", {
        left: 40,
        top: 140,
        fontSize: 24,
        fontFamily: "Arial",
        fill: "#ffffff",
      });
      c.add(t);
      c.setActiveObject(t);
    });
  }
  async function upload(f?: File) {
    if (!f) return;
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(f.type) ||
      f.size > 4 * 1024 * 1024
    ) {
      toast.error("Use PNG, JPG ou WebP de até 4 MB.");
      return;
    }
    const gen = generation.current;
    const targetSide = sideRef.current;
    const reader = new FileReader();
    reader.onerror = () => toast.error("Falha ao ler o arquivo.");
    reader.onload = async () => {
      try {
        const img = await FabricImage.fromURL(String(reader.result));
        if (gen !== generation.current || targetSide !== sideRef.current)
          return;
        if (img.width > 10000 || img.height > 10000) {
          toast.error("A imagem deve ter até 10.000 pixels por lado.");
          return;
        }
        img.scaleToWidth(120);
        img.set({ left: 75, top: 80 });
        setMode("2d");
        mutate((c) => {
          c.add(img);
          c.setActiveObject(img);
        });
      } catch {
        toast.error("Imagem inválida ou não suportada.");
      }
    };
    reader.readAsDataURL(f);
  }
  function property(key: string, value: string | number) {
    mutate(() => {
      selected?.set(key, value);
      selected?.setCoords();
    });
  }
  function save() {
    sync(false);
    try {
      localStorage.setItem(
        "expressao-draft-" + product.id,
        JSON.stringify(state.current),
      );
      toast.success("Rascunho salvo neste navegador.");
    } catch {
      toast.error("Sem espaço local. Baixe o projeto para preservar sua arte.");
    }
  }
  async function restore() {
    try {
      const saved = localStorage.getItem("expressao-draft-" + product.id);
      if (!saved) {
        toast.info("Nenhum rascunho salvo para esta peça.");
        return;
      }
      const d = designSchema.parse(JSON.parse(saved)) as Design;
      if (d.version !== 1 || d.productId !== product.id) throw new Error();
      state.current = d;
      setDesign(d);
      sideRef.current = "front";
      setSide("front");
      const c = fabric.current;
      if (c) {
        c.clear();
        if (d.front) await c.loadFromJSON(JSON.parse(d.front));
        c.renderAll();
        history.current = [JSON.stringify(c.toJSON())];
        index.current = 0;
        setHistoryIndex(0);
        setHistoryLength(1);
        sync(false);
      }
      toast.success("Rascunho restaurado.");
    } catch {
      toast.error("Não foi possível restaurar este rascunho.");
    }
  }
  function download(project: boolean) {
    sync(false);
    const a = document.createElement("a");
    const url = project
      ? URL.createObjectURL(
          new Blob([JSON.stringify(state.current, null, 2)], {
            type: "application/json",
          }),
        )
      : fabric.current?.toDataURL({ format: "png", multiplier: 3 });
    if (!url) return;
    a.href = url;
    a.download = `expressao-${product.id}-${project ? "projeto.json" : side + ".png"}`;
    a.click();
    if (project) setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success(
      project
        ? "Projeto exportado."
        : "Arte exportada para conferência. Não é arquivo de máquina.",
    );
  }
  const total = quantity(design.sizes);
  const textObject = selected instanceof IText ? selected : null;
  return {
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
  };
}
