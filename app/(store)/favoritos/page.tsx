import type { Metadata } from "next";
import Favorites from "@/components/catalog/Favorites";

export const metadata: Metadata = {
  title: "Favoritos",
  robots: { index: false },
};

export default function FavoritosPage() {
  return <Favorites />;
}
