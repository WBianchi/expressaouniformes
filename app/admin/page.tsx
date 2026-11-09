import "./admin-legacy.css";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { adminConfigured, isAdmin } from "@/lib/admin-auth";
import { asaasMode } from "@/lib/asaas";
import { frenetConfigured } from "@/lib/frenet";
import { listOrders } from "@/lib/order-lookup";
import { hasDatabase } from "@/lib/orders";
import { listBanners, listClientLogos, listPhotoOverrides } from "@/lib/site-media";
import { listLeads } from "@/lib/leads";

export const metadata = {
  title: "Painel da fábrica",
  robots: { index: false, follow: false },
};

export default async function Page() {
  if (!(await isAdmin())) return <AdminLogin configured={adminConfigured()} />;
  const [result, banners, photos, leads, clientLogos] = await Promise.all([
    listOrders(),
    listBanners().catch(() => null),
    listPhotoOverrides().catch(() => ({})),
    listLeads().catch(() => null),
    listClientLogos().catch(() => null),
  ]);
  return (
    <AdminDashboard
      orders={result.orders}
      source={result.source}
      error={result.error}
      banners={banners}
      photos={photos}
      leads={leads}
      clientLogos={clientLogos}
      integrations={{
        asaas: asaasMode(),
        frenet: frenetConfigured(),
        database: hasDatabase(),
        webhook: !!process.env.ASAAS_WEBHOOK_TOKEN,
      }}
    />
  );
}
