import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, Lead, ETAPAS, TIPO_CLIENTE_LABELS, TipoCliente } from "@/types/crm";
import { Loader2, TrendingUp, Users, DollarSign, Target } from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  iconClass?: string;
}

function StatCard({ title, value, subtitle, icon: Icon, iconClass }: StatCardProps) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className={`rounded-lg p-2.5 ${iconClass ?? "bg-primary/10"}`}>
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </div>
  );
}

export default function RelatoriosPage() {
  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("*");
      if (error) throw error;
      return data as Lead[];
    },
  });

  const { data: cards = [], isLoading: cardsLoading } = useQuery({
    queryKey: ["cards"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cards").select("*, leads(*)");
      if (error) throw error;
      return data as Card[];
    },
  });

  const isLoading = leadsLoading || cardsLoading;

  const totalValorPipeline = cards.reduce(
    (sum, c) => sum + (c.leads?.valor_estimado_contrato ?? 0),
    0
  );

  const vendasFechadas = cards.filter((c) => c.etapa === "VENDA_FECHADA");
  const valorFechado = vendasFechadas.reduce(
    (sum, c) => sum + (c.leads?.valor_estimado_contrato ?? 0),
    0
  );

  const mediaDiasNaEtapa =
    cards.length > 0
      ? Math.round(
          cards.reduce((sum, c) => sum + differenceInDays(new Date(), parseISO(c.data_entrada_etapa)), 0) /
            cards.length
        )
      : 0;

  const porTipo = leads.reduce((acc, l) => {
    acc[l.tipo_cliente] = (acc[l.tipo_cliente] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-card px-6 py-4">
        <h1 className="text-lg font-semibold">Relatórios</h1>
        <p className="text-sm text-muted-foreground">Visão geral do pipeline comercial</p>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard title="Total de Leads" value={leads.length} subtitle="leads cadastrados" icon={Users} />
          <StatCard
            title="Pipeline Total"
            value={`R$ ${totalValorPipeline.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`}
            subtitle="valor estimado"
            icon={DollarSign}
          />
          <StatCard
            title="Vendas Fechadas"
            value={vendasFechadas.length}
            subtitle={`R$ ${valorFechado.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`}
            icon={Target}
            iconClass="bg-green-100"
          />
          <StatCard
            title="Média na Etapa"
            value={`${mediaDiasNaEtapa}d`}
            subtitle="dias médios por etapa"
            icon={TrendingUp}
          />
        </div>

        {/* Funil por etapa */}
        <div className="rounded-xl border bg-card p-5">
          <h2 className="text-sm font-semibold mb-4">Distribuição por Etapa</h2>
          <div className="space-y-3">
            {ETAPAS.map((etapa) => {
              const count = cards.filter((c) => c.etapa === etapa.key).length;
              const valor = cards
                .filter((c) => c.etapa === etapa.key)
                .reduce((sum, c) => sum + (c.leads?.valor_estimado_contrato ?? 0), 0);
              const pct = cards.length > 0 ? Math.round((count / cards.length) * 100) : 0;

              return (
                <div key={etapa.key}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">{etapa.label}</span>
                    <span className="text-muted-foreground">
                      {count} card{count !== 1 ? "s" : ""} · R$ {valor.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Por tipo de cliente */}
        <div className="rounded-xl border bg-card p-5">
          <h2 className="text-sm font-semibold mb-4">Leads por Tipo de Cliente</h2>
          <div className="grid grid-cols-3 gap-4">
            {(["IMOBILIARIA", "CONSTRUTORA", "CORRETOR"] as TipoCliente[]).map((tipo) => (
              <div key={tipo} className="rounded-lg bg-muted/40 p-4 text-center">
                <p className="text-2xl font-bold">{porTipo[tipo] ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">{TIPO_CLIENTE_LABELS[tipo]}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
