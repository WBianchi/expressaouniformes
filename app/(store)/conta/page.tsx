import type { Metadata } from "next";
import AccountView from "@/components/account/AccountView";

export const metadata: Metadata = {
  title: "Minha conta",
  description: "Acompanhe pedidos, aprove layouts e gerencie endereços e favoritos.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AccountView />;
}
