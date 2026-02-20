import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Card as CardType, TIPO_CLIENTE_LABELS } from "@/types/crm";
import { differenceInDays, parseISO } from "date-fns";
import { Building2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface KanbanCardProps {
  card: CardType;
  isDragging?: boolean;
}

export function KanbanCard({ card, isDragging = false }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: card.id });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const lead = card.leads;
  const diasNaEtapa = differenceInDays(new Date(), parseISO(card.data_entrada_etapa));

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "cursor-grab rounded-lg border bg-card p-3 shadow-sm transition-all select-none",
        "hover:shadow-md hover:border-primary/30",
        isDragging && "cursor-grabbing opacity-80 shadow-xl rotate-1 scale-105"
      )}
    >
      {/* Lead name */}
      <p className="text-sm font-semibold leading-tight line-clamp-1">{lead?.nome ?? "—"}</p>

      {/* Company */}
      <div className="mt-1.5 flex items-center gap-1.5 text-muted-foreground">
        <Building2 className="h-3 w-3 flex-shrink-0" />
        <p className="text-xs line-clamp-1">{lead?.empresa ?? "—"}</p>
      </div>

      {/* Type badge */}
      {lead?.tipo_cliente && (
        <span className="mt-2 inline-block rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
          {TIPO_CLIENTE_LABELS[lead.tipo_cliente]}
        </span>
      )}

      {/* Footer */}
      <div className="mt-2.5 flex items-center justify-between border-t pt-2">
        {lead?.valor_estimado_contrato ? (
          <p className="text-xs font-semibold text-primary">
            R$ {lead.valor_estimado_contrato.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
          </p>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-1 text-muted-foreground">
          <Clock className="h-3 w-3" />
          <p className="text-xs">{diasNaEtapa}d</p>
        </div>
      </div>
    </div>
  );
}
