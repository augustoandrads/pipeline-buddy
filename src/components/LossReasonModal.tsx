/**
 * Modal for recording loss reason when moving lead to Perdido (US-06)
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LOSS_REASON_LABELS } from "@/types/crm";
import type { LossReason } from "@/types/crm";

interface LossReasonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: LossReason, otherDetails?: string) => Promise<void>;
  leadName?: string;
}

export function LossReasonModal({
  open,
  onOpenChange,
  onConfirm,
  leadName,
}: LossReasonModalProps) {
  const [selectedReason, setSelectedReason] = useState<LossReason | "">("");
  const [otherDetails, setOtherDetails] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!selectedReason) {
      setError("Selecione um motivo de perda");
      return;
    }

    if (selectedReason === "OTHER" && otherDetails.trim().length < 10) {
      setError("Quando selecionar 'Outro', forneça pelo menos 10 caracteres");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await onConfirm(selectedReason as LossReason, otherDetails);
      // Reset form
      setSelectedReason("");
      setOtherDetails("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao registrar perda"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Motivo de Perda</DialogTitle>
          <DialogDescription>
            {leadName && <span>Lead: {leadName}</span>}
            <p className="mt-2">
              Por favor, selecione o motivo pelo qual este lead foi perdido.
              Este dado é essencial para melhorar nosso processo.
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Loss Reason Select */}
          <div>
            <label className="text-sm font-medium block mb-2">
              Motivo da Perda *
            </label>
            <Select
              value={selectedReason}
              onValueChange={(value) => {
                setSelectedReason(value as LossReason);
                setError(null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um motivo..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LOSS_REASON_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Other Details Text Area (only if OTHER is selected) */}
          {selectedReason === "OTHER" && (
            <div>
              <label className="text-sm font-medium block mb-2">
                Detalhe (Outro) *
              </label>
              <Textarea
                placeholder="Descreva o motivo da perda em detalhes (mínimo 10 caracteres)..."
                value={otherDetails}
                onChange={(e) => {
                  setOtherDetails(e.target.value);
                  setError(null);
                }}
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {otherDetails.length}/10 caracteres mínimo
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={isLoading}>
              {isLoading ? "Registrando..." : "Registrar Perda"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
