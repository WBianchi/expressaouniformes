/** Ícones simples desenhados em SVG (sem marcas registradas em imagem). */
type P = { size?: number; className?: string };

export function WhatsAppIcon({ size = 22, className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 2.75a9.25 9.25 0 0 0-7.93 14.02L3 21l4.34-1.06A9.25 9.25 0 1 0 12 2.75Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M8.9 7.6c.2-.4.45-.42.7-.42h.55c.17 0 .4.06.58.47l.75 1.8c.07.17.1.37-.02.56l-.5.68c-.12.15-.13.33-.02.5.37.63.84 1.2 1.4 1.66.58.48 1.2.84 1.86 1.08.18.07.37.03.5-.11l.66-.8c.15-.18.38-.23.58-.14l1.76.83c.2.1.33.28.32.5-.03.62-.3 1.24-.82 1.6-.6.42-1.4.57-2.33.33-1.18-.3-2.47-1-3.68-2.1-1.3-1.17-2.2-2.46-2.58-3.68-.32-1.02-.11-1.9.29-2.76Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function PixIcon({ size = 18, className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M12 2.5 21.5 12 12 21.5 2.5 12 12 2.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="m7.5 12 2.6-2.6a2.7 2.7 0 0 1 3.8 0L16.5 12l-2.6 2.6a2.7 2.7 0 0 1-3.8 0L7.5 12Z" fill="currentColor" />
    </svg>
  );
}

export function BarcodeIcon({ size = 18, className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <rect x="3" y="5" width="1.6" height="14" rx=".4" />
      <rect x="6" y="5" width="1" height="14" rx=".4" />
      <rect x="8.5" y="5" width="2.2" height="14" rx=".4" />
      <rect x="12" y="5" width="1" height="14" rx=".4" />
      <rect x="14.5" y="5" width="1.6" height="14" rx=".4" />
      <rect x="17.5" y="5" width="1" height="14" rx=".4" />
      <rect x="19.6" y="5" width="1.4" height="14" rx=".4" />
    </svg>
  );
}

export function CardIcon({ size = 18, className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M2.5 9.5h19" stroke="currentColor" strokeWidth="2.2" />
      <rect x="5.5" y="13.5" width="5" height="2" rx="1" fill="currentColor" />
    </svg>
  );
}
