"use client";
import { useState } from "react";
import { Sparkles } from "lucide-react";

export function AiArt({
  disabled,
  onUse,
}: {
  disabled: boolean;
  onUse: (file: File) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [image, setImage] = useState("");
  async function generate() {
    setBusy(true);
    setError("");
    setImage("");
    try {
      const response = await fetch("/api/studio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Não foi possível gerar a arte.");
      setImage(data.image);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha na conexão.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <button
        className="tool-tile"
        disabled={disabled}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <Sparkles size={22} />
        <span>
          <strong>Gerar com IA</strong>
          <small>Transforme sua ideia em uma arte</small>
        </span>
      </button>
      {open && (
        <div className="ai-art-panel">
          <label className="field-label">
            Descreva sua arte
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              maxLength={800}
              placeholder="Um emblema azul e amarelo para uma equipe de manutenção…"
              rows={4}
            />
          </label>
          <p className="muted small-text">
            A descrição será enviada à OpenAI. Revise a arte antes de aplicar.
            Até 3 tentativas por dia.
          </p>
          <button
            className="button primary small"
            disabled={busy || prompt.trim().length < 8}
            onClick={() => void generate()}
          >
            {busy ? "Gerando arte…" : "Gerar arte"}
          </button>
          {error && (
            <p role="alert" className="small-text">
              {error}
            </p>
          )}
          {image && (
            <>
              <img
                src={image}
                alt="Arte gerada para revisão"
                style={{ width: "100%", borderRadius: 12 }}
              />
              <button
                className="button secondary small"
                disabled={disabled}
                onClick={async () => {
                  const blob = await (await fetch(image)).blob();
                  await onUse(
                    new File([blob], "arte-ia.png", { type: "image/png" }),
                  );
                }}
              >
                Usar na camiseta
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
