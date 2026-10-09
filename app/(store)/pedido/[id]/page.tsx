import type { Metadata } from "next";
import { OrderConfirmation } from "@/components/checkout/OrderConfirmation";

export const metadata: Metadata = {
  title: "Pedido",
  robots: { index: false },
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let raw = id;
  try {
    raw = decodeURIComponent(id);
  } catch {
    /* mantém o valor original */
  }
  const safe = raw.replace(/[^A-Za-z0-9-]/g, "").slice(0, 40);
  return <OrderConfirmation id={safe} />;
}
