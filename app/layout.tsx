import type { Metadata } from "next";
import { Toaster } from "sonner";
import StoreProvider from "@/components/store/StoreProvider";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "Expressão Uniformes | Sua marca veste bem.",
    template: "%s | Expressão Uniformes",
  },
  description:
    "Uniformes personalizados para a sua equipe. Explore o catálogo e crie a sua personalização no estúdio Expressão.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <StoreProvider>{children}</StoreProvider>
        <Toaster richColors position="bottom-center" />
      </body>
    </html>
  );
}
