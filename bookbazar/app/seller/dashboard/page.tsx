import Sidebar from "@/components/dashboard/Sidebar";

export default function DashboardPage() {
  return (
    <div className="flex">
      <Sidebar />

      <main className="flex-1 p-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </main>
    </div>
  );
}