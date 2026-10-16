import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Sora } from "next/font/google";
import { Toaster } from "sonner";
import StoreProvider from "@/components/store/StoreProvider";
import "./globals.css";

const body = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const heading = Sora({ subsets: ["latin"], variable: "--font-heading", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Expressão Uniformes | Uniformes profissionais para sua empresa",
    template: "%s | Expressão Uniformes",
  },
  description:
    "Uniformes em estoque prontos para personalizar com sua logo e orçamento de uniformes para empresas. Polos, camisetas, calças, jalecos e mais.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#070e19" },
  ],
};

// Aplica o tema salvo antes da primeira pintura (evita flash claro/escuro).
const themeScript = `try{var t=localStorage.getItem("eu-theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${body.variable} ${heading.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <StoreProvider>{children}</StoreProvider>
        <Toaster richColors closeButton position="bottom-right" offset={{ bottom: 96, right: 24 }} mobileOffset={{ bottom: 96 }} toastOptions={{ style: { fontFamily: "var(--font-sans)" } }} />
      </body>
    </html>
  );
}
