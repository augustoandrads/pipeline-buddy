import { Skeleton } from "@/components/ui/skeleton";
import { ETAPAS } from "@/types/crm";

export function KanbanSkeleton() {
  return (
    <div className="flex flex-1 gap-4 overflow-x-auto p-6">
      {ETAPAS.map((etapa) => (
        <div key={etapa.key} className="w-80 flex-shrink-0">
          {/* Column header */}
          <div className="mb-4">
            <Skeleton className="h-8 w-40" />
          </div>
          {/* Cards */}
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
