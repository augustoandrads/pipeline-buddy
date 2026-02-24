import { useDroppable } from "@dnd-kit/core";
import { Card, Etapa, ETAPAS, Lead } from "@/types/crm";
import { KanbanCard } from "@/components/KanbanCard";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  etapa: typeof ETAPAS[number];
  cards: Card[];
  onCardClick?: (lead: Lead | undefined, card?: Card) => void;
}

const ETAPA_COLORS: Record<string, string> = {
  REUNIAO_REALIZADA: "border-t-[hsl(var(--etapa-reuniao))]",
  PROPOSTA_ENVIADA: "border-t-[hsl(var(--etapa-proposta))]",
  EM_NEGOCIACAO: "border-t-[hsl(var(--etapa-negociacao))]",
  CONTRATO_GERADO: "border-t-[hsl(var(--etapa-contrato))]",
  VENDA_FECHADA: "border-t-[hsl(var(--etapa-venda))]",
  PERDIDO: "border-t-red-500",
};

const BADGE_COLORS: Record<string, string> = {
  REUNIAO_REALIZADA: "bg-[hsl(var(--etapa-reuniao)/0.1)] text-[hsl(var(--etapa-reuniao))]",
  PROPOSTA_ENVIADA: "bg-[hsl(var(--etapa-proposta)/0.1)] text-[hsl(var(--etapa-proposta))]",
  EM_NEGOCIACAO: "bg-[hsl(var(--etapa-negociacao)/0.1)] text-[hsl(var(--etapa-negociacao))]",
  CONTRATO_GERADO: "bg-[hsl(var(--etapa-contrato)/0.1)] text-[hsl(var(--etapa-contrato))]",
  VENDA_FECHADA: "bg-[hsl(var(--etapa-venda)/0.1)] text-[hsl(var(--etapa-venda))]",
  PERDIDO: "bg-red-100 text-red-700",
};

export function KanbanColumn({ etapa, cards, onCardClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: etapa.key });

  const totalValor = cards.reduce((sum, c) => sum + (c.leads?.valor_estimado_contrato ?? 0), 0);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-w-[280px] max-w-[280px] flex-col rounded-xl border-2 border-t-4 bg-muted/40 transition-colors",
        ETAPA_COLORS[etapa.key],
        isOver ? "border-primary/40 bg-accent/30" : "border-border"
      )}
    >
      {/* Column header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{etapa.label}</h3>
          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", BADGE_COLORS[etapa.key])}>
            {cards.length}
          </span>
        </div>
        {totalValor > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            R$ {totalValor.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
          </p>
        )}
      </div>

      {/* Cards */}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 pb-4 min-h-[200px]">
        {cards.map((card) => (
          <KanbanCard key={card.id} card={card} onLeadClick={onCardClick} />
        ))}
        {cards.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-border py-8">
            <p className="text-xs text-muted-foreground">Arraste cards aqui</p>
          </div>
        )}
      </div>
    </div>
  );
}
