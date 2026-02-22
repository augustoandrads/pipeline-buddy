import { Button } from "@/components/ui/button";
import { Edit, Move, Download, Trash2 } from "lucide-react";

interface LeadActionsProps {
  onEdit: () => void;
  onMove: () => void;
  onExport: () => void;
  onDelete: () => void;
  isLoading?: boolean;
}

export function LeadActions({
  onEdit,
  onMove,
  onExport,
  onDelete,
  isLoading = false,
}: LeadActionsProps) {
  return (
    <div className="space-y-2 border-t pt-4">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Ações
      </h3>

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          disabled={isLoading}
          className="w-full"
        >
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onMove}
          disabled={isLoading}
          className="w-full"
        >
          <Move className="h-4 w-4 mr-2" />
          Mover
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          disabled={isLoading}
          className="w-full"
        >
          <Download className="h-4 w-4 mr-2" />
          PDF
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          disabled={isLoading}
          className="w-full"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Deletar
        </Button>
      </div>
    </div>
  );
}
