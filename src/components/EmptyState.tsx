import { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6">
      <div className="text-muted-foreground">{icon}</div>
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-center text-sm text-muted-foreground max-w-sm">{description}</p>
      {action && (
        <Button variant="outline" onClick={action.onClick} className="gap-2 mt-2">
          {action.label}
        </Button>
      )}
    </div>
  );
}
