import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Lead } from "@/types/crm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface EditLeadModalProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditLeadModal({ lead, open, onOpenChange }: EditLeadModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<Lead>>(lead || {});

  const updateLead = useMutation({
    mutationFn: async (data: Partial<Lead>) => {
      const { error } = await supabase
        .from("leads")
        .update(data)
        .eq("id", lead?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards"] });
      toast({ title: "Lead atualizado com sucesso!" });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Erro ao atualizar lead", variant: "destructive" });
    },
  });

  if (!lead) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "quantidade_imoveis" || name === "valor_estimado_contrato"
        ? value === "" ? undefined : Number(value)
        : value,
    }));
  };

  const handleSubmit = () => {
    updateLead.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Lead</DialogTitle>
          <DialogDescription>Atualize as informações do lead</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              name="nome"
              value={formData.nome || ""}
              onChange={handleChange}
              placeholder="Nome do lead"
            />
          </div>

          <div>
            <Label htmlFor="empresa">Empresa</Label>
            <Input
              id="empresa"
              name="empresa"
              value={formData.empresa || ""}
              onChange={handleChange}
              placeholder="Nome da empresa"
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email || ""}
              onChange={handleChange}
              placeholder="email@example.com"
            />
          </div>

          <div>
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              name="telefone"
              value={formData.telefone || ""}
              onChange={handleChange}
              placeholder="(11) 99999-9999"
            />
          </div>

          <div>
            <Label htmlFor="quantidade_imoveis">Quantidade de Imóveis</Label>
            <Input
              id="quantidade_imoveis"
              name="quantidade_imoveis"
              type="number"
              value={formData.quantidade_imoveis || ""}
              onChange={handleChange}
              placeholder="0"
            />
          </div>

          <div>
            <Label htmlFor="valor_estimado_contrato">Valor Estimado</Label>
            <Input
              id="valor_estimado_contrato"
              name="valor_estimado_contrato"
              type="number"
              value={formData.valor_estimado_contrato || ""}
              onChange={handleChange}
              placeholder="0.00"
            />
          </div>

          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              name="observacoes"
              value={formData.observacoes || ""}
              onChange={handleChange}
              placeholder="Notas adicionais..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateLead.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={updateLead.isPending}
          >
            {updateLead.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
