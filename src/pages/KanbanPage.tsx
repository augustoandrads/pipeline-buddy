import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, Etapa, ETAPAS, Lead } from "@/types/crm";
import { KanbanColumn } from "@/components/KanbanColumn";
import { KanbanCard } from "@/components/KanbanCard";
import { KanbanSkeleton } from "@/components/KanbanSkeleton";
import { LeadDetailsSidebar } from "@/components/LeadDetailsSidebar";
import { LeadFilter, LeadFilters } from "@/components/LeadFilter";
import { useToast } from "@/hooks/use-toast";

export default function KanbanPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [filters, setFilters] = useState<LeadFilters>({
    origens: [],
    tipos: [],
    valueRange: [0, 1000000],
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ["cards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cards")
        .select("*, leads(*)")
        .order("data_entrada_etapa", { ascending: false });
      if (error) throw error;
      return data as Card[];
    },
  });

  const moveCard = useMutation({
    mutationFn: async ({ cardId, novaEtapa, etapaAnterior }: { cardId: string; novaEtapa: Etapa; etapaAnterior: Etapa }) => {
      const { error: cardError } = await supabase
        .from("cards")
        .update({ etapa: novaEtapa, data_entrada_etapa: new Date().toISOString() })
        .eq("id", cardId);
      if (cardError) throw cardError;

      const { error: movError } = await supabase
        .from("movimentacoes")
        .insert({ card_id: cardId, etapa_anterior: etapaAnterior, etapa_nova: novaEtapa });
      if (movError) throw movError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards"] });
      toast({ title: "Card movido com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao mover card", variant: "destructive" });
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    const card = cards.find((c) => c.id === event.active.id);
    if (card) setActiveCard(card);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCard(null);
    const { active, over } = event;
    if (!over) return;

    const card = cards.find((c) => c.id === active.id);
    if (!card) return;

    const novaEtapa = over.id as Etapa;
    if (novaEtapa === card.etapa) return;

    moveCard.mutate({ cardId: card.id, novaEtapa, etapaAnterior: card.etapa });
  };

  const filteredCards = useMemo(() => {
    return cards.filter((c) => {
      const lead = c.leads;
      if (!lead) return false;

      // Filtro por origem
      if (filters.origens.length > 0 && !filters.origens.includes(lead.origem || "")) {
        return false;
      }

      // Filtro por tipo de cliente
      if (filters.tipos.length > 0 && !filters.tipos.includes(lead.tipo_cliente)) {
        return false;
      }

      // Filtro por valor
      const value = lead.valor_estimado_contrato || 0;
      if (value < filters.valueRange[0] || value > filters.valueRange[1]) {
        return false;
      }

      return true;
    });
  }, [cards, filters]);

  const getCardsForEtapa = (etapa: Etapa) => filteredCards.filter((c) => c.etapa === etapa);

  const handleLeadClick = (lead: Lead | undefined, card?: Card) => {
    if (lead) {
      setSelectedLead(lead);
      setSelectedCard(card || null);
      setIsSidebarOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b bg-card px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold">Pipeline Comercial</h1>
            <p className="text-sm text-muted-foreground">Carregando...</p>
          </div>
        </div>
        <KanbanSkeleton />
      </div>
    );
  }

  const maxCardValue = Math.max(
    ...cards.map((c) => c.leads?.valor_estimado_contrato || 0)
  );
  const defaultFilters: LeadFilters = {
    origens: [],
    tipos: [],
    valueRange: [0, maxCardValue],
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-card px-6 py-4">
        <div className="flex-1">
          <h1 className="text-lg font-semibold">Pipeline Comercial</h1>
          <p className="text-sm text-muted-foreground">{filteredCards.length} de {cards.length} card{cards.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="w-40">
          <LeadFilter leads={cards.map((c) => c.leads).filter(Boolean) as Lead[]} onFiltersChange={setFilters} activeFilters={filters} />
        </div>
      </div>

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-1 gap-4 overflow-x-auto p-6">
          {ETAPAS.map((etapa) => (
            <KanbanColumn
              key={etapa.key}
              etapa={etapa}
              cards={getCardsForEtapa(etapa.key)}
              onCardClick={handleLeadClick}
            />
          ))}
        </div>

        <DragOverlay>
          {activeCard ? <KanbanCard card={activeCard} isDragging /> : null}
        </DragOverlay>
      </DndContext>

      {/* Lead Details Sidebar */}
      <LeadDetailsSidebar
        lead={selectedLead}
        card={selectedCard}
        open={isSidebarOpen}
        onOpenChange={setIsSidebarOpen}
      />
    </div>
  );
}
