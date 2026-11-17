import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MiniCart } from "@/components/layout/MiniCart";
import { FavoritesDrawer } from "@/components/layout/FavoritesDrawer";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { WhatsAppFab } from "@/components/layout/WhatsAppFab";
import { MediaProvider } from "@/components/store/MediaProvider";
import { getCategoryPhotos, getPhotoOverrides } from "@/lib/site-media";
import { syncCatalog } from "@/lib/listings-server";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  // o rodapé (servidor) lista as categorias: com os nomes e as categorias novas do painel
  const [photos, categories] = await Promise.all([getPhotoOverrides(), getCategoryPhotos(), syncCatalog()]);
  return (
    <MediaProvider photos={photos} categories={categories}>
      <a href="#conteudo" className="sr-only">
        Pular para o conteúdo
      </a>
      <Header />
      <main id="conteudo">{children}</main>
      <Footer />
      <MiniCart />
      <FavoritesDrawer />
      <MobileMenu />
      <MobileTabBar />
      <WhatsAppFab />
    </MediaProvider>
  );
}
