import { Outlet } from "react-router-dom";
import { useState } from "react";
import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
      />

      {/* Content shifts dynamically */}
      <div
        className={`transition-all duration-300 ${
          collapsed ? "ml-16" : "ml-60"
        }`}
      >
        <TopNavbar />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
