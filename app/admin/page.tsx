import "./admin-legacy.css";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { adminConfigured, isAdmin } from "@/lib/admin-auth";
import { asaasMode } from "@/lib/asaas";
import { frenetConfigured } from "@/lib/frenet";
import { listOrders } from "@/lib/order-lookup";
import { hasDatabase } from "@/lib/orders";
import { listBanners, listCategoryPhotos, listClientLogos, listPhotoOverrides, listSiteContent } from "@/lib/site-media";
import { listLeads } from "@/lib/leads";
import { listCatalogEdits } from "@/lib/listings-server";
import { NO_EDITS } from "@/lib/catalog";

export const metadata = {
  title: "Painel da fábrica",
  robots: { index: false, follow: false },
};

export default async function Page() {
  if (!(await isAdmin())) return <AdminLogin configured={adminConfigured()} />;
  const [result, banners, photos, leads, clientLogos, categoryPhotos, edits, siteContent] = await Promise.all([
    listOrders(),
    listBanners().catch(() => null),
    listPhotoOverrides().catch(() => ({})),
    listLeads().catch(() => null),
    listClientLogos().catch(() => null),
    listCategoryPhotos().catch(() => ({})),
    listCatalogEdits().catch(() => NO_EDITS),
    listSiteContent().catch(() => null),
  ]);
  return (
    <AdminDashboard
      orders={result.orders}
      source={result.source}
      error={result.error}
      banners={banners}
      photos={photos}
      categoryPhotos={categoryPhotos}
      edits={edits}
      leads={leads}
      clientLogos={clientLogos}
      siteContent={siteContent}
      integrations={{
        asaas: asaasMode(),
        frenet: frenetConfigured(),
        database: hasDatabase(),
        webhook: !!process.env.ASAAS_WEBHOOK_TOKEN,
      }}
    />
  );
}
