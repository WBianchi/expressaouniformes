// Barra de condições embaixo do banner da home ("Compra 100% segura", "Frete grátis acima de…").
// Ícones e textos editados no painel (Banners → Barra de condições).
import { Award, BadgePercent, Clock, CreditCard, Factory, Gift, Headset, Package, ShieldCheck, Shirt, Star, Truck, type LucideIcon } from "lucide-react";
import type { BenefitIcon, Benefits } from "@/lib/site-content";
import s from "./BenefitsBar.module.css";

const ICONS: Record<BenefitIcon, LucideIcon> = {
  percent: BadgePercent,
  shield: ShieldCheck,
  card: CreditCard,
  truck: Truck,
  factory: Factory,
  clock: Clock,
  award: Award,
  headset: Headset,
  package: Package,
  shirt: Shirt,
  gift: Gift,
  star: Star,
};

export function BenefitIconView({ icon, size = 24 }: { icon: BenefitIcon; size?: number }) {
  const Icon = ICONS[icon] ?? Star;
  return <Icon size={size} strokeWidth={1.5} aria-hidden />;
}

export function BenefitsBar({ benefits }: { benefits: Benefits }) {
  if (!benefits.active || !benefits.items.length) return null;
  return (
    <section className={s.bar} aria-label="Condições da loja">
      <ul className={`container ${s.list}`} data-count={benefits.items.length}>
        {benefits.items.map((b, i) => (
          <li key={i}>
            <BenefitIconView icon={b.icon} />
            <span>{b.text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
