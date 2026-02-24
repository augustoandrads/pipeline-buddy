/**
 * Loss Reasons Report Page (US-07)
 * Dashboard showing aggregated loss reasons with charts and detailed table
 */

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getLostLeads } from "@/services/lossReasonService";
import { formatBRL } from "@/lib/currency";
import { LOSS_REASON_LABELS } from "@/types/crm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";

export function LossReportPage() {
  const [periodFilter, setPeriodFilter] = useState<"7" | "30" | "90" | "all">(
    "30"
  );

  // Calculate date range
  const dateRange = useMemo(() => {
    const today = new Date();
    let startDate: Date | null = null;

    switch (periodFilter) {
      case "7":
        startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30":
        startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90":
        startDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = null;
    }

    return {
      startDate: startDate?.toISOString(),
      endDate: today.toISOString(),
    };
  }, [periodFilter]);

  // Fetch lost leads
  const { data: lostLeads = [], isLoading } = useQuery({
    queryKey: ["lostLeads", dateRange],
    queryFn: () => getLostLeads(dateRange.startDate, dateRange.endDate),
  });

  // Aggregate data for charts
  const aggregatedData = useMemo(() => {
    const stats: Record<
      string,
      { count: number; totalValue: number; label: string }
    > = {};

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lostLeads.forEach((record: Record<string, any>) => {
      const reason = record.reason;
      const label = LOSS_REASON_LABELS[reason] || reason;

      if (!stats[reason]) {
        stats[reason] = { count: 0, totalValue: 0, label };
      }
      stats[reason].count += 1;
      stats[reason].totalValue += record.leads?.valor_estimado_contrato || 0;
    });

    return Object.entries(stats).map(([reason, data]: [string, { count: number; totalValue: number; label: string }]) => ({
      name: data.label,
      value: data.count,
      totalValue: data.totalValue,
      reason,
    }));
  }, [lostLeads]);

  // Chart color mapping
  const COLORS = {
    PRICE: "#ef4444",
    COMPETITOR: "#f97316",
    NO_URGENCY: "#eab308",
    NO_RESPONSE: "#06b6d4",
    WRONG_PROFILE: "#8b5cf6",
    OTHER: "#6b7280",
  };

  const handleExportCSV = () => {
    const csv = [
      ["Data", "Lead", "Empresa", "Motivo", "Valor", "Detalhes"],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...lostLeads.map((record: Record<string, any>) => [
        new Date(record.criado_em).toLocaleDateString("pt-BR"),
        record.leads?.nome || "N/A",
        record.leads?.empresa || "N/A",
        LOSS_REASON_LABELS[record.reason] || record.reason,
        formatBRL(record.leads?.valor_estimado_contrato || 0),
        record.other_details || "-",
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-motivos-perda-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalLostValue = lostLeads.reduce((sum: number, record) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = record as Record<string, any>;
    return sum + (r.leads?.valor_estimado_contrato || 0);
  }, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Relatório de Motivos de Perda</h1>
          <p className="text-muted-foreground mt-2">
            Análise agregada dos principais motivos de perda de leads
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as any)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Selecione período..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
            <SelectItem value="all">Todos os períodos</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={handleExportCSV} variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Leads Perdidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{lostLeads.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total no período selecionado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valor Total Perdido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBRL(totalLostValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Valor estimado em contrato
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Motivo Principal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {aggregatedData.length > 0
                ? aggregatedData[0].name
                : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {aggregatedData.length > 0
                ? `${aggregatedData[0].value} ocorrências`
                : "Nenhum dado"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {aggregatedData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Distribuição de Motivos</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={aggregatedData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {aggregatedData.map((entry) => (
                      <Pie
                        key={entry.reason}
                        dataKey="value"
                        name={entry.name}
                        fill={COLORS[entry.reason as keyof typeof COLORS] || "#999"}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Bar Chart - Value Lost */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Valor Perdido por Motivo</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={aggregatedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis
                    tickFormatter={(value) => formatBRL(value).replace("R$ ", "")}
                  />
                  <Tooltip
                    formatter={(value) => formatBRL(value as number)}
                    contentStyle={{ backgroundColor: "#f3f4f6" }}
                  />
                  <Bar dataKey="totalValue" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Leads Perdidos (Detalhado)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando dados...
            </div>
          ) : lostLeads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum lead perdido no período selecionado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Lead</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {lostLeads.map((record: Record<string, any>) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        {new Date(record.criado_em).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="font-medium">
                        {record.leads?.nome || "N/A"}
                      </TableCell>
                      <TableCell>{record.leads?.empresa || "N/A"}</TableCell>
                      <TableCell>
                        {LOSS_REASON_LABELS[record.reason] || record.reason}
                      </TableCell>
                      <TableCell className="font-mono">
                        {formatBRL(record.leads?.valor_estimado_contrato || 0)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {record.other_details || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
