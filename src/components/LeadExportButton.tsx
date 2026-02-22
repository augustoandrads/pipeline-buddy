import { useState } from "react";
import { Card, Lead } from "@/types/crm";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LeadExportButtonProps {
  card: Card;
  lead: Lead;
}

export function LeadExportButton({ card, lead }: LeadExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    try {
      setIsExporting(true);

      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPosition = margin;

      // Header
      pdf.setFontSize(20);
      pdf.text("Pipeline Buddy", margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setTextColor(128, 128, 128);
      pdf.text(`Relatório gerado em ${new Date().toLocaleDateString("pt-BR")}`, margin, yPosition);
      yPosition += 15;

      // Title
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Lead: ${lead.nome}`, margin, yPosition);
      yPosition += 8;

      // Company
      pdf.setFontSize(11);
      pdf.setTextColor(100, 100, 100);
      pdf.text(lead.empresa, margin, yPosition);
      yPosition += 12;

      // Divider
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // Section: Informações de Contato
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text("Informações de Contato", margin, yPosition);
      yPosition += 7;

      pdf.setFontSize(10);
      pdf.setTextColor(50, 50, 50);
      if (lead.email) {
        pdf.text(`Email: ${lead.email}`, margin + 2, yPosition);
        yPosition += 5;
      }
      if (lead.telefone) {
        pdf.text(`Telefone: ${lead.telefone}`, margin + 2, yPosition);
        yPosition += 5;
      }
      yPosition += 3;

      // Section: Detalhes da Empresa
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text("Detalhes da Empresa", margin, yPosition);
      yPosition += 7;

      pdf.setFontSize(10);
      pdf.setTextColor(50, 50, 50);
      pdf.text(`Tipo: ${lead.tipo_cliente}`, margin + 2, yPosition);
      yPosition += 5;
      if (lead.quantidade_imoveis) {
        pdf.text(`Imóveis: ${lead.quantidade_imoveis}`, margin + 2, yPosition);
        yPosition += 5;
      }
      yPosition += 3;

      // Section: Oportunidade
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text("Oportunidade", margin, yPosition);
      yPosition += 7;

      pdf.setFontSize(10);
      pdf.setTextColor(50, 50, 50);
      if (lead.valor_estimado_contrato) {
        pdf.text(
          `Valor Estimado: R$ ${lead.valor_estimado_contrato.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
          })}`,
          margin + 2,
          yPosition
        );
        yPosition += 5;
      }
      if (lead.origem) {
        pdf.text(`Origem: ${lead.origem}`, margin + 2, yPosition);
        yPosition += 5;
      }
      yPosition += 3;

      // Section: Observações
      if (lead.observacoes) {
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        pdf.text("Observações", margin, yPosition);
        yPosition += 7;

        pdf.setFontSize(10);
        pdf.setTextColor(50, 50, 50);
        const splitText = pdf.splitTextToSize(lead.observacoes, pageWidth - 2 * margin - 2);
        pdf.text(splitText, margin + 2, yPosition);
        yPosition += splitText.length * 4;
      }

      yPosition += 5;

      // Section: Histórico
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text("Histórico", margin, yPosition);
      yPosition += 7;

      pdf.setFontSize(10);
      pdf.setTextColor(50, 50, 50);
      pdf.text(`Criado ${formatDistanceToNow(new Date(lead.criado_em), { addSuffix: true, locale: ptBR })}`, margin + 2, yPosition);
      yPosition += 5;
      pdf.text(`Etapa: ${card.etapa}`, margin + 2, yPosition);

      // Save PDF
      pdf.save(`${lead.nome.replace(/\s+/g, "_")}_lead.pdf`);
      toast({ title: "PDF exportado com sucesso!" });
    } catch (error) {
      toast({
        title: "Erro ao exportar PDF",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isExporting}
      className="w-full"
    >
      <Download className="h-4 w-4 mr-2" />
      {isExporting ? "Exportando..." : "Exportar PDF"}
    </Button>
  );
}
