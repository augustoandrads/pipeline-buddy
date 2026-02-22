import { useState, useCallback } from "react";
import { Lead, TipoCliente, TIPO_CLIENTE_LABELS } from "@/types/crm";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Filter, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface LeadFilters {
  origens: string[];
  tipos: TipoCliente[];
  valueRange: [number, number];
}

interface LeadFilterProps {
  leads: Lead[];
  onFiltersChange: (filters: LeadFilters) => void;
  activeFilters: LeadFilters;
}

export function LeadFilter({ leads, onFiltersChange, activeFilters }: LeadFilterProps) {
  const [filters, setFilters] = useState<LeadFilters>(activeFilters);

  const origens = Array.from(new Set(leads.map((l) => l.origem).filter(Boolean)));
  const maxValue = Math.max(
    ...leads
      .map((l) => l.valor_estimado_contrato || 0)
      .filter((v) => v > 0)
  );

  const handleOrigemToggle = useCallback((origem: string, checked: boolean) => {
    setFilters((prev) => {
      const newOrigens = checked
        ? [...prev.origens, origem]
        : prev.origens.filter((o) => o !== origem);
      const newFilters = { ...prev, origens: newOrigens };
      onFiltersChange(newFilters);
      return newFilters;
    });
  }, [onFiltersChange]);

  const handleTipoToggle = useCallback((tipo: TipoCliente, checked: boolean) => {
    setFilters((prev) => {
      const newTipos = checked
        ? [...prev.tipos, tipo]
        : prev.tipos.filter((t) => t !== tipo);
      const newFilters = { ...prev, tipos: newTipos };
      onFiltersChange(newFilters);
      return newFilters;
    });
  }, [onFiltersChange]);

  const handleValueRangeChange = useCallback((value: [number, number]) => {
    setFilters((prev) => {
      const newFilters = { ...prev, valueRange: value };
      onFiltersChange(newFilters);
      return newFilters;
    });
  }, [onFiltersChange]);

  const handleReset = useCallback(() => {
    const emptyFilters: LeadFilters = {
      origens: [],
      tipos: [],
      valueRange: [0, maxValue],
    };
    setFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  }, [maxValue, onFiltersChange]);

  const activeFilterCount =
    filters.origens.length + filters.tipos.length;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <Filter className="h-4 w-4 mr-2" />
          Filtros
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Filtrar Leads</SheetTitle>
          <SheetDescription>Customize sua busca de leads</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Origem */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Origem</Label>
            <div className="space-y-2">
              {origens.map((origem) => (
                <div key={origem} className="flex items-center gap-2">
                  <Checkbox
                    id={`origem-${origem}`}
                    checked={filters.origens.includes(origem)}
                    onCheckedChange={(checked) =>
                      handleOrigemToggle(origem, checked as boolean)
                    }
                  />
                  <label
                    htmlFor={`origem-${origem}`}
                    className="text-sm cursor-pointer flex-1"
                  >
                    {origem}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Tipo de Cliente */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Tipo de Cliente</Label>
            <div className="space-y-2">
              {(Object.keys(TIPO_CLIENTE_LABELS) as TipoCliente[]).map((tipo) => (
                <div key={tipo} className="flex items-center gap-2">
                  <Checkbox
                    id={`tipo-${tipo}`}
                    checked={filters.tipos.includes(tipo)}
                    onCheckedChange={(checked) =>
                      handleTipoToggle(tipo, checked as boolean)
                    }
                  />
                  <label
                    htmlFor={`tipo-${tipo}`}
                    className="text-sm cursor-pointer flex-1"
                  >
                    {TIPO_CLIENTE_LABELS[tipo]}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Valor */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Valor: R$ {filters.valueRange[0].toLocaleString("pt-BR")} - R${" "}
              {filters.valueRange[1].toLocaleString("pt-BR")}
            </Label>
            <Slider
              value={filters.valueRange}
              onValueChange={handleValueRangeChange}
              min={0}
              max={maxValue}
              step={1000}
              className="w-full"
            />
          </div>

          {/* Reset Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="w-full"
          >
            <X className="h-4 w-4 mr-2" />
            Limpar Filtros
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
