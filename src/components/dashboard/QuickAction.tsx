import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface QuickActionProps {
  icon: LucideIcon;
  title: string;
  description: string;
  to: string;
  variant?: "default" | "primary" | "accent";
}

export function QuickAction({
  icon: Icon,
  title,
  description,
  to,
  variant = "default",
}: QuickActionProps) {
  return (
    <Link
      to={to}
      className={cn(
        "group card-gaming p-5 block transition-all duration-300 hover:scale-[1.02] hover:border-primary/50",
        "animate-fade-in"
      )}
    >
      <div
        className={cn(
          "w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-all duration-300",
          variant === "primary" && "bg-primary/15 text-primary group-hover:bg-primary group-hover:text-primary-foreground",
          variant === "accent" && "bg-accent/15 text-accent group-hover:bg-accent group-hover:text-accent-foreground",
          variant === "default" && "bg-secondary text-muted-foreground group-hover:bg-primary/15 group-hover:text-primary"
        )}
      >
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="font-display font-semibold text-lg text-foreground mb-1 group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </Link>
  );
}
