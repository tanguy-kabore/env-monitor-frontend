import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface CardProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  headerAction?: ReactNode;
}

export default function Card({ title, subtitle, icon, children, className, headerAction }: CardProps) {
  return (
    <div className={cn("bg-card rounded-xl border border-border shadow-sm animate-fade-in", className)}>
      {(title || icon) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            {icon && <div className="text-primary">{icon}</div>}
            <div>
              {title && <h3 className="text-sm font-semibold text-text">{title}</h3>}
              {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {headerAction}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}
