import type { Metadata } from "next";
import { CheckoutFlow } from "@/components/checkout/CheckoutFlow";

export const metadata: Metadata = {
  title: "Finalizar compra",
  robots: { index: false },
};

export default function Page() {
  return <CheckoutFlow />;
}
