import { FileIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecentFileProps {
  name: string;
  type: string;
  date: string;
  size: string;
}

export function RecentFile({ name, type, date, size }: RecentFileProps) {
  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "cpk":
        return "text-primary bg-primary/15";
      case "bin":
        return "text-accent bg-accent/15";
      case "ted":
        return "text-success bg-success/15";
      default:
        return "text-muted-foreground bg-secondary";
    }
  };

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer group">
      <div className={cn("p-2 rounded-lg", getTypeColor(type))}>
        <FileIcon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
          {name}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="uppercase font-medium">{type}</span>
          <span>•</span>
          <span>{size}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="w-3.5 h-3.5" />
        <span>{date}</span>
      </div>
    </div>
  );
}
