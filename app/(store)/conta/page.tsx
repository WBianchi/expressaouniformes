import type { Metadata } from "next";
import AccountView from "@/components/account/AccountView";
import { ACCOUNT_BANNER_DEFAULT } from "@/lib/site-content";
import { getSiteContent } from "@/lib/site-media";

export const metadata: Metadata = {
  title: "Minha conta",
  description: "Acompanhe pedidos, aprove layouts e gerencie endereços e favoritos.",
  robots: { index: false, follow: false },
};

export default async function Page() {
  // foto do banner trocada no painel (Banners → Banner da Minha conta)
  const { accountBanner } = await getSiteContent();
  return <AccountView banner={accountBanner || ACCOUNT_BANNER_DEFAULT} />;
}
