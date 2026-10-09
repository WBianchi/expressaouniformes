"use client";
import { useId } from "react";
import { colorHex, type Brief } from "./config";

/** Prévia ilustrativa (não é simulador): camadas em SVG que reagem às escolhas do briefing. */

type Props = {
  brief: Pick<Brief, "collar" | "sleeve" | "cuff" | "friso" | "colors" | "extras" | "logo" | "positions" | "fabric">;
  view?: "front" | "back";
  className?: string;
  title?: string;
};

const MIRROR = "translate(400 0) scale(-1 1)";

function luminance(hex: string) {
  const n = parseInt(hex.replace("#", ""), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const SLEEVES = {
  Curta: "M114,72 C94,84 74,116 56,150 L100,181 C110,176 118,172 124,168 C121,136 119,104 114,72 Z",
  Longa: "M114,72 C92,88 76,140 66,220 L52,318 L88,324 L98,230 C104,206 114,190 124,168 C121,136 119,104 114,72 Z",
  Raglan: "M170,50 C152,58 128,64 114,72 C94,84 74,116 56,150 L100,181 C110,176 118,172 124,168 C136,126 152,84 170,50 Z",
} as const;

const CUFF = {
  short: { band: "M56,150 L100,181 L107,171 L63,140 Z", stripe: "M59.5,145 L103.5,176", hem: "M63,140 L107,171" },
  long: { band: "M52,318 L88,324 L86,341 L50,335 Z", stripe: "M51,328 L87,334", hem: "M54,308 L90,314" },
};

function neckline(collar: string, view: "front" | "back") {
  if (view === "back") return "M166,48 C182,54 218,54 234,48";
  if (collar === "Gola careca") return "M166,48 C176,76 224,76 234,48";
  if (collar === "Gola V") return "M166,48 L200,104 L234,48";
  return "M166,48 C180,60 220,60 234,48";
}
const bodyPath = (collar: string, view: "front" | "back") =>
  `${neckline(collar, view)} L286,72 C281,104 278,136 276,168 L280,346 Q200,358 120,346 L124,168 C122,136 119,104 114,72 Z`;

export function GarmentPreview({ brief, view = "front", className, title = "Prévia ilustrativa do uniforme" }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const id = (k: string) => `${k}-${uid}`;
  const body = colorHex(brief.colors.body);
  const sleeve = colorHex(brief.colors.sleeve);
  const collar = colorHex(brief.colors.collar);
  const friso = colorHex(brief.colors.friso);
  const has = (e: string) => brief.extras.includes(e);
  const isPolo = brief.collar.startsWith("Polo");
  const isPadre = brief.collar === "Gola padre";
  const placket = view === "front" && (isPolo || isPadre);
  const showFriso = brief.friso || brief.collar === "Polo com friso";
  const doubleFriso = brief.collar === "Polo com friso";
  const long = brief.sleeve === "Longa";
  const cuff = long ? CUFF.long : CUFF.short;
  const sleevePath = SLEEVES[brief.sleeve] ?? SLEEVES.Curta;
  const bPath = bodyPath(brief.collar, view);
  const dark = luminance(body) < 0.22;
  const markColor = dark ? "rgba(255,255,255,.7)" : "rgba(10,22,40,.55)";
  const buttonFill = has("Botões personalizados") ? friso : body;
  const fabricPattern =
    brief.fabric === "Piquet" ? "piquet" : brief.fabric === "Dry fit" ? "dry" : brief.fabric === "Brim" || brief.fabric === "Gabardine" ? "twill" : null;
  const raglan = brief.sleeve === "Raglan";
  const sideColor = has("Recorte bicolor") ? sleeve : null;

  const Logo = ({ x, y, w, rotate }: { x: number; y: number; w: number; rotate?: number }) => (
    <g transform={rotate ? `rotate(${rotate} ${x + w / 2} ${y + w / 2})` : undefined} className="logo-mark">
      {brief.logo?.dataUrl ? (
        <image href={brief.logo.dataUrl} x={x} y={y} width={w} height={w} preserveAspectRatio="xMidYMid meet" />
      ) : (
        <>
          <rect x={x} y={y} width={w} height={w} rx={w * 0.18} fill="none" stroke={markColor} strokeWidth="1.2" strokeDasharray="3 2.5" />
          <text x={x + w / 2} y={y + w / 2 + w * 0.09} textAnchor="middle" fontSize={Math.max(6, w * 0.24)} fontWeight="700" fill={markColor} fontFamily="system-ui, sans-serif" letterSpacing=".5">
            LOGO
          </text>
        </>
      )}
    </g>
  );

  const sleeveSide = (mirror: boolean) => (
    <g transform={mirror ? MIRROR : undefined}>
      <path d={sleevePath} fill={sleeve} stroke="rgba(8,18,36,.32)" strokeWidth="1.2" strokeLinejoin="round" />
      <g clipPath={`url(#${id("sleeveClip")})`}>
        {fabricPattern && <rect x="0" y="0" width="200" height="384" fill={`url(#${id(fabricPattern)})`} />}
        <rect x="0" y="0" width="200" height="384" fill={`url(#${id("sleeveShade")})`} />
        {long && has("Faixa refletiva") && (
          <path d="M44,232 L112,242 L110,256 L42,246 Z" fill={`url(#${id("reflect")})`} stroke="rgba(0,0,0,.15)" strokeWidth=".6" />
        )}
      </g>
      {brief.cuff === "Sem punho" ? (
        <path d={cuff.hem} stroke="rgba(8,18,36,.28)" strokeWidth="1" strokeDasharray="3 2.5" fill="none" />
      ) : (
        <>
          <path d={cuff.band} fill={collar} stroke="rgba(8,18,36,.32)" strokeWidth="1" strokeLinejoin="round" />
          <path d={cuff.band} fill={`url(#${id("rib")})`} />
          {(brief.cuff === "Punho com friso" || (showFriso && brief.cuff !== "Punho liso")) && (
            <path d={cuff.stripe} stroke={friso} strokeWidth="2.6" fill="none" strokeLinecap="butt" />
          )}
        </>
      )}
      {raglan && <path d="M170,50 C152,84 136,126 124,168" stroke={showFriso ? friso : "rgba(8,18,36,.22)"} strokeWidth={showFriso ? 2.2 : 1} fill="none" />}
    </g>
  );

  return (
    <svg viewBox="0 0 400 384" className={className} role="img" aria-label={title}>
      <title>{title}</title>
      <defs>
        <clipPath id={id("bodyClip")}>
          <path d={bPath} />
        </clipPath>
        <clipPath id={id("sleeveClip")}>
          <path d={sleevePath} />
        </clipPath>
        <clipPath id={id("flapClip")}>
          <path d="M200,60 L164,42 C156,46 150,54 147,62 L174,100 Z" />
        </clipPath>
        <linearGradient id={id("shade")} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity=".22" />
          <stop offset=".22" stopColor="#fff" stopOpacity=".05" />
          <stop offset=".45" stopColor="#fff" stopOpacity=".12" />
          <stop offset=".7" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".24" />
        </linearGradient>
        <linearGradient id={id("shadeV")} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".08" />
          <stop offset=".6" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".14" />
        </linearGradient>
        <linearGradient id={id("sleeveShade")} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity=".2" />
          <stop offset=".55" stopColor="#fff" stopOpacity=".07" />
          <stop offset="1" stopColor="#000" stopOpacity=".12" />
        </linearGradient>
        <linearGradient id={id("reflect")} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#aeb6c0" />
          <stop offset=".35" stopColor="#f4f6f9" />
          <stop offset=".6" stopColor="#c9d0d8" />
          <stop offset="1" stopColor="#eef1f5" />
        </linearGradient>
        <pattern id={id("rib")} width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(55)">
          <rect width="1.2" height="3" fill="#000" opacity=".14" />
        </pattern>
        <pattern id={id("piquet")} width="4" height="4" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r=".7" fill="#000" opacity=".1" />
          <circle cx="3" cy="3" r=".7" fill="#fff" opacity=".06" />
        </pattern>
        <pattern id={id("dry")} width="6" height="5" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.2" r=".9" fill="#000" opacity=".09" />
          <circle cx="4.5" cy="3.7" r=".9" fill="#000" opacity=".09" />
        </pattern>
        <pattern id={id("twill")} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)">
          <rect width="4" height="1" fill="#000" opacity=".08" />
        </pattern>
        <filter id={id("drop")} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#0b1a33" floodOpacity=".18" />
        </filter>
        <filter id={id("soft")}>
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
        <radialGradient id={id("floor")}>
          <stop offset="0" stopColor="#0b1a33" stopOpacity=".22" />
          <stop offset="1" stopColor="#0b1a33" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="200" cy="366" rx="130" ry="12" fill={`url(#${id("floor")})`} />

      <g filter={`url(#${id("drop")})`}>
        {/* interior da gola (costas por dentro) */}
        {view === "front" && <path d="M166,48 C182,36 218,36 234,48 L234,72 L166,72 Z" fill={body} />}
        {view === "front" && <path d="M166,48 C182,36 218,36 234,48 L234,72 L166,72 Z" fill="#000" opacity=".32" />}

        {!raglan && sleeveSide(false)}
        {!raglan && sleeveSide(true)}

        {/* corpo */}
        <path d={bPath} fill={body} stroke="rgba(8,18,36,.32)" strokeWidth="1.2" strokeLinejoin="round" />
        <g clipPath={`url(#${id("bodyClip")})`}>
          {sideColor && (
            <>
              <path d="M124,160 L154,176 L150,362 L112,362 Z" fill={sideColor} />
              <path d="M276,160 L246,176 L250,362 L288,362 Z" fill={sideColor} />
              {showFriso && (
                <>
                  <path d="M154,176 L150,362" stroke={friso} strokeWidth="2.4" />
                  <path d="M246,176 L250,362" stroke={friso} strokeWidth="2.4" />
                </>
              )}
            </>
          )}
          {fabricPattern && <rect x="100" y="30" width="200" height="335" fill={`url(#${id(fabricPattern)})`} />}
          {has("Faixa refletiva") && (
            <g stroke="rgba(0,0,0,.14)" strokeWidth=".6">
              <rect x="100" y="268" width="200" height="12" fill={`url(#${id("reflect")})`} />
              <rect x="100" y="292" width="200" height="12" fill={`url(#${id("reflect")})`} />
            </g>
          )}
          <rect x="100" y="30" width="200" height="335" fill={`url(#${id("shade")})`} />
          <rect x="100" y="30" width="200" height="335" fill={`url(#${id("shadeV")})`} />
          <g filter={`url(#${id("soft")})`} fill="none" strokeLinecap="round">
            <path d="M156,214 C162,260 156,300 162,340" stroke="#000" strokeOpacity=".1" strokeWidth="3" />
            <path d="M246,236 C240,280 246,310 240,340" stroke="#000" strokeOpacity=".08" strokeWidth="3" />
            <path d="M200,160 C204,220 198,290 204,340" stroke="#fff" strokeOpacity=".08" strokeWidth="5" />
          </g>
          {/* barra */}
          <path d="M120,338 Q200,350 280,338" stroke="rgba(8,18,36,.22)" strokeWidth="1" strokeDasharray="3 2.5" fill="none" />
        </g>

        {raglan && sleeveSide(false)}
        {raglan && sleeveSide(true)}

        {/* bolso */}
        {view === "front" && has("Bolso") && (
          <g>
            <path d="M222,134 L260,134 L260,168 Q241,176 222,168 Z" fill={body} stroke="rgba(8,18,36,.35)" strokeWidth="1" />
            <path d="M222,134 L260,134 L260,168 Q241,176 222,168 Z" fill="#000" opacity=".06" />
            <path d="M225,138 L257,138" stroke="rgba(8,18,36,.28)" strokeWidth=".8" strokeDasharray="2.5 2" />
            {showFriso && <path d="M222,134 L260,134" stroke={friso} strokeWidth="2.4" />}
          </g>
        )}

        {/* vista e botões */}
        {placket && (
          <g>
            <rect x="191" y="56" width="18" height={isPadre ? 120 : 70} rx="2" fill={body} stroke="rgba(8,18,36,.35)" strokeWidth="1" />
            <rect x="191" y="56" width="18" height={isPadre ? 120 : 70} rx="2" fill="#000" opacity=".05" />
            {(isPadre ? [70, 94, 118, 142, 166] : [76, 96, 114]).map((cy) => (
              <g key={cy}>
                <circle cx="200" cy={cy} r="3.8" fill={buttonFill} stroke="rgba(8,18,36,.45)" strokeWidth=".9" />
                <circle cx="199" cy={cy - 1} r="1.1" fill="#fff" opacity=".35" />
              </g>
            ))}
          </g>
        )}

        {/* golas */}
        {view === "front" && isPolo && (
          <g>
            <path d="M162,48 C172,30 228,30 238,48 C226,42 174,42 162,48 Z" fill={collar} stroke="rgba(8,18,36,.35)" strokeWidth="1" />
            <path d="M162,48 C172,30 228,30 238,48 C226,42 174,42 162,48 Z" fill="#000" opacity=".18" />
            {[false, true].map((m) => (
              <g key={String(m)} transform={m ? MIRROR : undefined}>
                <path d="M200,60 L164,42 C156,46 150,54 147,62 L174,100 Z" fill={collar} stroke="rgba(8,18,36,.38)" strokeWidth="1" strokeLinejoin="round" />
                <g clipPath={`url(#${id("flapClip")})`}>
                  <rect x="140" y="30" width="70" height="80" fill={`url(#${id("rib")})`} opacity=".6" />
                  {showFriso && <path d="M152,58 L180,96" stroke={friso} strokeWidth="2.6" />}
                  {doubleFriso && <path d="M158,56 L185,93" stroke={friso} strokeWidth="1.6" />}
                  <path d="M147,62 L174,100" stroke="#000" strokeOpacity=".15" strokeWidth="3" />
                </g>
              </g>
            ))}
          </g>
        )}
        {view === "back" && isPolo && (
          <g>
            <path d="M162,50 C174,34 226,34 238,50 L238,60 C226,48 174,48 162,60 Z" fill={collar} stroke="rgba(8,18,36,.38)" strokeWidth="1" />
            <path d="M162,50 C174,34 226,34 238,50 L238,60 C226,48 174,48 162,60 Z" fill={`url(#${id("rib")})`} opacity=".6" />
            {showFriso && <path d="M163,56 C175,43 225,43 237,56" stroke={friso} strokeWidth="2.4" fill="none" />}
          </g>
        )}
        {isPadre && (
          <g>
            {view === "front" ? (
              <>
                <path d="M168,38 C182,28 218,28 232,38 L230,44 C218,36 182,36 170,44 Z" fill={collar} />
                <path d="M168,38 C182,28 218,28 232,38 L230,44 C218,36 182,36 170,44 Z" fill="#000" opacity=".25" />
                <path d="M168,52 C182,62 218,62 232,52 L232,40 C218,48 182,48 168,40 Z" fill={collar} stroke="rgba(8,18,36,.38)" strokeWidth="1" />
                {showFriso && <path d="M168,43 C182,51 218,51 232,43" stroke={friso} strokeWidth="2" fill="none" />}
              </>
            ) : (
              <>
                <path d="M166,50 C182,56 218,56 234,50 L234,38 C218,44 182,44 166,38 Z" fill={collar} stroke="rgba(8,18,36,.38)" strokeWidth="1" />
                {showFriso && <path d="M166,41 C182,47 218,47 234,41" stroke={friso} strokeWidth="2" fill="none" />}
              </>
            )}
          </g>
        )}
        {(brief.collar === "Gola careca" || brief.collar === "Gola V") && (
          <g fill="none" strokeLinecap="round" strokeLinejoin="miter">
            {view === "front" && <path d="M166,48 C182,38 218,38 234,48" stroke={collar} strokeWidth="7" />}
            {view === "front" && <path d="M166,48 C182,38 218,38 234,48" stroke="#000" strokeOpacity=".25" strokeWidth="7" />}
            <path d={neckline(brief.collar, view)} stroke="rgba(8,18,36,.35)" strokeWidth="11" />
            <path d={neckline(brief.collar, view)} stroke={collar} strokeWidth="9.4" />
            {showFriso && <path d={neckline(brief.collar, view)} stroke={friso} strokeWidth="2.4" />}
          </g>
        )}

        {/* etiqueta de barra */}
        {has("Etiqueta própria") && (
          <g>
            <rect x={view === "front" ? 128 : 262} y="322" width="11" height="17" rx="1.5" fill="#fbfaf6" stroke="#c98d12" strokeWidth="1" />
            <path d={view === "front" ? "M130.5,327 h6 M130.5,331 h6" : "M264.5,327 h6 M264.5,331 h6"} stroke="#c98d12" strokeWidth=".9" />
          </g>
        )}

        {/* logos */}
        {view === "front" && brief.positions.includes("Peito esquerdo") && (
          <Logo x={226} y={has("Bolso") ? 100 : 106} w={has("Bolso") ? 28 : 34} />
        )}
        {view === "front" && brief.positions.includes("Peito direito") && <Logo x={140} y={106} w={34} />}
        {view === "front" && brief.positions.includes("Manga") && <Logo x={long ? 84 : 78} y={long ? 120 : 108} w={22} rotate={long ? 8 : 34} />}
        {view === "back" && brief.positions.includes("Costas") && <Logo x={156} y={96} w={88} />}
      </g>
    </svg>
  );
}
