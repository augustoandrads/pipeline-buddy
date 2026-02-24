/**
 * Hook para gerenciar thresholds de inatividade por etapa
 */

import { useMemo } from 'react';

export interface InactivityThreshold {
  etapa: string;
  diasParaAlerta: number;
  diasParaPerigo: number;
  label: string;
}

const DEFAULT_THRESHOLDS: InactivityThreshold[] = [
  {
    etapa: 'REUNIAO_REALIZADA',
    diasParaAlerta: 3,
    diasParaPerigo: 7,
    label: 'Reunião Realizada',
  },
  {
    etapa: 'PROPOSTA_ENVIADA',
    diasParaAlerta: 5,
    diasParaPerigo: 10,
    label: 'Proposta Enviada',
  },
  {
    etapa: 'EM_NEGOCIACAO',
    diasParaAlerta: 7,
    diasParaPerigo: 14,
    label: 'Em Negociação',
  },
  {
    etapa: 'CONTRATO_GERADO',
    diasParaAlerta: 3,
    diasParaPerigo: 7,
    label: 'Contrato Gerado',
  },
  {
    etapa: 'VENDA_FECHADA',
    diasParaAlerta: 0,
    diasParaPerigo: 0,
    label: 'Venda Fechada',
  },
];

/**
 * Retorna os thresholds de inatividade
 */
export function useInactivityThresholds() {
  return useMemo(() => DEFAULT_THRESHOLDS, []);
}

/**
 * Obtém o threshold para uma etapa específica
 */
export function getThresholdForStage(etapa: string): InactivityThreshold | null {
  return DEFAULT_THRESHOLDS.find((t) => t.etapa === etapa) || null;
}

/**
 * Calcula dias sem movimentação
 */
export function calculateDaysSinceLastActivity(lastActivityDate: string | Date): number {
  const last = new Date(lastActivityDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - last.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Determina o status de inatividade
 */
export function getInactivityStatus(
  etapa: string,
  daysSinceLastActivity: number
): 'normal' | 'alerta' | 'perigo' | null {
  const threshold = getThresholdForStage(etapa);
  if (!threshold || threshold.diasParaAlerta === 0) return null;

  if (daysSinceLastActivity >= threshold.diasParaPerigo) return 'perigo';
  if (daysSinceLastActivity >= threshold.diasParaAlerta) return 'alerta';
  return 'normal';
}

/**
 * Retorna a cor para um status de inatividade
 */
export function getInactivityColor(status: 'normal' | 'alerta' | 'perigo' | null): string {
  switch (status) {
    case 'perigo':
      return 'border-red-500 border-l-red-500';
    case 'alerta':
      return 'border-yellow-500 border-l-yellow-500';
    case 'normal':
      return 'border-green-500 border-l-green-500';
    default:
      return '';
  }
}
