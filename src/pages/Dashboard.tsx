import {
  Users,
  Shield,
  Trophy,
  Package,
  FileDown,
  FileUp,
  FolderOpen,
  Shirt,
  CircleDot,
  UserCircle,
  Zap,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { QuickAction } from "@/components/dashboard/QuickAction";
import { RecentFile } from "@/components/dashboard/RecentFile";
import { Button } from "@/components/ui/button";

const stats = [
  { icon: Users, label: "Players Loaded", value: "5,842", variant: "primary" as const },
  { icon: Shield, label: "Teams", value: "684", variant: "default" as const },
  { icon: Trophy, label: "Leagues", value: "48", variant: "accent" as const },
  { icon: Package, label: "Patches Created", value: "12", variant: "default" as const },
];

const quickActions = [
  {
    icon: FileDown,
    title: "Import Data",
    description: "Load CPK, BIN, TED or option files",
    to: "/import",
    variant: "primary" as const,
  },
  {
    icon: Users,
    title: "Edit Players",
    description: "Modify player stats and attributes",
    to: "/players",
    variant: "default" as const,
  },
  {
    icon: Shield,
    title: "Edit Teams",
    description: "Manage team rosters and settings",
    to: "/teams",
    variant: "default" as const,
  },
  {
    icon: Package,
    title: "Build Patch",
    description: "Create CPK or Sider patch",
    to: "/patch-builder",
    variant: "accent" as const,
  },
];

const recentFiles = [
  { name: "dt36_original.cpk", type: "CPK", date: "2 hours ago", size: "1.2 GB" },
  { name: "EDIT00000000.bin", type: "BIN", date: "Yesterday", size: "45 MB" },
  { name: "team_data.ted", type: "TED", date: "3 days ago", size: "12 MB" },
  { name: "player_faces.cpk", type: "CPK", date: "1 week ago", size: "890 MB" },
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-1">
            Welcome to <span className="text-gradient-primary">PES Editor</span>
          </h1>
          <p className="text-muted-foreground">
            Pro Evolution Soccer 2021 Editing Suite
          </p>
        </div>
        <Button variant="gaming" size="lg" className="gap-2">
          <Zap className="w-5 h-5" />
          Load Game Data
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="section-title">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickActions.map((action, index) => (
              <QuickAction key={index} {...action} />
            ))}
          </div>

          {/* Asset Editors */}
          <h2 className="section-title mt-8">Asset Editors</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <QuickAction
              icon={UserCircle}
              title="Face Editor"
              description="Import and manage player faces"
              to="/faces"
            />
            <QuickAction
              icon={Shirt}
              title="Kit Editor"
              description="Design team uniforms"
              to="/kits"
            />
            <QuickAction
              icon={CircleDot}
              title="Ball Editor"
              description="Import custom balls"
              to="/balls"
            />
          </div>
        </div>

        {/* Recent Files */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Recent Files</h2>
            <Button variant="ghost" size="sm" className="text-primary">
              View All
            </Button>
          </div>
          <div className="card-gaming divide-y divide-border">
            {recentFiles.map((file, index) => (
              <RecentFile key={index} {...file} />
            ))}
          </div>

          {/* File Browser Shortcut */}
          <div className="card-gaming p-5 border-dashed border-2 border-border hover:border-primary/50 transition-colors cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-secondary text-muted-foreground group-hover:bg-primary/15 group-hover:text-primary transition-colors">
                <FolderOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors">
                  Browse Game Files
                </h3>
                <p className="text-sm text-muted-foreground">
                  Explore CPK contents and data files
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Supported Formats */}
      <div className="card-gaming p-6">
        <h2 className="section-title mb-4">Supported Formats</h2>
        <div className="flex flex-wrap gap-3">
          {[".CPK", ".BIN", ".TED", ".DDS", ".FSH", ".PNG", ".XML", ".JSON"].map(
            (format) => (
              <span
                key={format}
                className="px-4 py-2 rounded-full bg-secondary text-sm font-medium text-muted-foreground border border-border hover:border-primary/50 hover:text-primary transition-colors cursor-default"
              >
                {format}
              </span>
            )
          )}
        </div>
      </div>
    </div>
  );
}
