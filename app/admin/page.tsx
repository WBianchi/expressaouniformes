import "./admin-legacy.css";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { adminConfigured, isAdmin } from "@/lib/admin-auth";
import { asaasMode } from "@/lib/asaas";
import { frenetConfigured } from "@/lib/frenet";
import { listOrders } from "@/lib/order-lookup";
import { hasDatabase } from "@/lib/orders";

export const metadata = {
  title: "Painel da fábrica",
  robots: { index: false, follow: false },
};

export default async function Page() {
  if (!(await isAdmin())) return <AdminLogin configured={adminConfigured()} />;
  const result = await listOrders();
  return (
    <AdminDashboard
      orders={result.orders}
      source={result.source}
      error={result.error}
      integrations={{
        asaas: asaasMode(),
        frenet: frenetConfigured(),
        database: hasDatabase(),
        webhook: !!process.env.ASAAS_WEBHOOK_TOKEN,
      }}
    />
  );
}
