import Catalog from "@/components/store/Catalog";
export const metadata = { title: "Loja" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const p = await searchParams;
  return (
    <Catalog
      key={JSON.stringify(p)}
      initialCategory={typeof p.categoria === "string" ? p.categoria : "Todos"}
      initialQuery={typeof p.q === "string" ? p.q : ""}
      onlyFavorites={p.favoritos === "1"}
    />
  );
}
