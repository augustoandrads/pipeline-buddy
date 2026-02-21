import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Lead, TIPO_CLIENTE_LABELS } from "@/types/crm";
import { LeadModal } from "@/components/LeadModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Loader2, Building2, Phone, Mail } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

const TIPO_COLORS = {
  IMOBILIARIA: "bg-blue-100 text-blue-700",
  CONSTRUTORA: "bg-orange-100 text-orange-700",
  CORRETOR: "bg-purple-100 text-purple-700",
};

export default function LeadsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return data as Lead[];
    },
  });

  const createLead = useMutation({
    mutationFn: async (values: Omit<Lead, "id" | "criado_em">) => {
      // Use atomic function to create lead + card in single transaction
      const { data, error } = await supabase.rpc("create_lead_with_card", {
        p_name: values.nome,
        p_email: values.email || null,
        p_company: values.empresa,
        p_tipo_cliente: values.tipo_cliente,
        p_telefone: values.telefone || null,
        p_quantidade_imoveis: values.quantidade_imoveis || null,
        p_valor_estimado_contrato: values.valor_estimado_contrato || null,
        p_origem: values.origem || null,
        p_observacoes: values.observacoes || null,
      });

      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Failed to create lead");

      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["cards"] });
      setModalOpen(false);
      toast({ title: "Lead cadastrado e adicionado ao Kanban!" });
    },
    onError: (error) => {
      const errorMsg = error instanceof Error ? error.message : "Erro desconhecido";
      if (errorMsg.includes("unique")) {
        toast({ title: "Este e-mail já foi cadastrado", variant: "destructive" });
      } else {
        toast({ title: `Erro ao cadastrar lead: ${errorMsg}`, variant: "destructive" });
      }
    },
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-card px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold">Leads</h1>
          <p className="text-sm text-muted-foreground">{leads.length} lead{leads.length !== 1 ? "s" : ""} cadastrado{leads.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Lead
        </Button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : leads.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed">
            <Building2 className="h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum lead cadastrado ainda.</p>
            <Button variant="outline" onClick={() => setModalOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Cadastrar primeiro lead
            </Button>
          </div>
        ) : (
          <div className="rounded-xl border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Nome / Empresa</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Valor Estimado</TableHead>
                  <TableHead>Imóveis</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Cadastrado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id} className="hover:bg-muted/20">
                    <TableCell>
                      <div>
                        <p className="font-medium">{lead.nome}</p>
                        <p className="text-xs text-muted-foreground">{lead.empresa}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TIPO_COLORS[lead.tipo_cliente]}`}>
                        {TIPO_CLIENTE_LABELS[lead.tipo_cliente]}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        {lead.email && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {lead.email}
                          </div>
                        )}
                        {lead.telefone && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {lead.telefone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {lead.valor_estimado_contrato
                        ? `R$ ${lead.valor_estimado_contrato.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`
                        : "—"}
                    </TableCell>
                    <TableCell>{lead.quantidade_imoveis ?? "—"}</TableCell>
                    <TableCell>
                      <span className="text-xs">{lead.origem || "—"}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(lead.criado_em), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <LeadModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={createLead.mutate}
        isLoading={createLead.isPending}
      />
    </div>
  );
}
