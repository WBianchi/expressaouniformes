import AdminDashboard from "@/components/admin/AdminDashboard";
export const metadata = {
  title: "Administração · demonstração",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <AdminDashboard />;
}
