import { Outlet } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

export const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header */}
      <Header />

      <div className="flex flex-1">
        {/* Sidebar (left) */}
        <Sidebar />

        {/* Main content area */}
        <main className="flex-1 p-8 overflow-y-auto">
          {/* This renders the child route */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};
