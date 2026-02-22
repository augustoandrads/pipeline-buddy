import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, ETAPAS, Etapa } from "@/types/crm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface MoveCardModalProps {
  card: Card | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ETAPA_COLORS: Record<string, string> = {
  REUNIAO_REALIZADA: "bg-[hsl(var(--etapa-reuniao)/0.15)] hover:bg-[hsl(var(--etapa-reuniao)/0.25)] border-[hsl(var(--etapa-reuniao))]",
  PROPOSTA_ENVIADA: "bg-[hsl(var(--etapa-proposta)/0.15)] hover:bg-[hsl(var(--etapa-proposta)/0.25)] border-[hsl(var(--etapa-proposta))]",
  EM_NEGOCIACAO: "bg-[hsl(var(--etapa-negociacao)/0.15)] hover:bg-[hsl(var(--etapa-negociacao)/0.25)] border-[hsl(var(--etapa-negociacao))]",
  CONTRATO_GERADO: "bg-[hsl(var(--etapa-contrato)/0.15)] hover:bg-[hsl(var(--etapa-contrato)/0.25)] border-[hsl(var(--etapa-contrato))]",
  VENDA_FECHADA: "bg-[hsl(var(--etapa-venda)/0.15)] hover:bg-[hsl(var(--etapa-venda)/0.25)] border-[hsl(var(--etapa-venda))]",
};

export function MoveCardModal({ card, open, onOpenChange }: MoveCardModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedEtapa, setSelectedEtapa] = useState<Etapa | null>(null);

  const moveCard = useMutation({
    mutationFn: async (novaEtapa: Etapa) => {
      if (!card) return;

      const { error: cardError } = await supabase
        .from("cards")
        .update({ etapa: novaEtapa, data_entrada_etapa: new Date().toISOString() })
        .eq("id", card.id);
      if (cardError) throw cardError;

      const { error: movError } = await supabase
        .from("movimentacoes")
        .insert({
          card_id: card.id,
          etapa_anterior: card.etapa,
          etapa_nova: novaEtapa,
        });
      if (movError) throw movError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards"] });
      queryClient.invalidateQueries({ queryKey: ["movimentacoes"] });
      toast({ title: "Card movido com sucesso!" });
      onOpenChange(false);
      setSelectedEtapa(null);
    },
    onError: () => {
      toast({ title: "Erro ao mover card", variant: "destructive" });
    },
  });

  if (!card) return null;

  const handleMove = () => {
    if (selectedEtapa) {
      moveCard.mutate(selectedEtapa);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Mover Card</DialogTitle>
          <DialogDescription>
            Selecione a nova etapa para este card
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {ETAPAS.map((etapa) => (
            <button
              key={etapa.key}
              onClick={() => setSelectedEtapa(etapa.key)}
              disabled={etapa.key === card.etapa}
              className={cn(
                "w-full p-3 rounded-lg border-2 transition-all text-left",
                selectedEtapa === etapa.key ? "border-primary" : "border-transparent",
                etapa.key === card.etapa
                  ? "opacity-50 cursor-not-allowed"
                  : ETAPA_COLORS[etapa.key],
              )}
            >
              <p className="font-semibold text-sm">{etapa.label}</p>
              {etapa.key === card.etapa && (
                <p className="text-xs text-muted-foreground">Etapa atual</p>
              )}
            </button>
          ))}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setSelectedEtapa(null);
            }}
            disabled={moveCard.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleMove}
            disabled={!selectedEtapa || moveCard.isPending}
          >
            {moveCard.isPending ? "Movendo..." : "Mover"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
