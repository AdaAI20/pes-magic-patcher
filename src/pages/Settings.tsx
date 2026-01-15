import {
  Settings,
  FolderOpen,
  HardDrive,
  Palette,
  Bell,
  Save,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            <span className="text-gradient-primary">Settings</span>
          </h1>
          <p className="text-muted-foreground">
            Configure application preferences
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
          <Button variant="gaming" className="gap-2">
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Game Paths */}
      <div className="card-gaming p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/15 text-primary">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-lg text-foreground">
              Game Paths
            </h2>
            <p className="text-sm text-muted-foreground">
              Set your PES 2021 installation directories
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">
              Game Installation Path
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="C:\Program Files (x86)\Steam\steamapps\common\eFootball PES 2021"
                className="bg-background border-border flex-1"
              />
              <Button variant="outline" className="gap-2">
                <FolderOpen className="w-4 h-4" />
                Browse
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">
              Sider Path
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="C:\...\sider"
                className="bg-background border-border flex-1"
              />
              <Button variant="outline" className="gap-2">
                <FolderOpen className="w-4 h-4" />
                Browse
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">
              Export Directory
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="C:\...\PES Editor\exports"
                className="bg-background border-border flex-1"
              />
              <Button variant="outline" className="gap-2">
                <FolderOpen className="w-4 h-4" />
                Browse
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Editor Settings */}
      <div className="card-gaming p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-accent/15 text-accent">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-lg text-foreground">
              Editor Settings
            </h2>
            <p className="text-sm text-muted-foreground">
              Customize editor behavior
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Auto-save</p>
              <p className="text-sm text-muted-foreground">
                Automatically save changes periodically
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Create Backups</p>
              <p className="text-sm text-muted-foreground">
                Backup original files before editing
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Validate on Import</p>
              <p className="text-sm text-muted-foreground">
                Check file integrity during import
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">
              Default Game Version
            </Label>
            <Select defaultValue="2021">
              <SelectTrigger className="bg-background border-border w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2021">PES 2021</SelectItem>
                <SelectItem value="2020">PES 2020</SelectItem>
                <SelectItem value="2019">PES 2019</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="card-gaming p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-success/15 text-success">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-lg text-foreground">
              Appearance
            </h2>
            <p className="text-sm text-muted-foreground">
              Customize the look and feel
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">
              Accent Color
            </Label>
            <div className="flex gap-3">
              {["#00a0e9", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"].map(
                (color) => (
                  <button
                    key={color}
                    className="w-10 h-10 rounded-lg border-2 border-border hover:border-primary transition-colors"
                    style={{ backgroundColor: color }}
                  />
                )
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Animations</p>
              <p className="text-sm text-muted-foreground">
                Enable interface animations
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Compact Mode</p>
              <p className="text-sm text-muted-foreground">
                Reduce spacing for more content
              </p>
            </div>
            <Switch />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="card-gaming p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-warning/15 text-warning">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-lg text-foreground">
              Notifications
            </h2>
            <p className="text-sm text-muted-foreground">
              Manage notification preferences
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Import Complete</p>
              <p className="text-sm text-muted-foreground">
                Notify when import finishes
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Export Complete</p>
              <p className="text-sm text-muted-foreground">
                Notify when export finishes
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Error Alerts</p>
              <p className="text-sm text-muted-foreground">
                Show error notifications
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </div>
    </div>
  );
}
