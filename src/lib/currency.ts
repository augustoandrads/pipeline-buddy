/**
 * Formatação e validação de moeda BRL
 */

export const BRL_FORMATTER = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/**
 * Formata um valor para BRL
 * @param value Valor em centavos ou reais
 * @returns String formatada em BRL
 */
export function formatBRL(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return 'Sem valor definido';
  }
  return BRL_FORMATTER.format(value);
}

/**
 * Valida se um valor é um número positivo válido para moeda
 * @param value Valor a validar
 * @returns true se válido, false caso contrário
 */
export function isValidBRLValue(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

/**
 * Converte string de entrada para valor numérico BRL
 * @param input String de entrada (ex: "1.500" ou "1500")
 * @returns Valor numérico ou null se inválido
 */
export function parseBRLInput(input: string): number | null {
  if (!input) return null;

  // Remove espaços
  let cleaned = input.trim();

  // Remove "R$" se presente
  cleaned = cleaned.replace(/^R\$\s*/, '');

  // Trata separadores PT-BR: ponto é milhar, vírgula é decimal
  cleaned = cleaned.replace(/\./g, '').replace(',', '.');

  const parsed = parseFloat(cleaned);

  if (isValidBRLValue(parsed)) {
    return parsed;
  }

  return null;
}
