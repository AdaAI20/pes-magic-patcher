import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";

export default function MainLayout() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar takes fixed space, content gets margin */}
      <Sidebar />

      {/* Wrap right side */}
      <div className="flex-1 ml-60 flex flex-col">
        <TopNavbar />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
