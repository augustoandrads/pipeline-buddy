import { FunnelData } from "@/hooks/useFunnelData";
import { TrendingDown } from "lucide-react";

interface FunnelChartProps {
  data: FunnelData[];
  maxWidth?: number;
}

const COLORS = [
  "bg-blue-500",
  "bg-blue-600",
  "bg-cyan-600",
  "bg-teal-600",
  "bg-emerald-600",
];

export function FunnelChart({ data, maxWidth = 400 }: FunnelChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <TrendingDown className="h-8 w-8 mb-2" />
        <p>Sem dados de funil disponíveis</p>
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="space-y-4">
      {data.map((item, index) => {
        const widthPercent = (item.count / maxCount) * 100;
        const color = COLORS[index] || COLORS[COLORS.length - 1];

        return (
          <div key={item.etapa} className="space-y-2">
            {/* Header */}
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">{item.label}</span>
              <div className="flex items-center gap-3 text-muted-foreground">
                <span className="font-semibold text-foreground">{item.count}</span>
                {index > 0 && (
                  <span className="text-xs px-2 py-1 rounded bg-muted">
                    {item.conversionRate}%
                  </span>
                )}
              </div>
            </div>

            {/* Bar */}
            <div
              className={`h-8 rounded-lg ${color} transition-all duration-300 flex items-center justify-end pr-3`}
              style={{
                width: `${Math.max(widthPercent, 5)}%`,
                opacity: 0.85,
              }}
            >
              {/* Show count inside bar if there's space */}
              {widthPercent > 30 && (
                <span className="text-xs font-semibold text-white">
                  {item.count}
                </span>
              )}
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div className="mt-6 pt-4 border-t">
        <p className="text-xs text-muted-foreground mb-2">Nota:</p>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• <strong>Contagem</strong>: Quantos leads passaram por esta etapa</li>
          <li>• <strong>Taxa de Conversão</strong>: Percentual que avançou para a próxima etapa</li>
        </ul>
      </div>
    </div>
  );
}
