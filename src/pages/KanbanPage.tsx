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
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, Etapa, ETAPAS } from "@/types/crm";
import { KanbanColumn } from "@/components/KanbanColumn";
import { KanbanCard } from "@/components/KanbanCard";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function KanbanPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeCard, setActiveCard] = useState<Card | null>(null);

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

  const getCardsForEtapa = (etapa: Etapa) => cards.filter((c) => c.etapa === etapa);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-card px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold">Pipeline Comercial</h1>
          <p className="text-sm text-muted-foreground">{cards.length} card{cards.length !== 1 ? "s" : ""} ativos</p>
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
            />
          ))}
        </div>

        <DragOverlay>
          {activeCard ? <KanbanCard card={activeCard} isDragging /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
